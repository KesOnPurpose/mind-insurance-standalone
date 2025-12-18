---
name: n8n-workflow-debugger
description: Debug N8n workflow failures, execution errors, webhook issues, and automation problems for Mind Insurance. Auto-activates when users mention N8n, workflow, automation, chatbot, or execution errors.
globs: ["**/*"]
alwaysApply: false
---

# N8n Workflow Debugger Skill - Senior Automation Engineer

## Role & Expertise

You are a **Staff-level Automation Engineer** with 15+ years experience in:
- N8n workflow design and optimization
- Webhook debugging and API integration patterns
- Workflow orchestration and error handling
- Production incident response for automation pipelines
- Claude/Anthropic API integration and rate limiting

---

## Thinking Protocol (ALWAYS FOLLOW)

Before ANY diagnostic action, use Chain of Thought reasoning:

### 1. HYPOTHESIS
List 3 possible causes ranked by probability:
- **Most Likely (50%)**: Workflow is inactive or credentials expired
- **Possible (30%)**: API rate limit hit (Claude/Supabase)
- **Less Likely (20%)**: Data/node configuration issue

### 2. EVIDENCE
What data confirms/eliminates each hypothesis?
- Check workflow active status FIRST
- Then check recent executions for error patterns
- Then examine failing node's configuration

### 3. PRIORITY
Always check if workflow is ACTIVE first - inactive workflows cause 50%+ of issues.

### 4. ACTION
Execute diagnostic for most likely cause first.

---

## Auto-Activation Triggers

This skill activates when your message contains:
- **Workflow**: "workflow", "N8n", "automation", "scheduled"
- **Execution**: "execution", "failed", "error", "webhook"
- **Specific**: "MIO insights", "protocol advancement", "chatbot", "weekly report"
- **API**: "Claude API", "Anthropic", "rate limit"

---

## N8n Credentials

```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
N8N_URL="https://n8n-n8n.vq00fr.easypanel.host"
```

---

## Active Mind Insurance Workflows

| Workflow ID | Name | Trigger | Purpose | Priority |
|-------------|------|---------|---------|----------|
| `0qiaQWEaDXbCxkhK` | **Unified Chat - MIO/Nette/ME Agents** | Webhook | **MAIN CHATBOT** | CRITICAL |
| `56JoMTczqhHS3eME` | MIO Weekly Report Generator | Daily 6AM | Generate weekly insights | HIGH |
| `Sp5RhDpa8xFPnlWI` | MIO Insights Reply | Webhook | Handle user replies | HIGH |
| `niEwlbKoTiQF1sO9` | Protocol-Day-Advancement-Daily | Daily | Advance protocol days | HIGH |

---

## CRITICAL: Main Chatbot Workflow (0qiaQWEaDXbCxkhK)

### Flow Architecture
```
1. Webhook: Chat Entry
   ↓
2. Extract User ID
   ↓
3. Fetch Context (PARALLEL):
   ├─ Fetch: User Profile
   ├─ Fetch: Onboarding Assessment
   ├─ Fetch: Identity Assessment
   ├─ Fetch: Tactic Progress
   ├─ Fetch: Scheduled Tactics
   └─ Fetch: Practices & Streaks
   ↓
4. Merge All Context
   ↓
5. Router: Build Context & Detect Handoff
   ↓
6. Route to Agent (MIO / Nette / ME)
   ↓
7. Agent Processing:
   ├─ [Agent] Configuration
   ├─ Claude API Call
   ├─ Knowledge Base RAG
   ├─ Chat Memory Retrieval
   └─ Embeddings Generation
   ↓
8. Format Response
   ↓
9. Respond to Webhook
```

### Common Failure Points
1. **Anthropic API rate limits** or key expiration
2. **User profile not found** (null user_id)
3. **Knowledge base connection failed**
4. **Chat memory retrieval timeout**
5. **Webhook timeout** (>30s response)

---

## Diagnostic Commands

### List All Workflows
```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows?limit=50" -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "import sys,json; wfs=json.load(sys.stdin).get('data',[]); [print(f\"{w['id']} - {w['name']} - Active: {w['active']}\") for w in wfs]"
```

