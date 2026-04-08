# License Management SaaS - Backend API

## Overview
Production-ready License Management SaaS backend built with Node.js, Express, and PostgreSQL.

## Features
- ✅ User authentication with JWT
- ✅ Secure license key generation and management
- ✅ Real-time license validation
- ✅ Domain binding and activation limits
- ✅ Multiple code generation snippets (PHP, JavaScript, Python, C#)
- ✅ Rate limiting and security features
- ✅ Product management
- ✅ License activation tracking

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database and JWT secret
```

3. **Setup database**
```bash
npx prisma migrate dev
```

4. **Start development server**
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Licenses (Mixed)
- `POST /api/licenses/validate` - **Public** - Validate license key
- `POST /api/licenses/activate` - **Public** - Activate license on domain
- `GET /api/licenses` - **Protected** - Get all user licenses
- `GET /api/licenses/:id` - **Protected** - Get single license
- `POST /api/licenses/generate` - **Protected** - Generate new license
- `DELETE /api/licenses/:id` - **Protected** - Revoke license
- `POST /api/licenses/:id/deactivate` - **Protected** - Deactivate domain

### Products (Protected)
- `GET /api/products` - Get all user products
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/stats` - Get product statistics
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Code Snippets (Public)
- `GET /api/snippets/list/:licenseId` - List available snippet languages
- `GET /api/snippets/preview` - Preview snippet as JSON
- `GET /api/snippets` - Download snippet file

## Request/Response Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}

Response 201:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Create Product
```bash
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My App",
  "description": "My awesome application"
}

Response 201:
{
  "id": 1,
  "name": "My App",
  "description": "My awesome application",
  "ownerId": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Generate License
```bash
POST /api/licenses/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "expiresAt": "2024-12-31T23:59:59Z",
  "activationLimit": 1
}

Response 201:
{
  "id": 1,
  "licenseKey": "MYAP-1704067200000-A1B2C3D4E5F6",
  "status": "ACTIVE",
  "expiresAt": "2024-12-31T23:59:59Z",
  "activationLimit": 1,
  "product": {...},
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Validate License (Public)
```bash
POST /api/licenses/validate
Content-Type: application/json

{
  "licenseKey": "MYAP-1704067200000-A1B2C3D4E5F6",
  "domain": "example.com"
}

Response 200:
{
  "valid": true,
  "product": "My App",
  "expiresAt": "2024-12-31T23:59:59Z",
  "activationsRemaining": 0
}
```

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **License Key Hashing**: Stored as bcrypt hashes, never stored in plain text
- **JWT Authentication**: 7-day expiration tokens
- **Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
  - Validation: 30 requests per minute
  - Generation: 100 licenses per hour
- **Input Validation**: Joi schema validation
- **Domain Binding**: Licenses bound to specific domains
- **Activation Limits**: Configurable activations per license
- **CORS**: Configurable CORS headers

## Database Schema

### Users
- id (PK)
- email (UNIQUE)
- password (hashed)
- name
- createdAt, updatedAt

### Products
- id (PK)
- name
- ownerId (FK → Users)
- description
- createdAt, updatedAt

### Licenses
- id (PK)
- keyHash (UNIQUE, bcrypt hashed)
- productId (FK → Products)
- userId (FK → Users)
- status (ACTIVE, EXPIRED, REVOKED, INACTIVE)
- expiresAt
- activationLimit
- createdAt, updatedAt

### Activations
- id (PK)
- licenseId (FK → Licenses)
- domain (UNIQUE with licenseId)
- ipAddress
- userAgent
- activatedAt
- lastValidatedAt

## Code Generation

Generated snippets include:

1. **WordPress Plugin** - PHP with wp_remote_post
2. **Generic PHP** - curl-based validation
3. **JavaScript** - Browser/Node.js validation with localStorage caching
4. **Python** - requests-based validation
5. **C#** - .NET HttpClient implementation

All snippets include:
- Configurable API URL
- Local caching (24 hours)
- Error handling
- Production-ready code

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# View database UI
npm run prisma:studio

# Create migration
npx prisma migrate dev --name migration_name

# Generate Prisma client
npm run prisma:generate
```

## Deployment

### Environment Variables for Production
```bash
DATABASE_URL="postgresql://..." # Production database
JWT_SECRET="..." # Strong random secret
NODE_ENV="production"
API_URL="https://api.yourdomain.com"
```

### Prisma Migrations
```bash
npx prisma migrate deploy
```

## License
MIT
