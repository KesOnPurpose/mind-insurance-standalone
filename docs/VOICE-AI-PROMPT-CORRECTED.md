# Voice AI Prompt - Corrected Version

## Problem Solved

The original prompt tried to use webhook-based actions (`Lookup Caller Session`, `Fetch Nette Context`) to identify callers. This approach **DOES NOT WORK** because:

> **GHL Voice AI can TRIGGER webhooks but CANNOT READ the response data.**

This is a documented GHL platform limitation.

## Solution: Pre-Call Custom Field Sync

Instead of webhooks, we:
1. Sync user context to GHL contact custom fields BEFORE the call starts
2. Voice AI reads these custom fields directly using `{{contact.voice_*}}` syntax

## Verification Status

**Infrastructure Working** (as of 2026-01-23):
- [x] Edge Function `sync-ghl-voice-context` deployed and functional
- [x] All 21 voice custom fields exist in GHL location `3KJeKktlnhQab7T0zrpM`
- [x] Keston's contact has populated values (sync IS working)
- [ ] Voice AI prompt needs to be updated to use the custom fields

## Key Changes from Old Prompt

### REMOVED (Don't Work):
- `STEP 0: WEB WIDGET CALLER IDENTIFICATION` - Used "Lookup Caller Session" webhook
- `STEP 1: FETCH CONTEXT` - Used "Fetch Nette Context" webhook
- Webhook-based identity matching flow

### ADDED (Works):
- Direct custom field references: `{{contact.voice_greeting_name}}`
- Pre-synced context awareness section with all 21 fields
- Simplified flow: Check if context exists → Use it / Fall back to manual ID

## GHL Custom Fields Available

| Field Key | Purpose | Example Value |
|-----------|---------|---------------|
| `voice_greeting_name` | Personalized greeting | "Hi Keston" |
| `voice_first_name` | First name for conversation | "Keston" |
| `voice_tier_level` | Subscription tier | "free", "premium" |
| `voice_journey_day` | Day in 90-day journey | 1-90 |
| `voice_journey_week` | Week in 12-week program | 1-12 |
| `voice_journey_phase` | Current phase | "foundation", "building" |
| `voice_readiness_level` | Assessment readiness | "fast_track" |
| `voice_assessment_score` | Assessment score | 0-100 |
| `voice_target_state` | Target state | "GA", "TX", "CA" |
| `voice_target_demographics` | Target populations | "Seniors", "Disabled" |
| `voice_user_context` | Full context block for AI | Multi-line text |
| `voice_context_synced_at` | Last sync timestamp | ISO timestamp |

## How to Update GHL Voice AI

1. Go to GHL Dashboard
2. Navigate to: Settings → Conversational AI → Voice AI
3. Select the "Nette - Group Home Expert" agent
4. Click on "System Prompt" or "Instructions"
5. Replace the entire prompt with the content from:
   - `/tmp/voice_ai_prompt_corrected.txt` (on the server)
   - Or copy from the "Corrected Prompt" section below

## Corrected Prompt

See `/tmp/voice_ai_prompt_corrected.txt` for the full prompt, or the content below:

---

```
## CALLER INFORMATION (Auto-populated from GHL contact record)
- Caller Phone: {{contact.phone}}
- Caller Name: {{contact.name}}
- Contact ID: {{contact.id}}

## PRE-SYNCED VOICE CONTEXT (Read directly from contact custom fields)
- Greeting Name: {{contact.voice_greeting_name}}
- First Name: {{contact.voice_first_name}}
- Tier Level: {{contact.voice_tier_level}}
- Journey Day: {{contact.voice_journey_day}}
- Journey Week: {{contact.voice_journey_week}}
- Journey Phase: {{contact.voice_journey_phase}}
- Readiness Level: {{contact.voice_readiness_level}}
- Assessment Score: {{contact.voice_assessment_score}}
- Target State: {{contact.voice_target_state}}
- Target Demographics: {{contact.voice_target_demographics}}
- User Context: {{contact.voice_user_context}}
- Context Synced At: {{contact.voice_context_synced_at}}

## CRITICAL: START OF CALL PROCEDURE

When a call begins, follow this sequence:

### STEP 1: CHECK FOR PRE-SYNCED CONTEXT

First, check if voice context has been synced by looking at {{contact.voice_greeting_name}}:

**IF {{contact.voice_greeting_name}} EXISTS (not empty):**
- User loaded the Voice tab before calling - context is already synced!
- Immediately greet them: "{{contact.voice_greeting_name}}, this is Nette! How can I help you today?"
- You have full context in the custom fields above - USE IT throughout the conversation
- Skip to STEP 3

**IF {{contact.voice_greeting_name}} IS EMPTY:**
- User may be calling from a different phone or didn't load Voice tab first
- Continue to STEP 2 for identity verification

### STEP 2: IDENTITY VERIFICATION (Only if no pre-synced context)

If the voice context fields are empty, ask for identification...

[Full prompt continues - see /tmp/voice_ai_prompt_corrected.txt]
```

---

## Testing After Update

1. **Load Voice Tab**: Open the app → Navigate to Voice tab → Wait for "Context synced to GHL" console log
2. **Check GHL Contact**: Verify custom fields are populated (via GHL dashboard or API)
3. **Make Test Call**: Initiate voice call
4. **Expected Result**: Nette says "Hi Keston!" (personalized greeting) instead of "Hi, how can I help?"

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEFORE CALL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User loads Voice tab                                            │
│        │                                                         │
│        ▼                                                         │
│  Frontend calls voiceContextService.syncVoiceContext()           │
│        │                                                         │
│        ▼                                                         │
│  Edge Function: sync-ghl-voice-context                           │
│        │                                                         │
│        ▼                                                         │
│  GHL API: PUT /contacts/{id} with customFields                   │
│        │                                                         │
│        ▼                                                         │
│  GHL Contact now has:                                            │
│    - voice_greeting_name: "Hi Keston"                            │
│    - voice_journey_day: 1                                        │
│    - voice_tier_level: "free"                                    │
│    - ... (21 total fields)                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DURING CALL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Voice AI starts call                                            │
│        │                                                         │
│        ▼                                                         │
│  Prompt reads: {{contact.voice_greeting_name}}                   │
│        │                                                         │
│        ▼                                                         │
│  Value = "Hi Keston" (already in contact record!)                │
│        │                                                         │
│        ▼                                                         │
│  Nette says: "Hi Keston, this is Nette! How can I help today?"   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/services/voiceContextService.ts` | Fetches user data, calls Edge Function |
| `supabase/functions/sync-ghl-voice-context/index.ts` | Updates GHL contact custom fields |
| `src/components/chat/GHLWidgetWrapper.tsx` | Triggers context sync on Voice tab load |
| `docs/VOICE-AI-PROMPT-CORRECTED.md` | This documentation |
| `/tmp/voice_ai_prompt_corrected.txt` | Full corrected prompt text |
