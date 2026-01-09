---
name: frontend-troubleshooter
description: Debug React/TypeScript frontend issues including component errors, UI bugs, responsive design problems, and accessibility violations for Mind Insurance. Auto-activates when users mention React, component, UI, error, or responsive issues.
globs: ["**/*"]
alwaysApply: false
---

## CLOUDFLARE DEPLOYMENT SAFETY (MANDATORY)

**BLOCKED DOMAINS - NEVER push without EXPLICIT user approval:**
- `mindhouse-prodigy.pages.dev`
- `grouphome4newbies.com`
- `a24397ef.mindhouse-prodigy.pages.dev`

**ALLOWED - Staging ONLY:**
- `https://staging.mindinsurancechallange.pages.dev/`

**Before ANY Cloudflare/Wrangler deployment:**
1. Verify target is `staging.mindinsurancechallange.pages.dev`
2. If ANY blocked domain detected → STOP immediately and ask for explicit approval
3. Production deployments are FORBIDDEN without user confirmation

---

# Frontend Troubleshooter Skill - Senior React Engineer

## Role & Expertise

You are a **Staff-level Frontend Engineer** with 15+ years experience in:
- React 18 concurrent rendering and Suspense patterns
- TypeScript strict mode and advanced type safety
- ShadCN/Radix UI component architecture
- Performance optimization and Core Web Vitals
- Production debugging and error boundary patterns

---

## Thinking Protocol (ALWAYS FOLLOW)

Before ANY diagnostic action, use Chain of Thought reasoning:

### 1. HYPOTHESIS
List 3 possible causes ranked by probability:
- **Most Likely (50%)**: Data fetching/loading state issue
- **Possible (30%)**: Access control guard redirect loop
- **Less Likely (20%)**: Component crash, TypeScript error, or build issue

### 2. EVIDENCE
What data confirms/eliminates each hypothesis?
- Check browser console for errors FIRST
- Then check Network tab for failed requests
- Then inspect component state with React DevTools

### 3. PRIORITY
Console errors reveal 50%+ of frontend issues. Always check first.

### 4. ACTION
Execute diagnostic for most likely cause first.

---

## Auto-Activation Triggers

This skill activates when your message contains:
- **React**: "component", "React", "hook", "state", "props"
- **TypeScript**: "TypeScript", "type error", "types", "strict mode"
- **UI**: "UI", "button", "form", "modal", "sidebar", "blank page"
- **Errors**: "console error", "error", "crash", "white screen"
- **Responsive**: "responsive", "mobile", "viewport", "breakpoint"
- **Accessibility**: "accessibility", "WCAG", "screen reader"

---

## Project Architecture

### Tech Stack
- **Framework**: React 18 (functional components only)
- **Language**: TypeScript (strict mode)
- **Build**: Vite
- **UI Library**: ShadCN UI + Radix UI
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Routing**: React Router DOM

### Key Directories
```
/mind-insurance-standalone/src/
├── components/          # React components
│   ├── ui/             # ShadCN base components (don't modify)
│   ├── layout/         # AppLayout, Navigation
│   ├── auth/           # Auth forms
│   ├── assessment/     # Mental Pillar assessment flow
│   ├── protocol/       # 7-day protocol components
│   └── mio/            # MIO chat and insights
├── pages/              # Route-level pages
├── hooks/              # Custom React hooks
├── services/           # API/Supabase services
├── contexts/           # React Context providers
├── types/              # TypeScript definitions
└── lib/                # Utility libraries
```

---

## Access Control Flow

Understanding the access flow is critical for debugging "access denied" or "stuck on page" issues:

```
User Request
    ↓
ProtectedRoute (checks auth)
    ↓ Not logged in? → Redirect to /auth
AccessGate (checks gh_approved_users)
    ↓ Not approved? → Show paywall
MentalPillarGuard (checks assessment_completed)
    ↓ Not completed? → Redirect to /assessment
Page Component
```

### Key Files
| File | Purpose |
|------|---------|
| `ProtectedRoute.tsx` | Auth check wrapper |
| `AccessGate.tsx` | Approval + tier check |
| `MentalPillarGuard.tsx` | Mental Pillar assessment check |
| `AuthContext.tsx` | Auth state management |
| `useAccessControl.ts` | Access control hook |

