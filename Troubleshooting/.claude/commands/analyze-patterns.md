---
description: Proactively detect system issues before users report them - Pattern Detection for Preventive Support (Mind Insurance)
allowed-tools: Bash, Read, Grep, WebSearch
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

# Pattern Analysis Report - Mind Insurance

Running proactive system health scan for Mind Insurance users...

---

## Step 1: Detect Orphaned Accounts (Critical)

Users in `gh_approved_users` without linked `user_id` - they can't access the app:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo "=== ORPHANED ACCOUNTS (Critical - No user_id linked) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/gh_approved_users?select=email,full_name,approved_at,tier&user_id=is.null&is_active=eq.true&order=approved_at.desc" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Found {len(data)} orphaned accounts:')
        for u in data:
            print(f'  - {u.get(\"email\")} ({u.get(\"full_name\")}) - approved {u.get(\"approved_at\", \"unknown\")[:10]}')
        print()
        print('FIX: Run /check-user [email] to link each user')
    else:
        print('No orphaned accounts found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 2: Detect At-Risk Users (High Dropout Risk)

Mind Insurance users with high inactivity (3+ days):

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== AT-RISK USERS (Inactive 3+ days) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_user_activity_tracking?select=user_id,inactive_days,is_at_risk,last_practice_at&inactive_days=gte.3&order=inactive_days.desc&limit=20" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Found {len(data)} at-risk users:')
        for u in data:
            risk = 'HIGH RISK' if u.get('is_at_risk') else 'Watch'
            print(f'  - User {u.get(\"user_id\", \"unknown\")[:8]}... - {u.get(\"inactive_days\")} days inactive [{risk}]')
        print()
        print('ACTION: Run /check-mio [user_id] for behavioral analysis')
    else:
        print('No at-risk users found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 3: Week 3 Danger Zone Users

Users in Days 15-21 (highest dropout period):

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== WEEK 3 DANGER ZONE (Days 15-21) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,email,current_day&user_source=eq.mi_standalone&current_day=gte.15&current_day=lte.21&order=current_day" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Found {len(data)} users in danger zone:')
        for u in data:
            print(f'  - {u.get(\"email\")} - Day {u.get(\"current_day\")}')
        print()
        print('NOTE: These users need extra attention - 60% dropout rate in Week 3')
    else:
        print('No users in Week 3 danger zone')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 4: N8n Workflow Failures (Warning)

Recent workflow execution errors:

```bash
N8N_KEY="$N8N_API_KEY"
echo ""
echo "=== N8N WORKFLOW FAILURES (Last 24h) ==="
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?status=error&limit=20" \
  -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys, json
from datetime import datetime, timezone
try:
    data = json.load(sys.stdin)
    executions = data.get('data', [])
    # Filter to last 24h
    recent = []
    now = datetime.now(timezone.utc)
    for e in executions:
        stopped = e.get('stoppedAt', '')
        if stopped:
            try:
                dt = datetime.fromisoformat(stopped.replace('Z', '+00:00'))
                hours_ago = (now - dt).total_seconds() / 3600
                if hours_ago <= 24:
                    recent.append((e, hours_ago))
            except:
                pass

    if recent:
        print(f'Found {len(recent)} failed executions in last 24h:')
        for e, hours in recent:
            wf_id = e.get('workflowId', 'unknown')
            exec_id = e.get('id', 'unknown')
            print(f'  - Execution {exec_id} (workflow {wf_id}) - {hours:.1f}h ago')
        print()
        print('FIX: Run /check-workflow [workflow_id] for details')
    else:
        print('No workflow failures in last 24h')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 5: Protocol Stalls (Monitor)

Users with active protocols but no completions in 3+ days:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== STALLED PROTOCOLS (Active but no activity) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=id,user_id,current_day,status,updated_at&status=eq.active&order=updated_at.asc&limit=10" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
from datetime import datetime, timezone
try:
    data = json.load(sys.stdin)
    if data:
        print(f'Active protocols (oldest first):')
        for p in data:
            updated = p.get('updated_at', '')[:10] if p.get('updated_at') else 'unknown'
            print(f'  - User {p.get(\"user_id\", \"unknown\")[:8]}... - Day {p.get(\"current_day\")} - Last update: {updated}')
        print()
        print('NOTE: Check if these users need intervention')
    else:
        print('No active protocols found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 6: Assessment Sync Gaps

Users with completed assessments but missing profile sync:

```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "=== ASSESSMENT SYNC GAPS ==="
echo "Checking for users with completed assessments but missing profile data..."
# This would require a join query - shown as example
echo "(Run manual query if needed to check mental_pillar_assessments vs user_profiles.mental_pillar_progress)"
```

---

## Summary Report

After running all checks, summarize:

### Report Format

```
## Pattern Analysis Report - [DATE]

### Critical Issues (Immediate Action Required)
- [ ] Orphaned accounts: X users need user_id linked
- [ ] Workflow failures: X executions failed

### High Priority (Action within 24h)
- [ ] At-risk users: X users inactive 3+ days
- [ ] Week 3 danger zone: X users in Days 15-21

### Monitor (Track for Trends)
- [ ] Stalled protocols: X users with stale protocols
- [ ] Assessment gaps: X users with sync issues

### Recommended Actions
1. [First priority action]
2. [Second priority action]
...
```

---

## Quick Fixes Reference

| Issue | Quick Fix |
|-------|-----------|
| Orphaned account | `/check-user [email]` then link user_id |
| At-risk user | `/check-mio [user_id]` for intervention |
| Week 3 user | Proactive MIO insight delivery |
| N8n failure | `/check-workflow [id]` then retry or fix |
| Protocol stall | `/check-protocol [user_id]` then advance if needed |
