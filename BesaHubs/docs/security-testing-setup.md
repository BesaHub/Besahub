# Security Testing CI/CD Setup

> **Last Updated:** October 1, 2025  
> **Version:** 1.0  
> **Maintainer:** BesaHubs Security Team

## Overview

This document provides instructions for setting up and using the automated security testing pipelines for BesaHubs CRM.

## Deliverables Summary

✅ **Completed Deliverables:**

1. **.github/workflows/sast.yml** - Static Application Security Testing (SAST)
   - CodeQL analysis for JavaScript/Node.js
   - NPM dependency vulnerability audit (client & server)
   - Security quality gates (fails on critical vulnerabilities)
   - Scheduled daily at 2 AM UTC
   
2. **.github/workflows/dast.yml** - Dynamic Application Security Testing (DAST)
   - OWASP ZAP baseline & full scans
   - Scans deployed application endpoints (production/staging)
   - Scheduled weekly on Sundays at 3 AM UTC
   - Manual workflow dispatch with custom target URL
   
3. **.zap/rules.tsv** - ZAP Rules Configuration
   - False positive suppressions for development alerts
   - Custom severity mappings
   - React DevTools and CORS development allowances
   
4. **docs/penetration-testing.md** - Comprehensive Penetration Testing Guide
   - Pre-test preparation checklist
   - OWASP WSTG v4.2 methodology
   - 13 attack scenarios with commands
   - Security controls verification matrix
   - 10+ testing tools with usage examples
   - Vulnerability reporting template
   - Post-test remediation procedures

---

## GitHub Actions Badge URLs

### For README.md Integration

Add these badges to your `README.md` file to display security scan status:

```markdown
## Security Status

[![CodeQL](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/sast.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/sast.yml)
[![OWASP ZAP](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/dast.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/dast.yml)
```

**Replace:**
- `YOUR_ORG` with your GitHub organization name
- `YOUR_REPO` with your repository name

**Example:**
```markdown
[![CodeQL](https://github.com/besahubs/crm-app/actions/workflows/sast.yml/badge.svg)](https://github.com/besahubs/crm-app/actions/workflows/sast.yml)
[![OWASP ZAP](https://github.com/besahubs/crm-app/actions/workflows/dast.yml/badge.svg)](https://github.com/besahubs/crm-app/actions/workflows/dast.yml)
```

---

## GitHub Secrets Configuration

### Required Secrets

Configure these secrets in your GitHub repository settings:

**Path:** `Settings → Secrets and variables → Actions → New repository secret`

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DOPPLER_TOKEN` | Doppler API token for secrets management | `dp.st.prod.xxxxxxxxxxxxx` |
| `DATABASE_URL` | PostgreSQL connection string for tests | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret for test environment | `test-secret-key-minimum-32-chars` |

### Optional Secrets (for production scans)

| Secret Name | Description |
|-------------|-------------|
| `PROD_API_URL` | Production API URL for DAST scans |
| `STAGING_API_URL` | Staging API URL for DAST scans |
| `SLACK_WEBHOOK_URL` | Slack notifications for critical findings |

---

## Workflow Execution

### SAST (Static Analysis) Workflow

**Triggers:**
- **Push** to `main` or `develop` branches
- **Pull Request** to `main` branch
- **Scheduled:** Daily at 2:00 AM UTC
- **Manual:** Via GitHub Actions UI

**Duration:** ~5-10 minutes

**What it does:**
1. Checks out code
2. Initializes CodeQL for JavaScript
3. Runs security-extended queries
4. Audits npm dependencies (server + client)
5. Checks for critical vulnerabilities (CVSS ≥ 9.0)
6. Uploads SARIF results to Security tab
7. Fails pipeline if critical vulnerabilities found

**Manual Trigger:**
```bash
# Via GitHub CLI
gh workflow run sast.yml

