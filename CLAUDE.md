# Mind Insurance Standalone - $100M Product

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

## CRITICAL: 10-Agent Team Architecture

**This is a $100M product. Development uses a TEAM of 10 specialized agents, not a single agent.**

### Agent Team Roster (10 Agents)

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
| 9 | **Analytics Engineer** | Metrics insight | Dashboards, KPIs, cost tracking |
| 10 | **MIO Oracle Specialist** | Forensic psychology | Behavioral analysis, dropout risk, protocols |

### Agent Knowledge Base (ALWAYS Reference)

**Core Standards:**
1. **`/Context/LOVABLE-STANDARDS.md`** - Tech stack, code patterns, Lovable.dev compatibility
2. **`/Context/AGENT-LOVABLE-DEVELOPER.md`** - Development workflow, validation checklists

**Team Architecture:**
3. **`/Context/MULTI-AGENT-ARCHITECTURE.md`** - Full agent roster, orchestration patterns, conflict resolution
4. **`/Context/PARALLEL-EXECUTION-GUIDE.md`** - When to run agents in parallel (2x speedup)
5. **`/Context/QUALITY-GATES-FRAMEWORK.md`** - 6-gate quality pipeline, enterprise compliance

**Specialized Agent Protocols:**
6. **`/Context/AGENT-SECURITY-AUDITOR.md`** - OWASP, SOC2, HIPAA, **VETO POWER**
7. **`/Context/AGENT-QA-VALIDATOR.md`** - Testing, accessibility, zero-miss detection
8. **`/Context/AGENT-COORDINATOR.md`** - Task decomposition, priority hierarchy
9. **`/Context/AGENT-BACKEND-ARCHITECT.md`** - Database schema, `mi_standalone` tag system
10. **`/Context/AGENT-N8N-WORKFLOW-ARCHITECT.md`** - N8n workflows, MIO chatbot
11. **`/Context/AGENT-MIO-ORACLE.md`** - 15 forensic capabilities, behavioral analysis
12. **`/Context/AGENT-DEVOPS-ENGINEER.md`** - Cloudflare Pages, Wrangler deployment
13. **`/Context/AGENT-ANALYTICS-ENGINEER.md`** - Metrics, dashboards, cost tracking

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

## Deployment & Environment Management

### Environment Overview

**Production**: Main user-facing application
- Branch: `main`
- Domain: https://grouphome4newbies.com
- Cloudflare Pages: https://mindhouse-prodigy.pages.dev

**Staging**: Development and testing environment
- Branch: `staging`
- Domain: https://staging.grouphome4newbies.com
- Cloudflare Pages: https://staging.mindhouse-prodigy.pages.dev

### Deployment Commands

```bash
# Deploy to staging (from staging branch)
npm run deploy:staging

# Deploy to production (from main branch)
npm run deploy:production

# Preview locally with staging config
npm run preview:staging

# Preview locally with production config
npm run preview:production
```

### Deployment Workflow

#### Development on Staging
```bash
# 1. Switch to staging branch
git checkout staging

# 2. Make your changes
# ... development work ...

# 3. Commit changes
git add .
git commit -m "feat: Your feature description"

# 4. Push to staging branch (after user approval)
git push origin staging

# 5. Deploy to staging environment
npm run deploy:staging

# 6. Test at https://staging.grouphome4newbies.com
```

#### Promoting to Production
```bash
# 1. Switch to main branch
git checkout main

# 2. Merge staging into main
git merge staging

# 3. Push to main (after user approval)
git push origin main

# 4. Deploy to production
npm run deploy:production

# 5. Verify at https://grouphome4newbies.com
```

### Environment Variables

All environments use the same configuration (defined in `wrangler.toml`):
```toml
VITE_SUPABASE_URL = "https://hpyodaugrkctagkrfofj.supabase.co"
VITE_SUPABASE_ANON_KEY = "eyJhbG..."
VITE_API_URL = "https://mio-fastapi-production-production.up.railway.app"
VITE_N8N_WEBHOOK_URL = "https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat"
```

**Note**: If you need different configs for staging vs production, update `wrangler.toml` with environment-specific sections.

### Cloudflare Pages Configuration

**Project Name**: `mindhouse-prodigy`
**Build Command**: `npm run build`
**Build Output**: `dist/`
**Framework**: Vite

**Custom Domains**:
- Production: `grouphome4newbies.com` (linked to main branch deployments)
- Staging: `staging.grouphome4newbies.com` (linked to staging branch deployments)

### Deployment Checklist

Before deploying to production:
```
[ ] All features tested on staging
[ ] TypeScript compilation passes (npx tsc --noEmit)
[ ] No browser console errors
[ ] Mobile/tablet/desktop responsive tested
[ ] Security audit clean (npm audit)
[ ] Performance acceptable (<2s load time)
[ ] Accessibility verified (WCAG AA)
[ ] User has approved deployment
[ ] Database migrations applied (if any)
```

### Rollback Procedure

If production deployment has issues:

1. **Via Cloudflare Dashboard**:
   - Go to Workers & Pages → mindhouse-prodigy → Deployments
   - Find the last working deployment
   - Click "⋯" menu → "Rollback to this deployment"

2. **Via Git**:
   ```bash
   git checkout main
   git revert HEAD  # or git reset --hard <previous-commit>
   git push origin main
   npm run deploy:production
   ```

### DNS Configuration

**Main Domain** (`grouphome4newbies.com`):
- Type: CNAME
- Name: `grouphome4newbies.com`
- Target: `mindhouse-prodigy.pages.dev`
- Proxy: Enabled (orange cloud)

**Staging Subdomain** (`staging.grouphome4newbies.com`):
- Type: CNAME
- Name: `staging`
- Target: `mindhouse-prodigy.pages.dev`
- Proxy: Enabled (orange cloud)

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

Build and scale this $100M Mind Insurance product with **world-class AI agent team coordination**:

1. **Delegate intelligently** - Use specialized agents for their expertise
2. **Execute in parallel** - 2x+ speedup with safe parallelization
3. **Enforce quality gates** - Zero tolerance for security/accessibility violations
4. **Maintain compliance** - SOC2, HIPAA, GDPR, WCAG AA standards
5. **Preserve Lovable compatibility** - Every change syncs properly through GitHub

**Core Principles:**
- This is a TEAM of agents, not a single agent
- Security agent has VETO POWER (can block any deployment)
- QA agent has BLOCK capability (can stop releases)
- User approval required for all GitHub pushes (NO EXCEPTIONS)
- Every line of code must pass 6 quality gates

**Success Metrics:**
- Test coverage: >85%
- Security vulnerabilities: ZERO HIGH/CRITICAL
- Performance: <2s load, <200ms API p95
- Accessibility: WCAG AA compliant
- Bug escape rate: <1 per release

**Remember**:
- You are the orchestrator of a world-class agent team
- Delegate to specialists for maximum quality
- Run parallel operations for maximum speed
- Enforce quality gates without compromise
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
