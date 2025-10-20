# BesaHubs CRM Security Documentation

> **Last Updated:** October 1, 2025  
> **Version:** 1.1  
> **Maintainer:** BesaHubs Security Team

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Access Control](#authentication--access-control)
3. [Transport & Network Security](#transport--network-security)
4. [API Protection](#api-protection)
5. [Data Security & Privacy](#data-security--privacy)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [GDPR Compliance](#gdpr-compliance)
8. [Security Testing](#security-testing)
9. [Phase 5: Enterprise Infrastructure](#phase-5-enterprise-infrastructure-october-2025)
   - [5.1 Secrets Management (Doppler Integration)](#51-secrets-management-doppler-integration)
   - [5.2 PII Encryption Key Rotation](#52-pii-encryption-key-rotation)
   - [5.3 Disaster Recovery & Backup Automation](#53-disaster-recovery--backup-automation)
   - [5.4 Compliance Documentation](#54-compliance-documentation)
   - [5.5 DDoS Mitigation & Bot Protection](#55-ddos-mitigation--bot-protection)
   - [5.6 Security Testing CI/CD](#56-security-testing-cicd)
   - [Phase 5 Architecture Diagram](#phase-5-architecture-diagram)
   - [Production Deployment Checklist](#production-deployment-checklist-1)
   - [Support & Troubleshooting](#support--troubleshooting)
10. [Production Deployment Checklist](#production-deployment-checklist)
11. [Incident Response](#incident-response)
12. [Developer Security Guidelines](#developer-security-guidelines)

---

## Overview

### Purpose of This Document

This document provides a comprehensive guide to the security features implemented in BesaHubs CRM. It serves as both a reference for developers and a transparency document for stakeholders who want to understand how we protect sensitive commercial real estate data.

### Security Posture Summary

BesaHubs CRM implements **26 distinct security features** across multiple layers:

- **Authentication**: Multi-factor authentication (MFA), JWT tokens with rotation, account lockout
- **Access Control**: Role-Based Access Control (RBAC) with 60+ granular permissions
- **Network Security**: HTTPS enforcement, HSTS, Content Security Policy
- **Data Protection**: PII encryption at rest, sensitive data masking, append-only audit logs
- **API Security**: Rate limiting, input sanitization, SQL injection protection
- **Compliance**: GDPR-compliant data export and deletion
- **Monitoring**: Real-time security alerts, structured logging, audit trails

### Compliance Standards

We align with industry-standard security frameworks:

- **OWASP Top 10 (2021)**: Protection against SQL injection, XSS, broken authentication, security misconfigurations
- **GDPR (General Data Protection Regulation)**: Right to data export, right to be forgotten, data retention policies
- **NIST Cybersecurity Framework**: Identity management, data security, detection and response
- **SOC 2 Type II Readiness**: Audit logging, access controls, encryption at rest

### Target Audience

- **Developers**: Implementation details, code references, security best practices
- **DevOps/SRE Teams**: Deployment configuration, monitoring setup, incident response
- **Security Auditors**: Compliance evidence, security controls documentation
- **Business Stakeholders**: High-level overview, risk mitigation strategies
- **End Users**: What protections are in place for their data

---

## Authentication & Access Control

### Password Policy

**Requirements:**
- Minimum length: **12 characters**
- Must include:
  - At least one lowercase letter (a-z)
  - At least one uppercase letter (A-Z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&)

**Implementation:** `server/utils/passwordHelper.js`

```javascript
// Password validation function
const validatePasswordComplexity = (password) => {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

**Security Benefits:**
- Resistant to dictionary attacks (12+ characters)
- Complexity requirements increase entropy
- Special characters prevent common password patterns

---

### Account Lockout Mechanism

**Configuration:**
- **Maximum Failed Attempts:** 5 attempts
- **Lockout Duration:** 30 minutes
- **Tracking Method:** Redis (real-time) + PostgreSQL (persistent)

**Implementation:** `server/services/authService.js`

**How It Works:**

```
┌──────────────┐
│ Login Attempt│
└──────┬───────┘
       │
       ▼
  ┌─────────────────┐
  │ Check if locked │◄─── Redis/DB
  └────────┬────────┘
           │
      ┌────┴────┐
      │ Locked? │
      └────┬────┘
           │
      Yes  │  No
      ↓    │   ↓
  [Reject] │ [Verify Password]
           │     │
           │   Valid?
           │     │
           │  No │ Yes
           │   ↓  │  ↓
           │ [Increment] [Reset Counter]
           │ [Counter]   [Allow Login]
           │     │
           │  ≥5?
           │   │
           │ Yes│
           │  ↓
           └─[Lock Account]
              [30 minutes]
```

**Code Example:**

```javascript
// Lock account after 5 failed attempts
async handleFailedLogin(userId, email, ip = null, userAgent = null) {
  const userAttempts = await this.recordLoginAttempt(userId, false);
  const emailAttempts = await this.recordLoginAttempt(email, true);

  const maxAttempts = Math.max(
    parseInt(userAttempts) || 0,
    parseInt(emailAttempts) || 0
  );

  if (maxAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
    await this.lockAccount(userId, email);
    return {
      locked: true,
      attemptsRemaining: 0
    };
  }

  return {
    locked: false,
    attemptsRemaining: LOCKOUT_CONFIG.MAX_ATTEMPTS - maxAttempts
  };
}
```

**Security Benefits:**
- Prevents brute force password attacks
- Tracks attempts by both user ID and email
- Dual storage (Redis + DB) ensures reliability
- Automatic unlock after 30 minutes (no admin intervention needed)

---

### JWT Token Lifecycle

**Token Types:**

| Token Type | Purpose | Expiration | Storage |
|------------|---------|------------|---------|
| **Access Token** | API authentication | 15 minutes | Client memory only |
| **Refresh Token** | Generate new access tokens | 7 days | httpOnly cookie (recommended) |

**Implementation:** `server/services/tokenService.js`

**Token Structure:**

```json
// Access Token Payload
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1696204800,
  "exp": 1696205700
}

// Refresh Token Payload
{
  "id": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "sid": "session-id",
  "iat": 1696204800,
  "exp": 1696809600
}
```

**Why Short-Lived Access Tokens?**
- Limits exposure window if token is compromised
- Forces regular re-authentication
- Reduces damage from XSS attacks

---

### Refresh Token Rotation

**What is Token Rotation?**
Token rotation means every time a refresh token is used to get a new access token, we issue a **brand new refresh token** and invalidate the old one. This is like getting a new key card every time you enter a secure building.

**Implementation:** `server/services/tokenService.js`

**Flow Diagram:**

```
Client                    Server                    Redis
  │                         │                         │
  │ 1. Send Refresh Token   │                         │
  ├────────────────────────>│                         │
  │                         │ 2. Verify Token         │
  │                         │ 3. Check Blacklist      │
  │                         ├────────────────────────>│
  │                         │<────────────────────────┤
  │                         │ 4. Not Blacklisted ✓    │
  │                         │                         │
  │                         │ 5. Blacklist Old Token  │
  │                         ├────────────────────────>│
  │                         │                         │
  │                         │ 6. Generate New Tokens  │
  │ 7. New Access + Refresh │                         │
  │<────────────────────────┤                         │
  │                         │ 8. Store New Refresh    │
  │                         ├────────────────────────>│
  │                         │                         │
```

**Token Reuse Detection:**

If someone tries to use a refresh token that's already been blacklisted (meaning it was already used once), we detect this as a **security breach** and:

1. **Revoke the entire session family** (all tokens in that session)
2. **Log a critical security alert**
3. **Force the user to re-authenticate**

```javascript
// Token reuse detection
if (await this.isRefreshRevoked(decoded.jti)) {
  appLogger.warn(`⚠️ Reuse detected! Revoking entire session family`);
  
  await securityAlertService.logTokenReuse(
    user.id,
    user.email,
    null,
    decoded.jti
  );
  
  await this.revokeTokenFamily(decoded.sid);
  throw new Error('Token reuse detected - session revoked for security');
}
```

**Security Benefits:**
- Stolen refresh tokens expire after first use
- Token reuse detection prevents replay attacks
- Automatic session revocation on suspicious activity

---

### Multi-Factor Authentication (MFA)

**Who Needs MFA:**
- **Required:** Admin and Manager roles
- **Optional:** All other users

**MFA Methods:**

1. **TOTP (Time-Based One-Time Password)**
   - 6-digit codes that change every 30 seconds
   - Compatible with Google Authenticator, Authy, 1Password
   - Window tolerance: ±60 seconds (2 time steps)

2. **Backup Codes**
   - 10 single-use recovery codes
   - Hashed with bcrypt before storage
   - Use when TOTP device is unavailable

**Implementation:** `server/services/mfaService.js`

**Setup Flow:**

```
1. User requests MFA setup
   └─> Server generates TOTP secret (32 characters)
   
2. Server sends QR code + manual entry key
   └─> Client displays QR code
   
3. User scans QR code with authenticator app
   └─> App generates 6-digit code
   
4. User submits verification code
   └─> Server verifies code
   
5. If valid:
   └─> Enable MFA
   └─> Generate 10 backup codes
   └─> Show codes to user (only once!)
   └─> Store hashed backup codes in database
```

**MFA Lockout Protection:**

Just like login attempts, MFA has its own lockout mechanism:
- **Maximum Failed Attempts:** 5 attempts
- **Lockout Duration:** 30 minutes
- Tracks attempts separately from login attempts

```javascript
// MFA verification with lockout
async verifyTOTP(user, token) {
  // Check if user is locked out
  if (user.isMfaLocked()) {
    const lockTimeRemaining = Math.ceil(
      (user.mfaLockUntil - new Date()) / 1000 / 60
    );
    throw new Error(
      `Account is locked. Try again in ${lockTimeRemaining} minutes.`
    );
  }

  // Verify token with ±60 second tolerance
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  if (verified) {
    await user.resetMfaAttempts();
    return true;
  } else {
    await user.incMfaAttempts();
    return false;
  }
}
```

**Security Benefits:**
- Protects against password compromise
- Time-based codes prevent replay attacks
- Backup codes enable account recovery
- Lockout prevents brute force attacks on MFA

---

### Role-Based Access Control (RBAC)

**System Roles:**

| Role | Description | MFA Required | Typical Use Case |
|------|-------------|--------------|------------------|
| **Admin** | Full system access | ✅ Yes | System administrators, IT managers |
| **Manager** | Team management, reporting | ✅ Yes | Sales managers, team leads |
| **Agent** | Deal and property management | ❌ Optional | Real estate agents, brokers |
| **Assistant** | Limited access, data entry | ❌ Optional | Administrative support staff |

**Permission System:**

We use **60+ granular permissions** structured as `resource:action` pairs:

```
Examples:
- properties:create
- properties:read
- properties:update
- properties:delete
- deals:create
- deals:read
- users:manage
- reports:view_all
```

**Implementation:** `server/services/permissionService.js` and `server/middleware/permissions.js`

**How to Protect an Endpoint:**

```javascript
// Protect route with permission check
const { permissionMiddleware } = require('./middleware/auth');

router.get('/properties', 
  authMiddleware,                          // Must be authenticated
  permissionMiddleware('properties', 'read'), // Must have properties:read
  async (req, res) => {
    // Handler code
  }
);
```

**Permission Caching:**

To avoid database queries on every request, user permissions are cached for 5 minutes:

```javascript
// Get user permissions (cached)
async function getUserPermissions(userId) {
  const cacheKey = `user_permissions_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.permissions; // Return cached
  }
  
  // Fetch from database if not cached
  // ...cache and return
}
```

**Security Benefits:**
- Principle of least privilege (users only get necessary access)
- Granular control over feature access
- Easy to audit who has access to what
- Cached permissions improve performance

---

## Transport & Network Security

### HTTPS Enforcement

**Production Configuration:**

In production, **all HTTP traffic is automatically redirected to HTTPS**.

**Implementation:** `server/index.js`

```javascript
// Force HTTPS in production
if (config.isProduction) {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      const secureUrl = `https://${req.get('host')}${req.url}`;
      return res.redirect(301, secureUrl);
    }
    next();
  });
}
```

**Development Configuration:**

- HTTP allowed in development for easier local testing
- WebSocket (ws://) allowed for hot module reload

---

### HTTP Strict Transport Security (HSTS)

**What is HSTS?**

HSTS tells browsers to **only connect via HTTPS** for the next year, even if the user types `http://` in the address bar.

**Configuration:**

```javascript
hsts: {
  maxAge: 31536000,      // 1 year in seconds
  includeSubDomains: true, // Apply to all subdomains
  preload: true          // Include in browser preload lists
}
```

**Implementation:** `server/index.js` via Helmet middleware

**Security Benefits:**
- Prevents SSL stripping attacks
- Protects against accidental HTTP connections
- Included in browser HSTS preload lists

---

### Content Security Policy (CSP)

**What is CSP?**

CSP is a security layer that prevents cross-site scripting (XSS) attacks by controlling what resources the browser can load.

**Our CSP Policy:**

```javascript
{
  defaultSrc: ["'self'"],              // Only load from our domain
  scriptSrc: ["'self'"],               // Only our scripts (no inline JS in production)
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],              // Only connect to our API
  frameAncestors: ["'none'"],          // Cannot be embedded in iframes
  baseUri: ["'self'"],
  formAction: ["'self'"]
}
```

**What This Blocks:**

- ❌ Inline JavaScript (`<script>alert('XSS')</script>`)
- ❌ External scripts from untrusted domains
- ❌ Embedding our site in iframes (clickjacking protection)
- ❌ Form submissions to external domains

**Security Benefits:**
- Prevents XSS attacks even if input sanitization is bypassed
- Blocks clickjacking attempts
- Prevents data exfiltration to external domains

---

### Security Headers

**Headers Applied by Helmet:**

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking (iframe embedding) |
| `X-XSS-Protection` | `1; mode=block` | Enable browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |
| `X-Powered-By` | *(removed)* | Hide Express.js signature |

**Implementation:** `server/index.js`

```javascript
app.use(helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hidePoweredBy: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

---

### CORS Whitelist

**What is CORS?**

Cross-Origin Resource Sharing (CORS) controls which websites can call our API. Without proper CORS configuration, any website could make requests to our API on behalf of logged-in users.

**Our CORS Policy:**

- **Development:** Allow `localhost:3000`, `localhost:5000`, and Replit dev domains
- **Production:** **Only** domains explicitly listed in `ALLOWED_ORIGINS` environment variable
- **No Wildcards:** We never use `*` (allow all origins) in production

**Implementation:** `server/index.js`

```javascript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // In production, if ALLOWED_ORIGINS is empty, reject all requests
    if (allowedOrigins.length === 0 && config.isProduction) {
      appLogger.error('CORS: Request blocked - no allowed origins configured');
      return callback(new Error('CORS policy: No allowed origins configured'));
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      appLogger.warn('CORS: Origin not allowed', { origin });
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Configuration:**

```bash
# .env file
ALLOWED_ORIGINS=https://app.besahubs.com,https://www.besahubs.com
```

**Security Benefits:**
- Prevents unauthorized websites from accessing our API
- Credentials (cookies, authorization headers) only sent to whitelisted domains
- Protects against CSRF attacks

---

## API Protection

### Global Request Validation (Joi)

**What is Joi?**

Joi is a schema validation library. We use it to validate **every API request** before it reaches our business logic.

**Implementation:** `server/validation/schemas/`

**Example Schema:**

```javascript
// Contact creation validation
const createContactSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).allow(''),
  company: Joi.string().max(200).allow(''),
  title: Joi.string().max(100).allow(''),
  notes: Joi.string().allow('')
});
```

**How to Use:**

```javascript
const { celebrate, Segments } = require('celebrate');
const { createContactSchema } = require('../validation/schemas/contact.schemas');

router.post('/contacts',
  authMiddleware,
  celebrate({ [Segments.BODY]: createContactSchema }), // Validate request body
  async (req, res) => {
    // If we get here, req.body is valid
  }
);
```

**Validation Error Response:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ],
  "message": "Please check your input and try again"
}
```

**Security Benefits:**
- Rejects malformed data before processing
- Prevents type confusion vulnerabilities
- Ensures data consistency
- Clear error messages help developers and users

---

### Input Sanitization (XSS Prevention)

**How We Prevent XSS:**

Every piece of user input is sanitized **before** it's stored in the database and **before** it's displayed to users.

**Implementation:** `server/middleware/sanitize.js`

**Sanitization Levels:**

1. **Strict** (default): Remove all HTML tags
   - Used for: Names, emails, addresses, most text fields
   
2. **Moderate**: Allow safe HTML tags (`<b>`, `<i>`, `<a>`)
   - Used for: Descriptions, notes, comments
   
3. **Email**: Normalize and validate email format
   - Used for: Email fields
   
4. **URL**: Validate URL structure
   - Used for: Website URLs, links

**Example:**

```javascript
// Input
{
  "firstName": "John<script>alert('XSS')</script>",
  "notes": "This is <b>bold</b> text with a <a href='https://example.com'>link</a>"
}

// After sanitization
{
  "firstName": "John",  // <script> tag removed
  "notes": "This is <b>bold</b> text with a <a href='https://example.com' rel='noopener noreferrer' target='_blank'>link</a>"
}
```

**Middleware Application:**

```javascript
// Applied globally to all routes
app.use(sanitizeInput);

// This sanitizes:
// - req.body
// - req.query
// - req.params
```

**Libraries Used:**
- `xss` package for XSS filtering
- `sanitize-html` for HTML sanitization
- `validator` for email and URL validation

**Security Benefits:**
- Prevents stored XSS attacks
- Prevents reflected XSS attacks
- Allows safe rich text where needed
- Applied globally (can't forget to sanitize)

---

### SQL Injection Protection

**How We Prevent SQL Injection:**

We use **Sequelize ORM** which automatically uses parameterized queries (prepared statements) for all database operations. This means user input is **never** directly concatenated into SQL strings.

**Implementation:** All database queries use Sequelize models

**Safe Query Examples:**

```javascript
// ✅ SAFE: Sequelize parameterized query
const user = await User.findOne({
  where: { email: userInput }  // Automatically parameterized
});

// ✅ SAFE: Raw query with replacements
await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: userInput },  // Parameterized
    type: QueryTypes.SELECT
  }
);
```

**UNSAFE Examples (NEVER DO THIS):**

```javascript
// ❌ DANGEROUS: String concatenation
await sequelize.query(
  `SELECT * FROM users WHERE email = '${userInput}'`
);

// ❌ DANGEROUS: Template literal
await sequelize.query(
  `SELECT * FROM users WHERE email = '${req.params.email}'`
);
```

**Additional Protection:**

We also have a SQL injection detection middleware that scans query parameters:

**Implementation:** `server/middleware/queryValidator.js`

```javascript
const dangerousPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(;|\-\-|\/\*|\*\/)/,
  /('|(\\'))/,
  /(\bOR\b.*=.*|1=1)/i
];

// Middleware checks all query parameters
app.use('/api/', queryValidationMiddleware);
```

**Security Benefits:**
- Automatic protection via ORM
- No risk of SQL injection in parameterized queries
- Additional detection layer catches suspicious patterns
- Enforced at the framework level (can't be bypassed)

---

### Rate Limiting

**Why Rate Limiting?**

Rate limiting prevents abuse by limiting how many requests a user can make in a given time window. This protects against:
- Brute force attacks
- DoS (Denial of Service) attempts
- Credential stuffing
- API abuse

**Rate Limit Strategies:**

| Endpoint Type | Max Requests | Time Window | Purpose |
|---------------|--------------|-------------|---------|
| **Auth Endpoints** | 5 | 15 minutes | Prevent login brute force |
| **Password Reset** | 3 | 1 hour | Prevent email bombing |
| **MFA Verify** | 5 | 5 minutes | Prevent MFA brute force |
| **Strict Endpoints** | 3 | 15 minutes | High-security operations |
| **General API** | 100 | 1 minute | Prevent API abuse |

**Implementation:** `server/middleware/rateLimiters.js`

**Example Configuration:**

```javascript
// Auth endpoints (login, register)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests
  message: 'Too many authentication attempts, please try again in 15 minutes',
  skipSuccessfulRequests: false,  // Count all attempts
  name: 'auth-limiter'
});

// Password reset endpoints
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // 3 requests
  message: 'Too many password reset attempts, please try again in 1 hour',
  skipSuccessfulRequests: true,  // Only count failures
  name: 'password-reset-limiter'
});
```

**How to Apply:**

```javascript
// Apply to specific routes
router.post('/auth/login', authLimiter, loginHandler);
router.post('/auth/forgot-password', passwordResetLimiter, forgotPasswordHandler);
```

**What Happens When Limit is Exceeded:**

1. Request is rejected with 429 (Too Many Requests) status
2. Security alert is logged
3. Alert service checks if this is a pattern (multiple IPs, repeated attempts)
4. Admin security dashboard shows rate limit violations

**Rate Limit Headers:**

Responses include rate limit information:

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1696205400
```

**Security Benefits:**
- Prevents brute force attacks
- Mitigates DoS attempts
- Protects against credential stuffing
- Limits damage from compromised accounts

---

## Data Security & Privacy

### PII Encryption at Rest

**What is Encrypted:**

All Personally Identifiable Information (PII) is encrypted in the database using PostgreSQL's `pgcrypto` extension:

- User email addresses
- Contact phone numbers
- Contact email addresses
- Company tax IDs
- Company EIN/TIN numbers
- Any other sensitive PII fields

**Encryption Method:**

- **Algorithm:** AES-256 via PostgreSQL `pgp_sym_encrypt()`
- **Key Management:** 32+ character encryption key in environment variable
- **Storage:** Encrypted as bytea (binary) in database

**Implementation:** `server/utils/encryption.js`

**How It Works:**

```javascript
// Encrypt a value before storing
const encryptValue = async (value) => {
  if (!value) return null;
  
  const key = getEncryptionKey();  // From ENCRYPTION_KEY env var
  const query = `SELECT pgp_sym_encrypt($1, $2) as encrypted`;
  const result = await sequelize.query(query, {
    bind: [value, key],
    type: sequelize.QueryTypes.SELECT
  });
  
  return result[0].encrypted;  // Returns encrypted binary data
};

// Decrypt when reading
const decryptValue = async (value) => {
  if (!value) return null;
  
  const key = getEncryptionKey();
  const query = `SELECT pgp_sym_decrypt($1, $2) as decrypted`;
  const result = await sequelize.query(query, {
    bind: [value, key],
    type: sequelize.QueryTypes.SELECT
  });
  
  return result[0].decrypted;
};
```

**Sequelize Model Hooks:**

Encryption happens automatically via Sequelize hooks:

```javascript
// User model
User.beforeCreate(async (user) => {
  if (user.email) {
    user.email = await encryptValue(user.email);
  }
});

User.afterFind(async (users) => {
  if (Array.isArray(users)) {
    for (let user of users) {
      if (user.email) {
        user.email = await decryptValue(user.email);
      }
    }
  } else if (users && users.email) {
    users.email = await decryptValue(users.email);
  }
});
```

**Key Management:**

```bash
# Generate encryption key (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
ENCRYPTION_KEY=your-secure-encryption-key-min-32-chars-never-lose-this-key
```

**⚠️ CRITICAL WARNING:**

- **Never lose the encryption key** - encrypted data cannot be recovered without it
- **Rotate keys carefully** - requires re-encrypting all data
- **Use a secrets manager** in production (AWS Secrets Manager, Azure Key Vault, etc.)
- **Backup the key** in a secure location separate from database backups

**Security Benefits:**
- Data is useless if database is compromised
- Meets compliance requirements (GDPR, SOC 2)
- Protects against database dumps and backups leaking
- Encryption happens at database level (transparent to application)

**Performance Note:**

Encrypted fields **cannot** be used in WHERE clauses efficiently. For searchable fields, use a hash-based lookup:

```javascript
// Create searchable hash
const emailHash = crypto.createHash('sha256')
  .update(email.toLowerCase())
  .digest('hex');

// Store both encrypted value and hash
await User.create({
  email: await encryptValue(email),
  emailHash: emailHash  // Searchable
});

// Search by hash
const user = await User.findOne({
  where: { emailHash: emailHash }
});
```

---

### Sensitive Data Masking in Logs

**What is Masked:**

To prevent accidental exposure in logs, we automatically mask:

- Credit card numbers (show last 4 digits)
- Social Security Numbers (show last 4 digits)
- Email addresses (show first character + domain)
- Phone numbers (show last 4 digits)
- Passwords (fully redacted)
- JWT tokens (fully redacted)
- API keys (fully redacted)
- MFA secrets (fully redacted)

**Implementation:** `server/utils/dataMasking.js`

**Masking Examples:**

```javascript
// Credit card: 4532-1234-5678-9010 → ****-****-****-9010
maskCreditCard("4532-1234-5678-9010")

// SSN: 123-45-6789 → ***-**-6789
maskSSN("123-45-6789")

// Email: john.doe@example.com → j***@example.com
maskEmail("john.doe@example.com")

// Phone: 555-123-4567 → ***-***-4567
maskPhone("555-123-4567")

// Generic: secret123456 → ********3456 (last 4 chars)
maskGeneric("secret123456", 4)
```

**Auto-Detection:**

The system can automatically detect and mask sensitive patterns in text:

```javascript
const maskSensitivePatterns = (text) => {
  // Automatically finds and masks:
  // - Credit card numbers
  // - SSNs
  // - Email addresses
  // - Phone numbers
};

// Example
const logMessage = "User john@test.com logged in from 555-123-4567";
const masked = maskSensitivePatterns(logMessage);
// Result: "User j***@test.com logged in from ***-***-4567"
```

**Object Masking:**

Automatically mask sensitive fields in objects before logging:

```javascript
const userData = {
  name: "John Doe",
  ssn: "123-45-6789",
  email: "john@test.com",
  password: "secretPassword123"
};

const masked = maskObjectFields(userData);
// Result:
{
  name: "John Doe",
  ssn: "***-**-6789",
  email: "j***@test.com",
  password: "[REDACTED]"
}
```

**Usage in Logging:**

```javascript
const { appLogger } = require('./config/logger');
const { maskObjectFields } = require('./utils/dataMasking');

// Before logging user data, mask sensitive fields
appLogger.info('User updated', {
  userId: user.id,
  changes: maskObjectFields(req.body)  // Mask sensitive fields
});
```

**Security Benefits:**
- Prevents accidental PII exposure in logs
- Logs can be safely shared with external monitoring services
- Developers can debug without accessing real data
- Meets compliance requirements for log handling

---

### Append-Only Audit Logs with Hash Chain

**What is an Audit Log?**

An audit log is an **immutable record** of security-relevant events. Think of it like a tamper-evident seal - if anyone tries to modify or delete entries, we can detect it.

**Events Logged:**

- User login attempts (success and failure)
- Password changes
- Permission changes
- Data access (who viewed what)
- Data modifications (who changed what)
- MFA enrollment/disable
- Admin actions
- Security alerts

**Hash Chain Verification:**

Each audit log entry contains:
1. Event data (timestamp, user, action, etc.)
2. Hash of the **previous entry** (like blockchain)
3. Hash of **current entry** (calculated from event data + previous hash)

```
Entry 1: [Data] → Hash A
Entry 2: [Data + Hash A] → Hash B  
Entry 3: [Data + Hash B] → Hash C
Entry 4: [Data + Hash C] → Hash D
```

If anyone tampers with Entry 2, Hash C won't match, and we'll detect the tampering.

**Implementation:** `server/services/auditLogService.js`

**Log Entry Structure:**

```json
{
  "timestamp": "2025-10-01 19:52:20",
  "userId": "user-uuid",
  "email": "user@example.com",
  "action": "USER_LOGIN",
  "resource": "auth",
  "method": "POST",
  "path": "/api/auth/login",
  "statusCode": 200,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "req-uuid",
  "previousHash": "901131d838b17aac0f7885b81e03cbdc...",
  "hash": "a5d3f8b9c4e2a1f7d6c3b8e4a9f2d5c1..."
}
```

**Verification:**

```javascript
// Verify hash chain integrity
const verifyHashChain = (logs) => {
  const results = {
    valid: true,
    totalEntries: logs.length,
    verifiedEntries: 0,
    tamperedEntries: [],
    brokenChains: []
  };

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  for (let i = 0; i < sortedLogs.length; i++) {
    const entry = sortedLogs[i];
    
    // Recalculate hash
    const expectedHash = calculateHash(entry, entry.previousHash);
    
    if (entry.hash !== expectedHash) {
      results.valid = false;
      results.tamperedEntries.push({
        timestamp: entry.timestamp,
        reason: 'Hash mismatch - entry may have been tampered'
      });
    }

    // Verify chain continuity
    if (i > 0 && entry.previousHash !== sortedLogs[i - 1].hash) {
      results.valid = false;
      results.brokenChains.push({
        timestamp: entry.timestamp,
        reason: 'Chain broken - previousHash does not match'
      });
    }

    results.verifiedEntries++;
  }

  return results;
};
```

**Immutability:**

- Audit logs are **append-only** (no DELETE or UPDATE operations)
- Stored in daily rotating files: `audit-2025-10-01.log`
- Files are automatically compressed after rotation
- No API endpoints exist to modify audit logs

**Security Benefits:**
- Tamper detection via hash chain
- Immutable audit trail for compliance
- Forensic investigation capability
- Meets SOC 2 and ISO 27001 requirements

---

### Log Retention

**Retention Policy:**

| Log Type | Retention Period | Storage |
|----------|------------------|---------|
| **Audit Logs** | 90 days minimum | Compressed files |
| **Application Logs** | 30 days | Rotating files |
| **Security Logs** | 90 days | Rotating files |
| **Error Logs** | 60 days | Rotating files |

**Automatic Log Rotation:**

Logs are automatically rotated daily:

```
logs/
├── audit-2025-10-01.log        (today)
├── audit-2025-09-30.log        (yesterday)
├── audit-2025-09-29.log.gz     (compressed)
├── audit-2025-09-28.log.gz
└── ...
```

**Cleanup Job:**

A scheduled job runs daily at 2 AM to remove old logs:

```javascript
// server/jobs/scheduledJobs.js
cron.schedule('0 2 * * *', async () => {
  await cleanupOldLogs();
});
```

**Production Recommendations:**

For production environments, we recommend:
1. **Ship logs to external service** (CloudWatch, Datadog, Splunk)
2. **Backup audit logs** to S3 or similar for long-term storage
3. **Increase retention** for audit logs to 1-2 years for compliance

---

### Encrypted Fields Summary

**User Model:**
- `email` (encrypted + hashed for search)

**Contact Model:**
- `email` (encrypted + hashed)
- `phone` (encrypted)
- `secondaryEmail` (encrypted)
- `mobilePhone` (encrypted)

**Company Model:**
- `taxId` (encrypted)
- `ein` (encrypted)

**How to Add Encryption to New Fields:**

1. Add field to model with BYTEA type
2. Add encryption hooks:

```javascript
// Before save
ModelName.beforeCreate(async (instance) => {
  if (instance.fieldName) {
    instance.fieldName = await encryptValue(instance.fieldName);
  }
});

// After retrieve
ModelName.afterFind(async (instances) => {
  if (Array.isArray(instances)) {
    for (let instance of instances) {
      if (instance.fieldName) {
        instance.fieldName = await decryptValue(instance.fieldName);
      }
    }
  }
});
```

3. Generate searchable hash if field needs to be searchable:

```javascript
const fieldHash = crypto.createHash('sha256')
  .update(value.toLowerCase())
  .digest('hex');
```

---

## Monitoring & Alerting

### Structured Logging

**Log Formats:**

- **Development:** Human-readable text format
- **Production:** JSON format for machine parsing

**Log Levels:**

| Level | Usage | Examples |
|-------|-------|----------|
| **ERROR** | System errors, exceptions | Database connection failed, API errors |
| **WARN** | Potential issues, degraded performance | High memory usage, slow queries |
| **INFO** | Normal operations | Server started, user logged in |
| **DEBUG** | Detailed debugging | Variable values, function calls |

**Log Files:**

```
server/logs/
├── combined.log        (all logs)
├── error.log          (errors only)
├── security.log       (security events)
├── audit-YYYY-MM-DD.log  (audit trail)
└── sql-audit.log      (SQL queries - optional)
```

**Implementation:** `server/config/logger.js` using Winston

**Example Structured Log:**

```json
{
  "timestamp": "2025-10-01T19:52:20.000Z",
  "level": "info",
  "service": "cre-crm-app",
  "message": "User login successful",
  "userId": "user-uuid",
  "email": "u***@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "req-abc123"
}
```

**Security Benefits:**
- Easy to search and analyze with tools like ELK stack
- Correlation IDs track requests across services
- Structured data enables alerting rules
- Sensitive data automatically masked

---

### Security Event Logging

**Events Automatically Logged:**

1. **Authentication Events:**
   - Login attempts (success/failure)
   - Password changes
   - Password reset requests
   - Account lockouts

2. **Authorization Events:**
   - Permission denied (403 errors)
   - Role changes
   - Permission grants/revokes

3. **MFA Events:**
   - MFA enrollment
   - MFA verification attempts
   - Backup code usage
   - MFA disable

4. **Data Access:**
   - Sensitive data exports
   - Bulk data operations
   - GDPR data export requests
   - Account deletion requests

5. **Administrative Actions:**
   - User account creation/deletion
   - Role assignments
   - Security configuration changes
   - System configuration changes

**Example Security Log Entry:**

```json
{
  "timestamp": "2025-10-01T19:52:20.000Z",
  "level": "warn",
  "service": "cre-crm-security",
  "event": "FAILED_LOGIN",
  "userId": "user-uuid",
  "email": "u***@example.com",
  "ip": "192.168.1.1",
  "attempts": 3,
  "attemptsRemaining": 2,
  "message": "Failed login attempt"
}
```

---

### Real-Time Security Alerts

**Alert Types:**

| Alert Type | Trigger | Severity | Action |
|------------|---------|----------|--------|
| **Brute Force** | 5+ failed logins in 5 min | CRITICAL | Auto-lock account, notify admin |
| **Multiple IPs** | Login from 3+ IPs in 1 hour | WARNING | Notify user and admin |
| **Token Reuse** | Refresh token used twice | CRITICAL | Revoke session, notify user |
| **Rate Limit** | 10+ violations in 1 hour | WARNING | Notify admin |
| **Admin Unusual IP** | Admin login from new IP | INFO | Notify admin |

**Implementation:** `server/services/securityAlertService.js`

**How Alerts Work:**

```
1. Security event occurs
   ↓
2. Alert service checks thresholds
   ↓
3. If threshold exceeded:
   ├─> Create SecurityAlert record in DB
   ├─> Log to security.log
   ├─> Send real-time notification (Socket.IO)
   └─> Email notification (optional)
```

**Alert Record Structure:**

```javascript
{
  alertType: 'BRUTE_FORCE',
  severity: 'CRITICAL',
  userId: 'user-uuid',
  email: 'user@example.com',
  ip: '192.168.1.1',
  message: 'Potential brute force attack detected',
  details: {
    count: 6,
    window: '5 minutes'
  },
  recommendedAction: 'Review IP and consider blocking',
  resolved: false,
  resolvedAt: null,
  resolvedBy: null
}
```

**Example: Brute Force Detection**

```javascript
async checkBruteForce(ip, userId = null, email = null) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const recentAttempts = await SecurityAlert.count({
    where: {
      ip: ip,
      alertType: 'BRUTE_FORCE',
      createdAt: { [Op.gte]: fiveMinutesAgo }
    }
  });

  if (recentAttempts >= 5) {
    return await this.createAlert({
      alertType: 'BRUTE_FORCE',
      severity: 'CRITICAL',
      userId,
      email,
      ip,
      message: `Potential brute force attack from IP ${ip}`,
      details: { count: recentAttempts + 1 },
      recommendedAction: 'Review IP and consider blocking'
    });
  }
}
```

---

### Admin Security Dashboard

**Dashboard Features:**

1. **Active Alerts**
   - Unresolved security alerts
   - Sorted by severity (Critical → Warning → Info)
   - One-click resolution

2. **Recent Security Events**
   - Last 100 security events
   - Real-time updates via WebSocket

3. **Login Statistics**
   - Successful vs failed login attempts
   - Geographic distribution (by IP)
   - Time-series graph

4. **User Activity**
   - Currently active users
   - Recent registrations
   - Locked accounts

5. **System Health**
   - API response times
   - Error rates
   - Database performance

**Access:**

```
URL: /admin/security-dashboard
Required Permission: admin:security:view
```

**Real-Time Updates:**

The dashboard receives real-time updates via Socket.IO:

```javascript
// Client-side
socket.on('security_alert', (alert) => {
  // Display new alert
  showNotification(alert);
  updateAlertList(alert);
});

// Server-side
io.to('admin_room').emit('security_alert', {
  type: alert.alertType,
  severity: alert.severity,
  message: alert.message,
  timestamp: alert.createdAt
});
```

---

## GDPR Compliance

### Data Export (Right to Access)

**Endpoint:** `GET /api/users/me/export-data`

**What is Exported:**

All personal data associated with the user's account:

- User profile information
- Properties (owned or created)
- Contacts (assigned or created)
- Deals (owned or created)
- Tasks (assigned or created)
- Activities (user's actions)
- Documents (uploaded files)
- Call logs
- Email logs
- Notifications
- Audit logs (last 1000 entries)

**Export Format:** JSON

**Implementation:** `server/services/gdprService.js`

**Rate Limiting:**

To prevent abuse:
- **Maximum:** 3 exports per day per user
- Resets at midnight

**Example Export:**

```json
{
  "metadata": {
    "exportDate": "2025-10-01T19:52:20.000Z",
    "userId": "user-uuid",
    "formatVersion": "1.0",
    "dataRetentionNotice": "This export contains all personal data..."
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "properties": [...],
  "contacts": [...],
  "deals": [...],
  "auditLogs": [...]
}
```

**How to Request:**

```bash
curl -X GET https://app.besahubs.com/api/users/me/export-data \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Right to Be Forgotten (Account Deletion)

**Endpoint:** `DELETE /api/users/me/delete-account`

**Process:**

1. **Request Phase:**
   - User requests deletion with password confirmation
   - Account is immediately **deactivated** (cannot login)
   - 30-day grace period begins

2. **Grace Period (30 days):**
   - User can cancel deletion request
   - Account can be restored with all data
   - User receives reminder emails

3. **Permanent Deletion (after 30 days):**
   - Automated job runs daily at 3 AM
   - Permanently deletes user data
   - Cascade deletion strategy applied

**Cascade Deletion Strategy:**

| Data Type | Action |
|-----------|--------|
| **User Account** | Permanently deleted |
| **Contacts** | Permanently deleted (if owned by user) |
| **Tasks** | Permanently deleted (if owned by user) |
| **Properties** | Anonymize (set owner to NULL) |
| **Deals** | Anonymize (set owner to NULL) |
| **Audit Logs** | Retained for compliance (90 days) |

**Implementation:** `server/services/gdprService.js`

**Request Deletion:**

```javascript
// POST /api/users/me/delete-account
{
  "password": "user_password_for_confirmation"
}

// Response
{
  "message": "Account deletion scheduled",
  "deletionDate": "2025-11-01T00:00:00.000Z",
  "gracePeriodDays": 30
}
```

**Cancel Deletion:**

```javascript
// POST /api/users/me/cancel-deletion

// Response
{
  "message": "Account deletion cancelled successfully",
  "accountRestored": true
}
```

**Scheduled Deletion Job:**

```javascript
// Runs daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  const results = await gdprService.processScheduledDeletions();
  appLogger.info('Scheduled deletions processed', results);
});
```

---

### Data Retention Policies

**Retention Periods:**

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| **Active User Data** | Until deleted | User request |
| **Deleted User Data** | 30 days (grace period) | Allow recovery |
| **Audit Logs** | 90 days minimum | Compliance |
| **Security Logs** | 90 days | Incident investigation |
| **Backup Data** | 90 days | Disaster recovery |
| **Application Logs** | 30 days | Troubleshooting |

**Automated Cleanup:**

Scheduled jobs clean up old data:

```javascript
// Daily cleanup at 2 AM
cron.schedule('0 2 * * *', async () => {
  // Remove logs older than retention period
  await cleanupOldLogs();
  
  // Process scheduled account deletions (30+ days)
  await processScheduledDeletions();
  
  // Clean up expired tokens from Redis
  await cleanExpiredTokens();
});
```

---

## Security Testing

### OWASP Top 10 Coverage

We test against all **OWASP Top 10 (2021)** vulnerabilities:

| # | Vulnerability | Our Protection | Test Coverage |
|---|---------------|----------------|---------------|
| **A01** | Broken Access Control | RBAC, permission checks | ✅ 50+ tests |
| **A02** | Cryptographic Failures | PII encryption, HTTPS, HSTS | ✅ Manual testing |
| **A03** | Injection | Sequelize ORM, input sanitization | ✅ 15+ tests |
| **A04** | Insecure Design | Security by design, threat modeling | ✅ Architecture review |
| **A05** | Security Misconfiguration | Helmet, CSP, secure defaults | ✅ Manual testing |
| **A06** | Vulnerable Components | npm audit, Dependabot | ✅ Automated |
| **A07** | Auth Failures | MFA, account lockout, JWT rotation | ✅ 20+ tests |
| **A08** | Software & Data Integrity | Hash chain audit logs | ✅ Manual testing |
| **A09** | Logging Failures | Structured logging, audit logs | ✅ Manual testing |
| **A10** | SSRF | Input validation, URL sanitization | ✅ 5+ tests |

**Test File:** `server/tests/security/owasp.test.js`

---

### SQL Injection Tests

**Test Cases:**

```javascript
const sqlInjectionPayloads = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "admin' OR '1'='1'/*",
  "'; DROP TABLE users--",
  "1' UNION SELECT NULL, NULL, NULL--",
  "' OR 'x'='x",
  "1; DELETE FROM users WHERE 1=1--"
];

// Test each payload on login endpoint
sqlInjectionPayloads.forEach(payload => {
  test(`Should reject SQL injection: ${payload}`, async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: payload, password: 'test' });

    expect([400, 401]).toContain(response.status);
  });
});
```

**Run Tests:**

```bash
cd server
npm test -- tests/security/owasp.test.js
```

---

### RBAC Integration Tests

**Test File:** `server/tests/security/rbac.test.js`

**Test Coverage:**

- ✅ Admin can access all resources
- ✅ Manager can access team resources
- ✅ Agent cannot access admin endpoints
- ✅ Permission checks work correctly
- ✅ Permission caching works
- ✅ Role assignment/removal works
- ✅ Permission inheritance works

**Example Test:**

```javascript
describe('RBAC Permission Tests', () => {
  test('Admin can access admin dashboard', async () => {
    const adminToken = createToken({ role: 'admin' });
    
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('Agent cannot access admin dashboard', async () => {
    const agentToken = createToken({ role: 'agent' });
    
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(response.status).toBe(403);
  });
});
```

**Run Tests:**

```bash
cd server
npm test -- tests/security/rbac.test.js
```

---

### Automated Dependency Scanning

**Tools Used:**

1. **npm audit** - Scans for known vulnerabilities
2. **Dependabot** (GitHub) - Automatic PR for security updates

**Run Manually:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# View detailed report
npm audit --json
```

**CI/CD Integration:**

Our GitHub Actions workflow runs security checks on every push:

```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: |
          cd server
          npm audit --audit-level=moderate
```

**Dependabot Configuration:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/server"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### How to Run All Security Tests

**Full Test Suite:**

```bash
# Run all tests
cd server
npm test

# Run only security tests
npm test -- tests/security/

# Run specific test file
npm test -- tests/security/owasp.test.js

# Run with coverage
npm test -- --coverage
```

**Manual Security Testing:**

1. **XSS Testing:**
   ```bash
   # Try to inject script in name field
   curl -X POST http://localhost:3001/api/contacts \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"firstName": "<script>alert(1)</script>", "lastName": "Test"}'
   ```

2. **SQL Injection Testing:**
   ```bash
   # Try SQL injection in login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin'\'' OR 1=1--", "password": "test"}'
   ```

3. **Rate Limiting Testing:**
   ```bash
   # Send 10 rapid requests
   for i in {1..10}; do
     curl -X POST http://localhost:3001/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email": "test@test.com", "password": "wrong"}';
   done
   ```

---

## Production Deployment Checklist

### Required Environment Variables

**Critical (Must Set):**

```bash
# JWT Secrets (32+ characters, cryptographically random)
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-different-from-jwt

# Database Encryption (32+ characters, NEVER LOSE THIS)
ENCRYPTION_KEY=your-secure-encryption-key-min-32-chars

# Database Connection
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Environment
NODE_ENV=production

# CORS Origins (comma-separated, no wildcards)
ALLOWED_ORIGINS=https://app.besahubs.com,https://www.besahubs.com

# Demo Mode (MUST be false in production)
DEMO_MODE=false
```

**Recommended:**

```bash
# Redis (for session management and caching)
REDIS_URL=redis://username:password@host:6379

# SSL/TLS Certificates
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# Email (for notifications)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@besahubs.com
EMAIL_PASS=email-password
```

---

### Secret Management

**Generate Strong Secrets:**

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Security Requirements:**

- ✅ Minimum 32 characters
- ✅ Cryptographically random (not dictionary words)
- ✅ Different secrets for each environment (dev/staging/prod)
- ✅ Rotate every 90 days
- ✅ Never commit to version control
- ✅ Use secrets manager (AWS Secrets Manager, Azure Key Vault)

**Best Practices:**

1. **Use a Secrets Manager:**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager get-secret-value --secret-id prod/besahubs/jwt-secret
   
   # Azure Key Vault
   az keyvault secret show --vault-name besahubs-vault --name jwt-secret
   ```

2. **Rotate Secrets:**
   - Schedule rotation every 90 days
   - Use blue-green deployment for zero downtime
   - Support multiple concurrent secrets during rotation

3. **Backup Secrets:**
   - Store in encrypted backup separate from database
   - Document recovery procedure
   - Test recovery process regularly

---

### Demo Mode Configuration

**⚠️ CRITICAL:**

Demo mode **MUST be disabled** in production:

```bash
# .env
DEMO_MODE=false
```

**Why?**

Demo mode creates a hardcoded admin account:
- Email: `admin@demo.com`
- Password: `admin123`

This is a **critical security vulnerability** in production.

**Automatic Protection:**

The server automatically blocks demo credentials in production:

```javascript
// server/config/environment.js
if (config.isProduction && config.demoMode) {
  console.error('🚨 SECURITY ERROR: Demo mode is DISABLED in production!');
  config.demoMode = false;
}
```

---

### Database Encryption Migration

**Initial Setup:**

If you're enabling encryption on an existing database:

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Set ENCRYPTION_KEY in .env
ENCRYPTION_KEY=your-new-encryption-key

# 3. Run encryption migration
cd server
node scripts/encryptExistingData.js

# 4. Verify encrypted data
node scripts/verifyEncryption.js
```

**Migration Script:** `server/scripts/encryptExistingData.js`

**What Gets Encrypted:**

- User emails (all existing users)
- Contact emails and phones (all existing contacts)
- Company tax IDs (all existing companies)

**Rollback Plan:**

If encryption fails:
1. Stop the application
2. Restore from backup: `psql $DATABASE_URL < backup.sql`
3. Fix the issue
4. Retry migration

---

### HTTPS Certificate Setup

**Option 1: Let's Encrypt (Recommended)**

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d app.besahubs.com

# Certificates will be at:
# /etc/letsencrypt/live/app.besahubs.com/fullchain.pem
# /etc/letsencrypt/live/app.besahubs.com/privkey.pem

# Configure .env
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/app.besahubs.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/app.besahubs.com/privkey.pem

# Auto-renewal (run monthly)
sudo crontab -e
0 0 1 * * certbot renew --quiet
```

**Option 2: Load Balancer (AWS ALB, Azure App Gateway)**

If using a load balancer, handle SSL at the load balancer:
- Load balancer handles HTTPS
- Application receives HTTP from load balancer
- Set `SSL_ENABLED=false` in .env
- Ensure load balancer forwards `X-Forwarded-Proto` header

---

### Redis Configuration

**For Distributed Systems:**

If running multiple server instances (load balanced), Redis is **required** for:
- Session management
- Token blacklist
- Rate limiting
- Caching

**Setup:**

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis (production settings)
sudo nano /etc/redis/redis.conf

# Set:
# - requirepass your-redis-password
# - maxmemory 512mb
# - maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis

# Configure .env
REDIS_URL=redis://:your-redis-password@localhost:6379
```

**Cloud Redis:**

- **AWS:** ElastiCache for Redis
- **Azure:** Azure Cache for Redis
- **Google Cloud:** Memorystore for Redis

**Without Redis:**

The application works without Redis, but with limitations:
- ✅ Basic authentication works (DB-based)
- ⚠️ Token rotation requires DB queries (slower)
- ⚠️ Rate limiting is per-instance (not global)
- ⚠️ No caching (slower API responses)

---

### Pre-Deployment Validation

**Run Validation Script:**

```bash
cd server
node config/validateEnv.js
```

**Checks:**

- ✅ NODE_ENV is set to 'production'
- ✅ JWT_SECRET is at least 32 characters
- ✅ ENCRYPTION_KEY is set and secure
- ✅ DATABASE_URL is set
- ✅ DEMO_MODE is false
- ✅ ALLOWED_ORIGINS is set (no wildcards)
- ✅ SSL certificates exist and are valid
- ✅ Redis connection works (if configured)

**Example Output:**

```
✅ Environment variables validated successfully

🔒 Security Configuration:
   Environment: PRODUCTION
   HTTPS Enforcement: ENABLED
   HSTS: ENABLED (1 year, preload)
   Demo Mode: DISABLED
   SSL/TLS: HTTPS

⚠️  Warnings:
   - REDIS_URL not set (caching disabled)
   - EMAIL_HOST not set (email notifications disabled)
```

---

## Incident Response

### How to Respond to Security Alerts

**Alert Severity Levels:**

| Severity | Response Time | Action |
|----------|--------------|--------|
| **CRITICAL** | Immediate (< 15 min) | Investigate, take action, notify team |
| **WARNING** | Within 1 hour | Review, monitor, document |
| **INFO** | Next business day | Log for analysis |

**Response Workflow:**

```
1. Receive Alert
   ↓
2. Assess Severity
   ├─ CRITICAL → Immediate Action
   ├─ WARNING → Review within 1 hour
   └─ INFO → Log and monitor
   ↓
3. Investigate
   ├─ View audit logs
   ├─ Check security logs
   └─ Identify affected users/data
   ↓
4. Take Action
   ├─ Lock accounts (if needed)
   ├─ Revoke tokens
   ├─ Block IPs
   └─ Notify users
   ↓
5. Document
   ├─ What happened
   ├─ What was done
   └─ Lessons learned
   ↓
6. Mark Resolved
```

---

### Viewing Audit Logs

**Admin Dashboard:**

```
URL: /admin/audit-logs
Required Permission: admin:audit:view
```

**API Endpoint:**

```bash
# Get recent audit logs
curl -X GET "https://app.besahubs.com/api/audit-logs?limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by user
curl -X GET "https://app.besahubs.com/api/audit-logs?userId=user-uuid" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by date range
curl -X GET "https://app.besahubs.com/api/audit-logs?startDate=2025-10-01&endDate=2025-10-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify integrity
curl -X GET "https://app.besahubs.com/api/audit-logs/verify" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Server Logs:**

```bash
# View audit log file
cat server/logs/audit-2025-10-01.log

# Search for specific user
grep "user@example.com" server/logs/audit-*.log

# Search for failed logins
grep "FAILED_LOGIN" server/logs/security-*.log
```

---

### Revoking Compromised Tokens

**Revoke Specific Token:**

```bash
# Via API (requires token jti and sid)
curl -X POST "https://app.besahubs.com/api/auth/revoke-token" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jti": "token-id", "sid": "session-id"}'
```

**Revoke All User Tokens:**

```bash
# Force logout all sessions for a user
curl -X POST "https://app.besahubs.com/api/admin/users/:userId/revoke-all-tokens" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Revoke via Server:**

```javascript
// server/services/tokenService.js

// Revoke single token
await tokenService.blacklistToken(jti, sid);

// Revoke entire session family
await tokenService.revokeTokenFamily(sid);

// Revoke all user sessions (requires custom implementation)
await tokenService.revokeAllUserSessions(userId);
```

---

### Account Lockout Management

**View Locked Accounts:**

```bash
# Admin dashboard
GET /api/admin/locked-accounts

# Response
{
  "lockedAccounts": [
    {
      "userId": "user-uuid",
      "email": "user@example.com",
      "lockUntil": "2025-10-01T20:30:00.000Z",
      "reason": "Too many failed login attempts"
    }
  ]
}
```

**Unlock Account:**

```bash
# Admin can manually unlock
curl -X POST "https://app.besahubs.com/api/admin/users/:userId/unlock" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Response
{
  "message": "Account unlocked successfully",
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

**Via Server:**

```javascript
// server/services/authService.js
await authService.resetLoginAttempts(userId, email);
```

**Automatic Unlock:**

Accounts automatically unlock after 30 minutes. No manual intervention needed.

---

### Emergency Contacts

**Security Team:**

- **Primary:** security@besahubs.com
- **Phone:** +1 (555) 123-4567 (24/7 for CRITICAL issues)
- **Slack:** #security-alerts

**Escalation Path:**

1. **Developer** → Investigate and attempt resolution
2. **Team Lead** → If issue persists or is critical
3. **CTO** → For critical security breaches
4. **CEO** → For data breaches requiring notification

**External Resources:**

- **AWS Support:** (for infrastructure issues)
- **Database Provider:** (for database security)
- **Security Auditor:** [contact info]

---

## Developer Security Guidelines

### Never Log Sensitive Data

**❌ BAD:**

```javascript
// Don't log raw user data
logger.info('User updated', { user: req.body });

// Don't log passwords
logger.info('Login attempt', { 
  email: user.email, 
  password: req.body.password  // NEVER!
});

// Don't log tokens
logger.info('Token issued', { token: accessToken });
```

**✅ GOOD:**

```javascript
// Use data masking
const { maskObjectFields } = require('./utils/dataMasking');

logger.info('User updated', { 
  userId: user.id,
  changes: maskObjectFields(req.body)  // Masks sensitive fields
});

// Log metadata only
logger.info('Login attempt', { 
  userId: user.id,
  email: maskEmail(user.email),  // j***@example.com
  success: true
});

// Log token metadata, not token itself
logger.info('Token issued', { 
  userId: user.id,
  tokenType: 'access',
  expiresIn: '15m'
});
```

---

### Always Use Parameterized Queries

**❌ BAD:**

```javascript
// String concatenation (SQL injection risk!)
const query = `SELECT * FROM users WHERE email = '${email}'`;
await sequelize.query(query);

// Template literals (SQL injection risk!)
await sequelize.query(`
  SELECT * FROM users 
  WHERE email = '${req.params.email}'
`);
```

**✅ GOOD:**

```javascript
// Use Sequelize ORM (automatically parameterized)
const user = await User.findOne({
  where: { email: email }  // Safe
});

// Use replacements for raw queries
await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: email },  // Parameterized
    type: QueryTypes.SELECT
  }
);
```

---

### Apply Permission Middleware

**❌ BAD:**

```javascript
// No authentication
router.get('/properties', async (req, res) => {
  const properties = await Property.findAll();
  res.json(properties);
});

