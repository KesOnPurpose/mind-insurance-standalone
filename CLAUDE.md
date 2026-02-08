# Mind Insurance Standalone - $100M Product

---

## GLOBAL AGENT REFERENCES (Workspace-Wide)

**These agents are available across ALL projects in the Purpose Waze workspace:**

### Brand & Strategy Agents (Always Available)

| Agent | Protocol File | When to Consult |
|-------|---------------|-----------------|
| **@brand-strategist** | `/Context/AGENT-BRAND-STRATEGIST.md` | Brand positioning, messaging, voice standards, category design |
| **@web-designer** | `/Context/AGENT-WEB-DESIGNER.md` | UI/UX, landing pages, visual identity, conversion optimization |

### Cross-Project Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| **BRAND-DNA.md** | `/Context/BRAND-DNA.md` | Complete brand bible, Keston's story, 3 Prisons, 4 Pillars |
| **AGENT-SECURITY-AUDITOR.md** | `/Context/AGENT-SECURITY-AUDITOR.md` | OWASP, SOC2, HIPAA - **VETO POWER** |
| **AGENT-QA-VALIDATOR.md** | `/Context/AGENT-QA-VALIDATOR.md` | Testing, accessibility, quality gates |
| **AGENT-SENIOR-REACT-DEVELOPER.md** | `/Context/AGENT-SENIOR-REACT-DEVELOPER.md` | React, TypeScript, mobile-first |
| **AGENT-BACKEND-ARCHITECT.md** | `/Context/AGENT-BACKEND-ARCHITECT.md` | Supabase, RLS, Edge Functions |
| **AGENT-N8N-WORKFLOW-ARCHITECT.md** | `/Context/AGENT-N8N-WORKFLOW-ARCHITECT.md` | N8n workflows, automation |
| **AGENT-DEVOPS-ENGINEER.md** | `/Context/AGENT-DEVOPS-ENGINEER.md` | Deployment, CI/CD, monitoring |
| **LOVABLE-STANDARDS.md** | `/Context/LOVABLE-STANDARDS.md` | Tech stack, code patterns |
| **QUALITY-GATES-FRAMEWORK.md** | `/Context/QUALITY-GATES-FRAMEWORK.md` | 6-gate quality pipeline |

### Marketing Agent Consultation Protocol

**All marketing agents MUST consult Brand Strategist before:**
- Creating new content batches
- Developing sales copy
- Designing email/SMS sequences
- Publishing authority-building content

**Reference**: See each agent's "Brand Strategist Consultation Protocol" section.

---

## DEFAULT AGENT: COO "Jaz"

**When you enter this project directory, the COO Agent "Jaz" activates by default.**

Jaz is the Master Orchestrator trained in EOS (Entrepreneurial Operating System) who:
- Translates vision into 90-day Rocks
- Orchestrates all 15 specialized agents
- Can push back on ideas that don't align with company goals
- Holds accountability via Scorecard and Rocks
- Approves production deployments (after Security clears)

**To invoke Jaz explicitly**: Reference EOS, Rocks, Scorecard, strategic decisions, or ask for orchestration.

**To bypass Jaz**: Directly invoke a specialized agent (e.g., `@senior-react-developer` for UI work).

**Full COO Protocol**: `/Context/AGENT-COO-JAZ.md`

---

## Project Overview

**Application**: Mind Insurance Standalone (mymindinsurance.com)
**Platform**: Lovable.dev
**Tech Stack**: React 18, TypeScript (strict), Vite, ShadCN UI, Tailwind CSS
**Database**: Supabase (`hpyodaugrkctagkrfofj.supabase.co`) - **SHARED with Grouphome**
**N8n Workflows**: `https://n8n-n8n.vq00fr.easypanel.host` - **SHARED with Grouphome**
**Sync Method**: GitHub ← → Lovable (bidirectional)

### User Source Tag System (CRITICAL)
**Filter for Mind Insurance users**: `user_profiles.user_source = 'mi_standalone'`
- `'mi_standalone'` = Mind Insurance app users (mymindinsurance.com)
- `'gh_user'` = Grouphome4newbies app users
- `'unknown'` = Legacy/unknown source

---

## CRITICAL: 18-Agent Team Architecture

**This is a $100M product. Development uses a TEAM of 18 specialized agents, not a single agent.**

**Current Constraint**: LEADS (all agents coordinate to support lead generation until solved)

### Agent Team Roster (18 Agents)

#### EXECUTIVE LAYER
| # | Agent | Special Power | Primary Focus |
|---|-------|---------------|---------------|
| 0 | **COO "Jaz"** | **DEFAULT AGENT** | EOS + Hormozi execution, orchestration, pushback authority |

#### PRODUCT TEAM (8 Agents)
| # | Agent | Special Power | Primary Focus |
|---|-------|---------------|---------------|
| 1 | **Coordinator** | Central governance | Task decomposition, conflict resolution |
| 2 | **Senior React Developer** | Visual validation | Components, TypeScript strict, mobile-first |
| 3 | **Backend/API Architect** | Database expertise | Supabase, RLS, Edge Functions, `mi_standalone` filtering |
| 4 | **Security Auditor** | **VETO POWER** | OWASP, SOC2, HIPAA, compliance |
| 5 | **QA Data Validator** | Release blocking | Testing, accessibility, zero-miss |
| 6 | **N8n Workflow Architect** | Chatbot expert | Workflows, automation, MIO/Nette/ME |
| 7 | **DevOps Engineer** | Deployment control | CI/CD, Cloudflare, monitoring |
| 8 | **Documentation Manager** | Synthesis power | ADRs, guides, knowledge base |

#### MARKETING & SALES TEAM (7 Agents) - EXPANDED
| # | Agent | Special Power | Primary Focus |
|---|-------|---------------|---------------|
| 9 | **Constraint Strategist** | Hormozi constraint diagnosis | LEADS/SALES/DELIVERY/PROFIT, 90-day Rocks |
| 10 | **Conversion Psychologist** | Grand Slam Offers | Value Equation, risk reversal, urgency |
| 11 | **Daily Content Engine** | 7AM/1PM/7PM content | 15 avatars, story/proof/solution |
| 12 | **Content Marketing** | Authority building | SEO clusters, viral content, brand voice |
| 13 | **Sales Copywriter** | VSL scripts | Grand Slam copy, price anchoring |
| 14 | **Lead Nurture** | Offer ladder | SMS/email sequences, retention |
| 15 | **Analytics/Attribution** | CFA tracking | Constraint metrics, A/B testing |

