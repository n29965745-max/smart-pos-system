const Joi = require('joi');

const schemas = {
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  createProduct: Joi.object({
    sku: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string(),
    price: Joi.number().positive().required(),
    cost: Joi.number().positive().required(),
    categoryId: Joi.string().required(),
    image: Joi.string()
  }),

  createCustomer: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    country: Joi.string(),
    creditLimit: Joi.number().default(0),
    branchId: Joi.string().required()
  }),

  createTransaction: Joi.object({
    userId: Joi.string().required(),
    customerId: Joi.string(),
    branchId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().positive().required(),
        discount: Joi.number().default(0)
      })
    ).required(),
    paymentMethod: Joi.string().required(),
    discount: Joi.number().default(0),
    notes: Joi.string(),
    idempotencyKey: Joi.string() // Optional idempotency key for duplicate prevention
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req.validated = value;
    next();
  };
};

module.exports = { schemas, validate };
