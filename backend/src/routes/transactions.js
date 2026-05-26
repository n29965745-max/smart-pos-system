const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { branchId, customerId, startDate, endDate, status, skip = 0, take = 20 } = req.query;

    const where = {};
    if (branchId) where.branchId = branchId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, username: true, firstName: true, lastName: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } }
        },
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      data: transactions,
      pagination: { total, skip: parseInt(skip), take: parseInt(take) }
    });
  } catch (error) {
    logger.error('Failed to fetch transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        payments: true,
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    logger.error('Failed to fetch transaction', { error: error.message, transactionId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction (ATOMIC with inventory validation)
router.post('/', authMiddleware, validate(schemas.createTransaction), async (req, res) => {
  try {
    const { userId, customerId, branchId, items, paymentMethod, discount = 0, notes, idempotencyKey } = req.validated;

    // Check for duplicate transaction using idempotency key
    if (idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey },
        include: {
          items: { include: { product: true } },
          payments: true,
          user: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true } }
        }
      });

      if (existing) {
        logger.info('Returning existing transaction (idempotent)', { 
          idempotencyKey, 
          transactionId: existing.id 
        });
        return res.status(200).json(existing);
      }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate inventory availability for ALL items first
      for (const item of items) {
        const inventory = await tx.inventory.findFirst({
          where: { 
            productId: item.productId, 
            branchId 
          },
          select: { quantity: true, product: { select: { name: true } } }
        });

        if (!inventory) {
          throw new Error(`Product ${item.productId} not found in branch inventory`);
        }

        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${inventory.product.name}. ` +
            `Available: ${inventory.quantity}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Calculate totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unitPrice - (item.discount || 0);
      }
      const tax = subtotal * 0.16; // 16% tax
      const total = subtotal + tax - discount;

      // 3. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          idempotencyKey,
          userId,
          customerId,
          branchId,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          status: 'COMPLETED',
          notes,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              total: item.quantity * item.unitPrice - (item.discount || 0)
            }))
          },
          payments: {
            create: {
              amount: total,
              method: paymentMethod,
              status: 'COMPLETED',
              type: 'PAYMENT'
            }
          }
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          user: { select: { id: true, username: true, firstName: true, lastName: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } }
        }
      });

      // 4. Update customer (within transaction)
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { 
            totalSpent: { increment: total },
            lastPurchaseAt: new Date()
          }
        });
      }

      // 5. Update inventory (within transaction) with validation
      for (const item of items) {
        const updated = await tx.inventory.updateMany({
          where: { 
            productId: item.productId,
            branchId,
            quantity: { gte: item.quantity } // Ensure sufficient stock
          },
          data: { 
            quantity: { decrement: item.quantity },
            lastUpdated: new Date()
          }
        });

        // Double-check update succeeded
        if (updated.count === 0) {
          throw new Error(`Failed to update inventory for product ${item.productId}. Stock may have changed.`);
        }
      }

      // 6. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_TRANSACTION',
          entity: 'transaction',
          entityId: transaction.id,
          changes: JSON.stringify({
            transactionNumber: transaction.transactionNumber,
            total: transaction.total,
            items: items.length,
            paymentMethod
          })
        }
      });

      return transaction;
    }, {
      maxWait: 5000, // 5 seconds max wait
      timeout: 10000, // 10 seconds timeout
      isolationLevel: 'Serializable' // Highest isolation level to prevent race conditions
    });

    logger.info('Transaction created successfully', {
      transactionId: result.id,
      transactionNumber: result.transactionNumber,
      total: result.total,
      items: result.items.length
    });

    res.status(201).json(result);
  } catch (error) {
    // Classify errors for better client feedback
    if (error.message.includes('Insufficient stock')) {
      logger.warn('Transaction failed: Insufficient stock', { 
        error: error.message,
        userId: req.validated?.userId 
      });
      return res.status(400).json({ 
        error: 'Insufficient stock',
        message: error.message
      });
    }
    
    if (error.message.includes('not found in branch inventory')) {
      logger.warn('Transaction failed: Product not found', { 
        error: error.message,
        userId: req.validated?.userId 
      });
      return res.status(404).json({ 
        error: 'Product not found',
        message: error.message
      });
    }

    if (error.message.includes('Failed to update inventory')) {
      logger.error('Transaction failed: Inventory update failed', { 
        error: error.message,
        userId: req.validated?.userId 
      });
      return res.status(409).json({ 
        error: 'Inventory conflict',
        message: 'Stock levels changed during transaction. Please try again.'
      });
    }
    
    if (error.code === 'P2034') { // Prisma transaction conflict
      logger.warn('Transaction failed: Database conflict', { 
        error: error.message,
        userId: req.validated?.userId 
      });
      return res.status(409).json({ 
        error: 'Transaction conflict',
        message: 'Please try again'
      });
    }

    // Log unexpected errors
    logger.error('Transaction creation failed', {
      error: error.message,
      stack: error.stack,
      userId: req.validated?.userId,
      customerId: req.validated?.customerId,
      items: req.validated?.items
    });

    res.status(500).json({ 
      error: 'Transaction failed',
      message: 'Unable to process transaction. Please try again.'
    });
  }
});

