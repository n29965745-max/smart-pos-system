const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/server');

const prisma = new PrismaClient();

describe('Transaction API - Atomic Operations', () => {
  let authToken;
  let testUser;
  let testBranch;
  let testProduct;
  let testCustomer;

  beforeAll(async () => {
    // Setup test data
    testBranch = await prisma.branch.create({
      data: {
        name: 'Test Branch',
        location: 'Test Location'
      }
    });

    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'CASHIER',
        branchId: testBranch.id
      }
    });

    const category = await prisma.category.create({
      data: { name: 'Test Category' }
    });

    testProduct = await prisma.product.create({
      data: {
        sku: 'TEST-001',
        name: 'Test Product',
        price: 100,
        cost: 50,
        categoryId: category.id
      }
    });

    await prisma.inventory.create({
      data: {
        productId: testProduct.id,
        branchId: testBranch.id,
        quantity: 10
      }
    });

    testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer@example.com',
        branchId: testBranch.id
      }
    });

    // Get auth token (mock for testing)
    authToken = 'test-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/transactions - Atomic Transaction Creation', () => {
    it('should create transaction atomically with inventory update', async () => {
      const transactionData = {
        userId: testUser.id,
        customerId: testCustomer.id,
        branchId: testBranch.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 100,
            discount: 0
          }
        ],
        paymentMethod: 'CASH',
        discount: 0
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.total).toBe(232); // 200 + 16% tax

      // Verify inventory was updated
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });
      expect(inventory.quantity).toBe(8); // 10 - 2

      // Verify customer was updated
      const customer = await prisma.customer.findUnique({
        where: { id: testCustomer.id }
      });
      expect(customer.totalSpent).toBe(232);
      expect(customer.lastPurchaseAt).toBeTruthy();
    });

    it('should reject transaction if insufficient stock', async () => {
      const transactionData = {
        userId: testUser.id,
        branchId: testBranch.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 100, // More than available
            unitPrice: 100
          }
        ],
        paymentMethod: 'CASH'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toBe('Insufficient stock');
    });

    it('should handle idempotency keys correctly', async () => {
      const idempotencyKey = `test-${Date.now()}`;
      const transactionData = {
        userId: testUser.id,
        branchId: testBranch.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 100
          }
        ],
        paymentMethod: 'CASH',
        idempotencyKey
      };

      // First request
      const response1 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      const transactionId = response1.body.id;

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(200); // Returns existing transaction

      expect(response2.body.id).toBe(transactionId);

      // Verify inventory was only deducted once
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });
      expect(inventory.quantity).toBe(7); // Only deducted once
    });

    it('should rollback on failure', async () => {
      const initialInventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });

      const transactionData = {
        userId: testUser.id,
        branchId: testBranch.id,
        items: [
          {
            productId: 'invalid-product-id',
            quantity: 1,
            unitPrice: 100
          }
        ],
        paymentMethod: 'CASH'
      };

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(404);

      // Verify inventory unchanged
      const finalInventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });
      expect(finalInventory.quantity).toBe(initialInventory.quantity);
    });
  });

  describe('POST /api/transactions/:id/refund - Refund Transaction', () => {
    let transactionToRefund;

    beforeEach(async () => {
      // Create a transaction to refund
      transactionToRefund = await prisma.transaction.create({
        data: {
          transactionNumber: `TXN-${Date.now()}`,
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          subtotal: 100,
          tax: 16,
          total: 116,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          items: {
            create: {
              productId: testProduct.id,
              quantity: 1,
              unitPrice: 100,
              total: 100
            }
          },
          payments: {
            create: {
              amount: 116,
              method: 'CASH',
              status: 'COMPLETED',
              type: 'PAYMENT'
            }
          }
        }
      });

      // Deduct inventory
      await prisma.inventory.updateMany({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        },
        data: {
          quantity: { decrement: 1 }
        }
      });
    });

    it('should refund transaction and restore inventory', async () => {
      const initialInventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });

      const response = await request(app)
        .post(`/api/transactions/${transactionToRefund.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Customer request'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refundAmount).toBe(116);

      // Verify transaction status updated
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionToRefund.id }
      });
      expect(transaction.status).toBe('REFUNDED');
      expect(transaction.refundReason).toBe('Customer request');

      // Verify inventory restored
      const finalInventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });
      expect(finalInventory.quantity).toBe(initialInventory.quantity + 1);

      // Verify refund payment created
      const payments = await prisma.payment.findMany({
        where: { transactionId: transactionToRefund.id }
      });
      const refundPayment = payments.find(p => p.type === 'REFUND');
      expect(refundPayment).toBeTruthy();
      expect(refundPayment.amount).toBe(-116);
    });

    it('should reject refund of already refunded transaction', async () => {
      // Refund once
      await request(app)
        .post(`/api/transactions/${transactionToRefund.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'First refund' })
        .expect(200);

      // Try to refund again
      const response = await request(app)
        .post(`/api/transactions/${transactionToRefund.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Second refund' })
        .expect(400);

      expect(response.body.error).toContain('already refunded');
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent overselling with concurrent requests', async () => {
      // Set inventory to 1
      await prisma.inventory.updateMany({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        },
        data: { quantity: 1 }
      });

      const transactionData = {
        userId: testUser.id,
        branchId: testBranch.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 100
          }
        ],
        paymentMethod: 'CASH'
      };

      // Send two concurrent requests
      const [response1, response2] = await Promise.allSettled([
        request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transactionData),
        request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transactionData)
      ]);

      // One should succeed, one should fail
      const succeeded = [response1, response2].filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = [response1, response2].filter(r => r.status === 'fulfilled' && r.value.status === 400);

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      // Verify inventory is 0 (not negative)
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: testProduct.id,
          branchId: testBranch.id
        }
      });
      expect(inventory.quantity).toBe(0);
    });
  });
});