// Authentication but no authorization
router.delete('/properties/:id', authMiddleware, async (req, res) => {
  await Property.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});
```

**✅ GOOD:**

```javascript
// Authentication + authorization
router.get('/properties', 
  authMiddleware,                           // Must be logged in
  permissionMiddleware('properties', 'read'), // Must have permission
  async (req, res) => {
    const properties = await Property.findAll();
    res.json(properties);
  }
);

// Check ownership for delete
router.delete('/properties/:id',
  authMiddleware,
  permissionMiddleware('properties', 'delete'),
  async (req, res) => {
    const property = await Property.findByPk(req.params.id);
    
    // Verify ownership (unless admin)
    if (property.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await property.destroy();
    res.json({ success: true });
  }
);
```

---

### Validate All Inputs

**❌ BAD:**

```javascript
// No validation
router.post('/contacts', authMiddleware, async (req, res) => {
  const contact = await Contact.create(req.body);
  res.json(contact);
});
```

**✅ GOOD:**

```javascript
const { celebrate, Segments } = require('celebrate');
const Joi = require('joi');

// Define schema
const createContactSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  company: Joi.string().max(200).optional()
});

// Apply validation
router.post('/contacts',
  authMiddleware,
  celebrate({ [Segments.BODY]: createContactSchema }),  // Validate
  async (req, res) => {
    // req.body is validated
    const contact = await Contact.create(req.body);
    res.json(contact);
  }
);
```

---

### Follow Least Privilege Principle

**Principle:**

Give users and services **only the permissions they need** to do their job, nothing more.

**Examples:**

**✅ Good Role Design:**

```javascript
// Agent role - can manage own deals and properties
const agentPermissions = [
  'properties:create',
  'properties:read',
  'properties:update',  // Own properties only
  'deals:create',
  'deals:read',
  'deals:update',       // Own deals only
  'contacts:read',
  'contacts:create'
];

