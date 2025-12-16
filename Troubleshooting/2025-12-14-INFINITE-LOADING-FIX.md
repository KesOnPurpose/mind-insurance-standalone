# Infinite Loading Screen Fix - December 14, 2025

## Issue Summary

**Problem**: Multiple users experiencing infinite loading spinners when accessing the app, preventing access to dashboard and assessment features.

**Root Cause**: NO timeout protection on loading states in critical access-control components (`useAccessControl`, `AccessGate`, `AssessmentGuard`).

**Impact**: Users stuck on loading screen indefinitely with no error message or recovery option.

**Resolution**: Implemented 10-second timeout protection across all critical loading components with graceful fallback UI.

---

## Affected Users

### Carol Newton-Smith
- **User ID**: `51aba34d-f5fa-4141-90d0-14ba32ab9fa0`
- **Email**: carol@example.com (check actual email in database)
- **Symptoms**: Logged in 6 times, 0 tactic progress, stuck on loading screen
- **Expected Behavior**: Should see dashboard or paywall
- **Access Status**: Verify in `gh_approved_users` table

### Cassandra Mackey
- **User ID**: `7282ebe1-4421-4bab-9f1a-a965e8a9b737`
- **Email**: cassandra@example.com (check actual email in database)
- **Symptoms**: Infinite loading spinner on app access
- **Root Cause**: NOT found in `gh_approved_users` table
- **Expected Behavior**: Should see Paywall component

---

## Technical Analysis

### Loading Chain Breakdown

```
DashboardPage
  → JourneyHeroSection
    → useJourneyContext
      → usePersonalizedTactics
        → RPC: gh_get_current_user_access (could hang indefinitely)
```

### Components Without Timeout Protection (Before Fix)

1. **`useAccessControl` hook**: RPC call to `gh_get_current_user_access` had no timeout
2. **`AccessGate` component**: Relied on `useAccessControl` without timeout fallback
3. **`AssessmentGuard` component**: Relied on `useOnboardingStatus` without timeout fallback

### Why This Happened

- Supabase RPC calls can hang due to:
  - Network issues
  - Database connection problems
  - Row-level security policy evaluation delays
  - Missing user records triggering infinite retry loops
- No timeout enforcement meant users waited indefinitely
- No error UI meant users couldn't self-recover

---

## Implementation Details

### Pattern Reference

The fix follows the existing timeout pattern established in:
```
/src/components/mind-insurance/IdentityCollisionGuard.tsx
```

**Standard Timeout Pattern**:
- 10-second timeout constant (`ACCESS_CHECK_TIMEOUT_MS = 10000`)
- `loadingTimedOut` state with `useState`
- `useEffect` with `setTimeout` that sets `loadingTimedOut = true` after 10s
- Graceful fallback UI with retry and refresh options
- Console warnings for debugging

---

## Files Modified

### 1. `useAccessControl.ts` Hook

**File**: `/src/hooks/useAccessControl.ts`

**Changes**:
```typescript
// Added timeout constant
const ACCESS_CHECK_TIMEOUT_MS = 10000; // 10 seconds

// Wrapped RPC call with Promise.race for timeout enforcement
const { data: accessData, isLoading, error, refetch } = useQuery({
  queryKey: ['user-access', user?.id],
  queryFn: async () => {
    const accessPromise = supabase.rpc('gh_get_current_user_access', {
      p_user_id: user!.id
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Access check timeout')), ACCESS_CHECK_TIMEOUT_MS)
    );

    const { data, error } = await Promise.race([accessPromise, timeoutPromise]);

    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
  retry: 1,
  staleTime: 30000
});
```

**Impact**:
- RPC calls now fail fast after 10 seconds instead of hanging indefinitely
- Added `refetch` alias for consistency with React Query pattern
- Retry limited to 1 attempt to prevent infinite loops

---

### 2. `AccessGate.tsx` Component

**File**: `/src/components/AccessGate.tsx`

