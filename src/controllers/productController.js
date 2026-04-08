const { PrismaClient } = require('@prisma/client');
const validation = require('../utils/validation');
const prisma = new PrismaClient();

/**
 * Get all products for authenticated user
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { ownerId: req.user.id },
      include: { 
        licenses: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = products.map(p => ({
      ...p,
      licenseCount: p.licenses.length,
      activeLicenseCount: p.licenses.filter(l => l.status === 'ACTIVE').length
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

/**
 * Get single product
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(req.params.id),
        ownerId: req.user.id
      },
      include: { licenses: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    const { error } = validation.schemas.createProduct.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if product name already exists for this user
    const existing = await prisma.product.findFirst({
      where: {
        name,
        ownerId: req.user.id
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Product name already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        ownerId: req.user.id
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const { name, description } = req.body;
    const productId = parseInt(req.params.id);

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name || product.name,
        description: description !== undefined ? description : product.description
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Cascade delete will remove licenses
    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

/**
 * Get product statistics
 */
exports.getProductStats = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: req.user.id
      },
      include: { licenses: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const licenses = product.licenses;
    const activations = await prisma.activation.findMany({
      where: {
        license: {
          productId: productId
        }
      }
    });

    const stats = {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter(l => l.status === 'ACTIVE').length,
      expiredLicenses: licenses.filter(l => l.status === 'EXPIRED').length,
      revokedLicenses: licenses.filter(l => l.status === 'REVOKED').length,
      totalActivations: activations.length,
      uniqueDomains: new Set(activations.map(a => a.domain)).size
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
