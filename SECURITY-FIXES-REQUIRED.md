# SECURITY FIXES REQUIRED - IMMEDIATE ACTION

**Date**: 2025-11-25
**Priority**: CRITICAL - DEPLOYMENT BLOCKED
**Security Agent**: VETO POWER ACTIVE

---

## DEPLOYMENT STATUS: BLOCKED

**Reason**: 2 CRITICAL security issues detected during security audit

**Cannot deploy until ALL critical issues are resolved.**

---

## CRITICAL-001: Hardcoded JWT Token in TestSSE.tsx

### Issue Details

**File**: `/src/pages/TestSSE.tsx`
**Line**: 68
**Severity**: CRITICAL
**Type**: Secret Exposure (OWASP A07)

### Current Code (INSECURE)

```typescript
// Line 68 in TestSSE.tsx
'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODY2MjIsImV4cCI6MjA3NDM2MjYyMn0.COFyvu_J-FnwTjbPCzi2v7yVR9cLWcg_sodKRV_Wlvs`,
```

### Required Fix

Replace hardcoded token with environment variable:

```typescript
// At top of file
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In fetch call (line 68)
'Authorization': `Bearer ${supabaseAnonKey}`,
```

### Impact if Not Fixed

- Supabase anon key exposed in source code
- Could be extracted from GitHub repository
- Enables potential unauthorized access to Supabase project
- Violates enterprise security standards

### How to Fix

1. Open `/src/pages/TestSSE.tsx`
2. Add at top of file (after imports):
   ```typescript
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   if (!supabaseAnonKey) {
     throw new Error('VITE_SUPABASE_ANON_KEY is not configured');
   }
   ```
3. Replace line 68 with:
   ```typescript
   'Authorization': `Bearer ${supabaseAnonKey}`,
   ```
4. Ensure `.env.local` contains:
   ```bash
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Test the functionality still works
6. Commit the change

**Estimated Time**: 5 minutes

---

## CRITICAL-002: Hardcoded Anthropic API Key

### Issue Details

**File**: `/glossary-extraction/.env`
**Line**: 1
**Severity**: CRITICAL
**Type**: Secret Exposure (OWASP A02)

### Current Code (INSECURE)

```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

### Impact if Not Fixed

- Anthropic API key exposed in repository
- Potential unauthorized API usage (financial cost)
- Key may be committed to version control history
- Security breach if repository is public or compromised

### Required Actions (IMMEDIATE)

**Step 1: Rotate the API Key**
1. Log in to Anthropic Console: https://console.anthropic.com/
2. Navigate to API Keys section
3. **REVOKE** the exposed key: `sk-ant-api03-jLqGuVmr1Vu_IBznaGAUMwe-...`
4. Generate a NEW API key
5. Store new key securely (NOT in repository)

**Step 2: Remove from Repository**
1. Delete the file:
   ```bash
   rm glossary-extraction/.env
   ```

2. Add to `.gitignore`:
   ```bash
   echo "glossary-extraction/.env" >> .gitignore
   ```

3. Create `.env.example`:
   ```bash
   # glossary-extraction/.env.example
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   ```

**Step 3: Clean Git History (if committed)**
```bash
# Check if .env was committed
git log --all --full-history -- "glossary-extraction/.env"

# If found, remove from history (coordinate with team first)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch glossary-extraction/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CAUTION: coordinate with team)
git push --force --all
```

**Step 4: Monitor for Unauthorized Usage**
1. Check Anthropic usage dashboard for unexpected API calls
2. Review recent activity for the OLD key
3. Set up billing alerts if available

**Estimated Time**: 15 minutes (+ monitoring time)

---

## HIGH-001: Run npm Audit

### Issue Details

**Severity**: HIGH
**Type**: Unknown Vulnerabilities

### Current State

npm audit was not successfully run during security audit due to npm not being available in the audit environment.

### Required Actions

1. Run npm audit locally:
   ```bash
   cd /Users/kesonpurpose/Downloads/UIB\ ASSETS/Cursor\ App\ Build/Grouphome\ App\ LOVABLE/mindhouse-prodigy
   npm audit --production
   ```

2. Review output for HIGH/CRITICAL vulnerabilities

3. If vulnerabilities found:
   ```bash
   # Try automatic fix
   npm audit fix

   # If manual fixes needed
   npm audit fix --force  # (may include breaking changes)
   ```

4. Document results in `Context/SECURITY-CHECKLIST.md`

5. If HIGH/CRITICAL vulnerabilities cannot be fixed:
   - Research alternative packages
   - Assess if vulnerability affects your usage
   - Create mitigation plan
   - Document decision

**Estimated Time**: 30 minutes + fix time

---

## VERIFICATION CHECKLIST

After fixing all issues, verify:

```bash
# 1. No hardcoded secrets
grep -r "eyJ" src/ --include="*.ts" --include="*.tsx"
grep -r "sk-ant-api" . --exclude-dir=node_modules

