# Grouphomes4newbies - Complete Application Structure

## Overview

A multi-agent AI platform for group home training that helps aspiring entrepreneurs achieve $100K revenue through personalized education, mindset coaching, and financial guidance.

**Architecture**: Serverless React + Supabase
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Shadcn UI
- **Backend**: Supabase Edge Functions (Deno) - NO Express server
- **Database**: Supabase PostgreSQL (external, not local)
- **Auth**: Supabase Auth (email/password, magic link, Google OAuth)
- **Storage**: Supabase Storage (for document uploads)
- **AI**: OpenAI API (embeddings + chat completions)

---

## Three AI Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| **Nette** | Group Home Expert | Educational guide | 403+ tactics, state licensing, personalized roadmaps |
| **MIO** | Mind Insurance Oracle | Mindset coach | PROTECT practices, behavioral patterns, accountability |
| **ME** | Money Evolution Expert | Financial strategist | Funding, ROI calculations, cash flow optimization |

---

## What's Currently Working

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Working | Hero, features, CTAs |
| Authentication | Working | Email/password, Google OAuth |
| Email Verification | Working | Magic link flow |
| Assessment Flow | Working | 10-step questionnaire |
| Dashboard | Working | Progress overview, next tactic |
| Roadmap/Tactics | Working | 403+ tactics with filters |
| AI Chat (all 3 agents) | Working | RAG-powered with handoff |
| PROTECT Practices | Working | 7 daily exercises |
| Mind Insurance Hub | Working | Streaks, points, levels |
| Admin Dashboard | Working | Analytics, permissions |
| Document Management | Working | Upload, link to tactics |

### Known Blocker
**New User Signup** - Fails because `user_profiles` table is missing columns that the `handle_new_user()` trigger tries to insert. Run the SQL fix in Supabase to resolve.

---

## Page-by-Page Breakdown

### 1. Landing Page (`/`)
**Purpose**: Marketing page to convert visitors to signups

| Component | Input | Output |
|-----------|-------|--------|
| Hero Section | None | CTA buttons to `/auth` |
| Features Section | None | Display only |
| Auth Check | `AuthContext.user` | Shows "Go to Dashboard" if logged in |

---

### 2. Auth Page (`/auth`)
**Purpose**: User login and signup

| Input | Processing | Output/Destination |
|-------|------------|-------------------|
| Email + Password | `supabase.auth.signUp()` or `signInWithPassword()` | Creates `auth.users` record → Triggers `handle_new_user()` → Creates `user_profiles` row |
| Google OAuth button | `supabase.auth.signInWithOAuth()` | Redirects to Google → Returns to `/auth/callback` |
| Magic Link | `supabase.auth.signInWithOtp()` | Sends email → User clicks → `/auth/callback` |

**Data Flow**:
```
User submits form
  → Supabase Auth creates auth.users record
  → Database trigger handle_new_user() fires
  → Inserts into user_profiles table
  → Creates user_onboarding record
  → Redirects to /assessment (new users) or /dashboard (returning)
```

---

### 3. Assessment Page (`/assessment`)
**Purpose**: 10-step onboarding questionnaire to personalize the roadmap

| Step | Question | Data Collected |
|------|----------|----------------|
| 1 | Ownership Model | `ownershipModel`: own_operate, partner, investor |
| 2 | Target State | `targetState`: State code (CA, TX, etc.) |
| 3 | Property Status | `propertyStatus`: owned, leasing, looking, not-started |
| 4 | Immediate Priority | `immediatePriority`: property_acquisition, operations, scaling |
| 5 | Startup Capital | `capitalAvailable`: under-5k, 5k-15k, 15k-50k, over-50k |
| 6 | Target Populations | `targetPopulations`: elderly, disabled, mental-health, etc. |
| 7 | Caregiving Experience | `caregivingExperience`: none, personal, professional |
| 8 | Support Team | `supportTeam`: solo, family-help, hire-caregivers |
| 9 | Commitment Level | `commitmentLevel`: 1-10 scale |
| 10 | Primary Motivation | `primaryMotivation`: income, helping, flexibility |

