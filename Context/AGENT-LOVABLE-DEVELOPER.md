# Lovable.dev Developer Agent Protocol

**Agent Purpose**: Continue development on Lovable.dev applications while maintaining full platform compatibility
**Sync Method**: GitHub as bridge (Local → GitHub → Lovable auto-sync)
**Database**: Supabase (`hpyodaugrkctagkrfofj.supabase.co`)

---

## CRITICAL RULES (NON-NEGOTIABLE)

### 1. GitHub Push Protocol
**NEVER push to GitHub without explicit user approval**

Before ANY push:
1. Summarize ALL changes made
2. List files modified/created
3. Show git diff summary
4. Ask: "Ready to push these changes to GitHub? This will sync to Lovable."
5. **WAIT for user confirmation**
6. Only push after explicit "yes", "approve", "push", or similar

### 2. Code Compatibility
**Always reference `/Context/LOVABLE-STANDARDS.md` before writing code**

- React 18 functional components only
- TypeScript strict mode (no `any` without justification)
- ShadCN UI components from `@/components/ui/`
- Tailwind CSS utilities only
- `@/` path aliases for all imports
- Hooks in `/src/hooks/`
- Services in `/src/services/`
- Types in `/src/types/`

### 3. Before Starting ANY Task
```
PRE-TASK CHECKLIST:
[ ] Read LOVABLE-STANDARDS.md
[ ] Check current project structure
[ ] Identify affected components
[ ] Plan TypeScript interfaces
[ ] Consider mobile-first design
[ ] Plan error handling
```

---

## WORKFLOW STAGES

### Stage 1: Task Analysis
1. Understand the requirement fully
2. Identify which pages/components are affected
3. Check existing patterns in the codebase
4. Plan the implementation approach
5. Create todo list if >2 steps

### Stage 2: Implementation
1. Follow component structure template exactly
2. Use ShadCN components first (check available list)
3. Extract reusable logic into hooks
4. Extract API calls into services
5. Type everything properly (interfaces/types)
6. Add loading and error states
7. Implement mobile-first responsive design

### Stage 3: Validation
1. **TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with zero errors

2. **Visual Validation** (Playwright):
   - Screenshot at 375px (mobile)
   - Screenshot at 768px (tablet)
   - Screenshot at 1440px (desktop)
   - Check alignment, spacing, overflow

3. **Console Check**:
   - No errors in browser console
   - No warnings (unless documented as acceptable)
   - Network requests succeeding

4. **Functionality Check**:
   - Interactive elements work
   - Forms validate properly
   - Navigation functions correctly
   - Authentication flows complete

### Stage 4: Git Management
1. **Commit locally** (can do without approval):
   ```bash
   git add .
   git commit -m "feat: description of change"
   ```

2. **Before pushing** (REQUIRES APPROVAL):
   ```
   Summary of changes:
   - [List all modifications]
   - [Files created/modified]
   - [Features added/fixed]

   Ready to push to GitHub? This will sync to Lovable.
   ```

3. **Only after approval**:
   ```bash
   git push origin main
   ```

---

## COMPONENT CREATION PROTOCOL

### New Component Checklist
```
Creating: src/components/[ComponentName].tsx

[ ] TypeScript interface for props defined
[ ] Functional component structure
[ ] Hooks at top of component
[ ] ShadCN UI components used
[ ] Tailwind classes only (no custom CSS)
[ ] Loading state handled
[ ] Error state handled
[ ] Mobile-first responsive classes
[ ] Accessibility attributes present
[ ] Exported properly
```

### New Page Checklist
```
Creating: src/pages/[PageName].tsx

[ ] Route configured in App.tsx
[ ] Page title/meta handled
[ ] Authentication check if protected
[ ] Data fetching in useEffect or hook
[ ] Loading skeleton present
[ ] Error boundary consideration
[ ] SEO-friendly structure
```

### New Hook Checklist
```
Creating: src/hooks/use[HookName].ts

[ ] Clear interface for return type
[ ] Options interface if configurable
[ ] State management encapsulated
[ ] Side effects in useEffect
[ ] Cleanup on unmount
[ ] Error handling included
[ ] Loading state tracked
```

---

## SUPABASE OPERATIONS

### Query Pattern
```typescript
// Always handle errors explicitly
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) {
  console.error('Query failed:', error);
  throw new Error(`Failed to fetch: ${error.message}`);
}

return data;
```

### Real-time Subscription
```typescript
// Always clean up subscriptions
useEffect(() => {
  const channel = supabase
    .channel('channel-name')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  return () => {
    channel.unsubscribe(); // CRITICAL
  };
}, [dependencies]);
```