# Via GitHub UI
# Actions → Security Code Scanning (SAST) → Run workflow
```

### DAST (Dynamic Analysis) Workflow

**Triggers:**
- **Scheduled:** Weekly on Sundays at 3:00 AM UTC (scans default deployment URL)
- **Manual:** Via GitHub Actions UI with custom target URL

**Duration:** ~30-60 minutes

**What it does:**
1. Accepts target URL (deployed application endpoint)
2. Runs OWASP ZAP baseline scan (passive analysis)
3. Runs OWASP ZAP full scan (active penetration testing)
4. Uploads HTML/JSON reports as artifacts
5. Checks for high-risk vulnerabilities (riskcode 3)
6. Fails pipeline if high-risk issues found

**Manual Trigger with Custom URL:**
```bash
# Via GitHub CLI with custom target
gh workflow run dast.yml -f target_url=https://your-staging-app.replit.dev

# Via GitHub UI
# Actions → Dynamic Security Testing (DAST) → Run workflow
# Enter target URL in the "target_url" input field
```

**Important:** Update the default target URL in `.github/workflows/dast.yml` to point to your production or staging deployment:
```yaml
# Line 11 in dast.yml
default: 'https://your-app-url.replit.dev'  # Update this
```

---

## Viewing Results

### CodeQL Security Results

**Location:** `Security → Code scanning alerts`

**Features:**
- View all detected vulnerabilities
- Filter by severity (Critical, High, Medium, Low)
- See code snippets and fix suggestions
- Track remediation status
- Export to CSV/JSON

### NPM Audit Results

**Location:** `Actions → [Workflow Run] → Artifacts`

**Download:**
1. Navigate to workflow run
2. Scroll to "Artifacts" section
3. Download `npm-audit-results`
4. Extract and view JSON files

**Files:**
- `npm-audit-server.json` - Server dependency vulnerabilities
- `npm-audit-client.json` - Client dependency vulnerabilities

### OWASP ZAP Reports

**Location:** `Actions → [Workflow Run] → Artifacts`

**Download:**
1. Navigate to DAST workflow run
2. Scroll to "Artifacts" section
3. Download `zap-scan-reports`
4. Extract and open HTML files in browser

**Files:**
- `zap-baseline-report.html` - Passive scan results
- `zap-full-report.html` - Active scan results
- `zap-baseline-report.json` - Machine-readable baseline results
- `zap-full-report.json` - Machine-readable full scan results

---

## Security Quality Gates

### Pipeline Failure Conditions

The CI/CD pipeline will **fail** if:

1. **Critical vulnerabilities found** (CVSS ≥ 9.0)
   - Source: CodeQL analysis
   - Source: NPM audit (critical severity)

2. **High-severity npm vulnerabilities in production dependencies**
   - Only production dependencies are checked
   - DevDependencies are informational only

3. **Build failures during CodeQL analysis**
   - Syntax errors, compilation failures

### Override Process (Emergency Only)

If you need to bypass security gates in an emergency:

```yaml
# Add to workflow file temporarily
- name: Check for critical vulnerabilities
  if: github.event_name != 'push' || github.ref != 'refs/heads/main'
  run: |
    # Security check commands
```

**⚠️ WARNING:** Document all security gate overrides and create remediation tickets immediately.

---

## Customization Guide

### Adjusting Scan Schedules

**Edit `.github/workflows/sast.yml`:**
```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
  # Change to: '0 14 * * *' for 2 PM UTC
  # Change to: '0 2 * * 1' for Mondays only at 2 AM UTC
```

**Edit `.github/workflows/dast.yml`:**
```yaml
schedule:
  - cron: '0 3 * * 0'  # Sundays at 3 AM UTC
  # Change to: '0 3 * * 3' for Wednesdays at 3 AM UTC
  # Change to: '0 3 1 * *' for First day of month at 3 AM UTC
```

**Cron syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

### Adding Additional CodeQL Queries

**Edit `.github/workflows/sast.yml`:**
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: ${{ matrix.language }}
    queries: security-extended, security-and-quality
    # Add custom queries:
    # queries: security-extended, security-and-quality, ./custom-queries/
```