// Assistant role - limited to data entry
const assistantPermissions = [
  'contacts:create',
  'contacts:read',
  'properties:read',
  'tasks:create',
  'tasks:read'
];
```

**❌ Bad Role Design:**

```javascript
// Don't give everyone admin permissions
const agentPermissions = [
  'admin:*',            // Too broad!
  'users:delete',       // Agents shouldn't delete users
  'system:configure'    // Agents shouldn't configure system
];
```

**In Code:**

```javascript
// Check specific permission, not role
// ❌ BAD
if (req.user.role === 'admin') {
  // Allow access
}

// ✅ GOOD
if (req.user.hasPermission('properties', 'delete')) {
  // Allow access
}
```

---

### Security Code Review Checklist

Before merging code, check:

- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] All inputs validated with Joi schemas
- [ ] All database queries use Sequelize ORM or parameterized queries
- [ ] All protected endpoints have `authMiddleware`
- [ ] Authorization checks (permissions) applied where needed
- [ ] No hardcoded secrets or API keys
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting applied to sensitive endpoints
- [ ] Input sanitization applied (XSS prevention)
- [ ] Unit tests cover security scenarios

---

## Phase 5: Enterprise Infrastructure (October 2025)

### 5.1 Secrets Management (Doppler Integration)

**Architecture:**
- Doppler SDK integration with automatic .env fallback for development
- 5-minute in-memory caching to reduce API calls
- Exponential backoff retry logic (3 attempts, 1s/2s/4s delays)
- Health monitoring endpoint (/api/health/secrets)
- Version tracking and automatic rotation support

**Environment Variables Required:**
- DOPPLER_TOKEN (production) - Doppler API token for secrets fetching
- All secrets available via fallback to server/.env in development

**Operational Procedures:**
- Setup guide: server/config/doppler-setup.md
- Health check: GET /api/health/secrets (admin-only)
- Cache refresh: Automatic every 5 minutes
- Fallback behavior: Uses .env if Doppler unavailable

**Quick Commands:**
```bash
# Install Doppler CLI
curl -sLf https://cli.doppler.com/install.sh | sh

