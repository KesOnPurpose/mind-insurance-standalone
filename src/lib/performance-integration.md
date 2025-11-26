# Performance Monitoring Integration Guide

## Quick Start

### 1. Install Required Dependencies

```bash
npm install --save web-vitals
npm install --save-dev rollup-plugin-visualizer vite-plugin-compression
```

### 2. Add Performance Monitoring to Your App

In your `src/App.tsx` or `src/main.tsx`, add:

```typescript
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

function App() {
  // Initialize performance monitoring
  usePerformanceMonitoring();

  // Rest of your app code...
  return (
    <Router>
      {/* Your routes */}
    </Router>
  );
}
```

### 3. Track Feature Performance

For expensive components or features:

```typescript
import { useFeaturePerformance } from '@/hooks/usePerformanceMonitoring';

function AssessmentPage() {
  // Track this feature's performance
  useFeaturePerformance('assessment-page');

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

### 4. Track Data Loading Performance

For components that fetch data:

```typescript
import { useDataLoadPerformance } from '@/hooks/usePerformanceMonitoring';

function UserProfile() {
  const { data, isLoading } = useQuery('user-profile', fetchUserProfile);

  // Track data fetching performance
  useDataLoadPerformance('user-profile', isLoading);

  return (
    <div>
      {isLoading ? <Spinner /> : <Profile data={data} />}
    </div>
  );
}
```

## Available Scripts

### Build & Analysis

```bash
# Standard build
npm run build

# Build with bundle analysis (creates dist/stats.html)
npm run build:analyze

# Check bundle sizes after build
npm run size:check

# Full performance analysis (requires manual open of stats.html)
npm run perf:analyze
```

### Performance Monitoring

```bash
# Check web vitals and anti-patterns (run after build)
npm run perf:vitals
```

## Bundle Optimization Tips

### 1. Lazy Load Heavy Components

```typescript
import { lazy, Suspense } from 'react';

// Instead of direct import
// import AssessmentResults from './AssessmentResults';

// Use lazy loading
const AssessmentResults = lazy(() => import('./AssessmentResults'));

function AssessmentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AssessmentResults />
    </Suspense>
  );
}
```

### 2. Code Split Routes

```typescript
import { lazy } from 'react';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Roadmap = lazy(() => import('./pages/Roadmap'));

// Use in router
<Routes>
  <Route path="/dashboard" element={
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  } />
</Routes>
```

### 3. Optimize Radix UI Imports

```typescript
// ❌ Bad - imports entire library
import * as Dialog from '@radix-ui/react-dialog';

// ✅ Good - imports only what's needed
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
```

### 4. Optimize Large Libraries

```typescript
// For libraries like lodash
// ❌ Bad
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ Good
import debounce from 'lodash/debounce';
debounce(fn, 300);
```

## Performance Budgets

The application enforces these performance budgets:

- **Main bundle**: <500KB gzipped
- **Total initial load**: <800KB gzipped
- **Vendor chunks**: <300KB each
- **LCP**: <2.5s
- **FCP**: <1.8s
- **CLS**: <0.1

## Monitoring in Production

### Environment Variables

Add to your `.env.production`:

```env
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api/performance
```

### Analytics Integration

The performance library will automatically send metrics to your analytics endpoint in production:

```typescript
// Sent data structure
{
  metric: 'LCP',
  value: 2100,
  rating: 'good',
  timestamp: 1234567890,
  url: 'https://app.com/dashboard',
  userAgent: '...',
  connection: '4g'
}
```

## Debugging Performance Issues

### 1. Check Console in Development

The performance library logs detailed metrics in development:

```
✅ LCP: 2100ms (good)
✅ FCP: 1500ms (good)
⚠️ CLS: 0.12 (needs-improvement)
```

### 2. Use Performance Snapshot

```typescript
import { getPerformanceSnapshot } from '@/lib/performance';

// Get current metrics
const snapshot = getPerformanceSnapshot();
console.log(snapshot);
```

### 3. Mark Custom Events

```typescript
import { markPerformance } from '@/lib/performance';

// Track custom operations
markPerformance('complex-calculation-start');
// ... your code
markPerformance('complex-calculation-end', 'complex-calculation-start');
```

## Common Issues & Solutions

### Issue: Bundle size too large

**Solution**:
1. Run `npm run build:analyze`
2. Open `dist/stats.html`
3. Identify large dependencies
4. Implement code splitting or find lighter alternatives

### Issue: Slow initial load

**Solution**:
1. Check network tab for large assets
2. Implement lazy loading for routes
3. Optimize images (WebP format)
4. Enable compression on server

### Issue: Poor CLS (Layout Shift)

**Solution**:
1. Set explicit dimensions for images/videos
2. Avoid inserting content above existing content
3. Use CSS transforms instead of position changes
4. Preload fonts

### Issue: High FCP/LCP

**Solution**:
1. Reduce JavaScript bundle size
2. Preload critical resources
3. Optimize server response time
4. Use CDN for static assets

## Next Steps

1. **Set up CI/CD checks**: Add bundle size checks to your CI pipeline
2. **Configure monitoring**: Set up real user monitoring in production
3. **Create dashboards**: Build performance dashboards for ongoing monitoring
4. **Regular audits**: Schedule monthly performance reviews

## Support

For issues or questions about performance monitoring:
1. Check the console for detailed error messages
2. Review the PERFORMANCE-BASELINE.md document
3. Run `npm run perf:vitals` for automated checks
4. Contact the DevOps team for infrastructure issues