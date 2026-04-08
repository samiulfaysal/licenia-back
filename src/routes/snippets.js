const express = require('express');
const router = express.Router();
const snippetController = require('../controllers/snippetController');

/**
 * GET /api/snippets/list/:licenseId
 * Get available snippet languages
 */
router.get('/list/:licenseId', snippetController.listSnippets);

/**
 * GET /api/snippets/preview?licenseId=X&language=php
 * Preview snippet as JSON
 */
router.get('/preview', snippetController.previewSnippet);

/**
 * GET /api/snippets?licenseId=X&language=php
 * Download snippet as file
 */
router.get('/', snippetController.getSnippet);

module.exports = router;
