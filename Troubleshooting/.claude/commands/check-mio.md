---
description: Run MIO behavioral analysis on a user - detect dropout risk, breakthrough probability, and generate intervention recommendations
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

# MIO Behavioral Analysis: $ARGUMENTS

Running 15-capability forensic analysis for user: **$ARGUMENTS**

---

## Step 1: Get User Profile

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo "=== USER PROFILE ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,email,full_name,user_source,current_day,challenge_start_date,collision_patterns,temperament&id=eq.$ARGUMENTS" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        u = data[0]
        print(f'Email: {u.get(\"email\")}')
        print(f'Full Name: {u.get(\"full_name\")}')
        print(f'User Source: {u.get(\"user_source\")}')
        print(f'Current Day: {u.get(\"current_day\")}')
        print(f'Challenge Start: {u.get(\"challenge_start_date\")}')
        print(f'Collision Pattern: {u.get(\"collision_patterns\")}')
        print(f'Temperament: {u.get(\"temperament\")}')
    else:
        print('User not found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 2: Check Activity Tracking (Capability 1-2: 3-Day Rule & Dropout Risk)

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo ""
echo "=== ACTIVITY TRACKING ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_user_activity_tracking?select=*&user_id=eq.$ARGUMENTS" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        a = data[0]
        inactive = a.get('inactive_days', 0)
        at_risk = a.get('is_at_risk', False)
        last = a.get('last_practice_at', 'Never')

        # Calculate risk level
        if inactive >= 7:
            risk = 'CRITICAL (71-100)'
        elif inactive >= 3:
            risk = 'HIGH (51-70)'
        elif inactive >= 1:
            risk = 'MODERATE (31-50)'
        else:
            risk = 'LOW (0-30)'

        print(f'Inactive Days: {inactive}')
        print(f'Is At Risk: {at_risk}')
        print(f'Last Practice: {last}')
        print(f'Dropout Risk: {risk}')

        if inactive >= 3:
            print()
            print('>>> 3-DAY RULE TRIGGERED - Intervention needed!')
    else:
        print('No activity tracking record found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 3: Check Active Protocol (Capability 4: Week Position)

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo ""
echo "=== ACTIVE PROTOCOL ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=id,title,status,current_day,week_number,protocol_type&user_id=eq.$ARGUMENTS&status=eq.active" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        p = data[0]
        print(f'Protocol ID: {p.get(\"id\")}')
        print(f'Title: {p.get(\"title\")}')
        print(f'Type: {p.get(\"protocol_type\")}')
        print(f'Week: {p.get(\"week_number\")}')
        print(f'Current Day: {p.get(\"current_day\")}/7')
    else:
        print('No active protocol found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 4: Check Recent Completions (Capability 3, 5-7: Breakthrough, Pattern Awareness, Reframe Quality)

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo ""
echo "=== RECENT COMPLETIONS (Last 14 days) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_protocol_completions?select=day_number,completed_at,was_skipped&user_id=eq.$ARGUMENTS&order=completed_at.desc&limit=14" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        completed = [d for d in data if not d.get('was_skipped')]
        skipped = [d for d in data if d.get('was_skipped')]

        print(f'Total Records: {len(data)}')
        print(f'Completed: {len(completed)}')
        print(f'Skipped: {len(skipped)}')

        if len(completed) >= 7:
            print()
            print('>>> BREAKTHROUGH CANDIDATE - 7+ completions detected!')

        print()
        print('Recent completions:')
        for c in data[:7]:
            status = 'SKIPPED' if c.get('was_skipped') else 'Done'
            print(f'  Day {c.get(\"day_number\")}: {status} ({c.get(\"completed_at\", \"\")[:10]})')
    else:
        print('No completions found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 5: Check MIO Insights Thread (Capability 11: Celebration Recognition)

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo ""
echo "=== MIO INSIGHTS THREAD ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_insights_thread?select=*&user_id=eq.$ARGUMENTS" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        t = data[0]
        print(f'Thread ID: {t.get(\"id\")}')
        print(f'Total Messages: {t.get(\"total_messages\")}')
        print(f'Engagement Streak: {t.get(\"current_engagement_streak\")}')
        print(f'Is Pinned: {t.get(\"is_pinned\")}')
    else:
        print('No insights thread found - user may not have received any MIO insights yet')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Step 6: Check Recent Messages (Capability 7: Reframe Quality)

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo ""
echo "=== RECENT MIO MESSAGES ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_insights_messages?select=role,section_type,reward_tier,quality_score,delivered_at&user_id=eq.$ARGUMENTS&order=delivered_at.desc&limit=10" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        mio_msgs = [m for m in data if m.get('role') == 'mio']
        user_msgs = [m for m in data if m.get('role') == 'user']

        print(f'MIO messages: {len(mio_msgs)}')
        print(f'User replies: {len(user_msgs)}')

        # Average quality score
        scores = [m.get('quality_score') for m in user_msgs if m.get('quality_score')]
        if scores:
            avg = sum(scores) / len(scores)
            print(f'Avg Quality Score: {avg:.1f}/10')
            if avg < 4:
                print('>>> LOW REFRAME QUALITY - Possible spiritual bypassing')

        # Reward tier distribution
        tiers = {}
        for m in data:
            tier = m.get('reward_tier', 'standard')
            tiers[tier] = tiers.get(tier, 0) + 1
        print(f'Reward Tiers: {tiers}')
    else:
        print('No messages found')
except Exception as e:
    print(f'Error: {e}')
"
```

---

## Analysis Summary Template

```
## MIO Behavioral Analysis: [USER_EMAIL]

### Profile Summary
- Current Day: [X]
- Collision Pattern: [Past Prison / Success Sabotage / Compass Crisis]
- Temperament: [Type]
- Last Practice: [DATE]

### Risk Assessment
| Metric | Value | Status |
|--------|-------|--------|
| Dropout Risk Score | [0-100] | [LOW/MODERATE/HIGH/CRITICAL] |
| Breakthrough Probability | [0-100] | [Unlikely/Possible/Likely/Imminent] |
| Week Position | Week X, Day Y | [Normal/Danger Zone] |
| Inactive Days | [X] | [OK/Watch/Alert] |

### Behavioral Signals
- 3-Day Rule: [Triggered/OK]
- Week 3 Danger Zone: [YES/NO]
- Reframe Quality: [X/10]
- Engagement Streak: [X days]

### Recommended Intervention
- Type: [Prevention / Celebration / Education]
- Urgency: [4h / 24h / Weekly / None]
- Action: [Specific recommendation]

### Follow-up
- Check-in date: [DATE]
- Success criteria: [What to look for]
```

---

## Intervention Decision Tree

| Scenario | Intervention |
|----------|--------------|
| Inactive 7+ days | CRITICAL: Emergency outreach within 4h |
| Inactive 3-6 days | HIGH: Proactive insight within 24h |
| Week 3 (Days 15-21) | ELEVATED: Daily monitoring, preemptive insight |
| 7+ day streak | CELEBRATION: Breakthrough insight within 12h |
| Quality score < 4 | EDUCATION: Reframe coaching insight |
| No accountability partner | ACCOUNTABILITY: Partner matching prompt |