#### SUPPORT TEAM (2 Agents)
| # | Agent | Special Power | Primary Focus |
|---|-------|---------------|---------------|
| 16 | **Analytics Engineer** | Metrics insight | Dashboards, KPIs, cost tracking |
| 17 | **MIO Oracle Specialist** | Forensic psychology | Behavioral analysis, dropout risk, protocols |

### Agent Knowledge Base (ALWAYS Reference)

**Core Standards:**
1. **`/Context/LOVABLE-STANDARDS.md`** - Tech stack, code patterns, Lovable.dev compatibility
2. **`/Context/AGENT-LOVABLE-DEVELOPER.md`** - Development workflow, validation checklists

**Team Architecture:**
3. **`/Context/MULTI-AGENT-ARCHITECTURE.md`** - Full agent roster, orchestration patterns, conflict resolution
4. **`/Context/PARALLEL-EXECUTION-GUIDE.md`** - When to run agents in parallel (2x speedup)
5. **`/Context/QUALITY-GATES-FRAMEWORK.md`** - 6-gate quality pipeline, enterprise compliance

**Executive Layer:**
6. **`/Context/AGENT-COO-JAZ.md`** - **DEFAULT AGENT**, EOS framework, orchestration, pushback authority

**Specialized Agent Protocols:**
7. **`/Context/AGENT-SECURITY-AUDITOR.md`** - OWASP, SOC2, HIPAA, **VETO POWER**
8. **`/Context/AGENT-QA-VALIDATOR.md`** - Testing, accessibility, zero-miss detection
9. **`/Context/AGENT-COORDINATOR.md`** - Task decomposition, priority hierarchy
10. **`/Context/AGENT-BACKEND-ARCHITECT.md`** - Database schema, `mi_standalone` tag system
11. **`/Context/AGENT-N8N-WORKFLOW-ARCHITECT.md`** - N8n workflows, MIO chatbot
12. **`/Context/AGENT-MIO-ORACLE.md`** - 15 forensic capabilities, behavioral analysis
13. **`/Context/AGENT-DEVOPS-ENGINEER.md`** - Cloudflare Pages, Wrangler deployment
14. **`/Context/AGENT-ANALYTICS-ENGINEER.md`** - Metrics, dashboards, cost tracking

**Marketing & Sales Team (7 Agents - EXPANDED):**
15. **`/Context/AGENT-CONSTRAINT-STRATEGIST.md`** - Hormozi constraint diagnosis, 90-day Rocks, CFA
16. **`/Context/AGENT-CONVERSION-PSYCHOLOGIST.md`** - Grand Slam Offers, Value Equation, risk reversal
17. **`/Context/AGENT-DAILY-CONTENT-ENGINE.md`** - 7AM/1PM/7PM content, 15 avatars, story/proof/solution
18. **`/Context/AGENT-CONTENT-MARKETING.md`** - Authority building, SEO clusters, viral content
19. **`/Context/AGENT-SALES-COPYWRITER.md`** - VSL scripts, Grand Slam copy, price anchoring
20. **`/Context/AGENT-LEAD-NURTURE.md`** - Offer ladder sequences, retention, GHL workflows
21. **`/Context/AGENT-ANALYTICS-ATTRIBUTION.md`** - CFA tracking, constraint metrics, A/B testing

**Marketing Assets:**
22. **`/Context/Marketing-Assets/KESTON-STORIES.md`** - 36 personal stories by avatar
23. **`/Context/Marketing-Assets/CLIENT-TESTIMONIALS.md`** - 9 detailed client transformations + 44 Google reviews (53 total)
24. **`/Context/Marketing-Assets/AVATAR-CONTENT-HOOKS.md`** - 15 avatar pain hooks and CTAs

