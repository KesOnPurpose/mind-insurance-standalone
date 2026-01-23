# Stuck Detection N8n Workflow

## Overview

This document describes the N8n workflow that orchestrates the stuck detection automation system for Grouphome course users. The workflow runs daily and triggers nudge messages for users who haven't made progress.

## Workflow Configuration

### Name
`GH-Stuck-Detection-Daily`

### Schedule
- **Trigger**: Cron Schedule
- **Time**: 6:00 AM UTC (7:00 AM EST / 4:00 AM PST)
- **Frequency**: Daily

### Nodes

```
┌──────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│   Cron Trigger   │─────▶│  HTTP Request       │─────▶│  IF: Has Users   │
│   (6 AM UTC)     │      │  (stuck-detection-  │      │                  │
│                  │      │   cron Edge Fn)     │      │                  │
└──────────────────┘      └─────────────────────┘      └────────┬─────────┘
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                                    ▼                         ▼
                                          ┌─────────────────┐       ┌─────────────────┐
                                          │  True: Process  │       │  False: Exit    │
                                          │  Results        │       │  (No users)     │
                                          └────────┬────────┘       └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  Split: By      │
                                          │  Threshold      │
                                          └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
          ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
          │  30-Day Alert   │            │  7/14-Day Alert │            │  3-Day Alert    │
          │  (Coach Email)  │            │  (Log Only)     │            │  (Log Only)     │
          └─────────────────┘            └─────────────────┘            └─────────────────┘
```

## Node Configurations

### 1. Cron Trigger Node
```json
{
  "name": "Daily 6AM Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 6 * * *"
        }
      ]
    }
  }
}
```

### 2. HTTP Request Node (Call Edge Function)
```json
{
  "name": "Call Stuck Detection",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/stuck-detection-cron",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "options": {
      "timeout": 30000
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "dry_run",
          "value": "false"
        }
      ]
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "name": "Supabase Service Key"
    }
  }
}
```

### 3. IF Node (Check for Users)
```json
{
  "name": "Has Stuck Users?",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "number": [
        {
          "value1": "={{$json.total_stuck_users}}",
          "operation": "larger",
          "value2": 0
        }
      ]
    }
  }
}
```

### 4. Split by Threshold Node
```json
{
  "name": "Split by Threshold",
  "type": "n8n-nodes-base.switch",
  "parameters": {
    "dataPropertyName": "stuck_threshold",
    "rules": {
      "rules": [
        {
          "value": "day30",
          "output": 0
        },
        {
          "value": "day14",
          "output": 1
        },
        {
          "value": "day7",
          "output": 2
        },
        {
          "value": "day3",
          "output": 3
        }
      ]
    }
  }
}
```

### 5. 30-Day Coach Alert Node (Email)
```json
{
  "name": "Coach Alert - 30 Day",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "nette@grouphome4newbies.com",
    "toEmail": "coach@grouphome4newbies.com",
    "subject": "🚨 30-Day Stuck Alert: {{ $json.full_name }}",
    "text": "User {{ $json.full_name }} ({{ $json.email }}) has been stuck for 30+ days.\n\nCurrent Tactic: {{ $json.current_tactic_name }}\nLast Progress: {{ $json.last_progress_at }}\n\nPlease reach out personally to this user.",
    "options": {}
  }
}
```

## Environment Variables Required

These must be set in the N8n instance:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `https://hpyodaugrkctagkrfofj.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Edge Function auth |

## Credentials to Configure

### HTTP Header Auth (for Supabase)
- **Name**: `Supabase Service Key`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer <SUPABASE_SERVICE_ROLE_KEY>`

### Email (for Coach Alerts)
- **Type**: SMTP or Gmail
- **From**: `nette@grouphome4newbies.com`
- **To**: `coach@grouphome4newbies.com`

## Testing the Workflow

### Manual Test (Dry Run)
1. Set `dry_run: true` in the HTTP Request body
2. Click "Execute Workflow"
3. Check output for detected users without sending notifications

### Production Test
1. Set `dry_run: false`
2. Create a test user with old progress date
3. Execute workflow
4. Verify:
   - `gh_automation_events` table has new entry
   - SMS was sent (check GHL dashboard)
   - In-app nudge appears in Nette chat

## Monitoring

### Success Indicators
- Workflow executes daily at 6 AM UTC
- `total_stuck_users` count in response
- No errors in workflow execution log

### Failure Indicators
- HTTP 500 response from Edge Function
- Missing GHL credentials error
- Database connection errors

## Related Files

- Edge Function: `supabase/functions/stuck-detection-cron/index.ts`
- SMS Function: `supabase/functions/send-nudge/index.ts`
- Shared Logic: `supabase/functions/_shared/stuck-detection.ts`
- In-App Nudge: `src/components/chat/ChatWelcomeScreen.tsx`
