const { PrismaClient } = require('@prisma/client');
const crypto = require('../utils/crypto');
const validation = require('../utils/validation');
const prisma = new PrismaClient();

/**
 * Get all licenses for authenticated user
 */
exports.getLicenses = async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      where: { userId: req.user.id },
      include: { 
        product: true,
        activations: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Hide sensitive data
    const sanitized = licenses.map(lic => ({
      id: lic.id,
      keyPreview: lic.keyHash.substring(0, 10) + '...',
      product: lic.product,
      status: lic.status,
      expiresAt: lic.expiresAt,
      activationLimit: lic.activationLimit,
      activationCount: lic.activations.length,
      activations: lic.activations,
      createdAt: lic.createdAt,
      updatedAt: lic.updatedAt
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
};

/**
 * Get single license with full details
 */
exports.getLicense = async (req, res) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { product: true, activations: true }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Verify ownership
    if (license.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(license);
  } catch (error) {
    console.error('Error fetching license:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
};

/**
 * Generate new license
 * POST /api/licenses/generate
 */
exports.generateLicense = async (req, res) => {
  try {
    const { productId, expiresAt, activationLimit } = req.body;

    // Validate input
    const { error, value } = validation.schemas.generateLicense.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(productId),
        ownerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate license key
    const licenseKey = crypto.generateLicenseKey(product.name, req.user.id);
    const keyHash = await crypto.hashLicenseKey(licenseKey);

    // Create license
    const license = await prisma.license.create({
      data: {
        keyHash,
       // keyPlain: licenseKey, // Will be cleared before sending
        productId: parseInt(productId),
        userId: req.user.id,
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        activationLimit: activationLimit || 1
      },
      include: { product: true }
    });

    // Return key ONLY during generation
    res.status(201).json({
      id: license.id,
      licenseKey: licenseKey, // Only returned here, never again
      status: license.status,
      expiresAt: license.expiresAt,
      activationLimit: license.activationLimit,
      product: license.product,
      createdAt: license.createdAt,
      message: 'IMPORTANT: Copy this key now. It will not be shown again.'
    });
  } catch (error) {
    console.error('Error generating license:', error);
    res.status(500).json({ error: 'Failed to generate license' });
  }
};

/**
 * Validate license key
 * POST /api/licenses/validate (public endpoint)
 */
exports.validateLicense = async (req, res) => {
  try {
    const { licenseKey, domain } = req.body;

    if (!licenseKey || !domain) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Missing licenseKey or domain' 
      });
    }

    // Validate domain format
    if (!validation.isValidDomain(domain)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid domain format' 
      });
    }

    // Get all licenses and verify key
    const licenses = await prisma.license.findMany({
      include: { product: true, activations: true }
    });

    let validLicense = null;

    for (const lic of licenses) {
      const isMatch = await crypto.verifyLicenseKey(licenseKey, lic.keyHash);
      if (isMatch) {
        validLicense = lic;
        break;
      }
    }

    if (!validLicense) {
      return res.status(200).json({ 
        valid: false, 
        error: 'License key not found' 
      });
    }

    // Check license status
    if (validLicense.status !== 'ACTIVE') {
      return res.status(200).json({ 
        valid: false, 
        error: `License is ${validLicense.status.toLowerCase()}` 
      });
    }

    // Check expiry
    if (validLicense.expiresAt && new Date() > validLicense.expiresAt) {
      return res.status(200).json({ 
        valid: false, 
        error: 'License has expired' 
      });
    }

    // Check domain binding
    const existingActivation = validLicense.activations.find(
      a => a.domain === domain
    );

    if (!existingActivation) {
      // New domain - check activation limit
      if (validLicense.activations.length >= validLicense.activationLimit) {
        return res.status(200).json({ 
          valid: false, 
          error: 'Activation limit exceeded' 
        });
      }

      // Create new activation
      await prisma.activation.create({
        data: {
          licenseId: validLicense.id,
          domain,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } else {
      // Update last validated time
      await prisma.activation.update({
        where: { id: existingActivation.id },
        data: { lastValidatedAt: new Date() }
      });
    }

    res.status(200).json({
      valid: true,
      product: validLicense.product.name,
      expiresAt: validLicense.expiresAt,
      activationsRemaining: Math.max(
        0,
        validLicense.activationLimit - validLicense.activations.length
      )
    });
  } catch (error) {
    console.error('Error validating license:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Validation error' 
    });
  }
};

/**
 * Activate license manually
 * POST /api/licenses/activate
 */
exports.activateLicense = async (req, res) => {
  try {
    const { licenseKey, domain } = req.body;

    const licenses = await prisma.license.findMany({
      include: { product: true, activations: true }
    });

    let validLicense = null;

    for (const lic of licenses) {
      const isMatch = await crypto.verifyLicenseKey(licenseKey, lic.keyHash);
      if (isMatch) {
        validLicense = lic;
        break;
      }
    }

    if (!validLicense) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Check if already activated on this domain
    const existing = await prisma.activation.findUnique({
      where: {
        licenseId_domain: {
          licenseId: validLicense.id,
          domain
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'License already activated on this domain' });
    }

    // Check activation limit
    if (validLicense.activations.length >= validLicense.activationLimit) {
      return res.status(400).json({ error: 'Activation limit exceeded' });
    }

    // Create activation
    const activation = await prisma.activation.create({
      data: {
        licenseId: validLicense.id,
        domain,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      message: 'License activated',
      activation,
      activationsRemaining: validLicense.activationLimit - validLicense.activations.length - 1
    });
  } catch (error) {
    console.error('Error activating license:', error);
    res.status(500).json({ error: 'Failed to activate license' });
  }
};

/**
 * Revoke license
 * DELETE /api/licenses/:id
 */
exports.revokeLicense = async (req, res) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (license.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.license.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'REVOKED' }
    });

    res.json({ message: 'License revoked' });
  } catch (error) {
    console.error('Error revoking license:', error);
    res.status(500).json({ error: 'Failed to revoke license' });
  }
};

/**
 * Deactivate from specific domain
 * POST /api/licenses/:id/deactivate
 */
exports.deactivateDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    const licenseId = parseInt(req.params.id);

    const license = await prisma.license.findUnique({
      where: { id: licenseId }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (license.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.activation.deleteMany({
      where: {
        licenseId,
        domain
      }
    });

    res.json({ message: 'Domain deactivated' });
  } catch (error) {
    console.error('Error deactivating domain:', error);
    res.status(500).json({ error: 'Failed to deactivate domain' });
  }
};