# Login to Doppler
doppler login

# Setup project
doppler setup

# Run with Doppler
doppler run -- node server/index.js
```

---

### 5.2 PII Encryption Key Rotation

**Zero-Downtime Dual-Key Strategy:**
- Batch processing (100 records per transaction) prevents database locks
- Atomic decrypt-with-old → encrypt-with-new operations
- Resume capability from checkpoint via rotation_progress table
- Dry-run mode for safe testing (--dry-run flag)
- Emergency rollback script with dual-key decryption

**Tables & Fields Rotated:**
- users: encrypted_email, encrypted_phone, encrypted_tax_id
- contacts: encrypted_email, encrypted_phone, encrypted_mobile, encrypted_fax, encrypted_tax_id, encrypted_ssn
- companies: encrypted_primary_contact_email, encrypted_primary_contact_phone, encrypted_tax_id, encrypted_ein

**Scheduled Rotation:**
- Quarterly cron job (Jan 1, Apr 1, Jul 1, Oct 1 at 4:00 AM)
- Auto-generates new key using crypto.randomBytes(32)
- 7-day advance notification before rotation
- Controlled by ROTATION_SCHEDULE environment variable

**Operational Procedures:**
- Full guide: server/config/KEY_ROTATION_GUIDE.md
- Emergency rollback: server/scripts/emergencyKeyRollback.js
- Progress tracking: rotation_progress table

**Quick Commands:**
```bash
# Dry-run test (no actual changes)
node server/scripts/rotateKeys.js \
  --old-key "$ENCRYPTION_KEY" \
  --new-key "$NEW_KEY" \
  --batch-size 100 \
  --dry-run

