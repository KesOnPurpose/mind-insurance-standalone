---
description: Check N8n workflow status and recent executions for Mind Insurance workflows
allowed-tools: Bash
---

# Check N8n Workflow: $ARGUMENTS

Running diagnostic for workflow: **$ARGUMENTS**

## Known Mind Insurance Workflows Quick Reference

| ID | Name |
|----|------|
| `0qiaQWEaDXbCxkhK` | **Unified Chat - MIO/Nette/ME Agents (MAIN CHATBOT)** |
| `56JoMTczqhHS3eME` | MIO Weekly Report Generator |
| `Sp5RhDpa8xFPnlWI` | MIO Insights Reply |
| `niEwlbKoTiQF1sO9` | Protocol-Day-Advancement-Daily |

---

## Step 1: Get Workflow Details

```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/$ARGUMENTS" -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys, json
try:
    w = json.load(sys.stdin)
    print(f\"Workflow Details:\")
    print(f\"  Name: {w.get('name')}\")
    print(f\"  ID: {w.get('id')}\")
    print(f\"  Active: {w.get('active')}\")
    print(f\"  Created: {w.get('createdAt')}\")
    print(f\"  Updated: {w.get('updatedAt')}\")
    print(f\"  Nodes ({len(w.get('nodes', []))}):\")
    for n in w.get('nodes', []):
        print(f\"    - {n.get('name')} ({n.get('type')})\")
except Exception as e:
    print(f'Error: {e}')
"
```

## Step 2: Get Recent Executions

```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=$ARGUMENTS&limit=10" -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    execs = data.get('data', [])
    print(f\"Recent Executions ({len(execs)}):\")
    print(f\"{'ID':<12} {'Status':<10} {'Started':<25} {'Finished':<25}\")
    print('-' * 75)
    for e in execs:
        print(f\"{e.get('id', 'N/A'):<12} {e.get('status', 'N/A'):<10} {(e.get('startedAt') or 'N/A')[:25]:<25} {(e.get('stoppedAt') or 'N/A')[:25]:<25}\")
except Exception as e:
    print(f'Error: {e}')
"
```

## Step 3: Check for Errors

```bash
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId=$ARGUMENTS&status=error&limit=5" -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    execs = data.get('data', [])
    if not execs:
        print('No recent errors found!')
    else:
        print(f\"Recent Errors ({len(execs)}):\")
        for e in execs:
            print(f\"  Execution {e.get('id')} failed at {e.get('stoppedAt')}\")
except Exception as e:
    print(f'Error: {e}')
"
```

## Step 4: Get Latest Error Details (if any)

If there are failed executions, get details on the most recent one:

```bash
# Replace EXECUTION_ID with the ID from Step 3
N8N_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZjBhM2VkYS00OWIzLTRkOTgtYWFhNC1jZWNhNjYwYWMxNDciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0MTE1NDEyfQ.JBOuUYZAsVwnhCwPzNaNnHw98-FsZJfGYn36Xfns_9M"
# curl -s "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions/EXECUTION_ID?includeData=true" -H "X-N8N-API-KEY: $N8N_KEY"
echo "Run with specific execution ID to see error details"
```

---

## Summary Report Template

```
## N8n Workflow Diagnostic: $ARGUMENTS

### Workflow Status
- Name: _______________
- Active: [ ] Yes / [ ] No
- Last Updated: _______________

### Recent Executions
| Status | Count |
|--------|-------|
| Success | ___ |
| Error | ___ |
| Running | ___ |

### Last Successful Run
- Time: _______________
- Duration: _______________

### Last Failed Run (if any)
- Time: _______________
- Error Node: _______________
- Error Message: _______________

### Health Assessment
- [ ] Workflow is active
- [ ] Recent executions exist
- [ ] No recurring errors
- [ ] Execution times are reasonable

### Recommended Actions
[List any fixes needed]
```

---

## Common Fixes

### Activate Workflow
Go to N8n UI: https://n8n-n8n.vq00fr.easypanel.host
Navigate to workflow and click "Activate"

### Check Credentials
1. Go to Credentials in N8n
2. Verify Supabase, Anthropic, etc. are configured
3. Test credential connection

### Retry Failed Execution
1. Go to Executions in N8n
2. Find the failed execution
3. Click "Retry"
