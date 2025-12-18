---
description: Multi-system diagnostic for any Mind Insurance issue - automatically routes to correct specialist
allowed-tools: Bash, Read, Grep, Glob
---

# Multi-System Diagnostic: $ARGUMENTS

Analyzing issue: **$ARGUMENTS**

---

## Step 1: Categorize the Issue

Based on the description, identify which system(s) are affected:

| Keywords | System | Diagnostic Path |
|----------|--------|-----------------|
| login, access, can't log in, denied | **User Access** | Check auth → gh_approved_users → user_profiles |
| assessment, mental pillar, restarting | **Assessment** | Check mental_pillar_assessments |
| protocol, day, task, stuck, not advancing | **Protocol** | Check mio_weekly_protocols → completions |
| MIO, chatbot, insights, not responding | **MIO System** | Check mio_insights_thread → N8n workflow |
| workflow, N8n, automation | **N8n Workflows** | Check workflow status and executions |
| error, component, UI, blank | **Frontend** | Check console errors, component state |
| database, query, RLS | **Backend** | Check schema, RLS policies |

---

## Step 2: Run Appropriate Diagnostics

### If User Access Issue:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo "=== Checking auth.users ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/admin/users?per_page=500" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" | grep -i "SEARCH_TERM"

echo ""
echo "=== Checking gh_approved_users ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/gh_approved_users?select=*&or=(email.ilike.*SEARCH_TERM*,full_name.ilike.*SEARCH_TERM*)" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

echo ""
echo "=== Checking user_profiles (MI only) ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,email,user_source,current_day&user_source=eq.mi_standalone&email=ilike.*SEARCH_TERM*" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

### If Protocol Issue:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo "=== Checking mio_weekly_protocols ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols?select=*&user_id=eq.USER_ID&order=created_at.desc&limit=3" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

echo ""
echo "=== Checking mio_protocol_completions ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_protocol_completions?select=*&user_id=eq.USER_ID&order=completed_at.desc&limit=7" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

### If MIO Issue:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo "=== Checking mio_insights_thread ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_insights_thread?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

echo ""
echo "=== Checking mio_insights_messages ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_insights_messages?select=*&user_id=eq.USER_ID&order=delivered_at.desc&limit=10" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

### If Assessment Issue:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
echo "=== Checking mental_pillar_assessments ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mental_pillar_assessments?select=*&user_id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"

echo ""
echo "=== Checking user_profiles mental pillar progress ==="
curl -s "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?select=id,mental_pillar_progress&id=eq.USER_ID" -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY"
```

### If N8n Workflow Issue:

```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
echo "=== Checking N8n recent executions ==="
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?limit=10" -H "X-N8N-API-KEY: $N8N_KEY"

echo ""
echo "=== Checking failed executions ==="
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?status=error&limit=5" -H "X-N8N-API-KEY: $N8N_KEY"
```

---

## Step 3: Cross-Reference Data

For user-specific issues, ensure data consistency:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"

echo "=== Cross-Reference Check ==="
echo "1. auth.users.id should match..."
echo "2. user_profiles.id"
echo "3. gh_approved_users.user_id"
echo "4. mio_weekly_protocols.user_id"
echo ""
echo "If any mismatch, this is likely the root cause."
```

---

## Summary Report Template

```
## Multi-System Diagnostic Report

### Issue Description
$ARGUMENTS

### Systems Checked
- [ ] User Access (auth.users, gh_approved_users)
- [ ] User Profiles (user_profiles with mi_standalone)
- [ ] Protocols (mio_weekly_protocols, mio_protocol_completions)
- [ ] MIO System (mio_insights_thread, mio_insights_messages)
- [ ] Assessments (mental_pillar_assessments)
- [ ] N8n Workflows

### Findings

#### System 1: [Name]
- Status: [OK / ISSUE]
- Details: _______________

#### System 2: [Name]
- Status: [OK / ISSUE]
- Details: _______________

### Root Cause
[Primary issue identified]

### Fix Applied
[Commands executed]

### Verification
[Confirm issue resolved]

### Prevention
[How to avoid in future]
```

---

## Quick Reference: Common Issue → Fix

| Issue | Root Cause | Fix Command |
|-------|-----------|-------------|
| Can't login | Not in gh_approved_users | Add to gh_approved_users |
| Access denied | user_id not linked | Update gh_approved_users.user_id |
| Protocol stuck | Day advancement failed | Manual day update |
| MIO not responding | Chatbot workflow failing | Check N8n workflow 0qiaQWEaDXbCxkhK |
| Assessment loop | mental_pillar_progress not set | Sync assessment to profile |
| Workflow not running | Inactive | Activate in N8n UI |