# Production rotation
node server/scripts/rotateKeys.js \
  --old-key "$ENCRYPTION_KEY" \
  --new-key "$NEW_KEY" \
  --batch-size 100

# Emergency rollback
node server/scripts/emergencyKeyRollback.js \
  --failed-key "$NEW_KEY" \
  --restore-key "$OLD_KEY" \
  --rotation-id "rotation-123456" \
  --confirm-rollback
```

---

### 5.3 Disaster Recovery & Backup Automation

**Encrypted Backup System:**
- Daily automated backups at 3:00 AM
- AES-256-GCM encryption with random IV per backup
- gzip compression (level 9, ~86% size reduction)
- SHA-256 checksums for integrity verification
- Metadata JSON with retention information

**Retention Policy:**
- 30 daily backups (last 30 days)
- 12 monthly backups (last 12 months)
- Unlimited yearly backups (indefinite archival)
- Automatic cleanup of expired backups

**Restore Testing:**
- Weekly automated restore test every Sunday at 5:00 AM
- Validates latest backup restore to restore_test database
- Table count verification and integrity checks
- Automatic test database cleanup after validation
- Socket.IO notifications for success/failure

**Operational Procedures:**
- Full guide: server/config/DISASTER_RECOVERY_GUIDE.md
- Backup log tracking: backup_logs table

**Quick Commands:**
```bash
# Manual backup
node server/scripts/backupDatabase.js \
  --output-dir ./server/backups \
  --encryption-key "$BACKUP_ENCRYPTION_KEY"