### Security Considerations
- Never use service role key in client code
- Always assume RLS is enforced
- Validate data before insert/update
- Handle authentication state properly

---

## ERROR HANDLING REQUIREMENTS

### Every Async Operation Must Have:
```typescript
try {
  setIsLoading(true);
  const result = await operation();
  // Success handling
} catch (error) {
  if (error instanceof Error) {
    console.error('Operation failed:', error.message);
    setError(error.message);
    // User-friendly notification
    toast.error('Something went wrong. Please try again.');
  }
} finally {
  setIsLoading(false);
}
```

### Form Validation:
```typescript
// Use Zod for schema validation
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
});
```

---

## UI/UX STANDARDS

### Responsive Breakpoints
- `sm:` = 640px+ (small tablets)
- `md:` = 768px+ (tablets)
- `lg:` = 1024px+ (laptops)
- `xl:` = 1280px+ (desktops)
- `2xl:` = 1536px+ (large screens)

### Mobile-First Examples
```tsx
// Start with mobile, enhance for larger
<div className="
  p-2 space-y-2           /* Mobile base */
  sm:p-3 sm:space-y-3     /* Small tablet */
  md:p-4 md:space-y-4     /* Tablet */
  lg:p-6 lg:space-y-6     /* Desktop */
">

// Grid that stacks on mobile
<div className="
  grid grid-cols-1        /* Mobile: single column */
  md:grid-cols-2          /* Tablet: 2 columns */
  lg:grid-cols-3          /* Desktop: 3 columns */
  gap-4
">
```

### Loading States (Required)
```tsx
// Skeleton loading
{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
) : (
  <ActualContent />
)}

// Button loading
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

---

## COMMON PATTERNS

### Protected Route
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### Data Fetching Hook
```typescript
// src/hooks/useData.ts
export const useData = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
```

---

## FILE NAMING CONVENTIONS

### Components
- PascalCase: `UserProfile.tsx`, `LoginForm.tsx`
- Index exports: `components/ui/index.ts` (optional)

### Hooks
- camelCase with "use" prefix: `useAuth.ts`, `useLocalStorage.ts`

### Services
- camelCase: `userService.ts`, `authService.ts`

### Types
- PascalCase for interfaces: `types/User.ts`
- camelCase for type files: `types/index.ts`

### Pages
- PascalCase: `Dashboard.tsx`, `UserSettings.tsx`

---

## DEBUGGING PROTOCOL

### When Errors Occur:
1. Check browser console for errors
2. Verify TypeScript compilation
3. Check network requests in DevTools
4. Verify Supabase queries
5. Check authentication state
6. Test in mobile view
7. Verify environment variables loaded

### Common Issues:
- **Import errors**: Check `@/` path alias in tsconfig
- **Type errors**: Ensure strict mode compliance
- **Supabase errors**: Check RLS policies
- **Routing issues**: Verify BrowserRouter wrapper
- **State issues**: Check Context provider hierarchy

---

## COMMUNICATION WITH USER

### Status Updates:
- Report progress on multi-step tasks
- Show screenshots after UI changes
- List files modified
- Explain technical decisions
- Highlight potential concerns

### Asking for Approval:
```
I've completed [task description].

Changes made:
- [List specific changes]

Files modified:
- [List files]

Screenshots show the result at mobile and desktop views.

Ready to push to GitHub? (This will sync to Lovable)
```

### When Blocked:
```
I've encountered an issue:
[Describe the problem]

Options:
1. [First option]
2. [Second option]
3. [Ask for clarification]

Which approach would you prefer?
```

---

## FINAL VERIFICATION BEFORE PUSH

```
PRE-PUSH CHECKLIST:
[ ] TypeScript compiles without errors
[ ] No console errors or warnings
[ ] Mobile view tested (375px)
[ ] Desktop view tested (1440px)
[ ] All new features work as expected
[ ] Error handling in place
[ ] Loading states present
[ ] Accessibility considered
[ ] Code follows LOVABLE-STANDARDS.md
[ ] Git commit messages are clear
[ ] User has approved push explicitly
```

---

## MCP TOOL USAGE

### Supabase MCP
- Query database directly for inspection
- Verify schema structure
- Check RLS policies
- Monitor real-time subscriptions

### Playwright MCP
- Screenshot validation (mandatory for UI)
- Test responsive behavior
- Check console errors
- Verify interactive elements

### Context7 MCP
- Fetch latest documentation
- Verify library usage patterns
- Check for breaking changes

---

**Remember**: You are maintaining a Lovable.dev application. Every line of code must be compatible with their platform. When in doubt, check LOVABLE-STANDARDS.md or ask the user for clarification.
