---
description: Check protocol status and completion history for a Mind Insurance user - diagnose day advancement issues, stalled protocols, and completion problems
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

# Protocol Status Check: $ARGUMENTS

Running protocol diagnostic for user: **$ARGUMENTS**

---

## Step 1: Get User Profile

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo "=== USER PROFILE ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,email,current_day,challenge_start_date,user_source&id=eq.$ARGUMENTS" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        u = data[0]
        is_mi = u.get('user_source') == 'mi_standalone'
        print(f'User ID: {u.get(\"id\")}')
        print(f'Email: {u.get(\"email\")}')
        print(f'User Source: {u.get(\"user_source\")} {\"(Mind Insurance)\" if is_mi else \"(NOT Mind Insurance)\"}')
        print(f'Global Current Day: {u.get(\"current_day\")}')
        print(f'Challenge Start: {u.get(\"challenge_start_date\")}')
    else:
        print('User not found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 2: Get Active Protocol

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== ACTIVE PROTOCOL ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=*&user_id=eq.$ARGUMENTS&status=eq.active" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        p = data[0]
        print(f'Protocol ID: {p.get(\"id\")}')
        print(f'Title: {p.get(\"title\")}')
        print(f'Type: {p.get(\"protocol_type\")}')
        print(f'Week Number: {p.get(\"week_number\")}')
        print(f'Current Day: {p.get(\"current_day\")}/7')
        print(f'Status: {p.get(\"status\")}')
        print(f'Source: {p.get(\"source\")}')
        print(f'Muted by Coach: {p.get(\"muted_by_coach\")}')
        print(f'Created: {p.get(\"created_at\")[:10] if p.get(\"created_at\") else \"unknown\"}')
        print(f'Updated: {p.get(\"updated_at\")[:10] if p.get(\"updated_at\") else \"unknown\"}')
    else:
        print('NO ACTIVE PROTOCOL FOUND')
        print('>>> User may need a new protocol assigned')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 3: Get Protocol History

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== PROTOCOL HISTORY (Last 5) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=id,title,status,current_day,week_number,created_at&user_id=eq.$ARGUMENTS&order=created_at.desc&limit=5" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Found {len(data)} protocols:')
        print()
        print(f'{\"Week\":<6} {\"Status\":<12} {\"Day\":<5} {\"Title\":<40} {\"Created\":<12}')
        print('-' * 80)
        for p in data:
            week = p.get('week_number', '?')
            status = p.get('status', 'unknown')
            day = f\"{p.get('current_day', '?')}/7\"
            title = (p.get('title') or 'Untitled')[:38]
            created = p.get('created_at', '')[:10]
            print(f'{week:<6} {status:<12} {day:<5} {title:<40} {created:<12}')
    else:
        print('No protocols found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 4: Get Completions for Active Protocol

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== PROTOCOL COMPLETIONS ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_protocol_completions?select=*&user_id=eq.$ARGUMENTS&order=completed_at.desc&limit=14" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Found {len(data)} completions:')
        print()
        completed = [d for d in data if not d.get('was_skipped')]
        skipped = [d for d in data if d.get('was_skipped')]
        print(f'Completed: {len(completed)}')
        print(f'Skipped: {len(skipped)}')
        print()
        print(f'{\"Day\":<5} {\"Status\":<10} {\"Completed At\":<25} {\"Protocol ID\":<36}')
        print('-' * 80)
        for c in data:
            day = c.get('day_number', '?')
            status = 'SKIPPED' if c.get('was_skipped') else 'Done'
            completed_at = c.get('completed_at', 'unknown')[:19]
            protocol_id = c.get('protocol_id', 'unknown')[:36]
            print(f'{day:<5} {status:<10} {completed_at:<25} {protocol_id:<36}')
    else:
        print('No completions found')
        print('>>> User has not completed any protocol days')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 5: Check Day Advancement Workflow

```bash
N8N_KEY="$N8N_API_KEY"
echo ""
echo "=== DAY ADVANCEMENT WORKFLOW (niEwlbKoTiQF1sO9) ==="
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=niEwlbKoTiQF1sO9&limit=5" \
  -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    execs = data.get('data', [])
    if execs:
        print(f'Recent executions:')
        for e in execs:
            status = e.get('status', 'unknown')
            started = e.get('startedAt', 'unknown')[:19]
            print(f'  [{status}] {started}')
    else:
        print('No recent executions found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Diagnostic Summary Template

```
## Protocol Diagnostic: [USER_EMAIL]

### Current State
- Has Active Protocol: [YES/NO]
- Protocol ID: [ID]
- Protocol Day: [X]/7
- Week Number: [X]
- Status: [active/completed/skipped/muted/expired]

### Completion Summary
| Day | Status |
|-----|--------|
| 1 | [Done/Pending/Skipped] |
| 2 | [Done/Pending/Skipped] |
| 3 | [Done/Pending/Skipped] |
| 4 | [Done/Pending/Skipped] |
| 5 | [Done/Pending/Skipped] |
| 6 | [Done/Pending/Skipped] |
| 7 | [Done/Pending/Skipped] |

### Issue Identified
[Description or "No issues found"]

### Root Cause
- [ ] No active protocol assigned
- [ ] Day advancement workflow not running
- [ ] Completion not saved
- [ ] Protocol muted by coach
- [ ] Protocol expired
- [ ] Other: [Describe]

### Recommended Fix
[Specific action to take]
```

---

## Common Fixes

### Fix 1: Manually Advance Day
```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?id=eq.PROTOCOL_ID" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"current_day": NEW_DAY_NUMBER}'
```

### Fix 2: Mark Completion Manually
```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_protocol_completions" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "protocol_id": "PROTOCOL_ID",
    "user_id": "USER_ID",
    "day_number": DAY_NUMBER,
    "completed_at": "2025-01-01T12:00:00Z",
    "response_data": {},
    "was_skipped": false
  }'
```

### Fix 3: Complete Protocol (Mark as Done)
```bash
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?id=eq.PROTOCOL_ID" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Fix 4: Unmute Protocol
```bash
curl -X PATCH "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?id=eq.PROTOCOL_ID" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"muted_by_coach": false, "status": "active"}'
```