**Voice Guides (Keston's Authentic Voice):**
25. **`/Context/Marketing-Assets/VOICE-COURSE-CREATION.md`** - Calm authority, definition-first, progressive frameworks
26. **`/Context/Marketing-Assets/VOICE-LIVE-BOOTCAMPS.md`** - High energy, interactive, whiteboard method
27. **`/Context/Marketing-Assets/VOICE-SOCIAL-MEDIA.md`** - Scroll-stopping hooks, ellipses, pattern-interrupt

### Voice-to-Context Quick Reference

| Content Type | Primary Voice | Key Characteristics |
|--------------|---------------|---------------------|
| 7 AM Story Posts | Social Media | Scroll-stop hooks, ellipses, vulnerability |
| 1 PM Proof Posts | Social Media | Transformation metrics, capitalized emphasis |
| 7 PM Solution Posts | Social Media + Course | Hook + systematic framework |
| Ad Copy | Social Media | Pattern-interrupt, punchy rhythm |
| VSL Scripts | Course + Live Bootcamps | Definition-first + energy transitions |
| Webinar Scripts | Live Bootcamps | High energy, chat engagement |
| Email Sequences | Course Creation | Educational, progressive revelation |
| SMS Messages | Social Media | Ultra-short, ellipses, single CTA |
| Sales Pages | Course + Social Media | Body=educational, Headlines/CTAs=punchy |

### Troubleshooting Folder (Support & Diagnostics)

**`/Troubleshooting/CLAUDE.md`** - Master troubleshooting reference

**Slash Commands:**
| Command | Purpose |
|---------|---------|
| `/check-user [email]` | User access diagnostic |
| `/check-workflow [id]` | N8n workflow status |
| `/check-mio [user_id]` | MIO behavioral analysis (15 capabilities) |
| `/check-protocol [user_id]` | Protocol status and completions |
| `/diagnose [issue]` | Multi-system diagnostic |
| `/analyze-patterns` | Proactive pattern detection |

**Specialized Skills:**
| Skill | Expertise |
|-------|-----------|
| `ticket-resolver` | Customer support (15+ years) |
| `backend-diagnostician` | Supabase, RLS, Edge Functions |
| `frontend-troubleshooter` | React 18, TypeScript, Components |
| `n8n-workflow-debugger` | N8n automation, chatbot |
| `mio-behavioral-analyst` | 15 forensic capabilities, dropout detection |
| `protocol-debugger` | 7-day protocol lifecycle |

---

## AGENT DELEGATION PROTOCOL (CRITICAL)

**ALWAYS delegate to the appropriate specialized agent based on task type:**

### When to Use Each Agent

```
TASK TYPE                           → DELEGATE TO
─────────────────────────────────────────────────────────────
UI/Component/Styling/Responsive    → @senior-react-developer
Pattern/Insight/Behavioral/MIO     → @mio-mind-insurance-oracle
Database/Supabase/RLS/Schema       → Backend Architect (Context file)
N8n Workflows/Chatbot/Automation   → N8n Workflow Architect (Context file)
Deployment/Cloudflare/CI-CD        → DevOps Engineer (Context file)
Metrics/Analytics/KPIs             → Analytics Engineer (Context file)
Research/Multi-step/Code Search    → general-purpose
Codebase Exploration/File Search   → Explore
Planning/Analysis                  → Plan
Support Tickets/User Issues        → Troubleshooting skills

MARKETING TEAM (7 Agents - NEW):
─────────────────────────────────────────────────────────────
Constraint/LEADS/SALES/CFA         → Constraint Strategist (Context file)
Offers/Value Equation/Guarantees   → Conversion Psychologist (Context file)
7AM/1PM/7PM Content/Avatars        → Daily Content Engine (Context file)
Blog/SEO/Authority Building        → Content Marketing (Context file)
Sales Pages/VSL/Ad Copy            → Sales Copywriter (Context file)
SMS/Email/Offer Ladder             → Lead Nurture (Context file)
CAC/LTV/A/B Tests/CFA              → Analytics Attribution (Context file)
```

### Proactive Agent Usage

**@senior-react-developer** - Use AUTOMATICALLY when:
- Building React components
- TypeScript strict mode compliance
- ShadCN UI integration
- Tailwind CSS styling
- Visual validation needed
- Mobile-first responsive design

**@mio-mind-insurance-oracle** - Use AUTOMATICALLY when:
- Analyzing user behavioral patterns (15 forensic capabilities)
- Detecting dropout risk (3-day rule, Week 3 danger zone)
- Breakthrough probability scoring
- Identity collision analysis
- Forensic psychological insights
- Intervention protocol design
- Neural rewiring protocol generation

**Troubleshooting Skills** - Use when:
- User can't access the app → `/check-user [email]`
- Protocol stuck/not advancing → `/check-protocol [user_id]`
- MIO not responding → `/check-workflow 0qiaQWEaDXbCxkhK`
- User at dropout risk → `/check-mio [user_id]`
- System-wide issues → `/analyze-patterns`

### Parallel Agent Execution

**For maximum efficiency (2x+ speedup), launch multiple agents simultaneously for independent tasks:**

Example: "Build user settings page with security review"
1. @senior-react-developer → Component design
2. Explore → Check existing patterns
3. general-purpose → Security threat model

Example: "Diagnose user access issue"
1. `/check-user` → Auth chain diagnostic
2. `/check-protocol` → Protocol status
3. `/check-mio` → Behavioral analysis

**Read `/Context/PARALLEL-EXECUTION-GUIDE.md` for safe parallelization rules.**

---

## QUALITY GATE ENFORCEMENT

**Every change must pass through 6 quality gates (see `/Context/QUALITY-GATES-FRAMEWORK.md`):**

1. **Static Analysis** - TypeScript strict, ESLint, Prettier
2. **Testing** - Unit (>85%), Integration, E2E
3. **Security** - OWASP, npm audit, secret detection
4. **Performance** - <2s load, <200ms API p95, Lighthouse >90
5. **Accessibility** - WCAG AA, keyboard nav, screen reader
6. **User Approval** - ALWAYS ask before git push/deploy

**Security Agent has VETO POWER** - Can block any deployment with HIGH/CRITICAL issues.

---

## NON-NEGOTIABLE RULES

### 1. GitHub Push Approval (CRITICAL)
**NEVER push to GitHub without explicit user approval**

Before ANY git push:
- Summarize all changes made
- List files modified/created/deleted
- Show what the changes accomplish
- Ask: "Ready to push to GitHub? This will sync to Lovable."
- **WAIT for explicit user approval**

Acceptable approval phrases: "yes", "push", "approve", "go ahead", "confirmed"

### 2. Code Standards (ENFORCED)
```
EVERY file must follow:
[ ] React 18 functional components (NO class components)
[ ] TypeScript strict mode (NO any types without justification)
[ ] ShadCN UI components from @/components/ui/
[ ] Tailwind CSS utilities ONLY (NO custom CSS files)
[ ] @/ path aliases for ALL imports
[ ] Hooks in /src/hooks/
[ ] Services in /src/services/
[ ] Types in /src/types/
[ ] Error handling with try/catch
[ ] Loading states for async operations
[ ] Mobile-first responsive design
```

### 3. Visual Validation (REQUIRED)
After ANY UI changes:
- Screenshot at 375px (mobile)
- Screenshot at 768px (tablet)
- Screenshot at 1440px (desktop)
- Check browser console for errors
- Verify TypeScript compilation: `npx tsc --noEmit`

---

## Supabase Configuration

### CRITICAL: SHARED DATABASE WARNING

**This database is shared between TWO applications:**
- **Grouphomes4newbies** (this app) - grouphome4newbies.com
- **Mind Insurance** - Mental wellness/challenge app

**ANY database changes (triggers, migrations, schema) must be compatible with BOTH apps.**

**BEFORE making database changes:**
1. Read `DATABASE-CONFIG.md` in this repo
2. Check if change affects the `handle_new_user()` trigger
3. Ensure all new columns have DEFAULTs
4. Test that user creation still works for BOTH apps

**Project URL**: `https://hpyodaugrkctagkrfofj.supabase.co`

**Environment Variables** (in `.env.local`):
```bash
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Service Role Key** (for MCP/backend only, NEVER in client code):
```
$SUPABASE_SERVICE_ROLE_KEY
```

### Database Documentation

**Read these before making database changes:**
- `DATABASE-CONFIG.md` - Working trigger config, shared database rules
- `supabase/migrations/` - Migration history

---

## Project Structure (STRICT)

```
/
├── index.html                  # Vite entry (REQUIRED at root)
├── src/
│   ├── main.tsx               # App bootstrap
│   ├── App.tsx                # Root component
│   ├── index.css              # Tailwind directives
│   ├── components/
│   │   ├── ui/               # ShadCN components (don't modify)
│   │   └── [features]/       # Your components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom hooks
│   ├── contexts/              # React Context providers
│   ├── services/              # API/Supabase calls
│   ├── utils/                 # Helper functions
│   ├── types/                 # TypeScript definitions
│   └── lib/                   # Library configs (supabase client)
├── public/                    # Static assets
├── supabase/
│   └── migrations/           # Database migrations
├── Context/                   # Agent knowledge files (CRITICAL)
│   ├── LOVABLE-STANDARDS.md           # Tech stack & code patterns
│   ├── AGENT-LOVABLE-DEVELOPER.md     # Development workflow
│   ├── MULTI-AGENT-ARCHITECTURE.md    # Agent team roster & orchestration
│   ├── PARALLEL-EXECUTION-GUIDE.md    # Safe parallelization rules
│   ├── QUALITY-GATES-FRAMEWORK.md     # 6-gate quality pipeline
│   ├── AGENT-SECURITY-AUDITOR.md      # Security protocols (VETO POWER)
│   └── AGENT-QA-VALIDATOR.md          # Testing & accessibility
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── components.json            # ShadCN config
└── package.json
```

---

## Development Workflow

### Starting a Task
1. **Identify task type** - UI? Backend? Security? Research? Behavioral?
2. **Delegate to appropriate agent** (see Agent Delegation Protocol above)
3. Read relevant `/Context/` files for that task
4. Check existing patterns in codebase
5. Plan implementation with todo list if complex (3+ steps)
6. **Consider parallel agent execution** for independent subtasks

### During Development
1. Follow component templates exactly (LOVABLE-STANDARDS.md)
2. Use ShadCN components first
3. Extract logic into hooks
4. Extract API calls into services
5. Type everything properly (TypeScript strict)
6. Add loading and error states
7. **Run through quality gates** (QUALITY-GATES-FRAMEWORK.md)

### After Development
1. Run TypeScript check: `npx tsc --noEmit`
2. Take screenshots at mobile/tablet/desktop (375px, 768px, 1440px)
3. Check browser console for errors
4. Verify accessibility (WCAG AA)
5. Run security scan: `npm audit`
6. Git commit locally
7. **ASK for approval before pushing** (NON-NEGOTIABLE)

### Agent Coordination
- **UI changes** → @senior-react-developer validates with Playwright
- **Behavioral analysis** → @mio-mind-insurance-oracle analyzes patterns
- **Security concerns** → Follow AGENT-SECURITY-AUDITOR.md (can VETO)
- **Quality validation** → Follow AGENT-QA-VALIDATOR.md (can BLOCK release)

---

## Common Development Patterns

### Admin User Picker Pattern (CRITICAL REFERENCE)

When building admin features that need to list/select users, follow this exact pattern.

**Database Tables:**
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `gh_approved_users` | Source of approved users | `id`, `full_name`, `email`, `user_id` (FK), `tier`, `is_active` |
| `user_profiles` | User accounts | `id` (UUID) |
| `admin_users` | Admin permission check | `user_id`, `role`, `is_active` |

**Key Relationship**: `gh_approved_users.user_id` → `user_profiles.id`

**Edge Function**: `admin-group-management` with action `list_users`
- Bypasses RLS using service role
- Returns: `id`, `full_name`, `email`, `user_id`, `tier`
- Filters: `is_active=true` AND `user_id IS NOT NULL`

**Working Reference**: `src/components/admin/reports/UserGroupManager.tsx`

**Pattern to Follow:**
```typescript
// 1. FULL interface matching Edge Function response (don't drop fields!)
interface UserProfile {
  id: string;              // gh_approved_users.id (React key)
  full_name: string | null;
  email: string | null;
  user_id: string;         // FK to user_profiles.id (for targeting)
  tier: string;
}

// 2. Store API response DIRECTLY (no transformation!)
const result = await callAdminGroupAPI('list_users');
setUsers((result.data || []) as UserProfile[]);

// 3. Use user_id for targeting/FK relationships
const handleAddUser = (user: UserProfile) => {
  const newIds = [...selectedUserIds, user.user_id];  // NOT user.id!
  // ...
};

// 4. Make CommandItem value searchable (NOT UUID!)
<CommandItem
  key={user.id}
  value={`${user.full_name || ''} ${user.email || ''}`}  // Searchable text
  onSelect={() => handleAddUser(user)}
>
```

**Common Mistakes to AVOID:**
1. ❌ Missing fields in interface (causes undefined errors)
2. ❌ Transforming data (mapping `user_id` to `id` destroys FK relationship)
3. ❌ Using `user.id` instead of `user.user_id` for targeting
4. ❌ Setting `CommandItem value={UUID}` (search won't work - must be text)

---

### Component Template
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ComponentData } from '@/types';

interface Props {
  data: ComponentData;
  onAction?: () => void;
}

export const MyComponent = ({ data, onAction }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Button onClick={onAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
};
```

### Hook Template
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useMyData = (id: string) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('table')
          .select('*')
          .eq('id', id);
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return { data, isLoading, error };
};
```

---

## MCP Tools Available

### Supabase MCP
- Direct database queries
- Schema inspection
- RLS policy verification
- Real-time subscription testing

### Playwright MCP
- Screenshot validation (MANDATORY for UI)
- Responsive testing
- Console error detection
- Interactive element testing

### Context7 MCP
- Latest React/TypeScript docs
- ShadCN component documentation
- Tailwind CSS references

---

## GoHighLevel (GHL) Integration

### GHL Configuration

**Location ID**: `3KJeKktlnhQab7T0zrpM` (Mind Insurance sub-account)
**API Key**: `$GHL_API_KEY`
**API Version**: `2021-07-28`
**Base URL**: `https://services.leadconnectorhq.com`