# List available backups
node server/scripts/restoreDatabase.js \
  --list-backups \
  --backup-dir ./server/backups

# Test restore (to restore_test DB)
node server/scripts/restoreDatabase.js \
  --backup-file ./server/backups/backup-2025-10-01-12-00-00.sql.gz.enc \
  --encryption-key "$BACKUP_ENCRYPTION_KEY" \
  --target-db restore_test

# Production restore (requires confirmation)
node server/scripts/restoreDatabase.js \
  --backup-file ./server/backups/backup-2025-10-01-12-00-00.sql.gz.enc \
  --encryption-key "$BACKUP_ENCRYPTION_KEY" \
  --confirm-restore
```

---

### 5.4 Compliance Documentation

**Frameworks Covered:**
- SOC 2 Trust Service Criteria (7 categories: CC1-CC7)
- ISO 27001 Annex A Controls (34 controls mapped)
- CCPA Compliance Requirements (4 consumer rights)

**Implementation Status:**
- ✅ 22 controls fully implemented (65%)
- ⚠️ 9 controls partially implemented (26%)
- ❌ 3 controls identified as gaps (9%)

**Key Documents:**
- Full compliance mapping: docs/compliance.md
- Data retention policy: 11 data types with specific periods
- Quarterly access review process
- Vendor risk assessment checklist with 8 evaluation sections

**Gap Remediation Timeline:**
- Q4 2025: BCP documentation, change management process, DPO appointment
- Q1 2026: Penetration testing, vulnerability scanning, SIEM integration
- Q2 2026: Annual security awareness, SOC 2 Type II preparation

---

### 5.5 DDoS Mitigation & Bot Protection

**Multi-Layer Protection:**
1. **Cloudflare Turnstile CAPTCHA:**
   - Integrated on Login, Register, and ForgotPassword pages
   - Token verification with 5-minute caching (95%+ API call reduction)
   - Graceful fallback if TURNSTILE_SECRET_KEY not set (dev mode)
   - Returns 400 error if captcha verification fails

2. **Geo-IP Blocking:**
   - Country-based blocking via BLOCKED_COUNTRIES env var (ISO codes)
   - IP whitelist support via WHITELISTED_IPS env var
   - geoip-lite offline lookup (no external API dependency)
   - Disabled in development mode

3. **Request Body Size Limits:**
   - Auth endpoints: 10kb (login, register, password reset)
   - General API: 100kb
   - Upload endpoints: 50MB
   - Returns 413 error for oversized payloads

4. **Adaptive Rate Limiting:**
   - Request signature tracking (SHA-256 hash of IP + User-Agent + body)
   - Duplicate request detection (same signature within 1 second)
   - Three-tier protection: Cloudflare → Nginx → Express

**Operational Procedures:**
- Full guide: server/config/REVERSE_PROXY_GUIDE.md
- Nginx configuration examples with rate limiting
- Cloudflare WAF and DDoS protection setup
- Security headers configuration (CSP, HSTS, X-Frame-Options)

**Environment Variables:**
- TURNSTILE_SECRET_KEY (Cloudflare Turnstile secret key)
- REACT_APP_TURNSTILE_SITE_KEY (Cloudflare Turnstile site key - client)
- BLOCKED_COUNTRIES (optional, comma-separated ISO codes)
- WHITELISTED_IPS (optional, comma-separated IPs)

---

### 5.6 Security Testing CI/CD

**SAST (Static Analysis):**
- CodeQL JavaScript analysis with security-extended queries
- NPM dependency vulnerability audit (server + client)
- Scheduled daily at 2:00 AM UTC
- Critical vulnerability gate: CVSS ≥ 9.0 fails pipeline
- SARIF report upload to GitHub Security tab

**DAST (Dynamic Analysis):**
- OWASP ZAP baseline scan (passive analysis)
- OWASP ZAP full scan (active testing)
- Scheduled weekly on Sundays at 3:00 AM UTC
- Docker Compose test environment
- HTML/JSON report generation

**Penetration Testing:**
- Comprehensive guide: docs/penetration-testing.md
- OWASP WSTG v4.2 methodology (11 testing categories)
- 13 detailed attack scenarios with executable commands
- Security controls verification matrix (40+ controls)
- Professional vulnerability reporting template

**GitHub Actions Workflows:**
- .github/workflows/sast.yml (CodeQL + npm audit)
- .github/workflows/dast.yml (OWASP ZAP)
- .zap/rules.tsv (ZAP scan rules configuration)

**Required GitHub Secrets:**
- DOPPLER_TOKEN (Doppler API token)
- DATABASE_URL (PostgreSQL connection string)
- JWT_SECRET (JWT signing secret)

---

### Phase 5 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  ENTERPRISE INFRASTRUCTURE                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴────────────────────┐
        │                                          │
   ┌────▼─────┐                              ┌────▼─────┐
   │ SECRETS  │                              │  BACKUP  │
   │ MANAGER  │                              │  SYSTEM  │
   └────┬─────┘                              └────┬─────┘
        │                                          │
   Doppler SDK                              AES-256-GCM
   5-min cache                              Daily @ 3 AM
   Auto-rotation                            Weekly restore test
        │                                          │
   ┌────▼─────────────────────────────────────────▼─────┐
   │           APPLICATION LAYER (Express.js)            │
   └────┬────────────────────────────────────────┬──────┘
        │                                        │
   ┌────▼─────┐                            ┌────▼─────┐
   │   PII    │                            │  DDOS    │
   │ ROTATION │                            │MITIGATION│
   └────┬─────┘                            └────┬─────┘
        │                                        │
   Quarterly                              Turnstile CAPTCHA
   Dual-key                               Geo-IP blocking
   Zero-downtime                          Rate limiting
        │                                        │
   ┌────▼────────────────────────────────────────▼─────┐
   │         POSTGRESQL DATABASE (Neon-hosted)         │
   │                                                    │
   │  • pgcrypto encryption                            │
   │  • rotation_progress tracking                     │
   │  • backup_logs auditing                           │
   │  • 50+ strategic indexes                          │
   └────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴────────────────────┐
        │                                          │
   ┌────▼─────┐                              ┌────▼─────┐
   │ CI/CD    │                              │COMPLIANCE│
   │ TESTING  │                              │   DOCS   │
   └──────────┘                              └──────────┘
        │                                          │
   CodeQL SAST                                SOC 2 TSC
   OWASP ZAP DAST                            ISO 27001
   Daily/Weekly                               CCPA
```