### Customizing ZAP Scan Rules

**Edit `.zap/rules.tsv`:**
```tsv
# Add new rule suppression
10055   IGNORE  # Your custom rule
10096   INFO      # Downgrade severity
```

**Rule format:**
```
RULE_ID THRESHOLD       [COMMENT]
```

**Thresholds:** `IGNORE`, `INFO`, `LOW`, `MEDIUM`, `HIGH`

**Find rule IDs:**
- View ZAP scan report HTML
- Each finding has a rule ID (e.g., 10055)
- Add to rules.tsv to customize handling

---

## Integration with Existing Security Tools

### Doppler Secrets Management

The workflows are configured to use Doppler for secrets:

```yaml
# In workflow file
- name: Setup secrets
  run: |
    echo "Setting up Doppler secrets..."
    doppler secrets download --no-file --format env > .env
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

### Slack Notifications (Optional)

Add Slack notifications for critical findings:

```yaml
# Add to workflow file
- name: Notify Slack on Critical Findings
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Security scan found critical vulnerabilities!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### JIRA Integration (Optional)

Auto-create JIRA tickets for vulnerabilities:

```yaml
- name: Create JIRA Ticket
  if: failure()
  uses: atlassian/gajira-create@v3
  with:
    project: SEC
    issuetype: Bug
    summary: '[Security] Critical vulnerability found in ${{ github.repository }}'
    description: 'See workflow run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
```

---

## Troubleshooting

### Common Issues

#### 1. CodeQL Analysis Fails

**Error:** `No code to analyze`

**Solution:**
```yaml
# Ensure autobuild is working
- name: Autobuild
  uses: github/codeql-action/autobuild@v3

# Or specify manual build:
- name: Build
  run: |
    cd server && npm install
    cd ../client && npm install
```

#### 2. Docker Compose Fails in DAST

**Error:** `Service 'backend' failed to build`

**Solution:**
- Check Dockerfile.test exists in server/
- Verify all dependencies are listed in package.json
- Check build logs for specific errors

#### 3. ZAP Scan Times Out

**Error:** `Timeout waiting for application`

**Solution:**
```yaml
# Increase wait time
- name: Start application services
  run: |
    docker-compose up -d
    sleep 60  # Increase from 30 to 60 seconds
```

#### 4. NPM Audit False Positives

**Error:** DevDependency vulnerabilities failing pipeline

**Solution:**
```yaml
# Audit only production dependencies
- name: Run npm audit
  run: |
    npm audit --production --audit-level=high
```

#### 5. SARIF Upload Fails

**Error:** `Failed to upload SARIF file`

**Solution:**
- Ensure `security-events: write` permission is set
- Check SARIF file is valid JSON
- Verify file size is under 10MB

---

## Best Practices

### For Developers

1. **Run local security scans before pushing:**
   ```bash
   # Run npm audit locally
   cd server && npm audit
   cd ../client && npm audit
   
   # Fix vulnerabilities
   npm audit fix
   ```

2. **Review CodeQL alerts in PRs:**
   - Check Security tab before merging
   - Fix all High/Critical findings
   - Document accepted risks for Medium/Low

3. **Test security fixes:**
   - Trigger SAST workflow manually after fixes
   - Verify vulnerability is resolved
   - Update issue tracker

### For Security Team

1. **Review DAST results weekly:**
   - Download ZAP reports every Monday
   - Triage findings by severity
   - Create remediation tickets

2. **Update ZAP rules quarterly:**
   - Review false positives
   - Add new suppressions as needed
   - Document reasoning in comments

3. **Conduct penetration tests quarterly:**
   - Follow docs/penetration-testing.md
   - Update security roadmap based on findings
   - Schedule re-tests for critical fixes

### For DevOps Team