### Available GHL Capabilities (via MCP)

All agents have access to GHL through the GoHighLevel MCP. Use these capabilities:

| Capability | MCP Tool | Purpose |
|------------|----------|---------|
| **Contacts** | `mcp__gohighlevel__*` | Search, create, update, delete contacts |
| **SMS** | `mcp__gohighlevel__send_sms` | Send SMS messages to contacts |
| **Email** | `ghl_email_send` | Send email campaigns |
| **Workflows** | `ghl_workflows_*` | Trigger and manage automation workflows |
| **Pipelines** | `ghl_pipelines_*` | Manage sales pipelines and opportunities |
| **Calendars** | `ghl_calendars_*` | View/manage appointments and availability |
| **Tags** | `ghl_tags_*` | Add/remove contact tags |
| **Custom Fields** | `ghl_customfields_*` | Manage custom field values |

### GHL Usage Examples

```yaml
# Search for a contact
Tool: mcp__gohighlevel__contacts_search
Parameters:
  locationId: "3KJeKktlnhQab7T0zrpM"
  email: "user@example.com"

# Send SMS
Tool: mcp__gohighlevel__send_sms
Parameters:
  locationId: "3KJeKktlnhQab7T0zrpM"
  contactId: "CONTACT_ID"
  message: "Your message here"

# Trigger workflow
Tool: ghl_workflows_trigger
Parameters:
  locationId: "3KJeKktlnhQab7T0zrpM"
  workflowId: "WORKFLOW_ID"
  contactId: "CONTACT_ID"
```

### MIO-Specific GHL Tags

