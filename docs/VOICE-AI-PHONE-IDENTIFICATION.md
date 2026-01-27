# Voice AI Phone-Based Identification

## Overview

This document describes the **phone-based identification system** for Nette Voice AI. Instead of relying on timing-based session matching (which doesn't work with GHL's trigger requirements), this approach uses the caller's phone number to identify them.

## The Problem (Old Approach)

The previous session-based approach failed because:
1. GHL Voice AI Custom Actions **require conversation triggers** (e.g., "phone number mentioned")
2. There is **NO "at call start" trigger** available
3. The `voice-session-lookup` function was never called because there was no trigger to invoke it

## The Solution (Phone-Based Identification)

**New Flow:**
1. Caller connects via Voice AI widget
2. Nette greets caller and immediately asks for their phone number
3. Caller provides phone number (e.g., "347-283-4717")
4. GHL detects "phone number mentioned" → triggers Custom Action
5. Custom Action calls `lookup-user-by-phone` edge function
6. Function returns user context (name, tier, journey day, etc.)
7. Nette continues with personalized conversation using the context

---

## Edge Function: `lookup-user-by-phone`

### Endpoint
```
POST https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/lookup-user-by-phone
```

### Request Body
```json
{
  "phone": "+13472834717"
}
```

Phone formats supported:
- `+13472834717` (E.164 - preferred)
- `13472834717` (with country code)
- `3472834717` (10-digit US)
- `347-283-4717` (formatted)

### Response (User Found)
```json
{
  "success": true,
  "identity_matched": true,
  "greeting_hint": "Keston! Great, I found you in our system.",
  "context_for_agent": "Name: Keston Glasgow. Journey: Day 1, Week 1. Tier: free",
  "user_data": {
    "user_id": "77062c24-be2a-41e2-9fee-4af8274d0d2f",
    "full_name": "Keston Glasgow",
    "first_name": "Keston",
    "email": "kes@purposewaze.com",
    "tier_level": "free",
    "journey_day": 1,
    "journey_week": 1,
    "verified_phone": "+13472834717"
  }
}
```

### Response (User Not Found)
```json
{
  "success": true,
  "identity_matched": false,
  "error": "No user found with this phone number"
}
```

---

## GHL Configuration Steps

### Step 1: Create N8n Webhook

Create a new N8n workflow with a webhook trigger:

**Workflow Name:** `Voice AI - Lookup User By Phone`

**Webhook URL:** `https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-lookup-by-phone`

**N8n Workflow Nodes:**
1. **Webhook** - Receives call from GHL with phone number
2. **HTTP Request** - Calls Supabase edge function
3. **Respond to Webhook** - Returns user context to GHL

```javascript
// N8n HTTP Request node configuration
{
  "method": "POST",
  "url": "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/lookup-user-by-phone",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "phone": "{{ $json.phone }}"
  }
}
```

### Step 2: Create GHL Custom Action

In GoHighLevel → Voice AI Agent → Custom Actions:

**Action Name:** `Lookup User By Phone`

**Description:** `Looks up user by phone number and returns their context for personalized conversation`

**Webhook URL:** (N8n webhook URL from Step 1)

**Trigger:** `When phone number is mentioned during the conversation`

**Input Schema:**
```json
{
  "phone": {
    "type": "string",
    "description": "The phone number provided by the caller",
    "source": "conversation"
  }
}
```

**Output Schema:**
```json
{
  "success": { "type": "boolean" },
  "identity_matched": { "type": "boolean" },
  "greeting_hint": { "type": "string" },
  "context_for_agent": { "type": "string" },
  "user_data": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string" },
      "full_name": { "type": "string" },
      "first_name": { "type": "string" },
      "tier_level": { "type": "string" },
      "journey_day": { "type": "number" },
      "journey_week": { "type": "number" }
    }
  }
}
```

### Step 3: Update Nette's Prompt

Add this to the beginning of Nette's agent prompt (see full prompt below).

---

## Updated Nette Prompt

Replace the existing prompt with this phone-identification-aware version:

```
# Nette - Group Home Mentor Voice Agent

## CRITICAL: Caller Identification Flow

When a call begins, you MUST follow this sequence:

1. **Greet warmly:**
   "Hey! This is Nette, your group home mentor. Thanks for calling!"

2. **Ask for phone number immediately:**
   "Quick question - what's the phone number you signed up with? I want to make sure I pull up your profile."

3. **Wait for the phone number** - The caller will say something like "347-283-4717"

4. **When the custom action returns with user data:**
   - If `identity_matched` is true: Use the `greeting_hint` from the response
     Example: "Keston! Great, I found you in our system."
   - Then reference their journey: "I see you're on Day {journey_day}, Week {journey_week}"
   - Continue with personalized coaching

5. **If user not found (`identity_matched` is false):**
   "Hmm, I couldn't find that number in our system. No worries though! Are you a new member, or maybe you signed up with a different number?"
   - Offer to help them anyway
   - Suggest they verify their phone in the app settings

## Context Variables Available After Lookup

After the phone lookup, you'll have access to:
- `first_name` - The user's first name for personal greetings
- `tier_level` - Their subscription tier (free, starter, premium)
- `journey_day` - Current day in their journey (1-90)
- `journey_week` - Current week (1-12)
- `context_for_agent` - Summary string with all key info

## Conversation Guidelines

[... rest of Nette's existing prompt continues here ...]
```

---

## Testing

### Test the Edge Function Directly
```bash
curl -X POST 'https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/lookup-user-by-phone' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+13472834717"}'
```

### Test via N8n Webhook
After setting up the N8n workflow, test it:
```bash
curl -X POST 'https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-lookup-by-phone' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"347-283-4717"}'
```

### Test End-to-End
1. Open the Mind Insurance app
2. Go to Voice tab
3. Click the phone widget to start a call
4. When Nette asks for your phone, say your number
5. Verify Nette responds with your name and context

---

## Troubleshooting

### "No user found with this phone number"
- Check that the phone number is in `user_profiles.verified_phone`
- Phone must be in E.164 format in the database (e.g., `+13472834717`)
- User must have completed phone verification in the app

### Custom Action Not Triggering
- Verify the trigger is set to "phone number mentioned"
- Ensure N8n webhook is active and accessible
- Check GHL Voice AI logs for errors

### N8n Webhook Errors
- Verify the Supabase edge function URL is correct
- Check N8n execution logs for HTTP errors
- Ensure edge function has `verify_jwt = false` in config.toml

---

## Architecture Diagram

```
┌─────────────────────┐
│   User in App       │
│   (Voice Tab)       │
└─────────┬───────────┘
          │ Click phone widget
          ▼
┌─────────────────────┐
│   GHL Voice AI      │
│   Widget (WebRTC)   │
└─────────┬───────────┘
          │ Nette asks for phone
          │ User says "347-283-4717"
          ▼
┌─────────────────────┐
│   GHL Custom Action │
│   "Phone Mentioned" │
└─────────┬───────────┘
          │ Webhook call
          ▼
┌─────────────────────┐
│   N8n Webhook       │
│   voice-lookup-...  │
└─────────┬───────────┘
          │ HTTP POST
          ▼
┌─────────────────────┐
│   Supabase Edge     │
│   lookup-user-by-   │
│   phone             │
└─────────┬───────────┘
          │ Query user_profiles
          │ WHERE verified_phone = ?
          ▼
┌─────────────────────┐
│   Response:         │
│   - identity_matched│
│   - greeting_hint   │
│   - user_data       │
└─────────┬───────────┘
          │ Return to GHL
          ▼
┌─────────────────────┐
│   Nette uses        │
│   context for       │
│   personalized      │
│   conversation      │
└─────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/lookup-user-by-phone/index.ts` | New edge function |
| `supabase/config.toml` | Added function config (`verify_jwt = false`) |
| `docs/VOICE-AI-PHONE-IDENTIFICATION.md` | This documentation |

---

## Next Steps

1. **Create N8n Workflow** - Set up the webhook workflow
2. **Configure GHL Custom Action** - Add the phone trigger action
3. **Update Nette's Prompt** - Add the phone-first identification flow
4. **Test End-to-End** - Verify the complete flow works