---

### Production Deployment Checklist

Before deploying to production with Phase 5 infrastructure:

#### Prerequisites
- [ ] Doppler account created and DOPPLER_TOKEN configured
- [ ] BACKUP_ENCRYPTION_KEY generated (32+ bytes random)
- [ ] TURNSTILE_SECRET_KEY and REACT_APP_TURNSTILE_SITE_KEY obtained
- [ ] GitHub Secrets configured (DOPPLER_TOKEN, DATABASE_URL, JWT_SECRET)
- [ ] Reverse proxy (Nginx/Cloudflare) configured per REVERSE_PROXY_GUIDE.md

#### Secrets Management
- [ ] All secrets migrated to Doppler
- [ ] Health check endpoint verified (/api/health/secrets)
- [ ] Cache performance tested (5-minute refresh)
- [ ] Fallback to .env disabled in production

#### Data Protection
- [ ] First PII key rotation dry-run completed
- [ ] Quarterly rotation cron job verified (Jan/Apr/Jul/Oct 1st @ 4 AM)
- [ ] Emergency rollback script tested
- [ ] rotation_progress table monitored

#### Disaster Recovery
- [ ] First backup created and verified
- [ ] Backup encryption key securely stored
- [ ] Weekly restore test automated (Sundays @ 5 AM)
- [ ] S3/Glacier storage configured (production)
- [ ] Retention policy validated (30 daily/12 monthly/unlimited yearly)

