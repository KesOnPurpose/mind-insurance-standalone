# Lovable.dev Application Development

## Project Overview

**Application**: Grouphome App (Mind Insurance)
**Platform**: Lovable.dev
**Tech Stack**: React 18, TypeScript (strict), Vite, ShadCN UI, Tailwind CSS
**Database**: Supabase (`hpyodaugrkctagkrfofj.supabase.co`)
**Sync Method**: GitHub ← → Lovable (bidirectional)

---

## CRITICAL: Multi-Agent Team Architecture

**This is a $100M product. Development uses a TEAM of specialized agents, not a single agent.**

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

---

## AGENT DELEGATION PROTOCOL (CRITICAL)

**ALWAYS delegate to the appropriate specialized agent based on task type:**

### When to Use Each Agent

```
TASK TYPE                           → DELEGATE TO
─────────────────────────────────────────────────────────────
UI/Component/Styling/Responsive    → @senior-react-developer
Pattern/Insight/Behavioral/MIO     → @mio-mind-insurance-oracle
Research/Multi-step/Code Search    → general-purpose
Codebase Exploration/File Search   → Explore
Planning/Analysis                  → Plan
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
- Analyzing user behavioral patterns
- Detecting dropout risk
- Breakthrough probability scoring
- Identity collision analysis
- Forensic psychological insights
- Intervention protocol design

### Parallel Agent Execution

**For maximum efficiency (2x+ speedup), launch multiple agents simultaneously for independent tasks:**

Example: "Build user settings page with security review"
1. @senior-react-developer → Component design
2. Explore → Check existing patterns
3. general-purpose → Security threat model

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

**Project URL**: `https://hpyodaugrkctagkrfofj.supabase.co`

**Environment Variables** (in `.env.local`):
```bash
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Service Role Key** (for MCP/backend only, NEVER in client code):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ
```

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