| Tag | Purpose | When Applied |
|-----|---------|--------------|
| `mind-insurance` | Base product tag | On signup |
| `app-signup` | App registration | On signup |
| `mio-onboarding-started` | Assessment started | First assessment interaction |
| `mio-onboarding-complete` | Onboarding finished | Assessment + avatar complete |
| `mio-protocol-active` | In active protocol | Day 1 of protocol |
| `mio-protocol-complete` | Completed protocol | Day 7 completion |
| `mio-sms-opted-in` | SMS opt-in confirmed | User opted in |
| `mio-push-enabled` | Push notifications enabled | User enabled |
| `mio-high-risk-dropout` | 2+ days inactive | Detected by activity tracker |
| `mio-day3-celebration` | Day 3 milestone | Day 3 completion |
| `mio-7day-champion` | Full protocol completion | Day 7 completion |
| `mio-pattern-past-prison` | Past Prison pattern | Assessment result |
| `mio-pattern-success-sabotage` | Success Sabotage pattern | Assessment result |
| `mio-pattern-compass-crisis` | Compass Crisis pattern | Assessment result |

### Agent GHL Permissions

| Agent | GHL Access Level | Primary Use |
|-------|------------------|-------------|
| COO (Jaz) | Full (all capabilities) | Strategic oversight |
| Lead Nurture | Full (contacts, SMS, email, workflows) | Re-engagement campaigns |
| Sales Copywriter | Read (contacts, analytics) | Personalized copy |
| Content Marketing | Read (segments, performance) | Content strategy |
| Analytics/Attribution | Read (all metrics) | ROI tracking |
| N8n Workflow Architect | Full (webhooks, workflows) | Automation |

---

## Deployment & Environment Management

### DEPLOYMENT RESTRICTIONS (NON-NEGOTIABLE)

**STAGING ONLY**: `mindinsurancechallange.pages.dev`

**NEVER DEPLOY TO**:
- `mymindinsurance.com` (production - requires explicit CEO/user approval)
- `grouphome4newbies.com` (different product - NEVER touch)
- Any other domain

**BEFORE ANY DEPLOYMENT**:
1. Confirm target is `mindinsurancechallange.pages.dev`
2. Verify branch is `staging` (NOT `main`)
3. ASK user for approval: "Ready to deploy to STAGING (mindinsurancechallange.pages.dev)?"
4. **NEVER auto-deploy to production**

### Environment Overview

**Staging**: Development and testing environment (DEFAULT)
- Branch: `staging`
- Domain: https://mindinsurancechallange.pages.dev
- Cloudflare Pages Project: `mindinsurancechallange`
- **This is where ALL development work deploys**

**Production**: (RESTRICTED - requires explicit approval)
- Branch: `main`
- Domain: https://mymindinsurance.com
- **NEVER push without explicit CEO/user approval**
- When approved, say: "Deploying to PRODUCTION per explicit user request"

### Deployment Commands

```bash
# Deploy to STAGING ONLY (default allowed action)
npm run deploy:staging
# OR
wrangler pages deploy dist --project-name=mindinsurancechallange

# Deploy to PRODUCTION (REQUIRES EXPLICIT APPROVAL)
# ONLY run after user explicitly approves with phrases like:
# "deploy to production", "push to prod", "go live", "approved for production"
npm run deploy:production
```

### Deployment Workflow

#### Development on Staging (DEFAULT)
```bash
# 1. Switch to staging branch
git checkout staging

# 2. Make your changes
# ... development work ...

# 3. Commit changes
git add .
git commit -m "feat: Your feature description"

# 4. ASK for approval before pushing
# "Ready to push to staging branch?"

# 5. Push to staging branch (after user approval)
git push origin staging

# 6. Deploy to STAGING
wrangler pages deploy dist --project-name=mindinsurancechallange

# 7. Test at https://mindinsurancechallange.pages.dev
```

#### Promoting to Production (RARE - REQUIRES EXPLICIT APPROVAL)
```bash
# ONLY proceed after receiving explicit approval like:
# "deploy to production", "push to prod", "go live"

# 1. COO (Jaz) reviews and approves
# 2. Security Auditor clears (no VETO)
# 3. QA Validator signs off

# 4. Switch to main branch
git checkout main

# 5. Merge staging into main
git merge staging

# 6. Push to main (with explicit approval)
git push origin main

# 7. Deploy to production
npm run deploy:production

# 8. Verify at https://mymindinsurance.com
```

### Deployment Checklists

**Before deploying to STAGING**:
```
[ ] Target is mindinsurancechallange.pages.dev
[ ] Branch is staging
[ ] TypeScript compilation passes (npx tsc --noEmit)
[ ] No browser console errors
[ ] User has approved deployment
```

**Before deploying to PRODUCTION** (rare):
```
[ ] EXPLICIT user approval received (quote the approval)
[ ] All staging tests passed
[ ] Security audit complete (@security-auditor cleared)
[ ] QA validation complete (@qa-data-validator signed off)
[ ] COO (Jaz) has reviewed and approved
[ ] Document reason for production deployment
[ ] Mobile/tablet/desktop responsive tested
[ ] Performance acceptable (<2s load time)
[ ] Accessibility verified (WCAG AA)
[ ] Database migrations applied (if any)
```

### Rollback Procedure

If staging deployment has issues:

1. **Via Cloudflare Dashboard**:
   - Go to Workers & Pages → mindinsurancechallange → Deployments
   - Find the last working deployment
   - Click "⋯" menu → "Rollback to this deployment"

2. **Via Git**:
   ```bash
   git checkout staging
   git revert HEAD
   git push origin staging
   wrangler pages deploy dist --project-name=mindinsurancechallange
   ```

### Environment Variables

All environments use the same configuration (defined in `wrangler.toml`):
```toml
VITE_SUPABASE_URL = "https://hpyodaugrkctagkrfofj.supabase.co"
VITE_SUPABASE_ANON_KEY = "eyJhbG..."
VITE_API_URL = "https://mio-fastapi-production-production.up.railway.app"
VITE_N8N_WEBHOOK_URL = "https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat"
```

---

## Git Workflow

### Commit Messages
```
feat: Add user profile page
fix: Resolve authentication redirect
refactor: Extract login logic to hook
style: Update button spacing
docs: Add API documentation
```

### Branch Strategy
- `main` - Production (deploys to grouphome4newbies.com)
- `staging` - Staging/development (deploys to staging.grouphome4newbies.com)
- Feature branches for experimental changes
- Always pull latest before starting work