#### Compliance
- [ ] SOC 2 control evidence collected
- [ ] ISO 27001 gap remediation plan approved
- [ ] CCPA consumer rights workflows tested
- [ ] Quarterly access review scheduled
- [ ] Vendor risk assessments completed

#### DDoS Protection
- [ ] Cloudflare Turnstile tested on all auth endpoints
- [ ] Geo-IP blocking configured (if required)
- [ ] Request body size limits verified
- [ ] Nginx rate limiting configured
- [ ] Cloudflare WAF rules activated

#### Security Testing
- [ ] GitHub Actions SAST pipeline running daily
- [ ] GitHub Actions DAST pipeline running weekly
- [ ] Critical vulnerability gates tested (CVSS ≥ 9.0)
- [ ] Initial penetration test completed
- [ ] Vulnerability remediation SLA defined

---

### Support & Troubleshooting

**Common Issues:**

1. **Doppler secrets not loading**
   - Check DOPPLER_TOKEN is set correctly
   - Verify network connectivity to api.doppler.com
   - Review logs: grep "Secrets" server/logs/combined.log
   - Fallback: Ensure .env file exists for development

2. **Key rotation fails mid-process**
   - Check rotation_progress table for last checkpoint
   - Resume with same rotation_id
   - If unrecoverable, run emergencyKeyRollback.js
   - Verify database has pgcrypto extension enabled

3. **Backup/restore errors**
   - Verify BACKUP_ENCRYPTION_KEY is correct
   - Check disk space (backups can be large)
   - Validate checksums before restore
   - Review backup_logs table for error details

4. **CAPTCHA verification failing**
   - Confirm TURNSTILE_SECRET_KEY is valid
   - Check Cloudflare API rate limits
   - Review token cache (5-minute TTL)
   - Test with manual verification request

5. **CI/CD pipelines failing**
   - Verify all GitHub Secrets are configured
   - Check Docker Compose services are healthy
   - Review SARIF reports in Security tab
   - Ensure ZAP rules.tsv is properly formatted

For detailed troubleshooting, refer to:
- server/config/KEY_ROTATION_GUIDE.md
- server/config/DISASTER_RECOVERY_GUIDE.md
- server/config/REVERSE_PROXY_GUIDE.md
- docs/penetration-testing.md

---

## Additional Resources

### Related Documentation

- [.env.example](../server/.env.example) - Environment variable configuration
- [DATABASE_SECURITY_GUIDELINES.md](../DATABASE_SECURITY_GUIDELINES.md) - Database security details
- [SQL_INJECTION_AUDIT_SUMMARY.md](../SQL_INJECTION_AUDIT_SUMMARY.md) - SQL injection audit results
- [REAL_DATA_INTEGRATION.md](../REAL_DATA_INTEGRATION.md) - Real data integration guidelines

### Code References

**Authentication & Authorization:**
- `server/services/authService.js` - Login attempts and account lockout
- `server/services/tokenService.js` - JWT token management and rotation
- `server/services/mfaService.js` - Multi-factor authentication
- `server/middleware/auth.js` - Authentication middleware
- `server/middleware/permissions.js` - Permission checks
- `server/services/permissionService.js` - RBAC logic

**Security Middleware:**
- `server/middleware/rateLimiters.js` - Rate limiting configurations
- `server/middleware/sanitize.js` - Input sanitization (XSS prevention)
- `server/middleware/queryValidator.js` - SQL injection detection
- `server/middleware/auditLogger.js` - Audit logging

**Data Security:**
- `server/utils/encryption.js` - PII encryption utilities
- `server/utils/dataMasking.js` - Sensitive data masking
- `server/utils/passwordHelper.js` - Password validation

**Monitoring:**
- `server/services/securityAlertService.js` - Security alerts
- `server/services/auditLogService.js` - Audit log management
- `server/config/logger.js` - Logging configuration

**GDPR:**
- `server/services/gdprService.js` - Data export and deletion

**Phase 5 - Enterprise Infrastructure:**
- `server/services/secretsManager.js` - Doppler secrets management
- `server/scripts/rotateKeys.js` - PII encryption key rotation
- `server/scripts/emergencyKeyRollback.js` - Emergency key rollback
- `server/scripts/backupDatabase.js` - Automated database backups
- `server/scripts/restoreDatabase.js` - Database restoration
- `server/middleware/captchaVerifier.js` - Cloudflare Turnstile verification
- `server/middleware/geoIpFilter.js` - Geo-IP blocking
- `server/config/KEY_ROTATION_GUIDE.md` - Key rotation procedures
- `server/config/DISASTER_RECOVERY_GUIDE.md` - Backup/restore guide
- `server/config/REVERSE_PROXY_GUIDE.md` - Production proxy setup
- `server/config/doppler-setup.md` - Doppler integration guide
- `docs/compliance.md` - SOC 2/ISO 27001/CCPA mapping
- `docs/penetration-testing.md` - Penetration testing guide
- `.github/workflows/sast.yml` - Static analysis pipeline
- `.github/workflows/dast.yml` - Dynamic analysis pipeline

**Testing:**
- `server/tests/security/owasp.test.js` - OWASP Top 10 tests
- `server/tests/security/rbac.test.js` - RBAC integration tests

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Official Site](https://gdpr.eu/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-10-01 | Added Phase 5: Enterprise Infrastructure documentation (Secrets Management, Key Rotation, Disaster Recovery, Compliance, DDoS Protection, CI/CD Testing) | BesaHubs Security Team |
| 1.0 | 2025-10-01 | Initial comprehensive security documentation | BesaHubs Security Team |

---

## Questions or Concerns?

If you have questions about security, found a potential vulnerability, or need clarification:

- **Email:** security@besahubs.com
- **Security Disclosure:** Follow responsible disclosure practices
- **Internal:** Slack #security-team

**Reporting Security Vulnerabilities:**

Please do NOT create public GitHub issues for security vulnerabilities. Email security@besahubs.com with:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We aim to respond within 24 hours and provide a fix within 7 days for critical issues.

---

**This documentation is maintained by the BesaHubs Security Team and updated regularly. Last reviewed: October 1, 2025.**
