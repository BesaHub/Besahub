# Production Reverse Proxy & DDoS Protection Guide

This guide provides production-ready configurations for deploying BesaHubs CRM with enterprise-grade DDoS mitigation and bot protection.

## Table of Contents

1. [Nginx Reverse Proxy Configuration](#nginx-reverse-proxy-configuration)
2. [Cloudflare Setup](#cloudflare-setup)
3. [Security Headers](#security-headers)
4. [Rate Limiting Strategies](#rate-limiting-strategies)
5. [Monitoring & Alerts](#monitoring--alerts)

---

## Nginx Reverse Proxy Configuration

### 1. Basic Upstream Configuration

```nginx
# /etc/nginx/conf.d/besahubs.conf

upstream besahubs_backend {
    # Use least connections load balancing
    least_conn;
    
    # Backend servers (scale horizontally)
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    # server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;  # Add more backends as needed
    
    # Enable keepalive connections
    keepalive 32;
}

upstream besahubs_frontend {
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### 2. Rate Limiting Configuration

```nginx
# Define rate limit zones at http level
http {
    # General API rate limiting: 100 requests/minute per IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    
    # Auth endpoints: 5 requests/15min per IP
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/15m;
    
    # Connection limit: max 10 concurrent connections per IP
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    # Request body size limits
    client_max_body_size 100M;  # General limit
    client_body_buffer_size 128k;
    
    # Timeouts for DDoS protection
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 3. Server Block Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name besahubs.com www.besahubs.com;
    
    # SSL/TLS Configuration
    ssl_certificate /etc/letsencrypt/live/besahubs.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/besahubs.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' wss:; frame-ancestors 'none';" always;
    
    # Connection limits
    limit_conn conn_limit 10;
    
    # API Rate Limiting
    location /api/auth/ {
        # Strict rate limiting for authentication endpoints
        limit_req zone=auth_limit burst=2 nodelay;
        limit_req_status 429;
        
        # Body size limit for auth endpoints
        client_max_body_size 10k;
        
        # Proxy configuration
        proxy_pass http://besahubs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /api/ {
        # General API rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
        
        # Body size limit for general API
        client_max_body_size 100k;
        
        # Proxy configuration
        proxy_pass http://besahubs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /api/upload/ {
        # Higher limit for upload endpoints
        client_max_body_size 50M;
        
        # Proxy configuration
        proxy_pass http://besahubs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://besahubs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
    
    # Frontend (React app)
    location / {
        proxy_pass http://besahubs_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://besahubs_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Error pages
    error_page 429 /429.html;
    location = /429.html {
        root /var/www/error-pages;
        internal;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name besahubs.com www.besahubs.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. DDoS Protection Configuration

```nginx
# /etc/nginx/conf.d/ddos-protection.conf

# Block known bad user agents
map $http_user_agent $bad_bot {
    default 0;
    ~*^$ 1;  # Empty user agent
    ~*(bot|crawler|spider|scraper) 1;  # Add specific bots to block
}

# Block requests with no referer for sensitive endpoints
map $http_referer $bad_referer {
    default 0;
    "" 1;
}

server {
    # ... other config ...
    
    # Block bad bots
    if ($bad_bot) {
        return 403;
    }
    
    # Rate limit based on request URI
    location ~ ^/api/(auth|admin)/ {
        if ($bad_referer) {
            return 403;
        }
        # ... rest of config ...
    }
}
```

---

## Cloudflare Setup

### 1. Add Domain to Cloudflare

1. Sign up for Cloudflare at https://dash.cloudflare.com
2. Click "Add a Site" and enter your domain (besahubs.com)
3. Select a plan (Free plan includes DDoS protection)
4. Cloudflare will scan your DNS records
5. Update your domain's nameservers to Cloudflare's nameservers
6. Wait for DNS propagation (can take up to 24 hours)

### 2. SSL/TLS Configuration

```
Dashboard → SSL/TLS → Overview
- Encryption mode: Full (strict)
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"
- Minimum TLS Version: 1.2
- Opportunistic Encryption: On
- TLS 1.3: On
```

### 3. Firewall Rules Configuration

#### Block by Country (Geo-IP Blocking)

```
Dashboard → Security → WAF → Create Firewall Rule

Rule Name: Block High-Risk Countries
Field: Country
Operator: is in
Value: [Select countries to block, e.g., CN, RU, KP]
Action: Block
```

#### Rate Limiting Rule

```
Dashboard → Security → WAF → Rate Limiting Rules

Rule Name: Auth Endpoint Protection
If incoming requests match:
  - URI Path contains "/api/auth/"
Then:
  - Requests: 5
  - Period: 15 minutes
  - Action: Block
  - Duration: 1 hour
```

#### Challenge Suspicious Traffic

```
Dashboard → Security → WAF → Create Firewall Rule

Rule Name: Challenge Suspicious Bots
Field: Threat Score
Operator: greater than
Value: 10
Action: Managed Challenge (CAPTCHA)
```

### 4. Bot Fight Mode

```
Dashboard → Security → Bots
- Enable "Bot Fight Mode" (Free plan)
OR
- Configure "Super Bot Fight Mode" (Paid plans)
  - Definitely automated: Block
  - Likely automated: Managed Challenge
  - Verified bots: Allow
```

### 5. DDoS Protection

```
Dashboard → Security → DDoS
- HTTP DDoS Attack Protection: Enabled (default)
- Network-layer DDoS Attack Protection: Enabled (default)
- Sensitivity Level: Medium (recommended)
```

### 6. Page Rules for Performance

```
Dashboard → Rules → Page Rules

Rule 1: Cache Static Assets
- URL: *besahubs.com/*.js
- Settings: Cache Level - Cache Everything, Edge Cache TTL - 1 month

Rule 2: Cache Static Assets (CSS)
- URL: *besahubs.com/*.css
- Settings: Cache Level - Cache Everything, Edge Cache TTL - 1 month

Rule 3: Cache Static Assets (Images)
- URL: *besahubs.com/*.{jpg,jpeg,png,gif,svg,ico}
- Settings: Cache Level - Cache Everything, Edge Cache TTL - 1 month

Rule 4: Bypass Cache for API
- URL: *besahubs.com/api/*
- Settings: Cache Level - Bypass
```

### 7. Security Level

```
Dashboard → Security → Settings
- Security Level: Medium (default)
- Challenge Passage: 30 minutes
- Browser Integrity Check: On
```

### 8. Turnstile (Cloudflare Captcha)

```
Dashboard → Turnstile
1. Click "Add Site"
2. Site Name: BesaHubs CRM
3. Domain: besahubs.com
4. Widget Mode: Managed (recommended)
5. Copy the Site Key and Secret Key
6. Add to environment variables:
   - Client: REACT_APP_TURNSTILE_SITE_KEY=<site_key>
   - Server: TURNSTILE_SECRET_KEY=<secret_key>
```

### 9. Analytics & Monitoring

```
Dashboard → Analytics & Logs
- Traffic: Monitor request volume, bandwidth
- Security: View blocked threats, challenge solve rate
- Performance: Check cache hit ratio, response time
- Logs (Enterprise only): Stream real-time logs to SIEM
```

### 10. Transform Rules (Optional)

```
Dashboard → Rules → Transform Rules → Modify Request Header

Rule Name: Add Security Headers
Field: Set static
Header name: X-Frame-Options
Value: DENY

Add additional headers:
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
```

---

## Security Headers

### Content Security Policy (CSP)

Add to Nginx or Cloudflare Transform Rules:

```
Content-Security-Policy: default-src 'self'; script-src 'self' challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' wss: challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

### Recommended Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filtering |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referer information |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disable unused browser features |

---

## Rate Limiting Strategies

### Three-Tier Protection

1. **Cloudflare Layer** (First line of defense)
   - Blocks obvious attacks before reaching origin
   - Rate: 100 req/min per IP globally
   - Challenge suspicious traffic

2. **Nginx Layer** (Second line of defense)
   - Protects backend services
   - Rate: Varies by endpoint (auth: 5/15min, API: 100/min)
   - Connection limits per IP

3. **Application Layer** (Third line of defense)
   - Express rate limiting middleware
   - User-specific limits (logged-in users)
   - Adaptive rate limiting based on behavior

### Adaptive Rate Limiting

The application implements adaptive rate limiting that adjusts based on:

- **Failed login attempts**: Stricter limits after failures
- **Request signatures**: Detect rapid duplicate requests
- **IP reputation**: Track historical behavior
- **User role**: Different limits for admin vs. regular users

---

## Monitoring & Alerts

### Cloudflare Notifications

```
Dashboard → Notifications → Add
- Advanced DDoS Attack Alert
- Advanced Security Events Alert
- Certificate Expiration Alert
- Traffic Anomalies Alert
```

### Application Monitoring

The BesaHubs CRM logs security events to:

1. **Security Log**: `/server/logs/security.log`
   - Rate limit violations
   - Captcha failures
   - Geo-IP blocks
   - Suspicious activity

2. **Audit Log**: `/server/logs/audit.log`
   - Authentication events
   - Critical actions
   - Access control changes

### Recommended Monitoring Tools

- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Log Analysis**: ELK Stack, Splunk, Datadog
- **APM**: New Relic, Datadog APM
- **Security Scanning**: Qualys, Nessus

---

## Testing Your Configuration

### 1. Test Rate Limiting

```bash
# Test auth endpoint rate limiting (should block after 5 requests)
for i in {1..10}; do
  curl -X POST https://besahubs.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo "Request $i"
done
```

### 2. Test Geo-IP Blocking

```bash
# Use a VPN to test from blocked countries
curl -I https://besahubs.com/api/auth/login
# Should return 403 Forbidden
```

### 3. Test Captcha

```bash
# Test login without captcha token
curl -X POST https://besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Should return 400 Bad Request
```

### 4. Test Body Size Limits

```bash
# Test with oversized payload
curl -X POST https://besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "$(yes 'a' | head -n 20000 | tr -d '\n')"
# Should return 413 Payload Too Large
```

### 5. Test SSL/TLS

```bash
# Check SSL configuration
openssl s_client -connect besahubs.com:443 -servername besahubs.com

# Test with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=besahubs.com
```

---

## Environment Variables Reference

### Client (React)

```bash
# .env
REACT_APP_TURNSTILE_SITE_KEY=0x4AAAAAAA...
```

### Server (Node.js)

```bash
# .env
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
BLOCKED_COUNTRIES=CN,RU,KP  # ISO 3166-1 alpha-2 codes, comma-separated
WHITELISTED_IPS=192.168.1.1,10.0.0.1  # Trusted IPs that bypass geo-blocking
```

---

## Troubleshooting

### Issue: Captcha not appearing

**Solution:**
1. Check that `REACT_APP_TURNSTILE_SITE_KEY` is set in client environment
2. Verify the site key is correct in Cloudflare dashboard
3. Check browser console for JavaScript errors
4. Ensure Cloudflare Turnstile script is not blocked by ad blockers

### Issue: Rate limiting too strict

**Solution:**
1. Adjust `max` and `windowMs` in `server/middleware/rateLimiters.js`
2. Increase burst size in Nginx configuration
3. Whitelist known good IPs in Cloudflare firewall rules

### Issue: Legitimate users blocked by geo-IP filter

**Solution:**
1. Add their IP to `WHITELISTED_IPS` environment variable
2. Review and update `BLOCKED_COUNTRIES` list
3. Consider using more granular blocking in Cloudflare firewall rules

### Issue: 413 Payload Too Large errors

**Solution:**
1. Check request body size in logs
2. Adjust limits in `server/index.js` if legitimate
3. Verify Nginx `client_max_body_size` setting

---

## Best Practices

1. **Layer Security**: Use Cloudflare + Nginx + Application-level protection
2. **Monitor Continuously**: Set up alerts for security events
3. **Regular Updates**: Keep SSL certificates, dependencies, and configs up to date
4. **Test Regularly**: Run security tests after configuration changes
5. **Log Everything**: Comprehensive logging helps with incident response
6. **Backup Configs**: Version control your Nginx and Cloudflare settings
7. **Incident Response Plan**: Document procedures for handling DDoS attacks
8. **Review Logs**: Regularly review security logs for suspicious patterns

---

## Additional Resources

- [Cloudflare DDoS Protection](https://www.cloudflare.com/ddos/)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