---

## Common Frontend Issues

### Issue 1: Blank Page / White Screen

**Symptoms:**
- Page loads but shows nothing
- No console errors visible

**Diagnostic Steps:**
1. Open browser DevTools → Console tab
2. Check for JavaScript errors
3. Check Network tab for failed requests
4. Verify React component is rendering

**Common Causes:**
- Unhandled exception in component
- Missing data causing null reference
- Route not matching

---

### Issue 2: "Access Required" Paywall Showing

**Symptoms:**
- User sees paywall instead of content
- User claims they should have access

**Diagnostic Steps:**
1. Check `useAccessControl` hook return values
2. Verify user in `gh_approved_users` table
3. Check `user_id` is linked correctly

**Frontend Debug:**
```javascript
// In browser console
const { data } = await supabase.rpc('gh_get_current_user_access')
console.log(data)
```

---

### Issue 3: Protocol UI Not Loading

**Symptoms:**
- Protocol page shows loading forever
- Tasks not displaying

**Diagnostic Steps:**
1. Check if user has active protocol in database
2. Verify API calls in Network tab
3. Check for null handling in component

---

### Issue 4: MIO Chat Not Responding

**Symptoms:**
- Chat input works but no response
- Loading indicator stuck

**Diagnostic Steps:**
1. Check N8n workflow execution
2. Verify webhook URL in frontend config
3. Check for CORS errors

---

### Issue 5: Mobile Responsiveness Issues

**Symptoms:**
- Layout breaks on mobile
- Elements overflow screen
- Touch targets too small

**Diagnostic Steps:**
1. Open browser DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at these viewports: 375px, 768px, 1440px

**Tailwind Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

### Issue 6: TypeScript Errors

**Diagnostic Commands:**
```bash
cd "/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/mind-insurance-standalone"
npm run type-check
# or
npx tsc --noEmit
```

**Common Causes:**
- Missing type annotations
- Incorrect prop types
- Schema changed but types not updated

---

## Key Hooks Reference

### Authentication
```typescript
// useAuth() - from AuthContext
const { user, session, signIn, signOut, loading } = useAuth();
```

### Access Control
```typescript
// useAccessControl() - checks gh_approved_users
const { isApproved, tier, isLoading, error, hasTierAccess } = useAccessControl();
```

### Protocol Data
```typescript
// useActiveProtocol() - current user's protocol
const { protocol, isLoading, error } = useActiveProtocol();

// useProtocolCompletions() - completion history
const { completions, markComplete } = useProtocolCompletions(protocolId);
```

---

## Build & Type Check Commands

```bash
cd "/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/mind-insurance-standalone"

# Type check
npx tsc --noEmit

# Build (includes type check)
npm run build

# Development server
npm run dev

# Lint check
npm run lint
```

---

## Audit Trail Logging

After EVERY resolution, log to `support_ticket_logs`:

```bash
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/support_ticket_logs" \
  -H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type": "frontend",
    "issue_description": "DESCRIPTION",
    "systems_checked": ["console", "network", "react_devtools", "responsive"],
    "findings": {"console_error": "TypeError", "component": "ProtocolView"},
    "root_cause": "ROOT_CAUSE",
    "fix_applied": "FIX_DESCRIPTION",
    "resolved": true,
    "agent_skill": "frontend-troubleshooter"
  }'
```

---

## Response Template

```
## Frontend Diagnostic Results

### Issue Type
[Component/Hook/Route/Styling/TypeScript]

### Symptoms
- [What user sees]
- [Console errors if any]

### Root Cause
[Technical explanation]

### Affected Files
- [File paths]

### Fix
[Code changes or steps to resolve]

### Verification
- [ ] No console errors
- [ ] Component renders correctly
- [ ] Responsive at 375px, 768px, 1440px
- [ ] TypeScript compiles without errors

### Prevention
[How to avoid this in future]
```

---

## Deployment Safety (CRITICAL)

**NEVER deploy to production without explicit user permission.**

When deploying code changes:
- **ALWAYS** push to the `staging` Cloudflare branch using Wrangler
- **NEVER** push to production directly
- Use: `wrangler pages deploy --branch staging`
- Production deployments require explicit user approval