**Changes**:
```typescript
// Added timeout state
const [loadingTimedOut, setLoadingTimedOut] = useState(false);

// Added timeout effect
useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
      console.warn('Access check timed out after 10 seconds');
    }, 10000);

    return () => clearTimeout(timer);
  } else {
    setLoadingTimedOut(false);
  }
}, [isLoading]);

// Added timeout UI
if (loadingTimedOut) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Connection Taking Longer Than Expected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're having trouble loading your access information.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button onClick={() => refetch()} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Impact**:
- Users see friendly timeout UI after 10 seconds
- "Try Again" button calls `refetch()` to retry access check
- "Refresh Page" button does full page reload as last resort
- Console warning logs for debugging

---

### 3. `AssessmentGuard.tsx` Component

**File**: `/src/components/AssessmentGuard.tsx`

**Changes**:
```typescript
// Added timeout state
const [loadingTimedOut, setLoadingTimedOut] = useState(false);

// Added timeout effect
useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
      console.warn('Assessment status check timed out after 10 seconds');
    }, 10000);

    return () => clearTimeout(timer);
  } else {
    setLoadingTimedOut(false);
  }
}, [isLoading]);

// Added timeout UI (same pattern as AccessGate)
if (loadingTimedOut) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Connection Taking Longer Than Expected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're having trouble loading your assessment status.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button onClick={() => refetch()} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Impact**:
- Same graceful timeout handling for assessment checks
- Uses `refetch` from `useOnboardingStatus` hook
- Consistent UX across all loading guards

---

## User Experience Improvements

### Before Fix
❌ Infinite loading spinner with no feedback
❌ No way to retry or recover
❌ Users forced to close browser and contact support
❌ No debugging information in console

### After Fix
✅ 10-second timeout with clear feedback
✅ "Try Again" button for quick retry
✅ "Refresh Page" button for full reset
✅ Console warnings for debugging
✅ Consistent UX across all loading states

---

## Testing Checklist

### Unit Testing
- [ ] Verify timeout triggers after exactly 10 seconds
- [ ] Verify timeout UI renders correctly
- [ ] Verify "Try Again" button calls `refetch()`
- [ ] Verify "Refresh Page" button reloads window
- [ ] Verify console.warn logs appear on timeout
- [ ] Verify timeout clears when loading completes early

### Integration Testing
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with Supabase RPC delays
- [ ] Test with missing user in `gh_approved_users`
- [ ] Test with valid user accessing dashboard
- [ ] Test with valid user accessing assessment
- [ ] Test timeout → retry → success flow

### User Acceptance Testing
- [ ] Carol Newton-Smith can access dashboard
- [ ] Cassandra Mackey sees Paywall (not in approved users)
- [ ] New users complete onboarding without hanging
- [ ] Existing users access dashboard within 3 seconds
- [ ] Mobile users see responsive timeout UI

### Browser Compatibility
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

---

## Debugging Guide

### Check User Access Status

```sql
-- Check if user is in approved users table
SELECT * FROM gh_approved_users
WHERE user_id = '51aba34d-f5fa-4141-90d0-14ba32ab9fa0';

-- Check user profile and tier
SELECT id, email, tier_level, subscription_tier, onboarding_completed
FROM user_profiles
WHERE id = '51aba34d-f5fa-4141-90d0-14ba32ab9fa0';

-- Check RPC function directly
SELECT * FROM gh_get_current_user_access('51aba34d-f5fa-4141-90d0-14ba32ab9fa0');
```

### Console Log Analysis

**Normal Loading** (should complete in <3 seconds):
```
[useAccessControl] Fetching access for user: 51aba34d-...
[useAccessControl] Access data loaded: { isApproved: true, ... }
```

**Timeout Scenario** (after 10 seconds):
```
[useAccessControl] Fetching access for user: 51aba34d-...
⚠️ Access check timed out after 10 seconds
```

**Error Scenario**:
```
[useAccessControl] Fetching access for user: 51aba34d-...
❌ Error fetching access: [Error details]
```

### Network Tab Analysis

1. Open DevTools → Network tab
2. Filter by "rpc" or "supabase"
3. Look for `gh_get_current_user_access` request
4. Check:
   - **Pending time**: Should be <3 seconds
   - **Status code**: Should be 200
   - **Response payload**: Should have `isApproved` field

### Common Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Timeout after 10s | Network issue or Supabase down | Check Supabase status dashboard |
| Immediate error | RLS policy blocking query | Verify user has proper permissions |
| Slow but completes | Database query optimization needed | Check RPC function indexes |
| Works on retry | Temporary network glitch | No action needed (timeout handles it) |

---

## Rollback Plan

