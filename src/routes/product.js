const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validation = require('../utils/validation');

// All product routes require authentication
router.use(authMiddleware);

/**
 * GET /api/products
 * Get all products for user
 */
router.get('/', productController.getProducts);

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', productController.getProduct);

/**
 * GET /api/products/:id/stats
 * Get product statistics
 */
router.get('/:id/stats', productController.getProductStats);

/**
 * POST /api/products
 * Create new product
 */
router.post(
  '/',
  validation.validate(validation.schemas.createProduct),
  productController.createProduct
);

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/:id', productController.updateProduct);

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
