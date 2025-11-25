# Mind Insurance App - Setup Checklist

## Environment Setup (Local Development)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Supabase account access

---

## 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd mindhouse-prodigy

# Install dependencies
npm install
```

---

## 2. Environment Variables Configuration

### CRITICAL SECURITY NOTE
**NEVER commit `.env` files to git.** Always use `.env.local` for sensitive data.

### Step 1: Create .env.local
```bash
# Copy template
cp .env.example .env.local
```

### Step 2: Fill in Credentials

Open `.env.local` and add your keys:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=<get-from-supabase-dashboard>

# For backend scripts only (DO NOT use in frontend)
SUPABASE_SERVICE_KEY=<get-from-supabase-dashboard>

# Optional: AI features
ANTHROPIC_API_KEY=<your-anthropic-key>
```

### Where to Find Keys

**Supabase Keys**:
1. Go to https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/settings/api
2. Copy "anon" key → `VITE_SUPABASE_ANON_KEY`
3. Copy "service_role" key → `SUPABASE_SERVICE_KEY` (for scripts only)

**Anthropic API Key**:
1. Go to https://console.anthropic.com/settings/keys
2. Create new key if needed
3. Copy to `ANTHROPIC_API_KEY`

---

## Security Fix - 2025-11-21

### What Happened
During Phase 1 security audit, `.env` file was discovered in git history with exposed API keys (Supabase service role key + Anthropic API key).

### Actions Taken
✅ Removed `.env` from git tracking
✅ Updated `.gitignore` to block all environment files
✅ Created `.env.example` template
✅ Created security incident report: SECURITY-INCIDENT-2025-11-21.md

### REQUIRED USER ACTION
**YOU MUST ROTATE THE FOLLOWING KEYS IMMEDIATELY**:
1. Supabase Service Role Key (https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/settings/api)
2. Anthropic API Key (https://console.anthropic.com/settings/keys)

See SECURITY-INCIDENT-2025-11-21.md for detailed instructions.

---

## Changelog

### 2025-11-21
- ✅ Created initial setup checklist
- ✅ Fixed `.gitignore` to include all `.env` variants
- ✅ Created `.env.example` template
- ✅ Removed `.env` from git tracking
- ✅ Documented security incident

---

**Status**: ✅ Ready for key rotation and continued development
**Last Updated**: 2025-11-21
