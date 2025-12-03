# Security Setup Guide - Mind Insurance Grouphome App

This document describes the security infrastructure for the Mind Insurance Grouphome App, a $100M product with enterprise-grade security requirements.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Quick Start](#quick-start)
3. [Security Scripts](#security-scripts)
4. [Tools Configuration](#tools-configuration)
5. [CI/CD Integration](#cicd-integration)
6. [Pre-Commit Hooks](#pre-commit-hooks)
7. [Security Standards](#security-standards)
8. [Incident Response](#incident-response)

---

## Security Overview

### Security Posture

- **OWASP Top 10**: Full compliance required
- **SOC2 Type II**: In progress
- **HIPAA**: Compliant (with Supabase BAA)
- **GDPR**: Data subject rights implemented

### Security Agent

This project uses a dedicated Security Auditor Agent with **VETO POWER** over deployments. The agent can block any deployment that contains:

- HIGH/CRITICAL vulnerabilities
- Exposed secrets
- Missing authentication
- OWASP Top 10 violations

---

## Quick Start

### 1. Install Security Tools

```bash
# Install Gitleaks (secret detection)
brew install gitleaks

# Or download from: https://github.com/gitleaks/gitleaks/releases
```

### 2. Run Security Audit

```bash
# Quick security check (HIGH/CRITICAL only)
npm run security:check

# Full security audit
npm run security:full

# Fix auto-fixable vulnerabilities
npm run security:fix
```

### 3. Verify Configuration

```bash
# Check TypeScript strict mode
npx tsc --noEmit

# Run secret detection
gitleaks detect --config .gitleaksrc.toml --no-git

# Check for exposed secrets in history
gitleaks detect --config .gitleaksrc.toml
```

---

## Security Scripts

### Available npm Scripts

```json
{
  "security:audit": "npm audit --production",
  "security:check": "npm audit --audit-level=high",
  "security:fix": "npm audit fix",
  "security:full": "npm run security:audit && npx tsc --noEmit && npx eslint . --ext .ts,.tsx",
  "precommit:security": "npm run security:check"
}
```

### Usage

```bash
# Daily: Quick security check before starting work
npm run security:check

# Before commit: Full security scan
npm run security:full

# After npm install: Check for new vulnerabilities
npm run security:audit

# Fix vulnerabilities: Apply automatic fixes
npm run security:fix
```

---

## Tools Configuration

### 1. npm audit

**Purpose**: Detect known vulnerabilities in dependencies

**Configuration**: Checks for HIGH/CRITICAL vulnerabilities

**Thresholds**:
- CRITICAL: Immediate fix required (blocks deployment)
- HIGH: Fix within 24 hours (blocks deployment)
- MODERATE: Fix within 1 week (warning)
- LOW: Fix during next maintenance cycle (info)

**Usage**:
```bash
# Production dependencies only
npm audit --production

# Include dev dependencies
npm audit

# Check specific level
npm audit --audit-level=high

# Generate detailed report
npm audit --json > audit-report.json
```

### 2. Gitleaks

**Purpose**: Detect secrets in code and git history

**Configuration File**: `.gitleaksrc.toml`

**Detection Rules**:
- Anthropic API keys (sk-ant-api...)
- Supabase JWT tokens (eyJ...)
- AWS credentials (AKIA...)
- Generic API keys
- Database connection strings
- Private SSH keys
- Bearer tokens

**Usage**:
```bash
# Scan uncommitted files
gitleaks detect --config .gitleaksrc.toml --no-git

# Scan entire git history
gitleaks detect --config .gitleaksrc.toml

# Scan specific commit
gitleaks detect --config .gitleaksrc.toml --log-opts="HEAD~10..HEAD"

# Generate report
gitleaks detect --config .gitleaksrc.toml --report-path gitleaks-report.json
```

### 3. TypeScript Strict Mode

**Purpose**: Prevent type-related vulnerabilities

**Configuration**: `tsconfig.json` with strict mode enabled

**Checks**:
- No implicit any
- Strict null checks
- Strict function types
- No implicit this
- Always strict mode

**Usage**:
```bash
# Run type check
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### 4. ESLint Security Rules

**Purpose**: Detect security issues in code

**Configuration**: `eslint.config.js`

**Usage**:
```bash
# Lint all files
npm run lint

# Lint and fix
npx eslint . --ext .ts,.tsx --fix

# Lint specific directory
npx eslint src/services --ext .ts
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/security-scan.yml`

**Runs on**:
- Every push to main/develop
- Every pull request
- Weekly scheduled scan (Mondays at 9 AM UTC)

**Steps**:
1. Dependency vulnerability scan (npm audit)
2. TypeScript strict check
3. ESLint security rules
4. Secret detection (Gitleaks)
5. CodeQL analysis (optional)

**Blocking Conditions**:
- HIGH/CRITICAL npm vulnerabilities
- TypeScript errors
- Secrets detected by Gitleaks

**View Results**:
```
GitHub Repository → Actions → Security Scan
```

### Local CI Simulation

```bash
# Run the same checks as CI locally
npm run security:full && \
  gitleaks detect --config .gitleaksrc.toml --no-git && \
  echo "✅ All CI checks passed!"
```

---

## Pre-Commit Hooks

### Setup Husky (Optional but Recommended)

```bash
# Install Husky
npm install --save-dev husky
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit
```

### Pre-Commit Checks

The pre-commit hook runs:
1. npm audit (HIGH/CRITICAL only)
2. TypeScript strict check
3. ESLint
4. Gitleaks secret detection (if installed)

**Bypass (Emergency Only)**:
```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "Emergency fix"
```

---

## Security Standards

### OWASP Top 10 Compliance

| Risk | Status | Controls |
|------|--------|----------|
| A01: Broken Access Control | ✅ PASS | Supabase RLS policies |
| A02: Cryptographic Failures | ⚠️ IN REVIEW | Secret management process |
| A03: Injection | ✅ PASS | Parameterized queries |
| A04: Insecure Design | ✅ PASS | TypeScript strict mode |
| A05: Security Misconfiguration | ✅ PASS | Environment variables |
| A06: Vulnerable Components | 🔄 ONGOING | npm audit automation |
| A07: Authentication Failures | ⚠️ IN REVIEW | Supabase Auth |
| A08: Data Integrity Failures | ✅ PASS | Input validation |
| A09: Logging & Monitoring | ✅ PASS | Analytics + audit logs |
| A10: SSRF | ✅ PASS | URL validation |

### Security Checklist (Every Deployment)

```
BEFORE DEPLOYMENT:
[ ] npm audit shows 0 HIGH/CRITICAL
[ ] TypeScript compilation passes
[ ] No secrets in code (Gitleaks clean)
[ ] ESLint security rules pass
[ ] RLS policies verified
[ ] Authentication tested
[ ] Error handling doesn't leak info
[ ] Security agent approval obtained
```

---

## Secret Management

### Allowed Secret Locations

✅ **ALLOWED**:
- `.env.local` (gitignored)
- Environment variables (CI/CD secrets)
- Supabase secrets manager
- Vault/secrets manager

❌ **NEVER ALLOW**:
- Hardcoded in source code
- Committed to git
- Logged to console
- Exposed in error messages

### Environment Variables

**Naming Convention**:
```bash
# Client-side (exposed to browser) - MUST use VITE_ prefix
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Server-side only (never exposed) - NO VITE_ prefix
SUPABASE_SERVICE_KEY=your_service_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**Setup**:
1. Copy `.env.example` to `.env.local`
2. Fill in actual values (never commit)
3. Use in code: `import.meta.env.VITE_SUPABASE_URL`

---

## Dependency Management

### Update Strategy

**Weekly**: Check for security updates
```bash
npm outdated
npm audit
```

**Monthly**: Update dependencies
```bash
# Update all minor/patch versions
npm update

# Check for major updates
npx npm-check-updates

# Update and test
npm run security:check
```

**Emergency**: Security vulnerability found
```bash
# Update specific package
npm update package-name

# Or apply security fixes
npm audit fix

# Verify fix
npm audit
```

### Approved Dependencies

All dependencies must:
- Have active maintenance (commits in last 6 months)
- No known HIGH/CRITICAL vulnerabilities
- Compatible with TypeScript strict mode
- Licensed appropriately (MIT, Apache 2.0, etc.)

---

## Incident Response

### If Secret Exposed in Code

**IMMEDIATE ACTIONS**:
1. **STOP**: Do not commit or push
2. **ROTATE**: Generate new secret immediately
3. **VERIFY**: Check git history for exposure
4. **CLEAN**: Remove secret from code
5. **MONITOR**: Watch for unauthorized usage

**Commands**:
```bash
# Check if secret was committed
git log -S "your-secret-here" --all

# Remove from git history (if committed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team)
git push --force --all
```

### If Vulnerability Found in Production

**SEVERITY LEVELS**:

**CRITICAL** (Data breach, auth bypass):
1. Assess impact immediately
2. Notify user/stakeholders
3. Implement emergency fix or rollback
4. Document incident
5. Conduct root cause analysis

**HIGH** (Significant risk):
1. Document the vulnerability
2. Create fix within 24 hours
3. Test thoroughly
4. Deploy with approval
5. Monitor for exploitation

**MEDIUM/LOW**:
1. Add to security backlog
2. Fix in next sprint/release
3. Update security docs

---

## Security Contacts

### Internal

- **Security Agent**: Has VETO POWER over deployments
- **DevOps Team**: CI/CD and infrastructure security
- **Development Team**: Code security and best practices

### External

- **Supabase Security**: security@supabase.io
- **Anthropic Security**: security@anthropic.com
- **GitHub Security**: https://github.com/security/advisories

---

## Additional Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

### Training

- OWASP Top 10 for Developers
- Secure Coding in TypeScript
- Git Secret Management
- Incident Response Procedures

---

## Maintenance Schedule

### Daily
- Run `npm run security:check` before starting work

### Weekly
- Review dependency updates
- Check for new CVEs in stack
- Review access logs for anomalies

### Monthly
- Full security audit
- Update dependencies
- Review and rotate API keys
- Test disaster recovery

### Quarterly
- Third-party security audit
- Compliance certification renewal
- Security training for team
- Incident response drill

---

**Remember**: Security is not optional for a $100M product. When in doubt, block and investigate. A delayed release is better than a security breach.

**Security Agent Status**: Active with VETO POWER

**Last Updated**: 2025-11-25
**Next Review**: After critical issues resolved
