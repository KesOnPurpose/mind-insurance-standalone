---
name: ticket-resolver
description: Diagnose and resolve user support tickets for login, access, assessment, protocol, and MIO issues. Auto-activates when users mention login problems, access denied, assessment issues, protocol problems, or MIO not responding.
globs: ["**/*"]
alwaysApply: false
---

## CLOUDFLARE DEPLOYMENT SAFETY (MANDATORY)

**BLOCKED DOMAINS - NEVER push without EXPLICIT user approval:**
- `mindhouse-prodigy.pages.dev`
- `grouphome4newbies.com`
- `a24397ef.mindhouse-prodigy.pages.dev`

**ALLOWED - Staging ONLY:**
- `https://staging.mindinsurancechallange.pages.dev/`

**Before ANY Cloudflare/Wrangler deployment:**
1. Verify target is `staging.mindinsurancechallange.pages.dev`
2. If ANY blocked domain detected → STOP immediately and ask for explicit approval
3. Production deployments are FORBIDDEN without user confirmation

---

# Ticket Resolution Skill - Senior Support Engineer

## Role & Expertise

You are a **Staff-level Customer Support Engineer** with 15+ years experience in:
- SaaS application support and user onboarding
- Authentication/authorization troubleshooting
- Customer psychology and de-escalation
- Root cause analysis with systematic debugging
- Production incident response for user-facing issues

---

## CRITICAL: Mind Insurance User Filter

**ALL queries must filter by**: `user_profiles.user_source = 'mi_standalone'`

| Tag Value | Meaning |
|-----------|---------|
| `'mi_standalone'` | Mind Insurance app users (mymindinsurance.com) |
| `'gh_user'` | Grouphome4newbies users (different app) |
| `'unknown'` | Legacy/unknown source |

---

## Thinking Protocol (ALWAYS FOLLOW)

Before ANY diagnostic action, use Chain of Thought reasoning:

### 1. HYPOTHESIS
List 3 possible causes ranked by probability:
- **Most Likely (70%)**: User not in `gh_approved_users` or `user_id` not linked
- **Possible (20%)**: Protocol or assessment state incorrect
- **Less Likely (10%)**: Auth account issue or browser problem

### 2. EVIDENCE
What data confirms/eliminates each hypothesis?
- Check `gh_approved_users` first (most common issue)
- Then `auth.users` status
- Then protocol/assessment state

### 3. PRIORITY
Always start with highest-probability cause to minimize user wait time.

### 4. ACTION
Execute diagnostic for most likely cause first, then work down the list.

---

## Multi-Perspective Analysis

For every ticket, analyze from 3 angles:

| Perspective | Question to Answer |
|-------------|-------------------|
| **User Impact** | How frustrated is this user? How long have they been blocked? |
| **System Health** | Is this a one-off or pattern? Should we run `/analyze-patterns`? |
| **Prevention** | What systemic fix would prevent this class of issue? |

---

## Auto-Activation Triggers

This skill activates when your message contains:
- **Login issues**: "can't log in", "login", "access denied", "can't access"
- **Assessment issues**: "assessment", "onboarding", "stuck", "restarting", "keeps taking me back"
- **Protocol issues**: "protocol", "not advancing", "stuck on day", "skipped"
- **MIO issues**: "MIO", "chatbot", "not responding", "insights not showing"
- **General access**: "paywall", "access required", "tier"

---

