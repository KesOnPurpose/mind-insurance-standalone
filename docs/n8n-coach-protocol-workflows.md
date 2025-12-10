# Coach Protocol V2 - N8N Workflows

This document describes the n8n workflows needed for the Coach Protocol V2 system.

## 1. Daily Protocol Advancement Workflow

**Purpose**: Advances all active coach protocol assignments daily at 12:01 AM EST.

### Workflow Structure

```
[Schedule Trigger] → [HTTP Request: Advance] → [Filter: Has Results] → [Send Notifications]
        ↓
    12:01 AM EST
    (Cron: 1 5 * * *)
```

### Node Configuration

#### 1.1 Schedule Trigger
- **Type**: Schedule Trigger
- **Cron Expression**: `1 5 * * *` (12:01 AM EST = 5:01 AM UTC)
- **Timezone**: America/New_York

#### 1.2 HTTP Request: Advance Protocols
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/coach-protocol-advance`
- **Headers**:
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`
  - `Content-Type`: `application/json`
- **Body**: `{}`

#### 1.3 Filter: Has Results
- **Type**: IF
- **Condition**: `{{$json.result.assignments_advanced > 0 || $json.result.assignments_completed > 0}}`

#### 1.4 Send Notifications (if needed)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/send-push-notification`
- **Body**:
```json
{
  "type": "coach_protocol_daily",
  "title": "New Tasks Available",
  "body": "Your daily coaching tasks are ready!"
}
```

---

## 2. Protocol Completion Notification Workflow

**Purpose**: Notifies coaches when a user completes their protocol.

### Workflow Structure

```
[Webhook Trigger] → [Get Protocol Details] → [Get User Details] → [Send Coach Notification]
```

### Webhook URL
`https://n8n-n8n.vq00fr.easypanel.host/webhook/coach-protocol-completed`

### Expected Webhook Payload
```json
{
  "event_type": "protocol_completed",
  "user_id": "uuid",
  "assignment_id": "uuid",
  "protocol_id": "uuid",
  "completion_data": {
    "days_completed": 21,
    "days_skipped": 0,
    "total_tasks_completed": 63,
    "completed_at": "2025-01-15T00:00:00Z"
  }
}
```

### Node Configuration

#### 2.1 Webhook Trigger
- **Type**: Webhook
- **HTTP Method**: POST
- **Path**: `/coach-protocol-completed`

#### 2.2 Get Protocol Details
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/coach_protocols_v2?id=eq.{{$json.protocol_id}}&select=title,coach_id`
- **Headers**:
  - `apikey`: `{{$env.SUPABASE_SERVICE_ROLE_KEY}}`
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`

#### 2.3 Get User Details
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/user_profiles?id=eq.{{$node["Webhook"].json.user_id}}&select=full_name,email`
- **Headers**:
  - `apikey`: `{{$env.SUPABASE_SERVICE_ROLE_KEY}}`
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`

#### 2.4 Send Coach Notification
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/send-push-notification`
- **Headers**:
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`
- **Body**:
```json
{
  "user_id": "{{$node['Get Protocol Details'].json[0].coach_id}}",
  "title": "Protocol Completed! 🎉",
  "body": "{{$node['Get User Details'].json[0].full_name}} completed {{$node['Get Protocol Details'].json[0].title}}"
}
```

---

## 3. Assignment Welcome Workflow

**Purpose**: Sends welcome notification when a user is assigned a new protocol.

### Workflow Structure

```
[Webhook Trigger] → [Get Protocol Details] → [Send Welcome Push]
```

### Webhook URL
`https://n8n-n8n.vq00fr.easypanel.host/webhook/coach-protocol-assigned`

### Expected Webhook Payload
```json
{
  "event_type": "assigned",
  "user_id": "uuid",
  "assignment_id": "uuid",
  "protocol_id": "uuid",
  "slot": "primary",
  "start_date": "2025-01-15T00:00:00Z"
}
```

### Node Configuration

#### 3.1 Webhook Trigger
- **Type**: Webhook
- **HTTP Method**: POST
- **Path**: `/coach-protocol-assigned`

#### 3.2 Get Protocol Details
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/coach_protocols_v2?id=eq.{{$json.protocol_id}}&select=title,total_weeks,theme_color`
- **Headers**:
  - `apikey`: `{{$env.SUPABASE_SERVICE_ROLE_KEY}}`
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`

#### 3.3 Send Welcome Push
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/send-push-notification`
- **Headers**:
  - `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`
- **Body**:
```json
{
  "user_id": "{{$node['Webhook'].json.user_id}}",
  "title": "New Coaching Protocol",
  "body": "You've been assigned: {{$node['Get Protocol Details'].json[0].title}} ({{$node['Get Protocol Details'].json[0].total_weeks}} weeks)"
}
```

---

## Environment Variables Required

In your n8n instance, configure these environment variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Supabase API access |
| `SUPABASE_URL` | Supabase project URL |

---

## Testing

### Test Daily Advancement
```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/coach-protocol-advance" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

### Test Assignment
```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/coach-protocol-assign" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "protocol_id": "your-protocol-id",
    "user_ids": ["user-id-1", "user-id-2"],
    "slot": "primary"
  }'
```

---

## Monitoring

The edge functions log results to the `coach_protocol_completion_events` table:

```sql
-- Check recent events
SELECT * FROM coach_protocol_completion_events
ORDER BY created_at DESC
LIMIT 20;

-- Check advancement statistics
SELECT event_type, COUNT(*), DATE(created_at)
FROM coach_protocol_completion_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, DATE(created_at)
ORDER BY DATE(created_at) DESC;
```
