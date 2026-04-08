const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createProduct: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
  }),

  generateLicense: Joi.object({
    productId: Joi.number().integer().required(),
    expiresAt: Joi.date().optional(),
    activationLimit: Joi.number().integer().min(1).max(100).default(1),
  }),

  validateLicense: Joi.object({
    licenseKey: Joi.string().required(),
    domain: Joi.string().required(),
  }),

  activateLicense: Joi.object({
    licenseKey: Joi.string().required(),
    domain: Joi.string().required(),
    ipAddress: Joi.string().optional(),
    userAgent: Joi.string().optional(),
  }),
};

// Validate request body
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details.map(d => d.message).join(', ')
      });
    }
    req.validated = value;
    next();
  };
};

// Get schema
exports.getSchema = (name) => {
  return schemas[name];
};

// Validate domain format
exports.isValidDomain = (domain) => {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return domainRegex.test(domain);
};

// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.schemas = schemas;