// Refund transaction
router.post('/:id/refund', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Refund reason is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get original transaction
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { items: true, payments: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'REFUNDED') {
        throw new Error('Transaction already refunded');
      }

      if (transaction.status === 'CANCELLED') {
        throw new Error('Cannot refund cancelled transaction');
      }

      // 2. Validate refund amount
      const maxRefund = transaction.total;
      const actualRefundAmount = refundAmount || maxRefund;
      
      if (actualRefundAmount > maxRefund) {
        throw new Error(`Refund amount (${actualRefundAmount}) exceeds transaction total (${maxRefund})`);
      }

      // 3. Update transaction status
      await tx.transaction.update({
        where: { id },
        data: { 
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: reason
        }
      });

      // 4. Create refund payment record
      await tx.payment.create({
        data: {
          transactionId: id,
          amount: -actualRefundAmount,
          method: transaction.paymentMethod,
          status: 'COMPLETED',
          type: 'REFUND'
        }
      });

      // 5. Restore inventory
      for (const item of transaction.items) {
        await tx.inventory.updateMany({
          where: { 
            productId: item.productId,
            branchId: transaction.branchId
          },
          data: { 
            quantity: { increment: item.quantity },
            lastUpdated: new Date()
          }
        });
      }

      // 6. Update customer total spent
      if (transaction.customerId) {
        await tx.customer.update({
          where: { id: transaction.customerId },
          data: { 
            totalSpent: { decrement: actualRefundAmount }
          }
        });
      }

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'REFUND_TRANSACTION',
          entity: 'transaction',
          entityId: id,
          changes: JSON.stringify({
            refundAmount: actualRefundAmount,
            reason,
            originalTotal: transaction.total
          })
        }
      });

      return { 
        success: true, 
        refundAmount: actualRefundAmount,
        transactionId: id
      };
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    });

    logger.info('Transaction refunded successfully', {
      transactionId: id,
      refundAmount: result.refundAmount,
      reason
    });

    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('already refunded') || error.message.includes('Cannot refund')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('exceeds transaction total')) {
      return res.status(400).json({ error: error.message });
    }

    logger.error('Refund failed', { 
      error: error.message, 
      transactionId: req.params.id 
    });
    
    res.status(500).json({ 
      error: 'Refund failed',
      message: 'Unable to process refund. Please try again.'
    });
  }
});

// Get daily sales
router.get('/daily/:branchId', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        branchId: req.params.branchId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { 
        items: true,
        payments: true
      }
    });

    const summary = {
      totalSales: transactions.reduce((sum, t) => sum + t.total, 0),
      totalTransactions: transactions.length,
      totalItems: transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
      averageTransaction: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length 
        : 0,
      paymentMethods: transactions.reduce((acc, t) => {
        acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ transactions, summary });
  } catch (error) {
    logger.error('Failed to fetch daily sales', { 
      error: error.message,
      branchId: req.params.branchId 
    });
    res.status(500).json({ error: 'Failed to fetch daily sales' });
  }
});

// Get transaction statistics
router.get('/stats/:branchId', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      branchId: req.params.branchId,
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalSales, totalTransactions, totalRefunds] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: { total: true }
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.count({
        where: {
          ...where,
          status: 'REFUNDED'
        }
      })
    ]);

    res.json({
      totalSales: totalSales._sum.total || 0,
      totalTransactions,
      totalRefunds,
      averageTransaction: totalTransactions > 0 
        ? (totalSales._sum.total || 0) / totalTransactions 
        : 0
    });
  } catch (error) {
    logger.error('Failed to fetch transaction stats', { 
      error: error.message,
      branchId: req.params.branchId 
    });
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
