# Mind Insurance Standalone - Troubleshooting Agent

## Quick Start

Paste any support ticket and I'll automatically:
1. Identify the issue type (login/access/assessment/protocol/MIO/workflow)
2. Use **Chain of Thought** reasoning to hypothesize causes
3. Run diagnostic queries prioritized by probability
4. Provide the fix with exact commands
5. Log resolution to audit trail for pattern detection

---

## Senior Engineer Skills (Auto-Activate)

These skills activate automatically based on keywords. Each operates as a **Staff-level Engineer** with 15+ years experience.

| Skill | Triggers On | Expertise |
|-------|-------------|-----------|
| `ticket-resolver` | "can't log in", "access denied", "assessment", "practice" | Customer Support + Auth troubleshooting |
| `backend-diagnostician` | "database", "RLS", "query", "Supabase", "edge function" | PostgreSQL + Supabase architecture |
| `n8n-workflow-debugger` | "workflow", "N8n", "execution", "webhook", "chatbot" | Automation + API integration |
| `frontend-troubleshooter` | "component", "React", "UI", "error", "responsive" | React 18 + TypeScript strict |
| `mio-behavioral-analyst` | "pattern", "dropout", "breakthrough", "insight", "MIO" | **NEW** Forensic psychology + behavioral analysis |
| `protocol-debugger` | "protocol", "day advancement", "completion", "skip" | **NEW** 7-day protocol tracking |

**All skills include:**
- Chain of Thought reasoning protocol
- Multi-perspective analysis (User Impact / System Health / Prevention)
- WebSearch for latest documentation
- Audit trail logging to `support_ticket_logs`

---

## Slash Commands (Quick Access)

| Command | Example | Purpose |
|---------|---------|---------|
| `/check-user` | `/check-user john@example.com` | Full user access diagnostic |
| `/check-workflow` | `/check-workflow 0qiaQWEaDXbCxkhK` | N8n workflow status |
| `/diagnose` | `/diagnose assessment keeps restarting` | Multi-system diagnostic |
| `/analyze-patterns` | `/analyze-patterns` | Proactive pattern detection |
| `/check-mio` | `/check-mio USER_ID` | **NEW** MIO behavioral analysis |
| `/check-protocol` | `/check-protocol USER_ID` | **NEW** Protocol status check |

---

## Database Credentials

### Supabase REST API
```bash
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
BASE_URL="https://hpyodaugrkctagkrfofj.supabase.co"
```

### PostgreSQL Direct
```bash
PGPASSWORD='Nette@2025!' psql 'postgresql://postgres.hpyodaugrkctagkrfofj:Nette%402025%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
```

### N8n API
```bash
N8N_KEY="$N8N_API_KEY"
N8N_URL="https://n8n-n8n.vq00fr.easypanel.host"
```

---

## User Source Tag System (CRITICAL)

**Mind Insurance users are identified by**: `user_profiles.user_source = 'mi_standalone'`

| Tag Value | Meaning |
|-----------|---------|
| `'mi_standalone'` | Mind Insurance app users (mymindinsurance.com) |
| `'gh_user'` | Grouphome4newbies users |
| `'unknown'` | Legacy/unknown source |

**Always filter MI users with:**
```sql
SELECT * FROM user_profiles WHERE user_source = 'mi_standalone';
```

---

## N8n Workflows

| Workflow ID | Name | Trigger | Purpose |
|-------------|------|---------|---------|
| `0qiaQWEaDXbCxkhK` | **Unified Chat - MIO/Nette/ME Agents** | Webhook | **MAIN CHATBOT** - Routes to MIO, Nette, or ME agents |
| `56JoMTczqhHS3eME` | MIO Weekly Report Generator | Daily 6AM | Generate weekly insights for users |
| `Sp5RhDpa8xFPnlWI` | MIO Insights Reply | Webhook | Handle user replies to MIO insights |
| `niEwlbKoTiQF1sO9` | Protocol-Day-Advancement-Daily | Daily | Advance users to new protocol days |

### Main Chatbot Workflow (0qiaQWEaDXbCxkhK) - CRITICAL
**Flow**: Webhook → Extract User ID → Fetch Context (Profile, Assessments, Tactics, Practices) → Merge → Route to Agent → MIO/Nette/ME → Claude API → Knowledge Base → Chat Memory → Format Response → Respond

---