**Data Flow**:
```
User completes assessment
  → assessmentService.calculateScores() computes:
      - financial_score, market_score, operational_score, mindset_score
      - overall_score (0-100)
      - readiness_level (foundation_building → expert_implementation)
  → assessmentService.saveAssessmentResults() writes to:
      - user_onboarding table (all answers + scores)
  → Updates user_onboarding.onboarding_step = 'assessment_complete'
  → Redirects to /dashboard
```

**Output Tables**:
- `user_onboarding` - Stores all assessment answers and computed scores

---

### 4. Dashboard (`/dashboard`)
**Purpose**: Main hub showing progress and next steps

| Component | Data Source (Input) | Display (Output) |
|-----------|---------------------|------------------|
| Welcome Modal | `user_onboarding.has_seen_welcome` | Shows once after assessment |
| Progress Card | `user_profiles.completed_tactics_count` | "X of 403 tactics completed" |
| Streak Counter | `user_profiles.current_streak` | "X day streak" |
| Points Display | `user_profiles.total_points` | Total points earned |
| Next Tactic Card | `usePersonalizedTactics()` hook | Smart-selected next recommended tactic |
| Business Profile Snapshot | `user_onboarding.*` | Entity name, state, property status |

**Data Flow**:
```
Dashboard loads
  → useAuth() gets current user
  → useUserProgress() fetches from gh_user_tactic_progress
  → usePersonalizedTactics() fetches from:
      - user_onboarding (assessment answers)
      - gh_tactic_instructions (all 403 tactics)
      - gh_user_tactic_progress (user's progress)
  → Filters tactics by:
      - User's budget, state, ownership model
      - Completed prerequisites
      - Current phase
  → Displays personalized next steps
```

---

### 5. Roadmap Page (`/roadmap`)
**Purpose**: Full 12-week tactic library with filters and progress tracking

| Feature | Input | Processing | Output |
|---------|-------|------------|--------|
| Week Selector | Click week 1-12 | Filters tactics | Shows tactics for that week |
| Search | Text input | Filters by name/description | Matching tactics |
| Category Filter | Dropdown | Filters by category | Filtered list |
| Status Filter | Dropdown | all/not-started/in-progress/completed | Filtered list |
| Start Tactic | Click button | `progressService.useStartTactic()` | Updates `gh_user_tactic_progress` |
| Complete Tactic | Click button | `progressService.useCompleteTactic()` | Updates progress + toast |
| Save Notes | Text input | `progressService.useSaveNotes()` | Saves to `gh_user_tactic_progress.notes` |

**Data Tables**:
- **READ**: `gh_tactic_instructions` (403 tactics), `user_onboarding` (filters), `gh_user_tactic_progress` (status)
- **WRITE**: `gh_user_tactic_progress` (status, notes, started_at, completed_at)

---

### 6. Chat Page (`/chat`)
**Purpose**: AI-powered conversations with Nette, MIO, or ME

| Input | Processing | Output |
|-------|------------|--------|
| User message | Sent to Supabase Edge Function `mio-chat` | AI response |
| Coach selector | Changes active agent | Different system prompt + knowledge base |

**Data Flow**:
```
User types message
  → Frontend calls supabase.functions.invoke('mio-chat')
  → Edge function:
      1. Generates embedding for message (OpenAI)
      2. Hybrid search: vector similarity + full-text + keywords
         - Nette: searches gh_training_chunks (403 tactics)
         - MIO: searches mio_knowledge_chunks
         - ME: searches funding/finance knowledge
      3. Builds context from top matches
      4. Calls OpenAI chat completion with context
      5. Checks for agent handoff (semantic similarity)
      6. Returns response + optional handoff suggestion
  → Frontend displays message
  → Stores conversation in agent_conversations table
```

**Data Tables**:
- **READ**: `gh_training_chunks`, `mio_knowledge_chunks`, `gh_tactic_instructions`
- **WRITE**: `agent_conversations`, `mio_chat_metrics`

---

### 7. PROTECT Page (`/protect`)
**Purpose**: Guided daily 7-step mindset practice