### Sync Cycle
```
Local Development (staging branch)
      ↓
  Git Commit
      ↓
  Ask User Approval
      ↓
  Git Push to staging (after approval)
      ↓
  Deploy to Staging
      ↓
  Test & Validate
      ↓
  Merge staging → main
      ↓
  Deploy to Production
      ↓
  Verify Live Site
```

---

## Validation Checklist (Use Before Every Push)

```
PRE-PUSH VALIDATION:
[ ] TypeScript passes (npx tsc --noEmit)
[ ] No browser console errors
[ ] Mobile responsive (375px)
[ ] Tablet responsive (768px)
[ ] Desktop responsive (1440px)
[ ] Loading states present
[ ] Error handling complete
[ ] ShadCN components used
[ ] Tailwind utilities only
[ ] @/ imports used
[ ] Accessibility checked
[ ] Feature works as intended
[ ] User has approved push
```

---

## Security Requirements

- Never expose service role key in client code
- Use anon key for client-side Supabase
- Rely on RLS policies for data security
- Validate all user inputs
- Sanitize rendered content
- Environment variables start with `VITE_`

---

## Performance Standards

- Mobile-first CSS (start small, scale up)
- Lazy load routes/components where beneficial
- Memoize expensive computations
- Clean up subscriptions in useEffect
- Optimize images in /public
- Minimize bundle size

---

## When You're Blocked

If you encounter issues:
1. Check TypeScript errors first
2. Verify Supabase connection
3. Check environment variables
4. Review existing patterns in codebase
5. Consult LOVABLE-STANDARDS.md
6. Ask user for clarification

---

## Mission

Build and scale this $100M Mind Insurance product with **world-class 18-agent team coordination**:

1. **Delegate intelligently** - Use specialized agents for their expertise
2. **Execute in parallel** - 2x+ speedup with safe parallelization
3. **Enforce quality gates** - Zero tolerance for security/accessibility violations
4. **Maintain compliance** - SOC2, HIPAA, GDPR, WCAG AA standards
5. **Preserve Lovable compatibility** - Every change syncs properly through GitHub
6. **Solve ONE constraint at a time** - Currently LEADS (Hormozi methodology)

**Core Principles:**
- This is a TEAM of 18 agents (1 Executive + 8 Product + 7 Marketing + 2 Support)
- Security agent has VETO POWER (can block any deployment)
- QA agent has BLOCK capability (can stop releases)
- Marketing Team EXPANDED (4 → 7 agents with Hormozi + Content frameworks)
- User approval required for all GitHub pushes (NO EXCEPTIONS)
- Every line of code must pass 6 quality gates

**Success Metrics:**
- Test coverage: >85%
- Security vulnerabilities: ZERO HIGH/CRITICAL
- Performance: <2s load, <200ms API p95
- Accessibility: WCAG AA compliant
- Bug escape rate: <1 per release
- **LEADS Constraint**: 50+ leads/week, CPL <$15, Assessment completion >60%

**Remember**:
- You are the orchestrator of a world-class 18-agent team
- Delegate to specialists for maximum quality
- Run parallel operations for maximum speed
- Enforce quality gates without compromise
- **Current constraint is LEADS** - all work supports lead generation
- **Marketing Team has 7 agents** - coordinate for maximum impact
- **User approval required for ALL GitHub pushes. No exceptions.**

---

## Future Infrastructure Migration Notes

### Database Migration (Planned)
**Current State**: Shared Supabase project with Grouphome
- Project URL: `https://hpyodaugrkctagkrfofj.supabase.co`
- Service Role Key: Shared (see credentials above)

**Future State**: Dedicated Mind Insurance Supabase project
- Project URL: `[NEW_MI_PROJECT_ID].supabase.co`
- Action Required: Update all API_KEY and BASE_URL references in:
  - `/Troubleshooting/.claude/skills/*/SKILL.md`
  - `/Troubleshooting/.claude/commands/*.md`
  - `/Troubleshooting/CLAUDE.md`
  - All Edge Functions and client code

### N8n Workflow Migration (Planned)
**Current State**: Shared N8n instance
- Instance URL: `https://n8n-n8n.vq00fr.easypanel.host`
- API Key: Shared with Grouphome

**Future State**: Dedicated Mind Insurance N8n instance
- Instance URL: `[NEW_MI_N8N_URL]`
- Action Required: Update all N8N_KEY and N8N_URL references in:
  - `/Troubleshooting/.claude/skills/n8n-workflow-debugger/SKILL.md`
  - `/Troubleshooting/.claude/commands/check-workflow.md`
  - `/Context/AGENT-N8N-WORKFLOW-ARCHITECT.md`

### Key Workflows to Migrate
| Workflow ID | Name | Priority |
|-------------|------|----------|
| `0qiaQWEaDXbCxkhK` | Unified Chat - MIO/Nette/ME | **CRITICAL** |
| `56JoMTczqhHS3eME` | MIO Weekly Report Generator | HIGH |
| `Sp5RhDpa8xFPnlWI` | MIO Insights Reply | HIGH |
| `niEwlbKoTiQF1sO9` | Protocol-Day-Advancement-Daily | HIGH |

---

## Phase 6: Faceless Brand Marketing Workflows

### Marketing Workflow IDs (Imported)

| Workflow ID | Name | Status | Purpose |
|-------------|------|--------|---------|
| `KeZ991JIVoXSI5az` | Mind Insurance Carousel Engine | ❌ INACTIVE | 7AM/1PM/7PM faceless carousels |
| `PLTBoumvdwCMN6zA` | Mind Insurance News-Driven Carousel Branch | ❌ INACTIVE | 11AM news-driven A/B test carousels |
| `WuZSXzPLkRZLNSq3` | Mind Insurance Daily Content Engine | ❌ INACTIVE | 7AM/1PM/7PM text posts via Postiz |
| `4PM6fa0QazN0VPvw` | Mind Insurance Testimonial Rotation | ❌ INACTIVE | Weekly testimonial cycling |
| `sAckF4SoXA6ZmaWW` | Mind Insurance Engagement Response | ❌ INACTIVE | Comment → DM → GHL lead capture |
| `w0hJPQk2vMVgQ8zr` | AI Avatar Posts | ❌ INACTIVE | HeyGen AI video → Blotato 9 platforms |
| `jlNjj1xcQLVZlH0Z` | Postiz scheduler for n8n | ❌ INACTIVE | Video scheduling via Postiz |

### Available Credentials in n8n