If the timeout fix causes issues:

1. **Immediate Rollback**:
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Manual Rollback**:
   - Remove timeout constants from all three files
   - Remove `loadingTimedOut` state and useEffect
   - Remove timeout UI sections
   - Keep original loading UI

3. **Partial Rollback**:
   - Increase timeout from 10s to 30s if too aggressive
   - Disable timeout for specific components if needed

---

## Monitoring & Alerts

### Metrics to Track

1. **Timeout Rate**: % of users hitting 10-second timeout
   - Target: <1% of all access checks
   - Alert threshold: >5%

2. **Average Load Time**: Time for access checks to complete
   - Target: <2 seconds
   - Alert threshold: >5 seconds average

3. **Retry Success Rate**: % of users who succeed after "Try Again"
   - Target: >80%
   - Alert threshold: <50%

### Logging Implementation (Future)

```typescript
// Add to useAccessControl.ts
if (error) {
  console.error('[useAccessControl] Error:', {
    userId: user?.id,
    error: error.message,
    timestamp: new Date().toISOString()
  });

  // Send to analytics (e.g., Sentry, LogRocket)
  trackError('access_check_failed', { userId: user?.id, error });
}
```

---

## Related Documentation

- **Loading Pattern Guide**: `/Context/LOADING-PATTERNS.md` (if exists)
- **Access Control Flow**: `/Context/ACCESS-CONTROL-FLOW.md` (if exists)
- **Supabase RLS Policies**: Check Supabase dashboard for `gh_approved_users` policies
- **Identity Collision Guard**: `/src/components/mind-insurance/IdentityCollisionGuard.tsx` (original timeout pattern)

---

## Post-Fix Actions

### Immediate (Next 24 Hours)
- [ ] Monitor Carol Newton-Smith's next login attempt
- [ ] Monitor Cassandra Mackey's next login attempt
- [ ] Check Sentry/error logs for timeout occurrences
- [ ] Verify no new support tickets about loading screens

### Short-Term (Next Week)
- [ ] Analyze timeout rate across all users
- [ ] Optimize `gh_get_current_user_access` RPC function if needed
- [ ] Add automated tests for timeout scenarios
- [ ] Update user onboarding docs with troubleshooting steps

### Long-Term (Next Month)
- [ ] Implement loading time analytics
- [ ] Add health check for Supabase connection
- [ ] Consider implementing progressive loading (show partial UI while loading)
- [ ] Review all other hooks/components for missing timeout protection

---

## Prevention Checklist

To prevent similar issues in the future:

- [ ] **Standard Pattern**: Always use 10-second timeout for external API calls
- [ ] **Loading States**: Always provide timeout UI for loading states >3 seconds
- [ ] **Error Boundaries**: Wrap all async operations in error boundaries
- [ ] **Retry Logic**: Limit retries to 1-3 attempts to prevent infinite loops
- [ ] **Console Logging**: Add debug logs for all critical loading paths
- [ ] **Code Review**: Check for timeout protection in all PR reviews
- [ ] **Documentation**: Update component library with timeout pattern examples

---

## Appendix: Code Snippets

### Standard Timeout Hook Pattern

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const TIMEOUT_MS = 10000; // 10 seconds

export function useDataWithTimeout() {
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['your-data'],
    queryFn: async () => {
      const dataPromise = fetchYourData();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      );

      return await Promise.race([dataPromise, timeoutPromise]);
    },
    retry: 1,
    staleTime: 30000
  });

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimedOut(true);
        console.warn('Data fetch timed out');
      }, TIMEOUT_MS);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimedOut(false);
    }
  }, [isLoading]);

  return { data, isLoading, error, refetch, loadingTimedOut };
}
```

### Standard Timeout UI Component

```typescript
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TimeoutUIProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function TimeoutUI({
  title = "Connection Taking Longer Than Expected",
  message = "We're having trouble loading your information.",
  onRetry
}: TimeoutUIProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{message}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button onClick={onRetry} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Contact & Escalation

**Developer**: Check git commit history for this fix
**Support Team**: Use this doc to troubleshoot loading issues
**Emergency**: If timeout rate >10%, immediately check Supabase status and RPC function performance

---

**Last Updated**: December 14, 2025
**Version**: 1.0
**Status**: Active
**Next Review**: December 21, 2025
