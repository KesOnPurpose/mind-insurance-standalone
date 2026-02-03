# GHCF Contract-to-Portal N8N Workflow

## FEAT-GHCF-009 through FEAT-GHCF-012: N8N Workflow Documentation

### Overview

This document describes the N8N workflow(s) needed to connect GHL (GoHighLevel) contract signing events to the Supabase Edge Functions that pre-approve users for portal access.

### Pipeline Architecture

```
GHL Contract Signed
    |
    v
GHL Webhook (outbound)
    |
    v
N8N Webhook Trigger Node
    |
    v
N8N: Extract & Normalize Data
    |
    v
N8N: HTTP Request to ghcf-webhook-handler Edge Function
    |
    v
Supabase: gh_approved_users UPSERT + ghl_enrollment_log
    |
    v
[Optional] N8N: Send pre-approval email to user
    |
    v
User navigates to /create-account?email=X&name=Y&ghl_contact_id=Z
    |
    v
CreateAccountPage polls check_email_approved RPC
    |
    v
User signs up -> link-user-after-signup -> Dashboard
```

### N8N Workflow: GHCF Contract Handler

#### Workflow Nodes

**Node 1: Webhook Trigger**
- Type: `Webhook`
- Method: `POST`
- Path: `/ghcf-contract-webhook`
- Authentication: Header auth (shared secret)
- Full URL: `https://n8n-n8n.vq00fr.easypanel.host/webhook/ghcf-contract-webhook`

**Node 2: Extract Contact Data**
- Type: `Set`
- Fields:
  - `contact_email`: `{{ $json.contact.email }}`
  - `contact_name`: `{{ $json.contact.first_name }} {{ $json.contact.last_name }}`
  - `ghl_contact_id`: `{{ $json.contact.id }}`
  - `webhook_type`: `contract_signed`
  - `idempotency_key`: `ghcf-contract-{{ $json.contact.id }}-{{ $json.timestamp }}`
  - `raw_payload`: `{{ $json }}`

**Node 3: Call GHCF Webhook Handler**
- Type: `HTTP Request`
- Method: `POST`
- URL: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/ghcf-webhook-handler`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer [SERVICE_ROLE_KEY]`
- Body (JSON):
  ```json
  {
    "webhook_type": "{{ $json.webhook_type }}",
    "contact_email": "{{ $json.contact_email }}",
    "contact_name": "{{ $json.contact_name }}",
    "ghl_contact_id": "{{ $json.ghl_contact_id }}",
    "idempotency_key": "{{ $json.idempotency_key }}",
    "raw_payload": {{ $json.raw_payload }}
  }
  ```

**Node 4: Check Response**
- Type: `IF`
- Condition: `{{ $json.status }}` equals `success`
- True branch: Node 5 (Send Email)
- False branch: Node 6 (Error Alert)

**Node 5: Send Pre-Approval Email (Optional)**
- Type: `Email Send` or `GHL Send Email`
- To: `{{ $json.contact_email }}`
- Subject: "Your Grouphome Accelerator Account is Ready!"
- Body: Includes link to `/create-account?email={{ encodeURIComponent($json.contact_email) }}&name={{ encodeURIComponent($json.contact_name) }}&ghl_contact_id={{ $json.ghl_contact_id }}`

**Node 6: Error Alert**
- Type: `Slack` or `Email`
- Notifies admin of failed webhook processing

### N8N Workflow: GHCF Payment Handler

#### Workflow Nodes

**Node 1: Webhook Trigger**
- Type: `Webhook`
- Method: `POST`
- Path: `/ghcf-payment-webhook`
- Full URL: `https://n8n-n8n.vq00fr.easypanel.host/webhook/ghcf-payment-webhook`

**Node 2: Extract Payment Data**
- Type: `Set`
- Fields:
  - `contact_email`: `{{ $json.contact.email }}`
  - `contact_name`: `{{ $json.contact.first_name }} {{ $json.contact.last_name }}`
  - `ghl_contact_id`: `{{ $json.contact.id }}`
  - `webhook_type`: `payment_received`
  - `whop_membership_id`: `{{ $json.payment.membership_id || '' }}`
  - `idempotency_key`: `ghcf-payment-{{ $json.contact.id }}-{{ $json.payment.id }}`
  - `raw_payload`: `{{ $json }}`

**Node 3: Call GHCF Webhook Handler**
- Same as contract handler Node 3, but with payment fields included

### GHL Webhook Configuration (FEAT-GHCF-013, FEAT-GHCF-014)

#### GHL Trigger Setup

**Trigger 1: Contract Signed**
- GHL Location: `crbqAgIVKWFaNFC8WTOo`
- Trigger Type: `Workflow` > `Contact Changed` or `Opportunity Status Changed`
- Filter: Pipeline stage = "Contract Signed"
- Action: Webhook POST to N8N URL

**Trigger 2: Payment Received**
- GHL Location: `crbqAgIVKWFaNFC8WTOo`
- Trigger Type: `Payment Received` or `Invoice Paid`
- Action: Webhook POST to N8N URL

#### GHL Redirect Configuration

After contract signing, GHL should redirect the user's browser to:
```
https://grouphome4newbies.com/create-account?email={contact.email}&name={contact.first_name}+{contact.last_name}&ghl_contact_id={contact.id}
```

This redirect can be configured in:
1. **GHL Form/Funnel**: Set the "Thank You" page URL
2. **GHL Contract**: Set the post-signature redirect URL
3. **GHL Workflow**: Use a "Redirect" action node

### Environment Variables Required

| Variable | Location | Value |
|----------|----------|-------|
| `SUPABASE_URL` | N8N Credential | `https://hpyodaugrkctagkrfofj.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | N8N Credential (encrypted) | Service role key |
| `GHL_WEBHOOK_SECRET` | N8N + GHL | Shared secret for webhook auth |

### Testing Checklist

```
[ ] GHL contract signed -> webhook fires to N8N
[ ] N8N receives webhook and extracts data correctly
[ ] N8N calls ghcf-webhook-handler edge function
[ ] Edge function creates/updates gh_approved_users record
[ ] Edge function logs to ghl_enrollment_log
[ ] Idempotency: duplicate webhook returns "duplicate" status
[ ] User redirected to /create-account with URL params
[ ] CreateAccountPage polls check_email_approved -> returns true
[ ] User signs up -> link-user-after-signup links account
[ ] User redirected to /dashboard with full access
```

### Error Handling

| Error | Behavior | Resolution |
|-------|----------|------------|
| N8N webhook timeout | GHL retries (default 3x) | Idempotency key prevents duplicates |
| Edge function 500 | N8N can retry via error branch | ghl_enrollment_log tracks failed status |
| Duplicate webhook | Returns `{"status":"duplicate"}` | No action needed (idempotent) |
| Invalid email | Returns 400 | GHL should validate email before sending |
| DB connection error | Edge function fails | Retry via N8N error handling |

### Monitoring

- Check `ghl_enrollment_log` table for `processing_status = 'failed'` entries
- Monitor N8N execution logs for failed runs
- Set up N8N error workflow to alert on failures
