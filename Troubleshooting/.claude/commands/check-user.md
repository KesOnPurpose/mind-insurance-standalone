---
description: Run complete user access diagnostic across auth.users, mi_approved_users, user_profiles, and protocols for Mind Insurance users
allowed-tools: Bash, Read, Grep
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

# Check User Access: $ARGUMENTS

Running complete diagnostic for Mind Insurance user: **$ARGUMENTS**

## Step 1: Find user in auth.users

Search for the user in Supabase authentication:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/admin/users?per_page=500" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
users = json.load(sys.stdin).get('users', [])
search = '$ARGUMENTS'.lower()
matches = [u for u in users if search in u.get('email', '').lower() or search in (u.get('user_metadata', {}).get('full_name', '') or '').lower()]
if matches:
    for u in matches:
        print(f\"Found in auth.users:\")
        print(f\"  ID: {u['id']}\")
        print(f\"  Email: {u['email']}\")
        print(f\"  Verified: {u.get('email_confirmed_at') is not None}\")
        print(f\"  Created: {u.get('created_at')}\")
        print(f\"  Provider: {u.get('app_metadata', {}).get('provider', 'email')}\")
        print()
else:
    print('NOT FOUND in auth.users')
"
```

## Step 2: Check mi_approved_users (MI Access Control)

Check if user is in the MI approval list:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mi_approved_users?select=*&or=(email.ilike.*$ARGUMENTS*,full_name.ilike.*$ARGUMENTS*)" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
results = json.load(sys.stdin)
if results:
    for r in results:
        print(f\"Found in mi_approved_users:\")
        print(f\"  ID: {r.get('id')}\")
        print(f\"  Email: {r.get('email')}\")
        print(f\"  Full Name: {r.get('full_name')}\")
        print(f\"  user_id (FK): {r.get('user_id')}\")
        print(f\"  Tier: {r.get('tier')} (user/admin/super_admin)\")
        print(f\"  is_active: {r.get('is_active')}\")
        print(f\"  Approved at: {r.get('approved_at')}\")
        print(f\"  Last access: {r.get('last_access_at')}\")
        print()
else:
    print('NOT FOUND in mi_approved_users')
"
```

## Step 3: Check user_profiles (Mind Insurance)

Check if user is a Mind Insurance user:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,full_name,email,user_source,current_day,challenge_start_date,collision_patterns,temperament&or=(email.ilike.*$ARGUMENTS*,full_name.ilike.*$ARGUMENTS*)" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
results = json.load(sys.stdin)
if results:
    for r in results:
        is_mi = r.get('user_source') == 'mi_standalone'
        print(f\"Found in user_profiles:\")
        print(f\"  ID: {r.get('id')}\")
        print(f\"  Email: {r.get('email')}\")
        print(f\"  Full Name: {r.get('full_name')}\")
        print(f\"  User Source: {r.get('user_source')} {'(Mind Insurance)' if is_mi else '(NOT Mind Insurance)'}\")
        print(f\"  Current Day: {r.get('current_day')}\")
        print(f\"  Challenge Start: {r.get('challenge_start_date')}\")
        print(f\"  Collision Pattern: {r.get('collision_patterns')}\")
        print(f\"  Temperament: {r.get('temperament')}\")
        print()
else:
    print('NOT FOUND in user_profiles')
"
```

## Step 4: Check active protocol

```bash
# Note: Replace USER_ID with the actual user_id from previous steps
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo "Query mio_weekly_protocols with the user_id found above"
# Example: curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=*&user_id=eq.USER_ID&status=eq.active" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

---

## Summary Report Template

```
## User Access Diagnostic: $ARGUMENTS

### 1. Auth Status
- [ ] Exists in auth.users
- [ ] Email verified
- [ ] User ID: _______________

### 2. MI Approval Status
- [ ] Exists in mi_approved_users
- [ ] is_active = true
- [ ] user_id linked correctly
- [ ] Tier: _______________ (user/admin/super_admin)

### 3. Mind Insurance Status
- [ ] user_source = 'mi_standalone'
- [ ] Challenge started
- [ ] Current Day: _______________

### 4. Protocol Status
- [ ] Has active protocol
- [ ] Protocol current_day: _______________

### Issues Found
[List any problems discovered]

### Recommended Fix
[Commands to fix the issue]
```

## Common Fixes

### If NOT in mi_approved_users:
```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mi_approved_users" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "EMAIL", "full_name": "NAME", "tier": "user", "is_active": true, "user_id": "AUTH_USER_ID"}'
```

### If user_id not linked:
```bash
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mi_approved_users?email=eq.EMAIL" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"user_id": "AUTH_USER_ID"}'
```