| Credential Name | Type | ID | Used By |
|-----------------|------|-----|---------|
| `Anthropic MIO API key` | anthropicApi | `jovA0WWYk5kBP683` | Content Engine, Testimonial |
| `Anthropic account` | anthropicApi | `3VRJZOH3YcwDFXsy` | Unified Chat |
| `OpenAi account` | openAiApi | `F8VBQaYL6g2IlKe3` | Unified Chat |
| `Postgres account` | postgres | `8NMb8xpnAv2CtCPV` | All MIO workflows |
| `Supabase account` | supabaseApi | `KHW1uhtY6Po3HSF6` | Unified Chat |
| `Supabase Service Key (MIO)` | httpHeaderAuth | `gb9hZTlvidHzPaI4` | HTTP requests |
| `Google Drive account` | googleDriveOAuth2Api | `ie56WbD7PHXu4vYZ` | Postiz scheduler |
| `Google Sheets account` | googleSheetsOAuth2Api | `lYIVPIEXJD6t9N1o` | Performance logging |

### Workflows Missing Credentials (Action Required)

**Carousel Engine (`KeZ991JIVoXSI5az`)**:
| Node | Missing Credential | Action |
|------|-------------------|--------|
| Generate Caption (Claude) | anthropicApi | Connect `Anthropic MIO API key` |
| Log to Performance Sheet | googleSheetsOAuth2Api | Connect `Google Sheets account` |
| Generate Cover Image (Leonardo AI) | httpHeaderAuth | Create `Leonardo AI API Key` |
| Generate Carousel (Blotato) | httpHeaderAuth | Create `Blotato API Key` |
| Publish to Instagram | httpHeaderAuth | Create `Instagram Graph API` |
| Publish to LinkedIn | httpHeaderAuth | Create `LinkedIn API` |
| WhatsApp Approval Request | httpHeaderAuth | Create `WhatsApp Cloud API` |

**News Carousel Branch (`PLTBoumvdwCMN6zA`)**:
| Node | Missing Credential | Action |
|------|-------------------|--------|
| Generate News Caption (Claude) | anthropicApi | Connect `Anthropic MIO API key` |
| Research Trending News (Perplexity) | httpHeaderAuth | Create `Perplexity API Key` |
| Log to A/B Test Sheet | googleSheetsOAuth2Api | Connect `Google Sheets account` |
| All Leonardo/Blotato/WhatsApp nodes | httpHeaderAuth | Same as Carousel Engine |

**AI Avatar Posts (`w0hJPQk2vMVgQ8zr`)**:
| Node | Missing Credential | Action |
|------|-------------------|--------|
| AI Research - Top 10/Report | perplexityApi | Create `Perplexity API Key` |
| AI Writer | openAiApi | Connect `OpenAi account` |
| Create Avatar Video (HeyGen) | httpHeaderAuth | Create `HeyGen API Key` |
| All Blotato nodes | blotatoApi | Create `Blotato API credentials` |
| Generate Motivational Quote | googleGeminiApi | Create `Google Gemini API Key` |
| Client Coaching Transcripts | googleDriveOAuth2Api | Connect `Google Drive account` |

### Credentials to Create (NEW)