1. **Monitor workflow performance:**
   - Track execution times
   - Optimize slow steps
   - Review artifact storage usage

2. **Keep actions up to date:**
   ```yaml
   # Update action versions quarterly
   uses: github/codeql-action/init@v3  # Check for v4, v5
   uses: actions/checkout@v4           # Latest version
   ```

3. **Rotate secrets regularly:**
   - Update DOPPLER_TOKEN monthly
   - Rotate JWT_SECRET for test environment
   - Audit secret usage in logs

---

## Cost Optimization

### GitHub Actions Minutes

**Current usage estimate:**
- SAST: ~10 minutes/run × 30 days = 300 minutes/month
- DAST: ~60 minutes/run × 4 weeks = 240 minutes/month
- **Total:** ~540 minutes/month

**Optimization tips:**
1. Run DAST on staging only (not production)
2. Cache npm dependencies to speed up builds
3. Run full scans weekly, baseline scans daily

### Artifact Storage

**Current usage estimate:**
- ZAP reports: ~50MB/week × 4 = 200MB/month
- NPM audit: ~1MB/day × 30 = 30MB/month
- **Total:** ~230MB/month

**Cleanup strategy:**
```yaml
# Auto-delete old artifacts after 30 days
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: reports
    path: reports/
    retention-days: 30  # Auto-delete after 30 days
```

---

## Compliance Mapping

### SOC 2 Type II

| Control | Evidence Location |
|---------|-------------------|
| CC6.6 - Logical Access - Code Scanning | CodeQL workflow runs |
| CC6.8 - Logical Access - Vulnerability Management | NPM audit results |
| CC7.1 - System Operations - Detection | ZAP scan reports |
| CC7.2 - System Operations - Monitoring | GitHub Security alerts |

### GDPR

| Requirement | Implementation |
|-------------|----------------|
| Article 32 - Security of Processing | SAST + DAST pipelines |
| Article 25 - Data Protection by Design | Security gates in CI/CD |

### OWASP Top 10 2021

| Category | Testing Coverage |
|----------|------------------|
| A01:2021 - Broken Access Control | ZAP authorization tests |
| A02:2021 - Cryptographic Failures | CodeQL crypto analysis |
| A03:2021 - Injection | SQLMap + CodeQL injection detection |
| A04:2021 - Insecure Design | Manual penetration testing |
| A05:2021 - Security Misconfiguration | ZAP configuration tests |
| A06:2021 - Vulnerable Components | NPM audit |
| A07:2021 - Authentication Failures | ZAP authentication tests |
| A08:2021 - Software & Data Integrity | SARIF integrity checks |
| A09:2021 - Security Logging Failures | CodeQL logging analysis |
| A10:2021 - SSRF | ZAP SSRF detection |

---

## Next Steps

1. **Enable workflows in GitHub:**
   - Go to Actions tab
   - Enable workflows
   - Trigger initial run manually

2. **Configure secrets:**
   - Add required secrets to repository
   - Test workflow with secrets
   - Verify Doppler integration

3. **Set up notifications:**
   - Configure Slack webhook (optional)
   - Enable email notifications
   - Set up security alert routing

4. **Schedule penetration test:**
   - Follow docs/penetration-testing.md
   - Book security team capacity
   - Prepare test environment

5. **Train development team:**
   - Share this documentation
   - Conduct security workshop
   - Review common vulnerabilities

---

## Support

### Documentation

- **Penetration Testing Guide:** `docs/penetration-testing.md`
- **Security Features:** `docs/security.md`
- **Compliance:** `docs/compliance.md`

### Contacts

- **Security Team:** security@besahubs.com
- **Slack Channel:** #security-team
- **On-Call:** PagerDuty - Security Escalation

### External Resources

- [GitHub CodeQL Documentation](https://codeql.github.com/docs/)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [GitHub Actions Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

*Document Version: 1.0*  
*Last Updated: October 1, 2025*  
*Next Review: January 1, 2026*