## Core Mind Insurance Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | Master user record | `user_source`, `challenge_start_date`, `current_day`, `collision_patterns`, `temperament` |
| `mio_weekly_protocols` | 7-day AI protocols | `user_id`, `day_tasks` (JSONB), `status`, `current_day`, `source` |
| `mio_protocol_completions` | Day completion tracking | `protocol_id`, `day_number`, `response_data`, `was_skipped` |
| `mio_insights_thread` | User insight threads | `user_id` (UNIQUE), `current_engagement_streak` |
| `mio_insights_messages` | MIO/user messages | `thread_id`, `role`, `section_type`, `reward_tier`, `quality_score` |
| `mio_knowledge_chunks` | RAG knowledge (250+ protocols) | `embedding` (vector), `category`, `applicable_patterns` |
| `mio_user_activity_tracking` | Inactivity detection | `user_id`, `inactive_days`, `is_at_risk`, `last_practice_at` |
| `mental_pillar_assessments` | Baseline/post assessments | `user_id`, `assessment_phase`, `pillar_scores`, `growth_deltas` |
| `mi_approved_users` | **MI Access Control** | `email`, `user_id`, `tier` (user/admin/super_admin), `is_active` |

### MI Access Control (IMPORTANT)

**Mind Insurance uses `mi_approved_users` table** (separate from Grouphome's `gh_approved_users`).

```sql
-- MI tier system (simpler than GH)
-- 'user' = standard access
-- 'admin' = user management, analytics
-- 'super_admin' = all admin features

-- Check if user is approved
SELECT mi_is_current_user_approved();

-- Get user's access details
SELECT mi_get_current_user_access();

-- Admin: Get all MI users
SELECT * FROM mi_admin_get_all_users();

-- Admin: Add/update/delete users
SELECT mi_admin_add_user(p_email, p_tier, p_full_name, p_phone, p_notes);
SELECT mi_admin_update_user(p_user_id, p_tier, p_is_active, ...);
SELECT mi_admin_delete_user(p_user_id);
```

---

## Common Support Tickets

### 1. "Can't log in" / "Can't access app"

**Root Causes:**
- User not in `mi_approved_users` table
- `user_id` not linked in `mi_approved_users`
- User exists in auth but hasn't completed signup

**Diagnostic Steps:**
```bash
# 1. Find user in auth.users
API_KEY="$SUPABASE_SERVICE_ROLE_KEY"
curl -s "$BASE_URL/auth/v1/admin/users?per_page=500" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | grep -i "EMAIL_HERE"

# 2. Check mi_approved_users (MI-specific access control)
curl -s "$BASE_URL/rest/v1/mi_approved_users?select=*&email=eq.EMAIL_HERE" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

# 3. Check user_profiles with user_source
curl -s "$BASE_URL/rest/v1/user_profiles?select=id,email,user_source,challenge_start_date&email=eq.EMAIL_HERE" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Fix: Add user to MI access list**
```bash
# Add user via REST API
curl -X POST "$BASE_URL/rest/v1/mi_approved_users" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "tier": "user", "is_active": true}'
```

---

### 2. "Protocol not advancing" / "Stuck on same day"

**Root Cause:** Protocol day advancement workflow not running or user data issue

**Diagnostic:**
```bash
# Check user's active protocol
curl -s "$BASE_URL/rest/v1/mio_weekly_protocols?select=*&user_id=eq.USER_ID&status=eq.active" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

# Check protocol completions
curl -s "$BASE_URL/rest/v1/mio_protocol_completions?select=*&user_id=eq.USER_ID&order=day_number.desc&limit=7" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

# Check N8n workflow execution
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=niEwlbKoTiQF1sO9&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

### 3. "MIO not responding" / "Chat broken"

**Root Cause:** Main chatbot workflow failure (API rate limit, credential issue, or user context missing)

**Diagnostic:**
```bash
# Check recent chatbot executions
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=0qiaQWEaDXbCxkhK&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"

# Check for errors
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=0qiaQWEaDXbCxkhK&status=error&limit=5" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

### 4. "Assessment keeps restarting"

**Root Cause:** Assessment completion not synced to `user_profiles`

**Diagnostic:**
```bash
# Check mental_pillar_assessments
curl -s "$BASE_URL/rest/v1/mental_pillar_assessments?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

# Check user_profiles mental pillar progress
curl -s "$BASE_URL/rest/v1/user_profiles?select=id,mental_pillar_progress&id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

---

