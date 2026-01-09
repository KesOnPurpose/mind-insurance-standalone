# MIO Weekly Report Generator - Group Targeting Update

## Summary

The n8n workflow (ID: `56JoMTczqhHS3eME`) needs to be updated to support group targeting from the admin panel.

## Changes Required

### 1. Add Webhook Trigger Node

Add a new Webhook node alongside the existing "Daily 6AM Trigger":
- **Name**: "Manual Webhook Trigger"
- **Method**: POST
- **Path**: `mio-report-generator`
- **Response Mode**: "When Last Node Finishes"

This will create a webhook URL like:
`https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-report-generator`

### 2. Add Merge Node

Create a Merge node to combine both triggers:
- **Name**: "Combine Triggers"
- **Mode**: "Choose Branch"
- **Output Type**: "All inputs merged together"

Connect both "Daily 6AM Trigger" and "Manual Webhook Trigger" to this merge node.

### 3. Update "Get Users Due for Report" Node

Replace the current SQL query with this conditional logic:

**Current Query** (keep for scheduled runs - when no target_type):
```sql
WITH user_journey AS (
  SELECT
    up.id as user_id,
    up.email,
    up.full_name,
    gau.tier,
    up.created_at as signup_date,
    EXTRACT(DAY FROM NOW() - up.created_at)::int as journey_day,
    (SELECT MAX(created_at) FROM mio_user_reports r WHERE r.user_id = up.id) as last_report_date
  FROM user_profiles up
  INNER JOIN gh_approved_users gau ON gau.email = up.email AND gau.is_active = true
),
due_users AS (
  SELECT *,
    CASE
      WHEN journey_day IN (7, 14, 21, 28) THEN true
      WHEN journey_day > 28 AND (last_report_date IS NULL OR EXTRACT(DAY FROM NOW() - last_report_date) >= 7) THEN true
      ELSE false
    END as is_due
  FROM user_journey
)
SELECT user_id, email, full_name, tier::text, journey_day, last_report_date
FROM due_users
WHERE is_due = true
LIMIT 50;
```

**New Query** (use when target_type is provided):
```sql
SELECT user_id, email, full_name
FROM resolve_target_users_direct(
  '{{ $json.target_type || "due" }}'::text,
  '{{ JSON.stringify($json.target_config || {}) }}'::jsonb
);
```

### 4. Recommended: Add IF Node Before User Query

Add an IF node to check if webhook provides target info:
- **Name**: "Check Target Type"
- **Condition**: `{{ $json.target_type }}` exists

Then route to:
- **True branch**: Use `resolve_target_users_direct()` query
- **False branch**: Use original "due users" query

### 5. Alternative: Single Dynamic Query

Or use a single query that handles both cases:

```sql
SELECT * FROM resolve_target_users_direct(
  COALESCE('{{ $json.target_type }}', 'due')::text,
  COALESCE('{{ $json.target_config ? JSON.stringify($json.target_config) : "{}" }}'::jsonb, '{}'::jsonb)
);
```

The `resolve_target_users_direct()` function handles the "due" case as its default behavior.

## Webhook Payload Format

When triggering from admin panel, the payload will be:

```json
{
  "automation_id": "uuid",
  "target_type": "custom_group",  // or "individual", "auto_group", "all"
  "target_config": {
    "group_id": "uuid"  // for custom_group
    // or "user_ids": ["uuid", ...] for individual
    // or "auto_group_type": "by_pattern", "pattern": "past_prison" for auto_group
  },
  "triggered_by": "admin_manual"
}
```

## Database Functions Available

These functions are now deployed to the database:

1. **`resolve_target_users_direct(p_target_type TEXT, p_target_config JSONB)`**
   - Returns: `TABLE(user_id UUID, email TEXT, full_name TEXT)`
   - Handles all target types including "due" (default workflow behavior)

2. **`resolve_automation_target_users(p_automation_id UUID)`**
   - Returns: `TABLE(user_id UUID)`
   - Looks up target config from mio_report_automation table

3. **`get_automation_user_count(p_target_type TEXT, p_target_config JSONB)`**
   - Returns: `INTEGER`
   - Preview count for admin UI

## Testing

After updating the workflow:

1. Create a custom group in admin panel
2. Add some users to the group
3. Create an automation with the webhook URL
4. Click "Trigger Now" button
5. Verify reports are generated for group members only

## Webhook URL for Admin Panel

Use this URL in automation configurations:
`https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-report-generator`
