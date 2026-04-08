const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate a random license key
exports.generateLicenseKey = (productName, userId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(12).toString('hex').toUpperCase();
  const productHash = crypto
    .createHash('md5')
    .update(productName)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();
  
  return `${productHash}-${timestamp.toString(36).toUpperCase()}-${random}`;
};

// Hash license key for storage
exports.hashLicenseKey = async (licenseKey) => {
  return await bcrypt.hash(licenseKey, 10);
};

// Verify license key against hash
exports.verifyLicenseKey = async (plainKey, hashedKey) => {
  return await bcrypt.compare(plainKey, hashedKey);
};

// Generate API key
exports.generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash API key
exports.hashApiKey = async (apiKey) => {
  return await bcrypt.hash(apiKey, 10);
};

// Verify API key
exports.verifyApiKey = async (plainKey, hashedKey) => {
  return await bcrypt.compare(plainKey, hashedKey);
};

// Create hash for storage
exports.createHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