### 5. "MIO insights not showing"

**Root Cause:** Insights thread not created or messages not delivered

**Diagnostic:**
```bash
# Check mio_insights_thread
curl -s "$BASE_URL/rest/v1/mio_insights_thread?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

# Check mio_insights_messages
curl -s "$BASE_URL/rest/v1/mio_insights_messages?select=*&user_id=eq.USER_ID&order=delivered_at.desc&limit=10" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

---

## Proactive Pattern Detection

Run `/analyze-patterns` daily to catch issues BEFORE users report them:

| Pattern | Detection | Alert Threshold |
|---------|-----------|-----------------|
| Orphaned Accounts | `mi_approved_users` with null `user_id` | Any records |
| Inactive MI Users | `mio_user_activity_tracking.inactive_days >= 2` | >10 users |
| Protocol Stalls | `mio_weekly_protocols` active but no completions in 3+ days | Any occurrence |
| Assessment Sync Gaps | `mental_pillar_assessments.completed_at` but `user_profiles.mental_pillar_progress` NULL | Any records |
| Chatbot Failures | N8n workflow `0qiaQWEaDXbCxkhK` errors in 24h | >3 failures |
| High Dropout Risk | `mio_user_activity_tracking.is_at_risk = TRUE` | >5 users |

---

## Key Helper Functions

```sql
-- Get active protocol for user
SELECT * FROM get_active_mio_protocol(user_id);

-- Get protocol with completion progress
SELECT * FROM get_protocol_with_progress(protocol_id);

-- Find users at milestones (7, 14, 21, 28 days)
SELECT * FROM get_group_users_at_milestone('mi_standalone', '{}'::jsonb, ARRAY[7,14,21,28]);

-- Search knowledge base with vector + pattern matching
SELECT * FROM search_mio_knowledge(query_embedding, filter_patterns, filter_temperament, max_time, match_count);
```

---

## Diagnostic Priority Order

When troubleshooting, always check in this order:

1. **User Source** - Is this an MI Standalone user? (`user_source = 'mi_standalone'`)
2. **Auth** - Does user exist in `auth.users`? Is email verified?
3. **Approval** - Is user in `mi_approved_users` with `is_active=true`?
4. **Link** - Does `mi_approved_users.user_id` match `auth.users.id`?
5. **Assessment** - Is `mental_pillar_assessments.completed_at` set?
6. **Protocol** - Does user have active `mio_weekly_protocols`?
7. **Activity** - Check `mio_user_activity_tracking` for inactivity

---

## Audit Trail Logging

All resolutions are logged to `support_ticket_logs` table:

```bash
curl -X POST "$BASE_URL/rest/v1/support_ticket_logs" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type": "TYPE",
    "user_email": "EMAIL",
    "issue_description": "DESCRIPTION",
    "systems_checked": ["auth.users", "mi_approved_users", "mio_weekly_protocols"],
    "findings": {"auth": "exists", "approved": "yes", "protocol": "missing"},
    "root_cause": "ROOT_CAUSE",
    "fix_applied": "FIX_DESCRIPTION",
    "resolved": true,
    "agent_skill": "SKILL_NAME"
  }'
```

---

## Deployment Safety (CRITICAL)

**NEVER deploy to production without explicit user permission.**

When deploying code changes:
- **ALWAYS** push to the `staging` Cloudflare branch using Wrangler
- **NEVER** push to production directly
- Use: `wrangler pages deploy --branch staging`
- Production deployments require explicit user approval

---

## Future Infrastructure Migration

### Database Migration (Planned)
- **Current**: `hpyodaugrkctagkrfofj.supabase.co` (shared with Grouphome)
- **Future**: `[NEW_PROJECT_ID].supabase.co` (dedicated Mind Insurance)
- **Action**: Update all `API_KEY` and `BASE_URL` references in skills

### N8n Migration (Planned)
- **Current**: `https://n8n-n8n.vq00fr.easypanel.host` (shared)
- **Future**: `[NEW_N8N_URL]` (dedicated Mind Insurance)
- **Action**: Update `N8N_KEY` and `N8N_URL` in workflow debugger skill

---

## Escalation

If issue cannot be resolved after diagnostic:
1. Document findings in ticket
2. Check recent deployments for regression
3. Review edge function logs: `npx supabase functions logs FUNCTION_NAME`
4. Check N8n execution history for workflow failures
5. Escalate to senior team with full diagnostic report
