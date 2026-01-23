# Voice Session Matching - GHL Voice AI Caller Identification

## Overview

This document explains how the Voice Session Matching system works to solve the GHL Voice AI "Guest Visitor" problem.

### The Problem

GHL Voice AI web widget creates a new "Guest Visitor" contact for every call, meaning:
- Nette (the Voice AI) cannot identify who is calling
- No personalized greeting ("Hey there" instead of "Hi Keston!")
- No access to user context (journey day, tier, assessment data)

### The Solution

**Session Matching**: Create a session record BEFORE the call, then look it up at call start.

```
Flow:
1. User loads Voice tab → App creates voice_sessions record
2. User clicks to call → Widget connects, Guest Visitor created (can't prevent)
3. Voice AI's FIRST action → Calls our webhook to look up session
4. Webhook finds session → Returns phone number and context
5. Voice AI uses "Get Contact" with phone → Gets full contact data
6. Nette greets: "Hey Keston! Let me pull up your info..."
```

---

## Components

### 1. Database: `voice_sessions` Table

**Migration**: `supabase/migrations/20260123000001_create_voice_sessions.sql`

```sql
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  phone TEXT NOT NULL,
  ghl_contact_id TEXT,
  context JSONB DEFAULT '{}',
  greeting_hint TEXT,           -- e.g., "Hi Keston!"
  created_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ,       -- When Voice AI looked up this session
  expires_at TIMESTAMPTZ,       -- 5 minutes after creation
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  status TEXT                   -- pending → matched → completed/expired
);
```

### 2. Frontend: Session Creation

**File**: `src/components/chat/GHLWidgetWrapper.tsx`

When user loads the Voice tab:
1. Calls `expireOldSessions()` to clean up
2. Calls `createVoiceSession()` with user's ID, phone, and GHL contact ID
3. Session expires in 5 minutes if not matched

**Service**: `src/services/voiceSessionService.ts`

### 3. Edge Function: Session Lookup

**File**: `supabase/functions/voice-session-lookup/index.ts`

Endpoint called by N8n webhook (which is called by Voice AI Custom Action):

```bash
POST /functions/v1/voice-session-lookup
Content-Type: application/json

{
  "lookup_window_seconds": 60  // Optional, default 60
}
```

**Response** (success):
```json
{
  "success": true,
  "phone": "+13472834717",
  "ghl_contact_id": "zixQE3VheJADxtwAU114",
  "greeting_hint": "Hi Keston!",
  "context": {
    "greeting_name": "Hi Keston!",
    "journey_day": 1,
    "tier_level": "foundation",
    ...
  },
  "session_id": "uuid-here",
  "user_id": "auth-user-id"
}
```

**Response** (no session):
```json
{
  "success": false,
  "error": "No pending session found. User may not have loaded the Voice tab recently."
}
```

---

## N8n Workflow Configuration

### Create Workflow: "Voice Session Lookup"

1. **Webhook Trigger**
   - Method: POST
   - Path: `/webhook/voice-session-lookup`
   - Authentication: None (or Header Auth if needed)

2. **HTTP Request Node**
   - Method: POST
   - URL: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/voice-session-lookup`
   - Headers:
     ```
     Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "lookup_window_seconds": 60
     }
     ```

3. **Respond to Webhook Node**
   - Return the HTTP Request response directly

### Webhook URL

After creating the workflow, the webhook URL will be:
```
https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-session-lookup
```

---

## GHL Voice AI Configuration

### Step 1: Create Custom Action

In GHL Dashboard → Location → Settings → Conversational AI → Voice AI:

1. Select the "Nette - Group Home Expert" agent
2. Go to **Custom Actions** tab
3. Click **Add Action**
4. Configure:
   - **Name**: `Lookup Caller Session`
   - **Type**: Webhook (POST)
   - **URL**: `https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-session-lookup`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body**: Leave empty or `{}`

### Step 2: Update Voice AI System Prompt

Add this to the BEGINNING of the system prompt:

```
MANDATORY FIRST STEP - CALLER IDENTIFICATION:
At the very start of EVERY call, you MUST:

1. Use the "Lookup Caller Session" custom action
2. If successful, greet the caller by name: "{{session.greeting_hint}}"
3. Then use "Get Contact" with the returned phone number to get full context

Example successful flow:
- Action returns: {"success": true, "greeting_hint": "Hi Keston!", "phone": "+13472834717"}
- You say: "Hi Keston! This is Nette. Let me pull up your information real quick..."
- Use "Get Contact" with phone +13472834717
- Now you have full context for personalized conversation

If lookup fails (no session found):
- Say: "Hey there! I'd love to personalize our chat. What phone number did you use when you signed up?"
- Use "Get Contact" with the number they provide

IMPORTANT: Never skip this first step. Personalization is critical for user experience.
```

### Step 3: Add Context Variables to Prompt

After the lookup section, add:

```
CALLER CONTEXT (after Get Contact):
- Name: {{contact.first_name}} {{contact.last_name}}
- Phone: {{contact.phone}}
- Tier: {{contact.custom_field.voice_tier_level}}
- Journey Day: {{contact.custom_field.voice_journey_day}}
- Journey Phase: {{contact.custom_field.voice_journey_phase}}
- Readiness Level: {{contact.custom_field.voice_readiness_level}}

USER CONTEXT FOR CONVERSATION:
{{contact.custom_field.voice_user_context}}

Use this information to personalize every response.
```

---

## Testing Procedure

### 1. Test Session Creation

1. Open browser console (F12)
2. Navigate to Voice tab
3. Look for logs:
   ```
   [GHL Widget] Creating voice session for caller identification
   [GHL Widget] Voice session created: {id: "...", greeting_hint: "Hi Keston!"}
   ```

### 2. Test Edge Function

```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/voice-session-lookup" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lookup_window_seconds": 60}'
```

### 3. Test N8n Webhook

```bash
curl -X POST "https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-session-lookup" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Test Full Flow

1. Log in to the app
2. Navigate to Voice tab (creates session)
3. Initiate voice call
4. Listen for personalized greeting

**Success Criteria**:
- [ ] Nette says "Hi [Name]!" within 10 seconds
- [ ] Nette references journey context
- [ ] Console shows session creation logs
- [ ] N8n execution shows successful lookup

---

## Troubleshooting

### Session Not Found

**Symptoms**: Voice AI says "Hey there" instead of personalized greeting

**Causes**:
1. User didn't load Voice tab before calling
2. Session expired (>5 minutes old)
3. Edge Function timing out

**Fix**:
- Ensure user loads Voice tab BEFORE clicking call button
- Check session `expires_at` timestamp
- Check Edge Function logs in Supabase

### Multiple Sessions

**Symptoms**: Wrong user context returned

**Causes**:
1. Multiple users calling simultaneously
2. Session not marked as matched

**Fix**:
- Session matching uses `created_at DESC LIMIT 1`
- Sessions are marked `matched` after lookup
- For high-volume: consider adding user fingerprinting

### GHL Custom Action Fails

**Symptoms**: Voice AI doesn't execute lookup action

**Causes**:
1. Custom Action not configured
2. Webhook URL incorrect
3. N8n workflow not active

**Fix**:
- Verify Custom Action in GHL dashboard
- Test webhook URL directly
- Check N8n workflow is enabled

---

## Security Considerations

1. **Edge Function uses Service Role Key** - bypasses RLS for webhook access
2. **Sessions expire after 5 minutes** - limits window for attacks
3. **Sessions marked as matched** - prevents replay
4. **No sensitive data in context** - only journey/assessment info

---

## File Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260123000001_create_voice_sessions.sql` | Database table |
| `src/services/voiceSessionService.ts` | Session CRUD operations |
| `src/components/chat/GHLWidgetWrapper.tsx` | Creates session on load |
| `supabase/functions/voice-session-lookup/index.ts` | Webhook lookup |
| `docs/VOICE-SESSION-MATCHING.md` | This documentation |

---

## Future Enhancements

1. **Session Analytics** - Track match rates, timing distributions
2. **Multi-device Support** - Handle same user on multiple devices
3. **Call Recording Linkage** - Link session to call transcript
4. **Fallback Identification** - Email/name matching if phone fails