| Step | Letter | Practice | Data Captured |
|------|--------|----------|---------------|
| 1 | P | Pattern Check | Text: negative patterns identified |
| 2 | R | Reinforce Identity | Text: identity statement |
| 3 | O | Outcome Visualization | Text: success visualization |
| 4 | T | Trigger Reset | Number: pattern interruptions today |
| 5 | E | Energy Audit | Object: {morning, afternoon, evening} 1-10 |
| 6 | C | Celebrate Wins | Text: today's victories |
| 7 | T | Tomorrow Setup | Text: tomorrow's priorities |

**Data Flow**:
```
User completes each step
  → supabase.functions.invoke('save-practice')
  → Edge function:
      1. Validates input
      2. Calculates points (10-15 per practice)
      3. Checks time window (late = 50% points)
      4. Inserts into daily_practices
      5. Updates user_profiles.total_points
      6. Checks section completion (PRO, TE, CT)
      7. Updates streak if all 7 complete
  → Returns points earned + any MIO feedback
```

**Data Tables**:
- **WRITE**: `daily_practices`, `user_profiles` (points, streak)
- **READ**: `daily_practices` (check existing today)

---

### 8. Mind Insurance Hub (`/mind-insurance`)
**Purpose**: Dashboard for mindset practices, streaks, and gamification

| Component | Data Source | Display |
|-----------|-------------|---------|
| Today's Progress | `daily_practices` (today) | X/7 practices complete |
| Streak Counter | `user_profiles.daily_streak_count` | Current streak days |
| Total Points | `user_profiles.total_points` | Lifetime points |
| Championship Level | `user_profiles.championship_level` | BRONZE/SILVER/GOLD/PLATINUM |
| Latest Insight | `mio_user_insights` | Most recent AI insight |

**Championship Levels**:
- BRONZE: 0-999 points
- SILVER: 1000-4999 points
- GOLD: 5000-9999 points
- PLATINUM: 10000+ points

---

### 9. Admin Dashboard (`/admin`)
**Purpose**: Analytics and user management (Super Admin only)

| Feature | Data Source | Output |
|---------|-------------|--------|
| User Stats | `user_profiles` count | Total users, active users |
| Chat Metrics | `agent_conversations`, `mio_chat_metrics` | Messages, avg response time |
| Practice Stats | `daily_practices` | Completion rates by practice |
| Top Performers | `user_profiles` ordered by points | Leaderboard |
| Export Data | Various tables | CSV/JSON download |

**Data Tables**:
- **READ**: `admin_users`, `user_profiles`, `daily_practices`, `agent_conversations`, `mio_chat_metrics`
- **WRITE**: `admin_audit_log` (all actions logged), `admin_metrics_cache`

---

### 10. Document Management (`/admin/documents`)
**Purpose**: Upload and manage training documents for RAG

| Action | Input | Processing | Output |
|--------|-------|------------|--------|
| Upload PDF | File + category | Supabase Storage upload → Edge function processes → Chunks created | Document record in `gh_documents` |
| Link to Tactic | Document ID + Tactic ID | Creates link record | `gh_document_tactic_links` row |
| AI Suggestions | Document ID | Analyzes content → Suggests relevant tactics | Display suggestions |

**Data Tables**:
- **WRITE**: `gh_documents`, `gh_document_tactic_links`, `gh_training_chunks`
- **READ**: `gh_tactic_instructions` (for linking), `gh_document_tactic_suggestions`

---

## Complete Database Schema

### Core User Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | Extended user info | id, email, full_name, avatar_url, current_streak, total_points, championship_level |
| `user_onboarding` | Assessment + business profile | user_id, ownership_model, target_state, capital_available, overall_score, readiness_level |
| `gh_user_tactic_progress` | Per-tactic status | user_id, tactic_id, status, started_at, completed_at, notes |

### Practice Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `daily_practices` | PROTECT practice completions | user_id, practice_date, practice_type, data, points_earned, completed |
| `practice_streaks` | Streak history | user_id, streak_start, streak_end, streak_length |
| `mio_user_insights` | AI-generated insights | user_id, insight_type, content, created_at |

