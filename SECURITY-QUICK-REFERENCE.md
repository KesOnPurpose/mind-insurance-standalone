# Security Quick Reference Card

**Mind Insurance Grouphome App - Security Agent with VETO POWER**

---

## DAILY SECURITY COMMANDS

```bash
# Before starting work
npm run security:check

# Before committing
npm run security:full

# After npm install
npm audit --production
```

---

## CRITICAL RULES

### NEVER DO THIS ❌

```typescript
// ❌ Hardcoded secrets
const API_KEY = "sk-ant-api03-...";
const token = "eyJhbGciOiJIUzI1NiI...";

// ❌ Secrets in console.log
console.log("API Key:", apiKey);

// ❌ Unvalidated user input
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ Exposed service role key in client code
const SUPABASE_SERVICE_KEY = "eyJ...service_role...";
```

### ALWAYS DO THIS ✅

```typescript
// ✅ Environment variables
const apiKey = import.meta.env.VITE_API_KEY;

// ✅ Supabase parameterized queries
const { data } = await supabase.from('users').select('*').eq('id', userId);

// ✅ Input validation with Zod
const schema = z.object({ email: z.string().email() });

// ✅ Error handling without leaking info
catch (error) {
  console.error("Operation failed"); // Don't log sensitive details
  return { error: "Something went wrong" };
}
```

---

## ENVIRONMENT VARIABLES

### Naming Convention

```bash
# Client-side (browser) - MUST use VITE_ prefix
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Server-side ONLY - NO VITE_ prefix
SUPABASE_SERVICE_KEY=your_service_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Setup

1. Copy `.env.example` → `.env.local`
2. Fill in real values
3. **NEVER commit .env.local**

---

## SECRET DETECTION

### Check for Secrets

```bash
# Before commit
gitleaks detect --config .gitleaksrc.toml --no-git

# Check git history
gitleaks detect --config .gitleaksrc.toml

# Search for patterns
grep -r "password\|secret\|key\|token" src/ --include="*.ts"
```

### If Secret Exposed

1. **STOP** - Don't commit/push
2. **ROTATE** - Generate new secret immediately
3. **REMOVE** - Delete from code
4. **VERIFY** - Check git history
5. **MONITOR** - Watch for unauthorized usage

---

## DEPENDENCY SECURITY

### Check Vulnerabilities

```bash
# Quick check
npm audit

# Production only
npm audit --production

# HIGH/CRITICAL only
npm audit --audit-level=high
```

### Fix Vulnerabilities

```bash
# Auto-fix (safe)
npm audit fix

# Force fix (may break)
npm audit fix --force

# Update specific package
npm update package-name
```

---

## PRE-COMMIT CHECKLIST

```
BEFORE EVERY COMMIT:
[ ] No hardcoded secrets
[ ] No console.log with sensitive data
[ ] TypeScript compiles (npx tsc --noEmit)
[ ] ESLint passes (npm run lint)
[ ] Security check passes (npm run security:check)
[ ] Gitleaks passes (if installed)
```

---

## OWASP TOP 10 QUICK CHECK

| Risk | How to Check |
|------|--------------|
| A01: Access Control | RLS policies on all Supabase tables |
| A02: Crypto Failures | No hardcoded secrets, use env vars |
| A03: Injection | Use Supabase client (parameterized) |
| A04: Insecure Design | TypeScript strict mode enabled |
| A05: Misconfiguration | Check .env in .gitignore |
| A06: Vulnerable Deps | Run npm audit |
| A07: Auth Failures | Use Supabase Auth, no custom auth |
| A08: Data Integrity | Validate inputs with Zod |
| A09: Logging | Don't log sensitive data |
| A10: SSRF | Validate external URLs |

---

## COMMON VULNERABILITIES

### SQL Injection (A03)

```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SECURE
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email);
```

### XSS (A03)

```typescript
// ❌ VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SECURE
<div>{userInput}</div> // React auto-escapes
```

### Hardcoded Secrets (A02)

```typescript
// ❌ VULNERABLE
const apiKey = "sk-ant-api03-...";

// ✅ SECURE
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) throw new Error('API key not configured');
```

---

## DEPLOYMENT BLOCKERS

### Security Agent VETO Triggers

Deployment is BLOCKED if:
- ❌ HIGH/CRITICAL npm vulnerabilities
- ❌ Secrets detected by Gitleaks
- ❌ TypeScript errors
- ❌ Missing authentication on protected routes
- ❌ SQL injection vulnerability
- ❌ XSS vulnerability
- ❌ Missing RLS policies

---

## INCIDENT RESPONSE

### If You Find a Vulnerability

**CRITICAL** (data breach, auth bypass):
1. Report immediately to security agent
2. Do NOT deploy
3. Document the issue
4. Wait for security team guidance

**HIGH** (significant risk):
1. Create security issue
2. Fix within 24 hours
3. Test thoroughly
4. Request security review

---

## TOOLS INSTALLED

### npm Scripts

```bash
npm run security:audit      # Full audit (production)
npm run security:check      # HIGH/CRITICAL only
npm run security:fix        # Auto-fix vulnerabilities
npm run security:full       # Complete security scan
```

### External Tools

- **Gitleaks**: Secret detection
- **npm audit**: Dependency scanning
- **TypeScript**: Type safety
- **ESLint**: Code quality + security

---

## CI/CD SECURITY

### GitHub Actions

- Runs on every push/PR
- Blocks merge if security issues found
- Weekly scheduled scans (Mondays 9 AM UTC)

### View Results

```
GitHub → Actions → Security Scan
```

---

## USEFUL LINKS

- Full Security Report: `Context/SECURITY-CHECKLIST.md`
- Setup Guide: `SECURITY-README.md`
- Immediate Fixes: `SECURITY-FIXES-REQUIRED.md`
- Security Agent Protocol: `Context/AGENT-SECURITY-AUDITOR.md`

---

## SECURITY AGENT STATUS

**VETO POWER**: Active
**Current Status**: DEPLOYMENT BLOCKED
**Reason**: 2 CRITICAL issues found
**Next Action**: Fix issues in SECURITY-FIXES-REQUIRED.md

---

## QUICK HELP

### Question: Can I commit this code?

Run: `npm run security:full && gitleaks detect --config .gitleaksrc.toml --no-git`

If all pass: ✅ Safe to commit
If any fail: ❌ Fix issues first

### Question: How do I rotate an exposed secret?

1. Generate new secret in service dashboard
2. Update .env.local with new secret
3. Test functionality
4. Revoke old secret
5. Monitor for unauthorized usage

### Question: What if npm audit finds vulnerabilities?

```bash
# Try auto-fix first
npm audit fix

# If that doesn't work
npm update package-name

# If still not fixed
# Research if vulnerability affects your usage
# Consider alternative packages
# Document decision
```

---

**Remember**: Security is not optional. When in doubt, ask the security agent.

**Print this card** and keep it at your desk!

---

**Last Updated**: 2025-11-25
**Security Agent**: Active with VETO POWER
