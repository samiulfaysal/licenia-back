const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationLimiter, generationLimiter } = require('../middleware/rateLimiter');

/**
 * PUBLIC ENDPOINTS
 */

// Validate license (public - no auth required)
router.post('/validate', validationLimiter, licenseController.validateLicense);

// Activate license (public - no auth required)
router.post('/activate', licenseController.activateLicense);

/**
 * PROTECTED ENDPOINTS
 */

// Get all licenses for user
router.get('/', authMiddleware, licenseController.getLicenses);

// Get single license
router.get('/:id', authMiddleware, licenseController.getLicense);

// Generate new license
router.post('/generate', authMiddleware, generationLimiter, licenseController.generateLicense);

// Revoke license
router.delete('/:id', authMiddleware, licenseController.revokeLicense);

// Deactivate from domain
router.post('/:id/deactivate', authMiddleware, licenseController.deactivateDomain);

module.exports = router;
