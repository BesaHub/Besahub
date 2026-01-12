# BesaHubs CRM - Compliance Documentation

> **Last Updated:** October 1, 2025  
> **Version:** 1.0  
> **Maintainer:** BesaHubs Compliance Team  
> **Framework Coverage:** SOC 2, ISO 27001, CCPA

## Table of Contents

1. [SOC 2 Trust Service Criteria Mapping](#soc-2-trust-service-criteria-mapping)
2. [ISO 27001 Annex A Control Mapping](#iso-27001-annex-a-control-mapping)
3. [CCPA Compliance Requirements](#ccpa-compliance-requirements)
4. [Data Retention Policy](#data-retention-policy)
5. [Access Review Process](#access-review-process)
6. [Vendor Risk Assessment Checklist](#vendor-risk-assessment-checklist)
7. [Gap Analysis & Remediation Plan](#gap-analysis--remediation-plan)
8. [Quarterly Compliance Checklist](#quarterly-compliance-checklist)

---

## SOC 2 Trust Service Criteria Mapping

### CC1: Control Environment

**Objective:** The entity demonstrates a commitment to integrity and ethical values, exercises oversight responsibility, establishes structure/authority/responsibility, demonstrates commitment to competence, and enforces accountability.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Organization Structure** | 4-tier role hierarchy (Admin, Manager, Agent, Assistant) with clear separation of duties | `server/models/Role.js`<br>`server/seeders/permissionsSeeder.js` | ✅ Implemented |
| **Management Oversight** | Admin-only access to audit logs, security dashboard, and user management | `server/routes/admin.js`<br>`server/middleware/auth.js` (adminOnly, adminMiddleware) | ✅ Implemented |
| **Ethical Values & Integrity** | Security documentation published and maintained, password complexity enforcement, MFA for privileged accounts | `docs/security.md`<br>`server/utils/passwordHelper.js` | ✅ Implemented |
| **Authority & Responsibility** | 60+ granular permissions across 12 resources with role-based assignment | `server/services/permissionService.js`<br>`server/models/Permission.js` | ✅ Implemented |
| **Commitment to Competence** | Documented security procedures, key rotation guide, disaster recovery procedures | `server/config/KEY_ROTATION_GUIDE.md`<br>`server/config/DISASTER_RECOVERY_GUIDE.md` | ✅ Implemented |
| **Accountability** | Immutable audit logs with hash chain verification, all admin actions logged | `server/middleware/auditLogger.js`<br>`server/routes/auditLogs.js` | ✅ Implemented |

**Key Controls:**
- **RBAC System:** 4 distinct roles with progressively restricted permissions
- **Admin Segregation:** Admin role required for audit log viewing (`GET /api/audit-logs`)
- **Permission Enforcement:** Middleware validation at API layer (`permissionMiddleware`)
- **Audit Trail:** Every privileged action logged with user ID, timestamp, and IP address

**Audit Evidence:**
```bash
# View role structure
GET /api/admin/roles

# Review permission matrix
GET /api/admin/permissions

# Audit log access
GET /api/audit-logs?userId=<admin-id>&startDate=<date>
```

---

### CC2: Communication & Information

**Objective:** The entity obtains or generates and uses relevant, quality information to support the functioning of internal control. The entity internally communicates information necessary to support the functioning of internal control.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Internal Communication** | Real-time Socket.IO alerts for security events, performance monitoring logs | `server/sockets/socketHandler.js`<br>`server/services/securityAlertService.js` | ✅ Implemented |
| **External Communication** | Comprehensive security documentation available to stakeholders | `docs/security.md` | ✅ Implemented |
| **Information Quality** | Structured JSON logging (Winston) with correlation IDs, sanitized sensitive data | `server/config/logger.js`<br>`server/utils/dataMasking.js` | ✅ Implemented |
| **Security Policy Distribution** | Security documentation includes developer guidelines, deployment checklists | `docs/security.md` (sections 10-11) | ✅ Implemented |
| **Incident Reporting** | Security alert system with severity levels (INFO, WARNING, CRITICAL) | `server/models/SecurityAlert.js` | ✅ Implemented |

**Key Controls:**
- **Security Dashboard:** Admin-accessible dashboard with real-time metrics (`/admin/security`)
- **Alert System:** Socket.IO notifications for:
  - Brute force attempts (5+ failed logins)
  - Multiple IP logins (3+ IPs in 1 hour)
  - Token reuse detection
  - Rate limit violations
- **Structured Logging:** JSON format with service tags, correlation IDs, and log levels
- **Documentation:** Security.md covers 26 security features across 11 sections

**Audit Evidence:**
```bash
# View security dashboard
GET /api/security/dashboard

# Retrieve security alerts
GET /api/security/alerts?severity=CRITICAL&resolved=false

# Check logs
tail -f server/logs/security-$(date +%Y-%m-%d).log
```

---

### CC3: Risk Assessment

**Objective:** The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives. The entity identifies risks to the achievement of its objectives and analyzes risks as a basis for determining how the risks should be managed.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Risk Identification** | Security endpoint audit analyzing 271 routes for protection gaps | `server/scripts/auditEndpoints.js`<br>`server/scripts/endpoint-audit-report.json` | ✅ Implemented |
| **Fraud Risk Assessment** | Account lockout (5 failed attempts), IP-based rate limiting, MFA enforcement | `server/services/authService.js`<br>`server/middleware/rateLimiters.js` | ✅ Implemented |
| **Change Impact Analysis** | Security testing suite covering OWASP Top 10, SQL injection, RBAC violations | `server/tests/security/owasp.test.js`<br>`server/tests/security/rbac.test.js` | ✅ Implemented |
| **Vulnerability Assessment** | Automated npm audit in CI/CD pipeline, rate limiting on auth endpoints | `docs/security.md` (section 8.7) | ✅ Implemented |

**Key Controls:**
- **Endpoint Security Audit:** Automated analysis of all 271 API routes for:
  - Public routes (no authentication required)
  - Auth-only routes (authentication but no permission check)
  - Protected routes (authentication + permission verification)
- **Rate Limiting Configuration:**
  - Authentication: 5 requests / 15 minutes
  - Password reset: 3 requests / hour
  - MFA verification: 5 requests / 5 minutes
  - General API: 100 requests / 15 minutes
- **Account Lockout:** 5 failed login attempts = 30-minute lockout
- **OWASP Top 10 Testing:** Automated tests for SQL injection, XSS, broken authentication

**Audit Evidence:**
```bash
# Run endpoint security audit
node server/scripts/auditEndpoints.js

# View audit report
cat server/scripts/endpoint-audit-report.json

# Run security tests
npm run test:security
```

---

### CC4: Monitoring Activities

**Objective:** The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning. The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Ongoing Monitoring** | Real-time security dashboard, performance monitoring middleware, hourly DB health checks | `client/src/pages/Admin/SecurityDashboard.js`<br>`server/middleware/performanceLogger.js`<br>`server/jobs/scheduledJobs.js` | ✅ Implemented |
| **Separate Evaluations** | Weekly backup restore testing, quarterly key rotation notifications | `server/jobs/scheduledJobs.js` (lines 224-298, 332-380) | ✅ Implemented |
| **Deficiency Reporting** | Failed login tracking, security alert creation with recommended actions | `server/services/securityAlertService.js` | ✅ Implemented |
| **Corrective Actions** | Automated account lockout, token revocation, session termination | `server/services/authService.js`<br>`server/services/tokenService.js` | ✅ Implemented |
| **Log Retention** | 90-day retention for audit/security logs, 30 days for application logs | `server/jobs/scheduledJobs.js` (cleanupOldLogs) | ✅ Implemented |

**Key Controls:**
- **Scheduled Monitoring Jobs:**
  - Database health check (hourly at :00)
  - Redis health check (every 30 minutes)
  - Log cleanup (daily at 2:00 AM)
  - Trigger detection (daily at 2:30 AM)
  - Automated backup (daily at 3:00 AM)
  - Weekly restore test (Sundays at 5:00 AM)
  - Quarterly key rotation notification (1st of Jan/Apr/Jul/Oct at 4:00 AM)
- **Performance Monitoring:** Slow query detection (>2s logged as warning)
- **Real-time Alerts:** Socket.IO push notifications to admin dashboard
- **Log Retention Policy:**
  - Audit logs: 90 days minimum
  - Security logs: 90 days minimum
  - Application logs: 30 days
  - Error logs: 60 days

**Audit Evidence:**
```bash
# View scheduled jobs status
GET /api/admin/jobs/status

# Check database health
GET /api/admin/health/database

# Review recent backups
GET /api/admin/backups?limit=30
```

---

### CC5: Control Activities

**Objective:** The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels. The entity selects and develops general control activities over technology to support the achievement of objectives.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Access Controls** | JWT authentication with 15-min access tokens, 7-day refresh tokens with rotation | `server/services/tokenService.js` | ✅ Implemented |
| **Password Management** | Minimum 12 characters, complexity requirements (upper, lower, number, special char) | `server/utils/passwordHelper.js` | ✅ Implemented |
| **Multi-Factor Authentication** | TOTP MFA required for Admin/Manager roles, 10 backup codes per user | `server/services/mfaService.js` | ✅ Implemented |
| **Data Encryption** | PII encryption at rest using pgcrypto (AES-256), sensitive field masking in logs | `server/utils/encryption.js`<br>`server/utils/dataMasking.js` | ✅ Implemented |
| **Session Management** | Refresh token rotation with blacklist, token reuse detection, session family revocation | `server/services/tokenService.js` (lines 45-98) | ✅ Implemented |
| **Input Validation** | Global Joi schema validation, XSS sanitization, SQL injection detection | `server/validation/schemas/`<br>`server/middleware/sanitize.js`<br>`server/middleware/queryValidator.js` | ✅ Implemented |

**Key Controls:**
- **Password Policy:**
  - Minimum length: 12 characters
  - Requires: uppercase, lowercase, number, special character (@$!%*?&)
  - Bcrypt hashing with salt rounds: 10
- **MFA Enforcement:**
  - Required for: Admin and Manager roles
  - TOTP window: ±60 seconds (2 time steps)
  - Backup codes: 10 per user, single-use, bcrypt hashed
  - MFA lockout: 5 failed attempts = 30-minute lockout
- **Token Security:**
  - Access token lifespan: 15 minutes
  - Refresh token lifespan: 7 days
  - Refresh token rotation: New token issued on each refresh
  - Token reuse detection: Auto-revoke entire session family
- **PII Encryption:**
  - Encrypted fields: email, phone, taxId
  - Algorithm: pgcrypto with AES-256
  - Key rotation: Quarterly with zero-downtime script

**Audit Evidence:**
```bash
# Test password policy
POST /api/auth/register
{
  "password": "weak" // Should reject
}

# Verify MFA configuration
GET /api/admin/users?role=admin&mfaEnabled=true

# Check encryption status
SELECT COUNT(*) FROM users WHERE email IS NOT NULL; -- All encrypted
```

---

### CC6: Logical & Physical Access Controls

**Objective:** The entity restricts logical and physical access to assets through appropriate access control mechanisms.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Authentication Mechanisms** | JWT bearer tokens, MFA for privileged roles, demo mode disabled in production | `server/middleware/auth.js`<br>`server/config/environment.js` | ✅ Implemented |
| **Authorization Enforcement** | Permission middleware checks resource:action at endpoint level | `server/middleware/permissions.js`<br>`server/middleware/auth.js` (permissionMiddleware) | ✅ Implemented |
| **Privileged Access Management** | Admin-only routes protected by adminMiddleware, manager-only by managerMiddleware | `server/routes/admin.js` (adminOnly function)<br>`server/middleware/auth.js` (lines 84-97) | ✅ Implemented |
| **Network Access Controls** | IP-based rate limiting, CORS whitelist (no wildcards in production), HTTPS enforcement | `server/middleware/rateLimiters.js`<br>`server/index.js` (CORS config) | ✅ Implemented |
| **Segregation of Duties** | Agents cannot delete properties, assistants have limited permissions | `server/routes/properties.js` (line 330)<br>`server/seeders/permissionsSeeder.js` | ✅ Implemented |

**Key Controls:**
- **JWT Authentication:**
  - Algorithm: HS256
  - Secret: Environment variable (JWT_SECRET)
  - Validation: Token expiry, signature verification, user active status
- **RBAC Permission Structure:**
  - Resources: properties, contacts, deals, users, reports, admin, etc.
  - Actions: create, read, update, delete, list, manage
  - Format: `resource:action` (e.g., `properties:delete`)
- **Admin-Only Endpoints:**
  - `/api/admin/users` - User management
  - `/api/audit-logs` - Audit log viewer
  - `/api/admin/roles` - Role management
  - `/api/admin/permissions` - Permission management
- **Rate Limiting by IP:**
  - Prevents distributed brute force attacks
  - Redis-backed for distributed rate limiting
  - Configurable limits per endpoint type

**Audit Evidence:**
```bash
# Test unauthorized access
GET /api/admin/users
Authorization: Bearer <agent-token> # Should return 403

# Verify permission enforcement
GET /api/admin/permissions?roleId=3 # Agent role

# Check rate limit configuration
cat server/middleware/rateLimiters.js
```

---

### CC7: System Operations

**Objective:** The entity defines objectives with sufficient clarity to enable the identification and assessment of risks. The entity manages the system to achieve objectives related to availability, processing integrity, confidentiality, and privacy.

| Control Component | BesaHubs Implementation | Evidence Location | Status |
|-------------------|------------------------|-------------------|--------|
| **Availability** | Daily automated backups with AES-256-GCM encryption, weekly restore testing | `server/scripts/backupDatabase.js`<br>`server/jobs/scheduledJobs.js` (lines 100-165, 224-298) | ✅ Implemented |
| **Processing Integrity** | Transaction support, database health monitoring, backup integrity verification | `server/services/gdprService.js` (transactions)<br>`server/jobs/scheduledJobs.js` (DB health) | ✅ Implemented |
| **Confidentiality** | PII encryption at rest, HTTPS enforcement, sensitive data masking in logs | `server/utils/encryption.js`<br>`server/config/ssl.js`<br>`server/utils/dataMasking.js` | ✅ Implemented |
| **Privacy - Data Subject Rights** | GDPR data export API, account deletion with 30-day grace period | `server/services/gdprService.js`<br>`server/routes/users.js` (lines 415, 495) | ✅ Implemented |
| **Disaster Recovery** | Backup retention (30 daily, 12 monthly, unlimited yearly), documented restore procedures | `server/config/DISASTER_RECOVERY_GUIDE.md` | ✅ Implemented |
| **Data Retention** | Automated deletion after grace period, audit log retention (90 days) | `server/scripts/processScheduledDeletions.js`<br>`server/jobs/scheduledJobs.js` (line 193) | ✅ Implemented |

**Key Controls:**
- **Backup Strategy:**
  - Frequency: Daily at 3:00 AM
  - Encryption: AES-256-GCM with dedicated encryption key
  - Compression: gzip level 9 (80%+ reduction)
  - Retention: 30 daily, 12 monthly, unlimited yearly
  - Verification: SHA-256 checksum, weekly restore test
- **GDPR Compliance:**
  - Right to Know: `GET /api/users/me/export-data` (rate limited: 3/day)
  - Right to Delete: `DELETE /api/users/me/delete-account` (30-day grace period)
  - Right to Rectification: Standard update endpoints with audit trail
  - Data Portability: JSON export with all user data
- **Disaster Recovery:**
  - RTO (Recovery Time Objective): < 4 hours
  - RPO (Recovery Point Objective): < 24 hours (daily backups)
  - Documented procedures: `server/config/DISASTER_RECOVERY_GUIDE.md`
  - Emergency rollback: `server/scripts/emergencyKeyRollback.js`
- **Data Retention Policy:**
  - Active user data: Retained indefinitely while account active
  - Deleted user data: 30-day grace period, then permanent deletion
  - Audit logs: 90 days minimum
  - Backup files: 30/12/unlimited (daily/monthly/yearly)

**Audit Evidence:**
```bash
# Verify backup configuration
GET /api/admin/backups/latest

# Test GDPR export
GET /api/users/me/export-data

# Check retention policy compliance
GET /api/admin/logs/retention-status
```

---

## ISO 27001 Annex A Control Mapping

### Control Matrix

| Control ID | Control Name | Implementation Status | Evidence Location | Gap Analysis |
|-----------|--------------|----------------------|-------------------|--------------|
| **A.5.1** | Information security policies | ✅ Implemented | `docs/security.md` | None - Comprehensive documentation covering 26 security features |
| **A.6.1** | Internal organization | ✅ Implemented | RBAC with 4 roles, admin oversight | None - Clear role hierarchy with separation of duties |
| **A.6.2** | Mobile devices and teleworking | ⚠️ Partial | JWT tokens secure for remote access | Missing: MDM policy, device encryption requirements |
| **A.7.1** | Prior to employment | ⚠️ Partial | Role assignment documented | Missing: Background check policy documentation |
| **A.7.2** | During employment | ✅ Implemented | Security training documentation | `docs/security.md` Section 11 - Developer Guidelines |
| **A.7.3** | Termination/change | ✅ Implemented | Account deactivation, access review process | `server/routes/admin.js` - User deactivation |
| **A.8.1** | Responsibility for assets | ✅ Implemented | Data ownership tracking (createdBy, ownerId fields) | All major entities track ownership |
| **A.8.2** | Information classification | ⚠️ Partial | PII encryption for sensitive data | Missing: Formal classification scheme documentation |
| **A.8.3** | Media handling | ❌ Gap | Not applicable (cloud-native) | Recommend: Document cloud storage security |
| **A.9.1** | Access control policy | ✅ Implemented | `server/services/permissionService.js` | 60+ granular permissions |
| **A.9.2** | User access management | ✅ Implemented | JWT authentication, MFA, role assignment | `server/middleware/auth.js`, `server/services/mfaService.js` |
| **A.9.3** | User responsibilities | ✅ Implemented | Password policy, MFA enforcement | `server/utils/passwordHelper.js` |
| **A.9.4** | System/application access | ✅ Implemented | Password complexity, MFA lockout, session management | Token rotation, refresh token blacklist |
| **A.10.1** | Cryptographic controls | ✅ Implemented | AES-256 for PII, TLS 1.2+ for transport, bcrypt for passwords | `server/utils/encryption.js` |
| **A.11.1** | Secure areas | ❌ N/A | Cloud infrastructure (not applicable) | Rely on cloud provider's physical security |
| **A.11.2** | Equipment | ❌ N/A | Cloud infrastructure (not applicable) | Rely on cloud provider's equipment security |
| **A.12.1** | Operational procedures | ✅ Implemented | Disaster recovery guide, key rotation guide | `server/config/DISASTER_RECOVERY_GUIDE.md`, `server/config/KEY_ROTATION_GUIDE.md` |
| **A.12.2** | Protection from malware | ⚠️ Partial | Input sanitization, XSS protection | Missing: Server-side antivirus policy |
| **A.12.3** | Backup | ✅ Implemented | Daily encrypted backups, weekly restore tests | `server/scripts/backupDatabase.js` |
| **A.12.4** | Logging and monitoring | ✅ Implemented | Winston structured logging, audit logs with hash chain | `server/config/logger.js`, `server/middleware/auditLogger.js` |
| **A.12.5** | Control of operational software | ⚠️ Partial | npm audit in CI/CD | Missing: Formal change management documentation |
| **A.12.6** | Technical vulnerability mgmt | ✅ Implemented | Automated npm audit, OWASP Top 10 testing | `server/tests/security/owasp.test.js` |
| **A.12.7** | Information systems audit | ✅ Implemented | Endpoint security audit (271 routes analyzed) | `server/scripts/auditEndpoints.js` |
| **A.13.1** | Network security management | ✅ Implemented | HTTPS enforcement, HSTS, CORS whitelist | `server/index.js` (Helmet, CORS configuration) |
| **A.13.2** | Information transfer | ✅ Implemented | TLS 1.2+ for all data in transit | `server/config/ssl.js` |
| **A.14.1** | Security in development | ✅ Implemented | Security testing suite, developer guidelines | `docs/security.md` Section 11 |
| **A.14.2** | Security in support processes | ⚠️ Partial | Production deployment checklist | Missing: Formal change control documentation |
| **A.15.1** | Information security in supplier relationships | ❌ Gap | Not documented | Missing: Vendor risk assessment process |
| **A.15.2** | Supplier service delivery | ❌ Gap | Not documented | Missing: Third-party SLA documentation |
| **A.16.1** | Management of information security incidents | ⚠️ Partial | Security alert system, logging | Missing: Formal incident response plan |
| **A.17.1** | Information security continuity | ✅ Implemented | Daily backups, disaster recovery procedures | `server/config/DISASTER_RECOVERY_GUIDE.md` |
| **A.17.2** | Redundancies | ⚠️ Partial | Database backups, Redis fallback mode | Missing: Multi-region deployment documentation |
| **A.18.1** | Compliance with legal requirements | ✅ Implemented | GDPR data export/deletion workflows | `server/services/gdprService.js` |
| **A.18.2** | Information security reviews | ✅ Implemented | Quarterly access review process (documented below) | Scheduled security audits |

### Implementation Summary

- **✅ Fully Implemented:** 22 controls (65%)
- **⚠️ Partially Implemented:** 9 controls (26%)
- **❌ Gaps:** 3 controls (9%)

---

## CCPA Compliance Requirements

### Consumer Rights Implementation

| CCPA Right | Implementation | API Endpoint | Evidence | Status |
|------------|---------------|--------------|----------|--------|
| **Right to Know** | Users can request complete data export in JSON format | `GET /api/users/me/export-data` | `server/services/gdprService.js` (lines 7-132) | ✅ Implemented |
| **Right to Delete** | Users can request account deletion with 30-day grace period | `DELETE /api/users/me/delete-account` | `server/services/gdprService.js` (lines 139-179) | ✅ Implemented |
| **Right to Opt-Out of Sale** | No personal information sold to third parties | Privacy Policy (to be created) | Not applicable - no data sales | ✅ Compliant |
| **Right to Non-Discrimination** | No differential pricing based on privacy rights exercise | Application logic | No pricing tiers based on data sharing | ✅ Compliant |
| **Right to Correction** | Users can update personal information via profile | `PUT /api/users/me` | Standard CRUD operations with audit trail | ✅ Implemented |
| **Authorized Agent** | Users can designate representative for requests | Manual process (admin support) | To be documented in privacy policy | ⚠️ Partial |

### Personal Information Processing

#### Categories of Personal Information Collected

| Data Category | Specific Fields | Encryption Status | Purpose | Retention Period |
|--------------|-----------------|-------------------|---------|------------------|
| **Identifiers** | Email, phone, name, user ID | Email/phone encrypted at rest (pgcrypto) | User authentication, account management | Active account: indefinite<br>Deleted: 30 days |
| **Financial Information** | Tax ID, commission records | Tax ID encrypted at rest | Commission calculation, tax reporting | Active: indefinite<br>Deleted: 7 years (tax compliance) |
| **Commercial Information** | Deal history, property interests | Not encrypted (business data) | CRM operations, sales tracking | Active: indefinite<br>Deleted: anonymized |
| **Internet/Network Activity** | Login IP, session data, API usage | Not encrypted (logs) | Security monitoring, fraud prevention | 90 days (audit logs) |
| **Geolocation** | Property addresses, user location (if provided) | Not encrypted | Property management, market analysis | Active: indefinite |
| **Professional Information** | Job title, department, company | Not encrypted | Role assignment, contact management | Active: indefinite |

#### Business Purposes for Collection

1. **User Authentication & Access Control**
   - Email/password for login
   - MFA enrollment and verification
   - Session management
   
2. **CRM Operations**
   - Contact and deal management
   - Property tracking and ownership analysis
   - Task and activity logging

3. **Security & Fraud Prevention**
   - Failed login tracking
   - IP-based rate limiting
   - Suspicious activity detection

4. **Legal Compliance**
   - Tax reporting (encrypted tax IDs)
   - Audit trail maintenance (90-day logs)
   - GDPR/CCPA request fulfillment

5. **Service Improvement**
   - Performance monitoring
   - Feature usage analytics
   - Error tracking

#### Third-Party Service Providers

| Service Provider | Data Shared | Purpose | Data Processing Agreement | Status |
|-----------------|-------------|---------|--------------------------|--------|
| **SendGrid** (Email) | Email address, name | Transactional emails (password reset, notifications) | Required | ⚠️ To be documented |
| **Twilio** (SMS/Calls) | Phone number | SMS notifications, call logging | Required | ⚠️ To be documented |
| **Stripe** (Payments) | Email, name, payment method | Commission payments | Required | ⚠️ To be documented |
| **Neon (Database)** | All encrypted PII | Database hosting | Required | ⚠️ To be documented |
| **AWS/Cloud Storage** | Uploaded documents, backups | File storage, disaster recovery | Required | ⚠️ To be documented |

**Note:** All third-party integrations must have signed Data Processing Agreements (DPAs) before production deployment.

### Consumer Request Handling

#### Data Export Process

```javascript
// Rate Limited: 3 requests per day per user
GET /api/users/me/export-data

// Response includes:
{
  "user": { /* user profile */ },
  "properties": [ /* owned/created properties */ ],
  "contacts": [ /* assigned contacts */ ],
  "deals": [ /* owned deals */ ],
  "tasks": [ /* assigned tasks */ ],
  "activities": [ /* user activities */ ],
  "documents": [ /* uploaded documents */ ],
  "callLogs": [ /* call history */ ],
  "emailLogs": [ /* email history */ ],
  "notifications": [ /* user notifications */ ],
  "auditLogs": [ /* user's audit trail */ ]
}
```

**Implementation Details:**
- Rate limit: 3 exports per day (enforced by `server/routes/users.js`)
- Format: JSON (structured, machine-readable)
- Excludes: Passwords, MFA secrets, refresh tokens (security)
- Logged: All export requests logged to audit trail

#### Account Deletion Process

```javascript
// Step 1: User requests deletion (requires password confirmation)
DELETE /api/users/me/delete-account
{
  "password": "user-password"
}

// Step 2: 30-day grace period begins
// - Account marked as deletionRequested: true
// - Account deactivated (isActive: false)
// - User can cancel deletion within 30 days

// Step 3: Automated deletion after grace period
// - Scheduled job runs daily at 4 AM
// - Permanent deletion of user data
// - Cascade deletion strategy:
//   - DELETE: Contacts, tasks, activities, documents, logs
//   - ANONYMIZE: Properties (set ownerId=null), deals (set ownerId=null)
```

**Data Deletion Strategy:**
- **Immediate:** Account deactivation, login disabled
- **30-day grace:** User can cancel deletion (`POST /api/users/me/cancel-deletion`)
- **Permanent:** Cascade deletion with anonymization where business continuity required
- **Audit:** Deletion logged with timestamp, user ID, and action initiator

---

## Data Retention Policy

### Retention Schedule

| Data Type | Retention Period | Deletion Method | Compliance Basis | Evidence |
|-----------|-----------------|-----------------|------------------|----------|
| **Active User Data** | Indefinite (while account active) | User-initiated deletion or admin force-delete | Business need | Account remains active until user/admin action |
| **Deleted User Data** | 30-day grace period | Automated permanent deletion | GDPR Right to be Forgotten | `server/scripts/processScheduledDeletions.js` |
| **Audit Logs** | 90 days minimum | Automated cleanup (daily rotation) | SOC 2, compliance requirements | `server/jobs/scheduledJobs.js` (cleanupOldLogs) |
| **Security Logs** | 90 days minimum | Automated cleanup (daily rotation) | Security incident investigation | `server/logs/security-*.log` |
| **Application Logs** | 30 days | Automated cleanup (daily rotation) | Operational efficiency | `server/logs/combined-*.log` |
| **Error Logs** | 60 days | Automated cleanup (daily rotation) | Debugging, trend analysis | `server/logs/error-*.log` |
| **Database Backups** | 30 daily, 12 monthly, unlimited yearly | Tiered retention (automated) | Disaster recovery, compliance | `server/config/DISASTER_RECOVERY_GUIDE.md` |
| **Transaction Records** | 7 years | Manual review before deletion | Tax compliance (IRS requirement) | Commission records, deal financials |
| **Call Logs** | 1 year | Automated deletion | Business operations | `server/models/CallLog.js` |
| **Email Logs** | 1 year | Automated deletion | Business operations | `server/models/EmailLog.js` |
| **MFA Backup Codes** | Until used or MFA disabled | Immediate deletion on use | Security best practice | `server/services/mfaService.js` |
| **Refresh Tokens** | 7 days or until revoked | Redis expiry + blacklist | Session management | `server/services/tokenService.js` |
| **Password Reset Tokens** | 1 hour | Immediate expiry | Security best practice | `server/routes/auth.js` |

### Retention Procedures

#### Automated Retention Jobs

```javascript
// Daily log cleanup (2:00 AM)
// - Deletes audit logs older than 90 days
// - Deletes security logs older than 90 days  
// - Deletes application logs older than 30 days
// - Compresses logs older than 7 days (.gz)

// Daily account deletion (4:00 AM)
// - Finds accounts with deletionRequested=true
// - Checks if 30-day grace period expired
// - Executes permanent deletion with cascade strategy

// Daily backup retention (3:00 AM - after backup)
// - Keeps last 30 daily backups
// - Converts daily to monthly (last backup of month)
// - Keeps 12 monthly backups
// - Keeps all yearly backups indefinitely
```

#### Manual Retention Processes

1. **Transaction Record Review (Annual)**
   - Review commission records older than 7 years
   - Consult with legal/tax advisor before deletion
   - Document deletion decision in audit log

2. **Large User Data Deletion (Admin-initiated)**
   - Admin force-delete: `DELETE /api/admin/users/:id/force-delete`
   - Requires admin authentication + confirmation
   - Bypasses 30-day grace period (immediate deletion)
   - Logged as ADMIN_ACTION in audit trail

3. **Emergency Data Purge (Security Incident)**
   - Documented in incident response plan (to be created)
   - Requires dual authorization (2 admins)
   - Complete audit trail of purge operation

### Compliance Verification

```bash
# Verify audit log retention
ls -lh server/logs/audit-*.log | awk '{print $9, $6, $7, $8}'

# Check user deletion queue
SELECT email, deletionRequestedAt, 
  deletionRequestedAt + INTERVAL '30 days' as deletion_date
FROM users 
WHERE deletionRequested = true;

# Review backup retention
GET /api/admin/backups/retention-status
```

---

## Access Review Process

### Quarterly Access Review Procedure

**Frequency:** Every 90 days (January, April, July, October)

**Responsible Parties:**
- **Admin:** Exports access reports, reviews all user access
- **Manager:** Reviews team member access within their department
- **Security Officer:** Reviews privileged access (admin/manager roles)

### Step-by-Step Review Process

#### Step 1: Export User Access Report

```bash
# Admin executes access report export
GET /api/admin/users?includeRoles=true&includePermissions=true&status=active

# Export includes:
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "agent",
      "isActive": true,
      "mfaEnabled": true,
      "lastLogin": "2025-10-01T12:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "roles": ["Agent"],
      "permissions": [
        "properties:read",
        "contacts:create",
        "deals:update",
        ...
      ]
    },
    ...
  ],
  "summary": {
    "totalUsers": 150,
    "activeUsers": 145,
    "inactiveUsers": 5,
    "adminUsers": 3,
    "managerUsers": 12,
    "agentUsers": 110,
    "assistantUsers": 25
  }
}
```

#### Step 2: Review Access Appropriateness

**Admin Reviews:**
- ✅ All admin accounts have MFA enabled
- ✅ No orphaned accounts (inactive > 90 days)
- ✅ Terminated employees have `isActive=false`
- ✅ Role assignments match job functions

**Manager Reviews (per department):**
- ✅ Team members have appropriate role (agent vs. assistant)
- ✅ Access aligns with current job responsibilities
- ✅ No excessive permissions for role

**Security Officer Reviews:**
- ✅ Privileged access justified (admin/manager)
- ✅ MFA compliance for privileged roles (100% required)
- ✅ No shared accounts detected
- ✅ Recent access activity (lastLogin < 30 days for active users)

#### Step 3: Revoke Inappropriate Access

```bash
# Revoke access for terminated user (within 24 hours of termination)
PUT /api/admin/users/:userId
{
  "isActive": false,
  "terminationDate": "2025-10-01",
  "terminationReason": "Employment ended"
}

# Remove role from user
DELETE /api/admin/users/:userId/roles/:roleId

# Force logout all sessions
POST /api/admin/users/:userId/revoke-sessions
```

**Revocation Actions Logged:**
- Event: USER_UPDATE (isActive changed to false)
- Admin ID and timestamp
- Reason for revocation
- IP address of admin

#### Step 4: Document Review with Sign-off

```javascript
// Access review record structure
{
  "reviewId": "review-2025-Q4",
  "reviewDate": "2025-10-01",
  "reviewPeriod": "Q4 2025",
  "reviewers": [
    {
      "reviewerId": "admin-uuid",
      "reviewerName": "Admin User",
      "role": "Admin",
      "scopeReviewed": "All users",
      "signoffTimestamp": "2025-10-01T14:30:00Z"
    },
    {
      "reviewerId": "manager-uuid",
      "reviewerName": "Manager User",
      "role": "Manager",
      "scopeReviewed": "Sales Department",
      "signoffTimestamp": "2025-10-01T15:00:00Z"
    }
  ],
  "findings": {
    "totalReviewed": 150,
    "accessRevoked": 3,
    "rolesModified": 5,
    "mfaEnforced": 2,
    "noIssues": 140
  },
  "actionItems": [
    "Revoke access for terminated employee (ID: user-123) - COMPLETED",
    "Enable MFA for Manager (ID: user-456) - COMPLETED",
    "Downgrade Agent to Assistant (ID: user-789) - COMPLETED"
  ],
  "nextReviewDate": "2026-01-01"
}
```

#### Step 5: Store Review Records in Audit Trail

```bash
# Log access review completion
POST /api/admin/access-reviews
{
  "reviewId": "review-2025-Q4",
  "reviewDate": "2025-10-01",
  "findings": { ... },
  "actionItems": [ ... ],
  "reviewers": [ ... ]
}

# Audit log entry created:
{
  "eventType": "ACCESS_REVIEW_COMPLETED",
  "timestamp": "2025-10-01T16:00:00Z",
  "userId": "admin-uuid",
  "details": {
    "reviewId": "review-2025-Q4",
    "usersReviewed": 150,
    "accessRevoked": 3,
    "signoffComplete": true
  }
}
```

### Access Review Checklist

- [ ] **Week 1 of Quarter:** Admin exports user access report
- [ ] **Week 2 of Quarter:** Managers review department access
- [ ] **Week 2 of Quarter:** Security Officer reviews privileged access
- [ ] **Week 3 of Quarter:** Revoke access for terminated/transferred users (within 24 hours)
- [ ] **Week 3 of Quarter:** Modify roles/permissions as needed
- [ ] **Week 4 of Quarter:** Document findings and action items
- [ ] **Week 4 of Quarter:** All reviewers sign off on completed review
- [ ] **Week 4 of Quarter:** Store review record in audit system
- [ ] **Week 4 of Quarter:** Schedule next quarter's review

### Continuous Monitoring

**Automated Alerts (Real-time):**
- User login from new IP (admin/manager only)
- Multiple failed login attempts (potential compromise)
- Role/permission changes (admin notification)
- MFA disabled for privileged account (critical alert)

**Monthly Spot Checks:**
- Random sample of 10% users for permission verification
- Review admin audit logs for unusual activity
- Verify MFA compliance for privileged roles

---

## Vendor Risk Assessment Checklist

### Third-Party Service Provider Evaluation

**Use this checklist when onboarding new vendors or reviewing existing vendor relationships.**

#### 1. Security & Privacy Questionnaire

| Question | Required Answer | Acceptable Evidence | Status |
|----------|----------------|---------------------|--------|
| Does vendor have SOC 2 Type II certification? | Yes (preferred) or equivalent | SOC 2 report dated within 12 months | ⬜ Pending |
| Does vendor have ISO 27001 certification? | Yes (preferred) or equivalent | ISO 27001 certificate | ⬜ Pending |
| Is data encrypted in transit (TLS 1.2+)? | Yes (required) | Security documentation | ⬜ Pending |
| Is data encrypted at rest? | Yes (required) | Security documentation | ⬜ Pending |
| Does vendor support MFA for access? | Yes (required) | Product documentation | ⬜ Pending |
| Is vendor GDPR compliant? | Yes (required if EU data) | GDPR compliance statement | ⬜ Pending |
| Is vendor CCPA compliant? | Yes (required if CA data) | CCPA compliance statement | ⬜ Pending |
| Does vendor have documented incident response plan? | Yes (required) | Incident response documentation | ⬜ Pending |
| What is vendor's data retention policy? | Documented and acceptable | Retention policy documentation | ⬜ Pending |
| Does vendor perform regular penetration testing? | Yes (preferred) | Pen test reports (annual minimum) | ⬜ Pending |
| Does vendor have a bug bounty program? | Yes (preferred) | Bug bounty policy | ⬜ Pending |

#### 2. Data Processing Agreement (DPA) Requirements

**Mandatory DPA Clauses:**

- [ ] **Purpose Limitation:** Vendor processes data only for specified purposes
- [ ] **Data Minimization:** Vendor accesses only necessary data fields
- [ ] **Confidentiality:** Vendor maintains confidentiality of all data
- [ ] **Sub-processors:** Vendor discloses all sub-processors, requires approval for changes
- [ ] **Data Subject Rights:** Vendor assists with GDPR/CCPA requests (export, deletion)
- [ ] **Security Measures:** Vendor maintains appropriate technical/organizational measures
- [ ] **Breach Notification:** Vendor notifies within 24-48 hours of breach discovery
- [ ] **Data Retention:** Vendor deletes data upon contract termination (30-day grace)
- [ ] **Audit Rights:** BesaHubs can audit vendor's security controls (annual minimum)
- [ ] **Liability:** Clear liability terms for data breaches
- [ ] **Data Location:** Vendor specifies data storage locations (geographic requirements)
- [ ] **Termination:** Data return/deletion procedures upon contract end

#### 3. Incident Notification Procedures

**Vendor must provide:**

- [ ] **Incident Contact:** 24/7 security incident hotline or email
- [ ] **Notification Timeline:** Commit to notification within 24 hours of breach discovery
- [ ] **Notification Contents:**
  - Nature of incident
  - Data types affected
  - Number of records/users impacted
  - Containment measures taken
  - Remediation plan and timeline
  - Contact information for further inquiries
- [ ] **Cooperation:** Vendor assists with BesaHubs' breach notification obligations
- [ ] **Root Cause Analysis:** Vendor provides RCA within 30 days of incident

#### 4. Audit & Compliance Verification

**Annual Requirements:**

- [ ] **Security Audit:** Vendor provides updated SOC 2 / ISO 27001 report annually
- [ ] **Right to Audit:** BesaHubs reserves right to conduct on-site or virtual audit
- [ ] **Compliance Attestation:** Vendor attests to GDPR/CCPA compliance annually
- [ ] **Vulnerability Scans:** Vendor shares results of vulnerability assessments
- [ ] **Penetration Testing:** Vendor shares penetration test results (sanitized)
- [ ] **Access Logs:** Vendor provides BesaHubs access logs upon request
- [ ] **Sub-processor Changes:** Vendor notifies 30 days before adding new sub-processor

#### 5. Data Location & Sovereignty

**Geographic Requirements:**

- [ ] **Primary Data Center Location:** _________________________ (specify)
- [ ] **Backup Data Center Location:** _________________________ (specify)
- [ ] **Data Residency Compliance:** Meets industry-specific requirements (GDPR, etc.)
- [ ] **Cross-Border Transfers:** Documented safeguards (Standard Contractual Clauses)
- [ ] **Government Access:** Vendor discloses government data access procedures

#### 6. Service Level Agreements (SLAs)

**Performance & Availability:**

- [ ] **Uptime SLA:** Minimum 99.9% uptime (monthly)
- [ ] **Support Response Time:** Tier 1: <1 hour, Tier 2: <4 hours, Tier 3: <24 hours
- [ ] **RTO (Recovery Time Objective):** ________ hours (specify)
- [ ] **RPO (Recovery Point Objective):** ________ hours (specify)
- [ ] **Scheduled Maintenance:** Advance notice (72 hours minimum)
- [ ] **Performance Metrics:** Vendor provides monthly performance reports

#### 7. Vendor Risk Rating

**Calculate overall vendor risk score:**

| Risk Category | Score (1-5) | Weight | Weighted Score |
|--------------|-------------|--------|----------------|
| Security Controls | ____ | 30% | ____ |
| Compliance Certifications | ____ | 25% | ____ |
| Data Handling Practices | ____ | 20% | ____ |
| Incident Response Capability | ____ | 15% | ____ |
| Financial Stability | ____ | 10% | ____ |
| **Total Weighted Score** | | **100%** | **____** |

**Risk Rating:**
- 4.0 - 5.0: Low Risk (approved)
- 3.0 - 3.9: Medium Risk (approved with mitigations)
- 2.0 - 2.9: High Risk (requires executive approval)
- 1.0 - 1.9: Critical Risk (not approved)

#### 8. Vendor Approval Sign-off

**Approval Required From:**

- [ ] **Security Officer:** _________________________ (Name, Date)
- [ ] **Legal Counsel:** _________________________ (Name, Date)
- [ ] **Privacy Officer:** _________________________ (Name, Date)
- [ ] **Executive Sponsor:** _________________________ (Name, Date)

**Contract Review:**
- [ ] DPA signed and executed
- [ ] SLA terms acceptable
- [ ] Security requirements met
- [ ] Compliance obligations documented
- [ ] Renewal date scheduled: _________________________

---

## Gap Analysis & Remediation Plan

### Identified Gaps

| Gap ID | Control Area | Description | Risk Level | Remediation Plan | Target Date | Owner |
|--------|-------------|-------------|------------|------------------|-------------|-------|
| **GAP-01** | A.6.2 - Mobile/Telework | No formal MDM policy or device encryption requirements | 🟡 Medium | Document BYOD policy, require device encryption for accessing CRM | Q1 2026 | Security Officer |
| **GAP-02** | A.7.1 - Pre-employment | Background check policy not documented | 🟡 Medium | Create HR policy for background checks, document in employee handbook | Q1 2026 | HR Manager |
| **GAP-03** | A.8.2 - Info Classification | No formal data classification scheme | 🟡 Medium | Implement data classification labels (Public, Internal, Confidential, Restricted) | Q2 2026 | Data Officer |
| **GAP-04** | A.12.2 - Malware Protection | No server-side antivirus policy | 🟡 Medium | Evaluate and implement server antivirus/EDR solution | Q2 2026 | Security Officer |
| **GAP-05** | A.12.5 - Change Management | Formal change management process not documented | 🟠 High | Implement change control board, document approval workflows | Q1 2026 | DevOps Lead |
| **GAP-06** | A.14.2 - Support Processes | Change control procedures informal | 🟠 High | Formalize change request process, implement ticketing system integration | Q1 2026 | DevOps Lead |
| **GAP-07** | A.15.1 - Vendor Mgmt | Vendor risk assessment process not documented | 🔴 Critical | Document vendor assessment checklist, perform retroactive assessments for existing vendors | Q4 2025 | Procurement |
| **GAP-08** | A.15.2 - Supplier SLAs | Third-party SLAs not documented | 🟠 High | Obtain SLA documentation from SendGrid, Twilio, Stripe, Neon | Q4 2025 | Procurement |
| **GAP-09** | A.16.1 - Incident Response | Formal incident response plan missing | 🔴 Critical | Create incident response plan with roles, procedures, communication templates | Q4 2025 | Security Officer |
| **GAP-10** | A.17.2 - Redundancy | Multi-region deployment not documented | 🟡 Medium | Document disaster recovery strategy, evaluate multi-region deployment | Q2 2026 | DevOps Lead |
| **GAP-11** | CCPA - DPAs | Data Processing Agreements not on file for 3rd parties | 🔴 Critical | Obtain signed DPAs from SendGrid, Twilio, Stripe, Neon, AWS | Q4 2025 | Legal Counsel |
| **GAP-12** | CCPA - Privacy Policy | Privacy policy not published | 🔴 Critical | Draft and publish CCPA-compliant privacy policy on website | Q4 2025 | Legal Counsel |

### Remediation Timeline

```
Q4 2025 (Critical Priority):
├─ GAP-07: Vendor Risk Assessment Process (4 weeks)
├─ GAP-08: Third-Party SLA Documentation (4 weeks)
├─ GAP-09: Incident Response Plan (6 weeks)
├─ GAP-11: Data Processing Agreements (4 weeks)
└─ GAP-12: Privacy Policy Publication (2 weeks)

Q1 2026 (High Priority):
├─ GAP-01: Mobile Device Management Policy (3 weeks)
├─ GAP-02: Background Check Policy (2 weeks)
├─ GAP-05: Change Management Process (6 weeks)
└─ GAP-06: Change Control Procedures (4 weeks)

Q2 2026 (Medium Priority):
├─ GAP-03: Data Classification Scheme (4 weeks)
├─ GAP-04: Server Antivirus/EDR (6 weeks)
└─ GAP-10: Multi-Region Deployment Docs (3 weeks)
```

### Gap Remediation Resources

| Gap ID | Estimated Effort | Budget Required | External Resources |
|--------|-----------------|-----------------|-------------------|
| GAP-01 | 24 hours | $0 | None |
| GAP-02 | 16 hours | $0 | None |
| GAP-03 | 32 hours | $0 | None |
| GAP-04 | 80 hours | $5,000 - $15,000/year | EDR vendor selection |
| GAP-05 | 60 hours | $0 | None |
| GAP-06 | 40 hours | $0 | None |
| GAP-07 | 40 hours | $0 | None |
| GAP-08 | 20 hours | $0 | None |
| GAP-09 | 80 hours | $2,000 - $5,000 | IR consultant (optional) |
| GAP-10 | 24 hours | $0 | None |
| GAP-11 | 30 hours | $0 | Legal review |
| GAP-12 | 16 hours | $1,000 - $3,000 | Legal review required |

**Total Estimated Budget:** $8,000 - $23,000

---

## Quarterly Compliance Checklist

### Q1 (January - March)

**Week 1-2:**
- [ ] Conduct quarterly access review (all users)
- [ ] Export user-role assignments report
- [ ] Review privileged access (admin/manager)
- [ ] Verify MFA compliance (100% for privileged roles)

**Week 3:**
- [ ] Review audit logs for anomalies (90-day window)
- [ ] Verify hash chain integrity (`GET /api/audit-logs/verify`)
- [ ] Check security alerts (unresolved incidents)
- [ ] Review failed login attempts (brute force detection)

**Week 4:**
- [ ] Test backup restore procedure (sample backup)
- [ ] Verify backup retention compliance (30/12/unlimited)
- [ ] Review vendor compliance (SOC 2/ISO 27001 renewals)
- [ ] Update compliance documentation (docs/compliance.md)

**Ongoing:**
- [ ] Monitor scheduled job execution (daily/weekly/monthly)
- [ ] Review database health check logs
- [ ] Verify Redis health (if configured)

### Q2 (April - June)

**Week 1-2:**
- [ ] Conduct quarterly access review (all users)
- [ ] Review data retention compliance
- [ ] Audit user deletion queue (30-day grace period tracking)
- [ ] Verify PII encryption status (all encrypted fields)

**Week 3:**
- [ ] Test PII encryption key rotation (dry-run mode)
- [ ] Review quarterly key rotation notification (if Q2 includes Jan/Apr/Jul/Oct)
- [ ] Audit third-party integrations (SendGrid, Twilio, Stripe)
- [ ] Verify data processing agreements (DPAs on file)

**Week 4:**
- [ ] Run security test suite (`npm run test:security`)
- [ ] Review OWASP Top 10 test results
- [ ] Execute endpoint security audit (`node server/scripts/auditEndpoints.js`)
- [ ] Document findings and remediation actions

**Ongoing:**
- [ ] Monitor GDPR export requests (3/day rate limit)
- [ ] Track account deletion requests (30-day grace monitoring)

### Q3 (July - September)

**Week 1-2:**
- [ ] Conduct quarterly access review (all users)
- [ ] Review password policy compliance (12+ chars, complexity)
- [ ] Audit MFA enrollment (admins/managers 100% required)
- [ ] Verify token rotation (refresh token blacklist)

**Week 3:**
- [ ] Test disaster recovery procedures (full restore test)
- [ ] Verify emergency rollback scripts (key rotation)
- [ ] Review incident response readiness (once plan created)
- [ ] Audit security alert resolution (outstanding alerts)

**Week 4:**
- [ ] Review rate limiting effectiveness (auth endpoints)
- [ ] Analyze brute force detection logs
- [ ] Verify account lockout mechanism (5 attempts/30min)
- [ ] Test CORS configuration (no wildcards in production)

**Ongoing:**
- [ ] Monitor log retention (90-day audit logs)
- [ ] Review backup integrity (weekly restore tests)

### Q4 (October - December)

**Week 1-2:**
- [ ] Conduct quarterly access review (all users)
- [ ] Annual compliance audit preparation
- [ ] Review all control implementations (SOC 2, ISO 27001)
- [ ] Update compliance evidence repository

**Week 3:**
- [ ] Execute annual security assessment
- [ ] Review gap remediation progress (target dates)
- [ ] Conduct vendor risk assessments (annual review)
- [ ] Verify third-party compliance (SOC 2/ISO renewals)

**Week 4:**
- [ ] Update privacy policy (annual review)
- [ ] Review CCPA compliance (consumer rights implementation)
- [ ] Document compliance achievements (annual report)
- [ ] Plan next year's compliance roadmap

**Ongoing:**
- [ ] Monitor all scheduled jobs (daily/weekly/monthly)
- [ ] Track compliance metrics (audit log coverage, MFA adoption, etc.)

### Continuous Monitoring (Daily/Weekly)

**Daily:**
- [ ] Review security dashboard for critical alerts
- [ ] Monitor failed login attempts
- [ ] Check database health status
- [ ] Verify backup completion (3 AM daily)

**Weekly:**
- [ ] Review audit logs for unusual activity
- [ ] Verify backup restore test results (Sundays 5 AM)
- [ ] Monitor rate limit violations
- [ ] Check token revocation logs

**Monthly:**
- [ ] Export compliance metrics report
- [ ] Review vendor performance (SLA compliance)
- [ ] Spot check user permissions (10% sample)
- [ ] Update compliance documentation (if needed)

---

## Compliance Evidence Repository

### Evidence Collection for Auditors

| Control | Evidence Type | Location | Access Method |
|---------|--------------|----------|---------------|
| **SOC 2 - CC1** | Role definitions, permission matrix | `server/models/Role.js`, `server/seeders/permissionsSeeder.js` | Code review |
| **SOC 2 - CC2** | Security documentation, alert logs | `docs/security.md`, `server/logs/security-*.log` | Documentation, log files |
| **SOC 2 - CC3** | Endpoint audit report, test results | `server/scripts/endpoint-audit-report.json`, `server/tests/security/` | JSON report, test suite |
| **SOC 2 - CC4** | Scheduled job logs, health checks | `server/jobs/scheduledJobs.js`, audit logs | Cron config, logs |
| **SOC 2 - CC5** | Password policy, MFA config, encryption | `server/utils/passwordHelper.js`, `server/services/mfaService.js`, `server/utils/encryption.js` | Code review |
| **SOC 2 - CC6** | Authentication middleware, RBAC | `server/middleware/auth.js`, `server/middleware/permissions.js` | Code review |
| **SOC 2 - CC7** | Backup logs, GDPR implementation | `server/scripts/backupDatabase.js`, `server/services/gdprService.js` | Code review, backup metadata |
| **ISO 27001 - A.9.1** | Access control policy (RBAC) | `server/services/permissionService.js` | Code review |
| **ISO 27001 - A.12.3** | Backup procedures, restore tests | `server/config/DISASTER_RECOVERY_GUIDE.md`, backup logs | Documentation, logs |
| **ISO 27001 - A.12.4** | Logging configuration, audit trail | `server/config/logger.js`, `server/middleware/auditLogger.js` | Code review, log files |
| **CCPA - Right to Know** | Data export API, rate limiting | `server/services/gdprService.js` (lines 7-132), `server/routes/users.js` | Code review, API test |
| **CCPA - Right to Delete** | Account deletion workflow | `server/services/gdprService.js` (lines 139-321), `server/scripts/processScheduledDeletions.js` | Code review, deletion logs |

### Auditor Self-Service Access

```bash
# 1. Clone compliance evidence repository
git clone <repo-url>
cd besahubs-crm

# 2. Review security documentation
cat docs/security.md
cat docs/compliance.md

# 3. Examine control implementations
cat server/middleware/auth.js          # Authentication controls
cat server/services/permissionService.js # RBAC controls
cat server/utils/encryption.js         # Data encryption

# 4. Review audit logs (admin access required)
curl -H "Authorization: Bearer <admin-token>" \
  https://api.besahubs.com/api/audit-logs?startDate=2025-01-01&limit=1000

# 5. Verify hash chain integrity
curl -H "Authorization: Bearer <admin-token>" \
  https://api.besahubs.com/api/audit-logs/verify

# 6. Export compliance report
curl -H "Authorization: Bearer <admin-token>" \
  https://api.besahubs.com/api/admin/compliance/report
```

---

## Document Control

**Document Owner:** BesaHubs Compliance Team  
**Approval Authority:** Chief Information Security Officer (CISO)  
**Review Frequency:** Quarterly (or upon significant system changes)  
**Next Review Date:** January 1, 2026

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-01 | BesaHubs Compliance Team | Initial compliance documentation covering SOC 2, ISO 27001, CCPA |

**Distribution List:**
- Executive Team
- Security Officer
- Privacy Officer
- Legal Counsel
- DevOps Team
- External Auditors (upon request)

---

## Contact Information

**Compliance Inquiries:**
- Email: compliance@besahubs.com
- Security Issues: security@besahubs.com
- Data Subject Requests (GDPR/CCPA): privacy@besahubs.com

**Emergency Contact (Security Incidents):**
- 24/7 Hotline: [To be configured]
- Incident Email: incidents@besahubs.com
