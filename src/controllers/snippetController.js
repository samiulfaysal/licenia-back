const codeGenerator = require('../utils/codeGenerator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get code snippet for license integration
 * GET /api/snippets?licenseId=X&language=php
 */
exports.getSnippet = async (req, res) => {
  try {
    const { licenseId, language } = req.query;

    if (!licenseId || !language) {
      return res.status(400).json({ 
        error: 'Missing licenseId or language parameter' 
      });
    }

    // Verify license exists and get details
    const license = await prisma.license.findUnique({
      where: { id: parseInt(licenseId) },
      include: { product: true }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Get API URL from environment
    const apiUrl = process.env.API_URL || 'https://api.example.com';

    let snippet = '';
    let mimeType = 'text/plain';

    switch (language.toLowerCase()) {
      case 'php':
      case 'wordpress':
        snippet = codeGenerator.generateWordPressSnippet(
          apiUrl,
          license.productId
        );
        mimeType = 'application/x-php';
        break;

      case 'php-generic':
        snippet = codeGenerator.generateGenericPhpSnippet(
          apiUrl,
          license.productId
        );
        mimeType = 'application/x-php';
        break;

      case 'javascript':
      case 'js':
        snippet = codeGenerator.generateJavaScriptSnippet(
          apiUrl,
          license.productId
        );
        mimeType = 'application/javascript';
        break;

      case 'python':
      case 'py':
        snippet = codeGenerator.generatePythonSnippet(
          apiUrl,
          license.productId
        );
        mimeType = 'text/x-python';
        break;

      case 'csharp':
      case 'cs':
      case 'c#':
        snippet = codeGenerator.generateCSharpSnippet(
          apiUrl,
          license.productId
        );
        mimeType = 'text/x-csharp';
        break;

      default:
        return res.status(400).json({ 
          error: 'Unsupported language. Supported: php, javascript, python, csharp' 
        });
    }

    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `attachment; filename="license-validator.${getFileExtension(language)}"`);
    res.send(snippet);
  } catch (error) {
    console.error('Error generating snippet:', error);
    res.status(500).json({ error: 'Failed to generate snippet' });
  }
};

/**
 * Get all available snippets for a license
 * GET /api/snippets/list/:licenseId
 */
exports.listSnippets = async (req, res) => {
  try {
    const { licenseId } = req.params;

    const license = await prisma.license.findUnique({
      where: { id: parseInt(licenseId) },
      include: { product: true }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const snippets = [
      {
        language: 'WordPress Plugin',
        code: 'wordpress',
        description: 'For WordPress plugins and themes',
        fileExtension: 'php'
      },
      {
        language: 'Generic PHP',
        code: 'php-generic',
        description: 'For custom PHP applications',
        fileExtension: 'php'
      },
      {
        language: 'JavaScript',
        code: 'javascript',
        description: 'For frontend validation',
        fileExtension: 'js'
      },
      {
        language: 'Python',
        code: 'python',
        description: 'For Python applications',
        fileExtension: 'py'
      },
      {
        language: 'C#',
        code: 'csharp',
        description: 'For .NET applications',
        fileExtension: 'cs'
      }
    ];

    const apiUrl = process.env.API_URL || 'https://api.example.com';

    res.json({
      product: license.product.name,
      snippets: snippets.map(s => ({
        ...s,
        downloadUrl: `/api/snippets?licenseId=${licenseId}&language=${s.code}`,
        previewUrl: `/api/snippets/preview?licenseId=${licenseId}&language=${s.code}`
      }))
    });
  } catch (error) {
    console.error('Error listing snippets:', error);
    res.status(500).json({ error: 'Failed to list snippets' });
  }
};

/**
 * Get snippet preview (as JSON)
 * GET /api/snippets/preview?licenseId=X&language=php
 */
exports.previewSnippet = async (req, res) => {
  try {
    const { licenseId, language } = req.query;

    if (!licenseId || !language) {
      return res.status(400).json({ 
        error: 'Missing licenseId or language parameter' 
      });
    }

    const license = await prisma.license.findUnique({
      where: { id: parseInt(licenseId) },
      include: { product: true }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const apiUrl = process.env.API_URL || 'https://api.example.com';

    let snippet = '';

    switch (language.toLowerCase()) {
      case 'wordpress':
      case 'php':
        snippet = codeGenerator.generateWordPressSnippet(
          apiUrl,
          license.productId
        );
        break;
      case 'php-generic':
        snippet = codeGenerator.generateGenericPhpSnippet(
          apiUrl,
          license.productId
        );
        break;
      case 'javascript':
      case 'js':
        snippet = codeGenerator.generateJavaScriptSnippet(
          apiUrl,
          license.productId
        );
        break;
      case 'python':
      case 'py':
        snippet = codeGenerator.generatePythonSnippet(
          apiUrl,
          license.productId
        );
        break;
      case 'csharp':
      case 'cs':
      case 'c#':
        snippet = codeGenerator.generateCSharpSnippet(
          apiUrl,
          license.productId
        );
        break;
      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    res.json({
      language,
      product: license.product.name,
      code: snippet
    });
  } catch (error) {
    console.error('Error previewing snippet:', error);
    res.status(500).json({ error: 'Failed to preview snippet' });
  }
};

function getFileExtension(language) {
  const extensions = {
    'php': 'php',
    'wordpress': 'php',
    'php-generic': 'php',
    'javascript': 'js',
    'js': 'js',
    'python': 'py',
    'py': 'py',
    'csharp': 'cs',
    'cs': 'cs',
    'c#': 'cs'
  };
  return extensions[language.toLowerCase()] || 'txt';
}