# 2. TypeScript compiles
npx tsc --noEmit

# 3. No HIGH/CRITICAL vulnerabilities
npm audit --audit-level=high

# 4. Gitleaks passes (if installed)
gitleaks detect --config .gitleaksrc.toml --no-git

# 5. ESLint passes
npm run lint
```

**All checks must pass before requesting security agent re-approval.**

---

## RE-APPROVAL PROCESS

### After Fixing All Issues

1. Run verification checklist above
2. Document fixes in commit message:
   ```
   security: Fix CRITICAL hardcoded secrets

   - Remove hardcoded JWT from TestSSE.tsx (CRITICAL-001)
   - Rotate and secure Anthropic API key (CRITICAL-002)
   - Run npm audit and fix vulnerabilities (HIGH-001)
   - Add security scanning infrastructure

   Security audit results:
   - npm audit: 0 HIGH/CRITICAL
   - Gitleaks: PASS
   - TypeScript: PASS
   - ESLint: PASS

   Ready for security agent re-review.
   ```

3. Request re-review from security agent

4. **DO NOT DEPLOY** until security agent removes VETO

---

## TIMELINE

**Target Resolution**: Within 1 hour

**Breakdown**:
- CRITICAL-001 fix: 5 minutes
- CRITICAL-002 fix: 15 minutes
- HIGH-001 audit: 30 minutes
- Verification: 10 minutes
- **Total**: ~60 minutes

---

## ADDITIONAL SECURITY INFRASTRUCTURE ADDED

The following files have been created to prevent future issues:

1. **Context/SECURITY-CHECKLIST.md** - Comprehensive security audit report
2. **package.json** - Added security scripts
3. **.gitleaksrc.toml** - Secret detection configuration
4. **.github/workflows/security-scan.yml** - Automated CI/CD security scanning
5. **.husky/pre-commit** - Pre-commit security hooks
6. **SECURITY-README.md** - Security setup documentation
7. **This file** - Immediate action items

---

## NEXT STEPS AFTER FIXES

1. Set up Husky for pre-commit hooks:
   ```bash
   npm install --save-dev husky
   npx husky install
   chmod +x .husky/pre-commit
   ```

2. Install Gitleaks:
   ```bash
   brew install gitleaks
   ```

3. Enable GitHub Actions:
   - Push `.github/workflows/security-scan.yml` to repository
   - Verify workflow runs successfully

4. Schedule weekly security reviews:
   - Monday: Run `npm run security:check`
   - Update dependencies with security patches
   - Review Dependabot alerts (if enabled)

---

## CONTACT

**Questions or Issues?**
- Review `SECURITY-README.md` for detailed documentation
- Check `Context/SECURITY-CHECKLIST.md` for full audit results
- Refer to `Context/AGENT-SECURITY-AUDITOR.md` for security protocols

**Security Agent**: Standing by for re-review after fixes

---

**REMEMBER**: Do NOT attempt to deploy or push to production until:
- [ ] CRITICAL-001 fixed (JWT removed)
- [ ] CRITICAL-002 fixed (Anthropic key rotated)
- [ ] HIGH-001 complete (npm audit run)
- [ ] Verification checklist passes
- [ ] Security agent removes VETO

**Current Status**: DEPLOYMENT BLOCKED by Security Agent VETO

**Last Updated**: 2025-11-25
