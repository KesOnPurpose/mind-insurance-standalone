# Grouphomes4newbies - Application Structure

## Overview

A multi-agent AI platform for group home training that helps aspiring entrepreneurs achieve $100K revenue through personalized education, mindset coaching, and tactical guidance.

**Architecture**: Serverless (React + Supabase)
- **Frontend**: React/Vite with TypeScript
- **Backend**: Supabase Edge Functions (no traditional server)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password, magic link, Google OAuth)

---

## Three AI Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| **Nette** | Group Home Expert | Educational guide | 403+ tactics, state licensing, personalized roadmaps |
| **MIO** | Mind Insurance Oracle | Mindset coach | PROTECT practices, behavioral patterns, accountability |
| **ME** | Money Evolution Expert | Financial strategist | Funding, ROI calculations, cash flow optimization |

---

## Page Structure

### Public Pages (No Auth Required)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing Page | Marketing hero, features overview, sign-up CTA |
| `/auth` | Auth Page | Login/signup with password, magic link, or Google |
| `/forgot-password` | Forgot Password | Password reset request |
| `/reset-password` | Reset Password | Set new password |
| `/verify-email` | Email Verification | Email confirmation landing |

---

### Protected Pages (Auth Required)

#### Core User Journey

| Route | Page | Purpose |
|-------|------|---------|
| `/assessment` | Assessment Page | 10-step onboarding questionnaire (target population, state, budget, commitment level) |
| `/avatar-assessment` | Avatar Assessment | User profile/avatar setup |
| `/dashboard` | Dashboard | Main hub - progress overview, next tactic, streak stats, welcome modal for new users |
| `/roadmap` | Roadmap Page | Full 12-week tactic library (403+ tactics), filters, progress tracking, journey map |
| `/chat` | Chat Page | AI agent conversations with Nette, MIO, or ME - includes handoff suggestions |
| `/model-week` | Model Week | Weekly schedule planner for time-blocking tactics |
| `/profile` | Profile Page | User profile management |
| `/settings` | Settings Page | App preferences and configuration |

---

#### Mind Insurance System (MIO's Domain)

| Route | Page | Purpose |
|-------|------|---------|
| `/mind-insurance` | Mind Insurance Hub | Dashboard for mindset practices, streak tracking, championship level |
| `/mind-insurance/practice` | Practice Page | Daily PROTECT practice session |
| `/mind-insurance/championship` | Championship | Gamification - levels, achievements, leaderboards |
| `/mind-insurance/insights` | Insights | AI-generated behavioral insights from MIO |
| `/mind-insurance/vault` | Vault | Saved insights and breakthroughs |

---

#### PROTECT Daily Practices

Seven individual practice pages (each letter of PROTECT):

| Route | Letter | Practice |
|-------|--------|----------|
| `/mind-insurance/practices/pattern-check` | P | Identify negative patterns |
| `/mind-insurance/practices/reinforce-identity` | R | Identity statement reinforcement |
| `/mind-insurance/practices/outcome-visualization` | O | Visualize success |
| `/mind-insurance/practices/trigger-reset` | T | Count pattern interruptions |
| `/mind-insurance/practices/energy-audit` | E | Rate energy levels (morning/afternoon/evening) |
| `/mind-insurance/practices/celebrate-wins` | C | Log daily victories |
| `/mind-insurance/practices/tomorrow-setup` | T | Plan tomorrow's priorities |

---

#### Admin Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Admin Dashboard | Analytics, permissions, user management (Super Admin only) |
| `/admin/documents` | Document Management | Upload/manage training documents for RAG system |

---

### Demo/Test Pages

| Route | Purpose |
|-------|---------|
| `/protocol-demo` | Interactive glossary demonstration |
| `/chat-demo` | Chat testing without auth |
| `/test-sse` | SSE streaming diagnostics |
| `/test-tooltip` | Glossary tooltip testing |
| `/populate-kb` | Knowledge base population utility |

---

## Key Features

### Personalization System
- **Assessment-driven**: Initial questionnaire determines starting week (1-12), recommended tactics, and priority order
- **State-specific**: Licensing requirements filtered by user's target state
- **Budget-aware**: Tactics filtered by user's available startup capital
- **Critical path**: Identifies blocked tactics and prerequisites

### PROTECT Practice System
- Daily 7-step mindset routine
- Streak tracking and points system
- Championship levels (Bronze → Silver → Gold → Platinum)
- MIO analyzes patterns and provides AI insights

### RAG-Powered Chat
- Hybrid search: 60% vector embeddings + 20% full-text + 20% pattern matching
- Agent handoff suggestions (e.g., "This sounds like a mindset block, want to talk to MIO?")
- Conversation memory within sessions

### Progress Tracking
- 403+ tactics across 12 model weeks
- Status: Not Started → In Progress → Completed
- Notes per tactic
- Weekly progress visualization
- Budget tracker for startup costs

---

## Database Tables (Key)

| Table | Purpose |
|-------|---------|
| `user_profiles` | Extended user info, streak, points, championship level |
| `user_onboarding` | Assessment answers, business profile |
| `gh_user_tactic_progress` | Per-tactic status and notes |
| `daily_practices` | PROTECT practice completions |
| `mio_user_insights` | AI-generated behavioral insights |
| `gh_training_chunks` | RAG knowledge base chunks |
| `mio_knowledge_chunks` | MIO-specific knowledge base |
| `admin_users` | Admin role assignments |

---

## Supabase Edge Functions

| Function | Purpose |
|----------|---------|
| `mio-chat` | MIO agent conversation handler with RAG |
| `get-analytics` | Admin analytics data |
| `save-practice` | Store PROTECT practice data |
| `analyze-document-metadata` | Document processing for RAG |
| `invalidate-cache` | Cache management |

---

## Component Architecture

```
src/
├── components/
│   ├── admin/         # Admin dashboard components
│   ├── auth/          # Login forms
│   ├── chat/          # Chat UI, coach selector, handoff
│   ├── dashboard/     # Dashboard widgets
│   ├── documents/     # Document management
│   ├── layout/        # AppLayout, navigation
│   ├── mind-insurance/ # PROTECT practice components
│   ├── modals/        # Strategy update, skip assessment
│   ├── onboarding/    # Welcome modal, progress stepper
│   ├── protocol/      # Glossary tooltips
│   ├── roadmap/       # Tactic cards, week cards, journey map
│   ├── ui/            # Shadcn UI primitives
│   └── voice/         # Voice recording components
├── contexts/
│   ├── AuthContext    # User authentication state
│   ├── AdminContext   # Admin permissions
│   └── ProductContext # Current product (grouphome/mind-insurance/me-wealth)
├── hooks/             # Custom React hooks
├── services/          # API service layer
└── types/             # TypeScript definitions
```

---

## User Flow Summary

```
Landing → Auth → Assessment (10 steps) → Dashboard
                                              ↓
         ┌──────────────────────────────────────────────────┐
         │                                                  │
         ↓                                                  ↓
   Roadmap (Tactics)                              Mind Insurance
   - Browse 12 weeks                              - Daily PROTECT
   - Start/complete tactics                       - Streak tracking
   - Track progress                               - AI insights
         │                                                  │
         └────────────────→ Chat ←──────────────────────────┘
                     (Nette, MIO, or ME)
```

---

*Last updated: November 2024*
