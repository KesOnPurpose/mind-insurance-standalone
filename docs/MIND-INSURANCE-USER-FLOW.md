# Mind Insurance User Flow & Onboarding Process

> **Last Updated:** December 13, 2025
> **Product:** Mind Insurance - $100M Feature
> **Purpose:** Complete user journey documentation from signup to daily engagement

---

## Table of Contents

1. [Overview](#overview)
2. [Access Control Gates](#access-control-gates)
3. [Phase 1: Identity Collision Assessment](#phase-1-identity-collision-assessment)
4. [Phase 2: First Session (Protocol Reveal)](#phase-2-first-session-protocol-reveal)
5. [Phase 3: Daily Habit Loop](#phase-3-daily-habit-loop)
6. [Core Features](#core-features)
7. [Data Architecture](#data-architecture)
8. [User Flow Diagram](#user-flow-diagram)

---

## Overview

Mind Insurance follows a **progressive disclosure pattern** where users gradually unlock deeper features as they complete assessments and maintain engagement through daily practices.

### Key Principles
- **Pattern-First Design:** Everything flows from the detected identity collision pattern
- **Time-Gated Practices:** PROTECT method practices only available in specific windows
- **Gamification:** Streaks, skip tokens, and milestones drive engagement
- **AI Personalization:** MIO provides pattern-aware insights and protocols

---

## Access Control Gates

Users must pass through 4 sequential gates before accessing Mind Insurance:

```
┌─────────────────────────────────────────────────────────────────┐
│                    4-GATE SECURITY MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GATE 1: ProtectedRoute                                         │
│  ├── Check: Is user authenticated?                              │
│  ├── File: /src/components/ProtectedRoute.tsx                   │
│  └── Fail: Redirect to /auth                                    │
│                                                                 │
│  GATE 2: AccessGate                                             │
│  ├── Check: Has user purchased/been approved?                   │
│  ├── File: /src/components/AccessGate.tsx                       │
│  └── Fail: Show paywall screen                                  │
│                                                                 │
│  GATE 3: AssessmentGuard                                        │
│  ├── Check: General platform assessment complete?               │
│  ├── File: /src/components/AssessmentGuard.tsx                  │
│  ├── Table: user_onboarding.assessment_completed_at             │
│  └── Fail: Redirect to /assessment                              │
│                                                                 │
│  GATE 4: IdentityCollisionGuard                                 │
│  ├── Check: Identity Collision assessment complete?             │
│  ├── File: /src/components/mind-insurance/IdentityCollisionGuard│
│  ├── Table: identity_collision_assessments                      │
│  └── Fail: Redirect to /mind-insurance/assessment               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** Admins can bypass Gates 3 & 4 for testing and support purposes.

---

## Phase 1: Identity Collision Assessment

**Route:** `/mind-insurance/assessment`
**Component:** `IdentityCollisionAssessmentPage.tsx`

### Intro Screens (First-Time Only)

7 introductory screens shown only on first visit (tracked via localStorage):
- Welcome to Mind Insurance
- What is an Identity Collision?
- How this assessment works
- What you'll discover
- How to answer honestly
- Privacy and safety
- Ready to begin

### 8-Question Assessment

| # | Question Focus | Type | Weight |
|---|----------------|------|--------|
| Q1 | Effort vs Results gap | Single choice | Normal |
| Q2 | Relationship with action-taking | Single choice | Normal |
| Q3 | "Should be further along" frequency | Single choice | Normal |
| Q4 | Internal conflict pattern | Single choice | **HIGH** |
| Q5 | New strategy implementation | Single choice | Normal |
| Q6 | Decision-making confidence | Single choice | Normal |
| Q7 | Life area most impacted | Single choice | Normal |
| Q8 | Impact intensity | Slider (1-10) | Normal |

### Pattern Detection Engine

The assessment calculates scores for 3 identity collision types:

| Pattern | Description | Key Indicators |
|---------|-------------|----------------|
| **Past Prison** | Held back by past experiences, background, or history | High scores on Q1, Q2, mentions of past |
| **Compass Crisis** | Lacks clear direction, feels lost or uncertain | High scores on Q5, Q6, decision paralysis |
| **Success Sabotage** | Unconsciously sabotages near breakthrough moments | High scores on Q3, Q4, pattern of near-misses |

### UX Features

- One question per screen with cinematic transitions
- Auto-advance on multiple choice (400ms delay)
- Slider questions require manual advance
- Keyboard navigation (arrow keys)
- Progress bar showing current step
- Can go back and edit previous answers
- "Reveal My Pattern" button triggers save

### Data Created

```sql
INSERT INTO identity_collision_assessments (
  user_id,
  assessment_data,      -- JSON of all responses
  pattern_targeted,     -- 'past_prison' | 'compass_crisis' | 'success_sabotage'
  results_json,         -- Detailed scoring breakdown
  completed_at
)
```

### Post-Assessment Trigger

On completion, an N8n webhook is triggered to generate the user's personalized 7-day protocol.

---

## Phase 2: First Session (Protocol Reveal)

**Route:** `/mind-insurance/first-session`
**Component:** `FirstSessionPage.tsx`

### 5-Stage Automated Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRST SESSION STAGES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: WELCOME (3 seconds)                                   │
│  ├── "Hi [Name], I'm MIO"                                       │
│  ├── Personalized welcome message                               │
│  └── Sets warm, supportive tone                                 │
│                                                                 │
│  STAGE 2: ANALYZING (8-30 seconds)                              │
│  ├── Brain animation displayed                                  │
│  ├── Polls for N8n-generated protocol                           │
│  ├── Max 15 attempts (30s timeout)                              │
│  └── Falls back to background polling if needed                 │
│                                                                 │
│  STAGE 3: REVEAL                                                │
│  ├── Pattern name dramatically revealed                         │
│  ├── "Your pattern is: SUCCESS SABOTAGE"                        │
│  ├── Protocol title shown                                       │
│  └── Day 1 preview displayed                                    │
│                                                                 │
│  STAGE 4: ENGAGEMENT                                            │
│  ├── MIO asks first question about user's pattern               │
│  ├── Text input for user response                               │
│  └── Can skip if desired                                        │
│                                                                 │
│  STAGE 5: CONFIRMATION                                          │
│  ├── "Your coverage is ready"                                   │
│  ├── Summary of what's next                                     │
│  └── [View Coverage Center] CTA                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Created

```sql
-- Created by N8n webhook (not frontend)
INSERT INTO mio_insight_protocols (
  user_id,
  title,
  pattern_targeted,
  total_days,           -- Usually 7
  days,                 -- JSON array of day tasks
  status,               -- 'active'
  created_at
)
```

---

## Phase 3: Daily Habit Loop

After onboarding, users enter the daily engagement cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY HABIT LOOP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MORNING (3am - 10am) ─── Championship Setup                    │
│  │                                                              │
│  ├── P - Pattern Check                                          │
│  │   └── Notice where pattern might show up today               │
│  │                                                              │
│  ├── R - Reinforce Identity                                     │
│  │   └── Affirm who you're becoming                             │
│  │                                                              │
│  └── O - Outcome Visualization                                  │
│      └── See today's success in advance                         │
│                                                                 │
│  MIDDAY (10am - 3pm) ─── NASCAR Pit Stop                        │
│  │                                                              │
│  ├── T - Trigger Reset                                          │
│  │   └── Identify and reset any triggered patterns              │
│  │                                                              │
│  └── E - Energy Audit                                           │
│      └── Check energy levels and adjust                         │
│                                                                 │
│  EVENING (3pm - 10pm) ─── Victory Lap                           │
│  │                                                              │
│  ├── C - Celebrate Wins                                         │
│  │   └── Acknowledge today's victories (big and small)          │
│  │                                                              │
│  └── T2 - Tomorrow Setup                                        │
│      └── Prepare mentally for tomorrow                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Points: ~70 max per day
Streak: Consecutive days with practices completed
```

---

## Core Features

### Practice Hub
**Route:** `/mind-insurance`

- Current championship level (Bronze/Silver/Gold/Platinum)
- Today's practice status (X of 7 completed)
- Points earned today
- Current streak counter
- Quick access to all practices

### Coverage Center
**Route:** `/mind-insurance/coverage`

| Tab | Contents |
|-----|----------|
| **MIO Coverage** | Active AI protocol, day-by-day tasks, progress, history |
| **Coach Coverage** | Human-assigned protocols, week/day tracking |

**Gamification Elements:**
- Coverage Streak (consecutive completion days)
- Skip Tokens (earn 1 per protocol, bank up to 3)
- Milestones (Day 7, Day 21, Day 66 achievements)

### My Evidence (Vault)
**Route:** `/mind-insurance/vault`

| Tab | Contents |
|-----|----------|
| **Recordings** | Voice recordings from practices |
| **Patterns** | Detected behavioral patterns over time |
| **Victories** | Wins and breakthroughs recorded |
| **Assessments** | All completed assessments |

### MIO Chat
**Route:** `/mind-insurance/chat`

AI-powered conversations about:
- Pattern insights
- Daily challenges
- Breakthrough moments
- Protocol questions

### MIO Insights
**Route:** `/mind-insurance/mio-insights`

Thread-based insights from MIO based on:
- Protocol progress
- Practice patterns
- Behavioral analysis

---

## Data Architecture

### Database Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIND INSURANCE TABLES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  user_profiles                                                  │
│  └── User metadata, timezone, tier_level                        │
│                                                                 │
│  user_onboarding                                                │
│  └── General platform onboarding state                          │
│  └── Key: assessment_completed_at                               │
│                                                                 │
│  identity_collision_assessments                                 │
│  └── Full Identity Collision responses                          │
│  └── Key: pattern_targeted, completed_at                        │
│                                                                 │
│  mio_insight_protocols                                          │
│  └── AI-generated personalized protocols                        │
│  └── Key: user_id, status, days (JSON)                          │
│                                                                 │
│  daily_practices                                                │
│  └── PROTECT method practice tracking                           │
│  └── Key: practice_date, practice_type, completed               │
│                                                                 │
│  coverage_streaks                                               │
│  └── Streak data + skip tokens                                  │
│  └── Key: current_streak, skip_tokens                           │
│                                                                 │
│  coverage_milestones                                            │
│  └── Achievement records                                        │
│  └── Examples: day_7, day_21, day_66                            │
│                                                                 │
│  voice_recordings                                               │
│  └── Audio files from practices                                 │
│  └── Key: audio_url, duration                                   │
│                                                                 │
│  coach_protocol_assignments                                     │
│  └── Human coach-assigned protocols                             │
│  └── Key: protocol_id, slot (primary/secondary)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Created at Each Stage

| Stage | Data Created | Table |
|-------|--------------|-------|
| Signup | User profile | `user_profiles` |
| General Assessment | Onboarding milestone | `user_onboarding` |
| Identity Collision | Pattern + responses | `identity_collision_assessments` |
| First Session | 7-day protocol | `mio_insight_protocols` |
| Daily Practice | Practice records | `daily_practices` |
| Ongoing | Streak tracking | `coverage_streaks` |
| Achievements | Milestones | `coverage_milestones` |
| Voice Practice | Audio files | `voice_recordings` |

---

## User Flow Diagram

```
                              ┌──────────────┐
                              │   SIGNUP     │
                              └──────┬───────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │     GATE 1: ProtectedRoute     │
                    │   (Is user authenticated?)     │
                    └────────────────┬───────────────┘
                                     │ ✓
                                     ▼
                    ┌────────────────────────────────┐
                    │      GATE 2: AccessGate        │
                    │  (Has user purchased/approved?)│
                    └────────────────┬───────────────┘
                                     │ ✓
                                     ▼
                    ┌────────────────────────────────┐
                    │    GATE 3: AssessmentGuard     │
                    │ (General platform assessment?) │
                    └────────────────┬───────────────┘
                                     │ ✓
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                PHASE 1: IDENTITY COLLISION ASSESSMENT           │
│                Route: /mind-insurance/assessment                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Intro Screens] → [8 Questions] → [Pattern Detection]        │
│                                                                 │
│   Patterns Detected:                                            │
│   • Past Prison (held back by past)                             │
│   • Compass Crisis (lacks direction)                            │
│   • Success Sabotage (self-sabotages)                           │
│                                                                 │
│   Data: identity_collision_assessments record created           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │  N8n Webhook (Backend)          │
                    │  Generates personalized protocol│
                    └────────────────┬────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: FIRST SESSION                       │
│                    Route: /mind-insurance/first-session         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Welcome] → [Analyzing] → [Reveal] → [Engage] → [Confirm]     │
│                                                                 │
│   User sees:                                                    │
│   • Their pattern name revealed                                 │
│   • Personalized 7-day protocol                                 │
│   • Day 1 task preview                                          │
│   • First MIO question                                          │
│                                                                 │
│   Data: mio_insight_protocols record created                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3: DAILY HABIT LOOP                    │
└─────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   PRACTICE HUB   │    │ COVERAGE CENTER  │    │   MY EVIDENCE    │
│  /mind-insurance │    │   /coverage      │    │     /vault       │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│                  │    │                  │    │                  │
│ PROTECT Method:  │    │ MIO Tab:         │    │ 4 Tabs:          │
│ • Morning (3-10) │    │ • Active protocol│    │ • Recordings     │
│ • Midday (10-3)  │    │ • Day progress   │    │ • Patterns       │
│ • Evening (3-10) │    │ • History        │    │ • Victories      │
│                  │    │                  │    │ • Assessments    │
│ 7 daily practices│    │ Coach Tab:       │    │                  │
│ ~70 points/day   │    │ • Assigned work  │    │ Historical       │
│                  │    │                  │    │ transformation   │
│                  │    │ Gamification:    │    │ record           │
│                  │    │ • Streaks        │    │                  │
│                  │    │ • Skip Tokens    │    │                  │
│                  │    │ • Milestones     │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────┐
                         │     MIO CHAT     │
                         │      /chat       │
                         ├──────────────────┤
                         │ AI conversations │
                         │ • Pattern help   │
                         │ • Daily support  │
                         │ • Breakthroughs  │
                         └──────────────────┘
```

---

## Key Routes Summary

| Route | Component | Purpose |
|-------|-----------|---------|
| `/mind-insurance` | MindInsuranceHub | Practice Hub (main entry) |
| `/mind-insurance/assessment` | IdentityCollisionAssessmentPage | Identity Collision quiz |
| `/mind-insurance/first-session` | FirstSessionPage | Protocol reveal experience |
| `/mind-insurance/coverage` | CoverageCenterPage | Protocol management |
| `/mind-insurance/vault` | VaultPage | My Evidence (recordings, patterns) |
| `/mind-insurance/chat` | MIOChatPage | AI chat interface |
| `/mind-insurance/mio-insights` | MIOInsightsPage | Insights thread |
| `/mind-insurance/protocol/:id` | ProtocolDetailPage | MIO protocol detail |
| `/mind-insurance/coach-protocol` | CoachProtocolDetailPage | Coach protocol detail |

---

## Success Metrics

### Onboarding Success
- `identity_collision_assessments.completed_at` set
- `mio_insight_protocols` record created
- User reaches Coverage Center

### Daily Engagement
- Practice completion rate
- Streak length
- Points accumulation

### Long-term Engagement
- Longest streak achieved
- Milestones unlocked
- Protocol completion rate
- Voice recordings captured

---

## Admin Capabilities

Both AssessmentGuard and IdentityCollisionGuard check for admin status:

```typescript
if (isAdmin) {
  // Can access any Mind Insurance page without assessments
  // Used for: testing, support, demonstrating features
}
```

---

*Document maintained by Purpose Waze Engineering Team*