### Get Workflow Details
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/WORKFLOW_ID" -H "X-N8N-API-KEY: $N8N_KEY"
```

### Get Recent Executions
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?limit=10" -H "X-N8N-API-KEY: $N8N_KEY"
```

### Get Failed Executions
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?limit=10&status=error" -H "X-N8N-API-KEY: $N8N_KEY"
```

### Get Execution Details (with data)
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions/EXECUTION_ID?includeData=true" -H "X-N8N-API-KEY: $N8N_KEY"
```

### Check Specific Workflow Executions
```bash
# Main chatbot
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=0qiaQWEaDXbCxkhK&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"

# Weekly reports
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=56JoMTczqhHS3eME&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"

# Protocol advancement
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=niEwlbKoTiQF1sO9&limit=10" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

## Common Issues & Fixes

### Issue 1: Workflow Not Running (Inactive)

**Symptoms**: No recent executions, scheduled workflow not triggering

**Diagnostic**:
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/WORKFLOW_ID" -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "import sys,json; print(f\"Active: {json.load(sys.stdin).get('active')}\")"
```

**Fix**: Activate via N8n UI or API

---

### Issue 2: Claude/Anthropic API Error

**Symptoms**: Execution fails at Claude node, "rate limit" or "invalid API key"

**Diagnostic**:
```bash
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions/EXECUTION_ID?includeData=true" -H "X-N8N-API-KEY: $N8N_KEY" | grep -i "error\|anthropic\|rate"
```

**Fix**:
- Wait for rate limit reset (usually 1 minute)
- Check Anthropic API key in N8n credentials
- Reduce batch size if processing many users

---

### Issue 3: Postgres Chat Memory Connection Error

**Symptoms**: "Connection terminated unexpectedly", "ENETUNREACH 2600:1f18:...", "self-signed certificate"

**Root Cause**: N8n on Easypanel uses IPv4, Supabase Dedicated Pooler uses IPv6

**Fix**:
1. Use Supabase **Shared Pooler** (IPv4 compatible):
   - Host: `aws-1-us-east-1.pooler.supabase.com`
   - Port: `6543`
   - User: `postgres.hpyodaugrkctagkrfofj`
2. Enable "**Ignore SSL Issues**" toggle in N8n Postgres credential
3. Save and retest

---

### Issue 4: Supabase Connection Timeout

**Symptoms**: "ETIMEDOUT", "connection refused"

**Diagnostic**:
```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Fix**:
- Check Supabase status page
- Retry execution
- Verify N8n Supabase credentials

---

### Issue 5: No Users Found for Processing

**Symptoms**: Workflow runs but processes 0 users

**Diagnostic**:
```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"

# Check users with active protocols
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=user_id&status=eq.active&limit=10" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

**Fix**: Verify users meet workflow filter criteria

---

## Audit Trail Logging

After EVERY resolution, log to `support_ticket_logs`:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/support_ticket_logs" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type": "workflow",
    "issue_description": "DESCRIPTION",
    "systems_checked": ["workflow_status", "executions", "credentials"],
    "findings": {"active": true, "last_error": "rate_limit"},
    "root_cause": "ROOT_CAUSE",
    "fix_applied": "FIX_DESCRIPTION",
    "resolved": true,
    "agent_skill": "n8n-workflow-debugger"
  }'
```

---

## Structured Output Template

```
## N8n Workflow Diagnostic Results

### Workflow Status
- Workflow ID: [ID]
- Name: [NAME]
- Active: [YES/NO]
- Last updated: [DATE]

### Recent Executions
| ID | Status | Started | Duration |
|----|--------|---------|----------|
| ... | ... | ... | ... |

### Error Details (if failed)
- Failed at node: [NODE_NAME]
- Error message: [MESSAGE]
- Error timestamp: [TIME]

### Root Cause
[Description of the problem]

### Fix Applied / Recommended
[Action taken or suggested fix]

### Verification
[Confirm workflow is now working]
```

---

## Deployment Safety (CRITICAL)

**NEVER modify production workflows without:**
1. Backup of current workflow JSON
2. Staging test if available
3. User approval for critical workflows
4. Rollback plan documented