| Service | API Type | Where to Get | Monthly Cost |
|---------|----------|--------------|--------------|
| **Leonardo AI** | HTTP Header Auth | [leonardo.ai](https://leonardo.ai) | ~$20-30/mo |
| **Blotato** | OAuth/API Key | [blotato.com](https://blotato.com) | $29/mo (Starter) |
| **HeyGen** | HTTP Header Auth | [heygen.com/api-pricing](https://heygen.com/api-pricing) | $99/mo (Pro) |
| **Perplexity** | API Key | [perplexity.ai](https://perplexity.ai) | ~$20/mo |
| **WhatsApp Cloud** | HTTP Header Auth | Meta Business Suite | Free (via GHL) |
| **Instagram Graph** | OAuth | Meta Business Suite | Free |
| **LinkedIn** | OAuth | LinkedIn Developer Portal | Free |

### Workflow Activation Checklist

**To activate each workflow:**

```
CAROUSEL ENGINE (KeZ991JIVoXSI5az):
[ ] Create Leonardo AI account → Add API key to n8n
[ ] Create Blotato account → Add API key to n8n
[ ] Connect Instagram Graph API (Meta Business)
[ ] Connect LinkedIn API
[ ] Connect WhatsApp Cloud API (or use GHL webhook)
[ ] Connect Google Sheets → Create "Carousels" sheet
[ ] Connect Anthropic → Use existing "Anthropic MIO API key"
[ ] Test schedule trigger (7AM/1PM/7PM timezone)
[ ] Activate workflow

NEWS CAROUSEL BRANCH (PLTBoumvdwCMN6zA):
[ ] Create Perplexity API key → Add to n8n
[ ] All Leonardo/Blotato/WhatsApp credentials (same as above)
[ ] Connect Google Sheets → Create "News Carousels" sheet
[ ] Test A/B tracking
[ ] Activate workflow

DAILY CONTENT ENGINE (WuZSXzPLkRZLNSq3):
[ ] Already has Anthropic connected ✅
[ ] Already has Google Sheets connected ✅
[ ] Update HTTP requests with correct Postiz API endpoint
[ ] Update WhatsApp approval webhook URL
[ ] Activate workflow

TESTIMONIAL ROTATION (4PM6fa0QazN0VPvw):
[ ] Already has Anthropic connected ✅
[ ] Already has Google Sheets connected ✅
[ ] Update HTTP requests with correct Postiz API endpoint
[ ] Activate workflow

ENGAGEMENT RESPONSE (sAckF4SoXA6ZmaWW):
[ ] Already has Google Sheets connected ✅
[ ] Update GHL API endpoint (location: 3KJeKktlnhQab7T0zrpM)
[ ] Update Instagram DM API endpoint
[ ] Set up webhook URL and share with social platforms
[ ] Activate workflow

AI AVATAR POSTS (w0hJPQk2vMVgQ8zr):
[ ] Create HeyGen account (Pro $99/mo) → Add API key
[ ] Create Blotato account → Configure all 9 platform nodes
[ ] Connect Perplexity API → For research nodes
[ ] Connect OpenAI → Use existing "OpenAi account"
[ ] Connect Google Drive → For coaching transcripts
[ ] Optionally add Google Gemini → For quote generation
[ ] Update HeyGen avatar_id and voice_id in Setup node
[ ] Activate workflow
```

### Jaz (COO) Workflow Management Commands

```bash
# List all marketing workflows
curl -s -X GET "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | jq '.data[] | select(.name | contains("Mind Insurance"))'

# Check workflow status
curl -s -X GET "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/{WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | jq '{name, active, updatedAt}'

# Activate a workflow
curl -s -X PATCH "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/{WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# Execute workflow manually
curl -s -X POST "https://n8n-n8n.vq00fr.easypanel.host/api/v1/workflows/{WORKFLOW_ID}/run" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"

# Check recent executions
curl -s -X GET "https://n8n-n8n.vq00fr.easypanel.host/api/v1/executions?workflowId={WORKFLOW_ID}&limit=5" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

### N8n API Key

```
$N8N_API_KEY
```

### WhatsApp Business API Credentials (For Future Use)

**Status**: Phone Number needs verification - currently bypassed in workflows

```
Access Token: $WHATSAPP_ACCESS_TOKEN
Phone Number ID: 934233539768975 (needs verification)
WhatsApp Business Account ID: 1967732063787123
Test Number: +1 555 185 4477
Recipient (Keston): +1 (347) 283-4717
```

**To Enable WhatsApp Approval Flow**:
1. Add production phone number in WhatsApp Manager: business.facebook.com/wa/manage
2. Verify phone number ownership
3. Reconnect workflow: Prepare Post Data → WhatsApp Approval → Create Instagram Container

### Active Instagram Workflows (Dec 24, 2025)

| Workflow ID | Name | Status | Mode |
|-------------|------|--------|------|
| `jrrr338cPLYsBWC3` | Instagram Direct Post | ✅ ACTIVE | Fully automated (WhatsApp bypassed) |
| `NbJrn2lPoFF3BuM1` | Instagram Carousel Post | ✅ ACTIVE | Webhook triggered |

**Direct Post Schedule**: 7 AM, 1 PM, 7 PM daily
**Carousel Webhook**: `POST https://n8n-n8n.vq00fr.easypanel.host/webhook/instagram-carousel`

### Phase 6 File References

| File | Purpose |
|------|---------|
| `/Context/FACELESS-BRAND-STRATEGY.md` | 80/20 faceless brand strategy |
| `/Context/CTA-STRATEGY.md` | CTA evolution & offer sequencing |
| `/Context/DISTRIBUTION-ARCHITECTURE.md` | Full content flywheel architecture |
| `/Context/Marketing-Assets/LEONARDO-PROMPTS.md` | AI image prompts by avatar |
| `/Context/Marketing-Assets/CAROUSEL-TEMPLATES.md` | Blotato template specs |
| `/n8n-workflows/carousel-engine.json` | Local workflow backup |
| `/n8n-workflows/news-carousel-branch.json` | Local workflow backup |
| `/n8n-workflows/daily-content-engine.json` | Local workflow backup |
| `/n8n-workflows/testimonial-rotation.json` | Local workflow backup |
| `/n8n-workflows/engagement-response.json` | Local workflow backup |

### Migration Checklist
```
DATABASE MIGRATION:
[ ] Create new Supabase project
[ ] Migrate schema (all MI-specific tables)
[ ] Update RLS policies
[ ] Migrate user data (WHERE user_source = 'mi_standalone')
[ ] Update all credentials in codebase
[ ] Test all Edge Functions
[ ] Verify MIO chatbot functionality

N8N MIGRATION:
[ ] Deploy new N8n instance
[ ] Export workflow configurations
[ ] Import to new instance
[ ] Update credentials (Supabase, Anthropic, etc.)
[ ] Test all 4 workflows
[ ] Update webhook URLs in frontend
[ ] Verify MIO chatbot responses
```

---

## Phase 6B: Postiz + Instagram OAuth Setup

### Self-Hosted Postiz Configuration

**Postiz URL**: `https://postiz-postiz.vq00fr.easypanel.host`
**Custom Domain**: `social.purposewaze.com` (DNS required)
**Easypanel Server IP**: `31.97.102.191`

### DNS Setup (Cloudflare - REQUIRED)

Add A record in Cloudflare for `purposewaze.com`:
```
Type: A
Name: social
IPv4: 31.97.102.191
Proxy: DNS only (gray cloud)
TTL: Auto
```

### Meta/Instagram OAuth Credentials

| Setting | Value |
|---------|-------|
| Meta App ID | `1134084322002708` |
| Instagram App ID | `26029558633329139` |
| Instagram App Secret | `$META_APP_SECRET` |
| Instagram Account | `kesonpurpose` (ID: `17841401031137742`) |

### Meta Developer Portal Configuration

**URL**: https://developers.facebook.com/apps/1134084322002708/settings/basic/

**App Domains**: Add `social.purposewaze.com`

**Facebook Login → Settings → Valid OAuth Redirect URIs**:
```
https://social.purposewaze.com/api/auth/callback/facebook
https://social.purposewaze.com/api/integrations/social/facebook/callback
```

**Instagram Basic Display → Valid OAuth Redirect URIs**:
```
https://social.purposewaze.com/api/auth/callback/instagram
https://social.purposewaze.com/api/integrations/social/instagram/callback
```

### Postiz Environment Variables (Easypanel)

Add to Postiz service in Easypanel → Environment:
```env
INSTAGRAM_APP_ID=26029558633329139
INSTAGRAM_APP_SECRET=$META_APP_SECRET
FACEBOOK_APP_ID=1134084322002708
FACEBOOK_APP_SECRET=$META_APP_SECRET
NEXT_PUBLIC_BACKEND_URL=https://social.purposewaze.com
BACKEND_INTERNAL_URL=https://social.purposewaze.com
FRONTEND_URL=https://social.purposewaze.com
```

### Postiz + n8n Integration

**Postiz API Endpoint**: `https://social.purposewaze.com/api`

Create n8n HTTP Header Auth credential:
- Name: `Postiz API`
- Header Name: `Authorization`
- Header Value: `Bearer {POSTIZ_API_TOKEN}`

Get API token from: Postiz → Settings → API Keys

### TikTok (SKIPPED - Complex Approval)

TikTok Developer credentials (saved for later):
```
Client Key: $TIKTOK_CLIENT_KEY
Client Secret: $TIKTOK_CLIENT_SECRET
```
Note: TikTok requires business verification and app approval. Skip for initial launch.

### Setup Completion Checklist

```
POSTIZ + INSTAGRAM SETUP:
[x] Postiz deployed in Easypanel ✅
[ ] DNS record added in Cloudflare (A → 31.97.102.191)
[ ] DNS propagation verified
[ ] Meta App Domains updated
[ ] Meta OAuth redirect URIs added
[ ] Postiz environment variables added
[ ] Postiz restarted after env changes
[ ] Instagram connected in Postiz
[ ] Test post to Instagram
[ ] Postiz API key generated
[ ] n8n credential created for Postiz
[ ] Workflows updated with Postiz endpoints
```