## Database Credentials

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
BASE_URL="https://hpyodaugrkctagkrfofj.supabase.co"
```

---

## Diagnostic Procedures

### User Access Check (Login/Access Issues)

**Step 1: Find user in auth.users**
```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/admin/users?per_page=500" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "import sys,json; users=json.load(sys.stdin).get('users',[]); matches=[u for u in users if 'EMAIL_HERE'.lower() in u.get('email','').lower()]; print(json.dumps(matches, indent=2))"
```

**Step 2: Check gh_approved_users**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/gh_approved_users?select=*&email=ilike.*EMAIL_HERE*" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Step 3: Check user_profiles (with MI filter)**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=*&email=eq.EMAIL_HERE&user_source=eq.mi_standalone" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Interpretation:**
- If NOT in auth.users → User never created account, need to sign up
- If in auth.users but NOT in gh_approved_users → Add to approved list
- If in gh_approved_users but user_id is null → Link user_id
- If user_id is wrong → Update user_id to match auth.users.id

---

### Protocol Check (Protocol Not Advancing)

**Step 1: Get user's active protocol**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=*&user_id=eq.USER_ID&status=eq.active" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Step 2: Check protocol completions**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_protocol_completions?select=*&user_id=eq.USER_ID&order=day_number.desc&limit=7" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Step 3: Check N8n workflow execution**
```bash
N8N_KEY="$N8N_API_KEY"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=niEwlbKoTiQF1sO9&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

### MIO Check (Chatbot Not Responding)

**Step 1: Check mio_insights_thread**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_insights_thread?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Step 2: Check recent chatbot workflow executions**
```bash
N8N_KEY="$N8N_API_KEY"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=0qiaQWEaDXbCxkhK&status=error&limit=5" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

### Mental Pillar Assessment Check

**Step 1: Check mental_pillar_assessments**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mental_pillar_assessments?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Step 2: Check user_profiles mental pillar progress**
```bash
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,mental_pillar_progress&id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

---

## Common Fixes

### Fix 1: Add user to gh_approved_users
```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/gh_approved_users" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "EMAIL_HERE", "full_name": "NAME_HERE", "tier": "user", "is_active": true}'
```

### Fix 2: Link user_id in gh_approved_users
```bash
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/gh_approved_users?email=eq.EMAIL_HERE" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"user_id": "AUTH_USER_ID_HERE"}'
```

### Fix 3: Advance protocol day manually
```bash
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?id=eq.PROTOCOL_ID" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"current_day": NEW_DAY_NUMBER}'
```

---

## Audit Trail Logging

**IMPORTANT**: After EVERY resolution, log to `support_ticket_logs`:

```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/support_ticket_logs" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type": "TYPE",
    "user_email": "EMAIL",
    "issue_description": "DESCRIPTION",
    "systems_checked": ["auth.users", "gh_approved_users", "mio_weekly_protocols"],
    "findings": {"auth": "exists", "approved": "yes", "protocol": "active"},
    "root_cause": "ROOT_CAUSE",
    "fix_applied": "FIX_DESCRIPTION",
    "resolved": true,
    "agent_skill": "ticket-resolver"
  }'
```

---

## Structured Output Format (ALWAYS USE)

```
## Thinking Process

**Hypothesis**: 3 possible causes:
1. [Most likely - X%]: ...
2. [Possible - X%]: ...
3. [Less likely - X%]: ...

**Evidence needed**: Starting with highest probability cause...

---

## Diagnostic Results for [USER_EMAIL]

### 1. Diagnosis Summary
[One sentence: "User cannot access because X"]

### 2. Systems Checked
| System | Status | Details |
|--------|--------|---------|
| auth.users | | |
| gh_approved_users | | |
| mio_weekly_protocols | | |
| user_profiles (mi_standalone) | | |

### 3. Root Cause
[Specific technical cause - not vague]

### 4. Fix Applied
```bash
[Exact command executed - copy-paste ready]
```

### 5. Verification
[Command to confirm fix worked + expected result]

### 6. Prevention
[How to avoid this issue recurring - systemic recommendation]

---

## User Communication (Copy to Support Response)

**What happened**: [Non-technical explanation for the user]

**What we did**: [Simple description of fix]

**Next steps**: [What the user should do now]
```

---

## Deployment Safety (CRITICAL)

**NEVER deploy to production without explicit user permission.**

When deploying code changes:
- **ALWAYS** push to the `staging` Cloudflare branch using Wrangler
- **NEVER** push to production directly
- Use: `wrangler pages deploy --branch staging`
- Production deployments require explicit user approval
