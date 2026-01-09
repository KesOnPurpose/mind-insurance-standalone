# Coverage Center N8n Workflows

## Overview

Two webhook workflows power the Coverage Center's real-time protocol generation and MIO responses.

---

## Workflow 1: First Protocol Generation

**File:** `First-Protocol-Generation.json`

**Webhook URL:** `POST /webhook/first-protocol-generation`

**Purpose:** Generate personalized 7-day protocol immediately after Identity Collision Assessment completion.

**Target Response Time:** < 30 seconds

### Payload Schema

```json
{
  "user_id": "uuid",
  "user_name": "string",
  "collision_pattern": "achiever_burnout | people_pleaser | perfectionist_paralysis | impostor_syndrome",
  "temperament_type": "string",
  "biggest_challenge": "string (optional)",
  "ideal_outcome": "string (optional)",
  "assessment_id": "uuid (optional)"
}
```

### Response Schema (Success)

```json
{
  "success": true,
  "protocol_id": "uuid",
  "title": "The Override Protocol",
  "pattern_targeted": "achiever_burnout",
  "pattern_name": "The Achiever's Burnout Cycle",
  "mio_intro": "Your drive that got you here is the same drive...",
  "total_days": 7,
  "current_day": 1,
  "first_day_preview": "Notice Without Judgment",
  "user_id": "uuid",
  "generated_at": "ISO timestamp"
}
```

### Flow

```
Webhook → Build Prompt → Claude AI → Format Protocol → Store in Supabase → Response
```

### Pattern-Specific Configurations

| Pattern | Protocol Focus | Day 1 Focus |
|---------|---------------|-------------|
| achiever_burnout | Strategic rest as performance advantage | Notice "push through" impulse |
| people_pleaser | Internal validation + healthy boundaries | Catch considering others first |
| perfectionist_paralysis | Imperfect action over perfect inaction | Notice "not ready" = "afraid" |
| impostor_syndrome | Internalizing evidence of competence | Catch dismissing achievements |

---

## Workflow 2: Protocol Day Completion Response

**File:** `Protocol-Day-Completion-Response.json`

**Webhook URL:** `POST /webhook/protocol-day-completion`

**Purpose:** Generate MIO's personalized response after user completes CT with protocol check-in.

**Target Response Time:** < 15 seconds

### Payload Schema

```json
{
  "user_id": "uuid",
  "user_name": "string",
  "protocol_id": "uuid",
  "day_number": 1-7,
  "practice_response": "yes_multiple | yes_once | tried | forgot",
  "moment_captured": "string (user's journal entry)",
  "insight_captured": "string (optional)",
  "collision_pattern": "string",
  "streak_count": 13
}
```

### Response Schema (Success)

```json
{
  "success": true,
  "message_id": "uuid",
  "mio_response": {
    "content": "Day 3 Complete! You caught the pattern before...",
    "key_insight": "One sentence insight",
    "neural_connection": "How this rewired something",
    "next_day_hook": "Tomorrow: Day 4 - Alternative Response",
    "streak_celebration": "13-day streak!"
  },
  "day_number": 3,
  "protocol_complete": false,
  "streak_count": 13,
  "skip_token_earned": false,
  "generated_at": "ISO timestamp"
}
```

### Flow

```
Webhook → Fetch Protocol Context (RAG) → Build MIO Prompt → Claude AI → Format Response → Store Message → Check Protocol Complete → Award Skip Token (if Day 7) → Response
```

### Response Tone Logic

| Practice Response | Tone | Acknowledgment |
|-------------------|------|----------------|
| yes_multiple | Celebratory | "Prefrontal cortex getting faster than amygdala" |
| yes_once | Encouraging | "Single moment of awareness = rewiring" |
| tried | Supportive | "Awareness itself is the practice" |
| forgot | Compassionate | "Data, not failure" |

### Skip Token Logic

When `day_number >= total_days` (protocol complete):
1. Award 1 Skip Token (max 3)
2. Mark protocol as completed
3. Set `skip_token_earned = true`

---

## Database Tables Used

### First Protocol Generation

**Writes to:** `mio_weekly_protocols`

Fields:
- `user_id`, `protocol_type`, `title`, `pattern_targeted`, `description`
- `mio_intro`, `insight_summary`, `why_it_matters`, `neural_principle`
- `total_days`, `day_tasks` (JSONB), `week_number`, `year`
- `source` = 'onboarding_completion'
- `status` = 'active', `current_day` = 1

### Day Completion Response

**Reads from:** `mio_weekly_protocols`, `mio_protocol_completions`

**Writes to:** `mio_insights_messages`

**Updates:** `coverage_streaks` (Skip Token), `mio_weekly_protocols` (status)

---

## Frontend Integration

### Triggering First Protocol (Assessment Completion)

```typescript
// In IdentityCollisionAssessmentPage.tsx after submission
const response = await fetch('/webhook/first-protocol-generation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.id,
    user_name: user.user_metadata?.first_name,
    collision_pattern: assessmentData.collision_pattern,
    temperament_type: assessmentData.temperament,
    assessment_id: assessmentData.id,
  }),
});
```

### Triggering Day Completion (CT Submit)

```typescript
// In CelebrateWins.tsx after CT submission
if (protocolCheckInData) {
  await fetch('/webhook/protocol-day-completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      user_name: user.user_metadata?.first_name,
      protocol_id: protocolCheckInData.protocol_id,
      day_number: protocolCheckInData.day_number,
      practice_response: protocolCheckInData.practice_response,
      moment_captured: protocolCheckInData.moment_captured,
      insight_captured: protocolCheckInData.insight_captured,
      collision_pattern: activeProtocol.pattern_targeted,
      streak_count: coverageStreak.current_streak,
    }),
  });
}
```

---

## Deployment Checklist

1. [ ] Import workflows to N8n instance
2. [ ] Configure credentials:
   - Anthropic API (Claude claude-sonnet-4-20250514)
   - Supabase Postgres connection
3. [ ] Activate webhooks
4. [ ] Test with curl:
   ```bash
   curl -X POST https://your-n8n.com/webhook/first-protocol-generation \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test-uuid","user_name":"Test","collision_pattern":"achiever_burnout"}'
   ```
5. [ ] Monitor execution logs for < 30s response time
6. [ ] Verify protocol appears in `mio_weekly_protocols` table

---

## Error Handling

Both workflows return error responses with:
- HTTP 500 status code
- `{ success: false, error: "message", user_id: "uuid" }`

Frontend should:
1. Show user a loading state while waiting
2. If timeout (> 60s), poll for protocol existence
3. Display fallback message if generation fails

---

## Performance Targets

| Metric | First Protocol | Day Completion |
|--------|---------------|----------------|
| Response Time | < 30s | < 15s |
| Claude Model | claude-sonnet-4-20250514 | claude-sonnet-4-20250514 |
| Max Tokens | 4000 | 800 |
| Temperature | 0.7 | 0.7 |