### Knowledge Base Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `gh_tactic_instructions` | 403 tactics master list | tactic_id, tactic_name, description, week, category, cost_range |
| `gh_training_chunks` | RAG chunks for Nette | id, content, embedding, tactic_id, chunk_type |
| `mio_knowledge_chunks` | RAG chunks for MIO | id, content, embedding, topic, source |
| `gh_documents` | Uploaded training docs | id, document_name, category, file_url, applicable_states |
| `gh_document_tactic_links` | Doc-to-tactic links | document_id, tactic_id, link_type |

### Chat Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agent_conversations` | Chat history | user_id, agent_type, message, response, created_at |
| `mio_chat_metrics` | Chat performance | conversation_id, response_time_ms, tokens_used |
| `mio_forensic_analysis` | Pattern analysis | user_id, analysis_type, findings |

### Admin Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `admin_users` | Admin role assignments | user_id, role (super_admin, admin, viewer) |
| `admin_audit_log` | All admin actions | admin_user_id, action_type, target_type, details |
| `admin_metrics_cache` | Cached analytics | metric_key, metric_value, expires_at |

---

## Supabase Edge Functions

| Function | Trigger | Input | Output |
|----------|---------|-------|--------|
| `mio-chat` | Chat message sent | `{ message, agent_type, user_id, conversation_id }` | `{ response, handoff_suggestion?, conversation_id }` |
| `save-practice` | PROTECT step completed | `{ user_id, practice_type, practice_date, data }` | `{ points_earned, section_complete?, feedback? }` |
| `get-analytics` | Admin dashboard load | `{ metric_type, time_range, filters }` | `{ data, cached }` |
| `analyze-document-metadata` | Document uploaded | `{ document_id, file_url }` | `{ chunks_created, tactic_suggestions }` |
| `populate-knowledge-base` | Manual trigger | `{ source, content }` | `{ chunks_inserted }` |
| `invalidate-cache` | Data changes | `{ cache_keys }` | `{ invalidated_count }` |

---

## Frontend Services Layer

| Service File | Purpose | Tables Accessed |
|--------------|---------|-----------------|
| `assessmentService.ts` | Calculate scores, save results | `user_onboarding` |
| `progressService.ts` | Start/complete tactics | `gh_user_tactic_progress` |
| `practiceService.ts` | PROTECT practices | `daily_practices`, `practice_streaks` |
| `documentService.ts` | Document CRUD | `gh_documents`, `gh_document_tactic_links` |
| `tacticFilterService.ts` | Filter tactics by user profile | `gh_tactic_instructions` |
| `businessProfileService.ts` | Update business profile | `user_onboarding` |
| `auditLogger.ts` | Log admin actions | `admin_audit_log` |
| `metricsCache.ts` | Cache analytics | `admin_metrics_cache` |

---

## Environment Variables Required

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend client |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Frontend client |
| `OPENAI_API_KEY` | OpenAI API access | Edge Functions (set in Supabase) |

---

## User Journey Flow

```
1. LANDING (/)
   └── Click "Get Started"

2. AUTH (/auth)
   └── Sign up with email/password or Google
   └── Trigger creates user_profiles record

3. ASSESSMENT (/assessment)
   └── Complete 10-step questionnaire
   └── Scores calculated, saved to user_onboarding
   └── Redirects to dashboard

4. DASHBOARD (/dashboard)
   ├── See personalized next tactic
   ├── View progress stats
   └── Navigate to:

5. ROADMAP (/roadmap)
   ├── Browse 403 tactics across 12 weeks
   ├── Filter by category, status, budget
   ├── Start tactics → Status: in_progress
   └── Complete tactics → Status: completed

6. CHAT (/chat)
   ├── Talk to Nette (tactics/licensing)
   ├── Talk to MIO (mindset/accountability)
   ├── Talk to ME (financing/funding)
   └── Agent handoff suggestions

7. MIND INSURANCE (/mind-insurance)
   ├── Daily PROTECT practices (7 steps)
   ├── Build streaks for points
   ├── Level up: Bronze → Silver → Gold → Platinum
   └── View AI-generated insights

8. ADMIN (/admin) - Super Admin only
   ├── View analytics dashboard
   ├── Manage documents
   └── Export data
```

---

*Last updated: November 2024*
