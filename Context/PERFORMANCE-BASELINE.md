# Performance Baseline & Monitoring Guide

## Target Metrics (Quality Gate 4: Performance)

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: <2.5s ✅
- **FCP (First Contentful Paint)**: <1.8s ✅
- **TTI (Time to Interactive)**: <3.9s ✅
- **TBT (Total Blocking Time)**: <200ms ✅
- **CLS (Cumulative Layout Shift)**: <0.1 ✅

### Bundle Size Targets
- **Main Bundle**: <500KB gzipped
- **Vendor Chunks**: <300KB each
- **Route Chunks**: <100KB each
- **Total Initial Load**: <800KB gzipped

### Runtime Performance
- **Page Load Time**: <2s (3G network)
- **API Response p95**: <200ms
- **Lighthouse Score**: >90
- **Memory Usage**: <50MB initial, <100MB after navigation

## Current Bundle Analysis

### Estimated Sizes (Based on Dependencies)

#### Major Dependencies
```
React + React-DOM:          ~45KB gzipped
Radix UI (41 components):   ~150KB gzipped (if all imported)
Recharts:                   ~95KB gzipped
Supabase Client:            ~38KB gzipped
React Router:               ~12KB gzipped
React Hook Form:            ~25KB gzipped
Framer Motion:              ~49KB gzipped
PDF.js:                     ~250KB gzipped (lazy-loadable)
```

#### Problem Areas Identified
1. **AssessmentPage**: 50KB uncompressed - needs code splitting
2. **RoadmapPage**: 48KB uncompressed - needs optimization
3. **Radix UI**: Too many components imported - tree-shake unused
4. **PDF.js**: Should be lazy loaded only when PDFs are accessed

## Code Splitting Strategy

### Implementation Plan

#### 1. Route-Based Splitting (Implemented via Vite Config)
```typescript
// Already configured in vite.config.ts:
- react-vendor: React ecosystem
- radix-ui: All Radix components
- charts: Recharts isolation
- supabase: SDK isolation
- forms: Form libraries
- animation: Framer Motion
- pdf: PDF.js (lazy)
```

#### 2. Component-Level Splitting (To Implement)

**High-Priority Lazy Loading Targets:**
```typescript
// AssessmentPage - Split into chunks
const AssessmentQuestions = lazy(() => import('./AssessmentQuestions'));
const AssessmentResults = lazy(() => import('./AssessmentResults'));
const AssessmentProgress = lazy(() => import('./AssessmentProgress'));

// RoadmapPage - Split heavy visualizations
const RoadmapVisualization = lazy(() => import('./RoadmapVisualization'));
const MilestoneCards = lazy(() => import('./MilestoneCards'));
const ProgressCharts = lazy(() => import('./ProgressCharts'));

// PDF Components - Always lazy
const PDFViewer = lazy(() => import('./PDFViewer'));
const PDFUploader = lazy(() => import('./PDFUploader'));

// Heavy Modals/Dialogs
const SettingsDialog = lazy(() => import('./SettingsDialog'));
const DataExportModal = lazy(() => import('./DataExportModal'));
```

#### 3. Dynamic Imports for Features
```typescript
// Import only when feature is accessed
const loadPDFFeature = () => import('@/features/pdf');
const loadChartsFeature = () => import('@/features/charts');
const loadAnimationFeature = () => import('@/features/animation');
```

## Optimization Techniques

### 1. React Optimizations
- **React.memo** for expensive components
- **useMemo/useCallback** for expensive computations
- **Virtual scrolling** for long lists (>100 items)
- **Suspense boundaries** with loading states

### 2. Asset Optimizations
- **Images**: WebP format, lazy loading, responsive sizes
- **Fonts**: Subset, preload critical, font-display: swap
- **Icons**: SVG sprites or icon fonts (not individual SVGs)
- **CSS**: Critical CSS inline, non-critical deferred

### 3. Network Optimizations
- **Prefetch**: Next likely routes
- **Preconnect**: Supabase, CDNs
- **Cache**: Service worker for static assets
- **Compression**: Brotli > Gzip

### 4. Runtime Optimizations
- **Web Workers**: Heavy computations off main thread
- **RequestIdleCallback**: Non-urgent updates
- **Debounce/Throttle**: User input handlers
- **Intersection Observer**: Lazy loading triggers

## Monitoring Setup

### Development Monitoring
```typescript
// In main.tsx or App.tsx
import { initPerformanceMonitoring } from '@/lib/performance';

if (import.meta.env.DEV) {
  initPerformanceMonitoring({
    debug: true,
    reportToAnalytics: false,
  });
}
```

### Production Monitoring
```typescript
// In main.tsx or App.tsx
import { initPerformanceMonitoring } from '@/lib/performance';

if (import.meta.env.PROD) {
  initPerformanceMonitoring({
    debug: false,
    reportToAnalytics: true,
    analyticsEndpoint: '/api/analytics/performance',
  });
}
```

### Custom Performance Marks
```typescript
import { markPerformance } from '@/lib/performance';

// Mark important events
markPerformance('assessment-start');
// ... assessment logic
markPerformance('assessment-complete', 'assessment-start');

// Track component render performance
import { useRenderPerformance } from '@/lib/performance';

function ExpensiveComponent() {
  useRenderPerformance('ExpensiveComponent');
  // ... component logic
}
```

## Performance Testing Checklist

### Pre-Deployment
- [ ] Run `npm run build:analyze` - Check bundle sizes
- [ ] Run `npm run perf:analyze` - Review chunk distribution
- [ ] Run Lighthouse CI - Score must be >90
- [ ] Test on 3G network - Load time <3s
- [ ] Check memory leaks - Chrome DevTools Memory Profiler
- [ ] Verify lazy loading - Network tab shows deferred loading

### Post-Deployment
- [ ] Real User Monitoring (RUM) - Track actual user metrics
- [ ] Error rate <1% - Monitor Sentry/similar
- [ ] Core Web Vitals - All green in Search Console
- [ ] CDN hit rate >90% - Static assets cached
- [ ] API latency p95 <200ms - Backend monitoring

## Regression Prevention

### Automated Checks
1. **Bundle Size Action**: Fail if main bundle >600KB
2. **Lighthouse CI**: Fail if score <85
3. **Web Vitals Monitoring**: Alert if any metric degrades >10%
4. **Memory Profiling**: Weekly automated checks

### Manual Reviews
1. **Quarterly Performance Audit**: Full analysis
2. **Before Major Features**: Baseline measurement
3. **After Major Changes**: Impact assessment

## Quick Wins Implemented

1. ✅ **Vite Config Optimizations**
   - Manual chunk splitting
   - Terser minification
   - Tree shaking
   - Compression analysis

2. ✅ **Performance Monitoring Library**
   - Web Vitals tracking
   - Custom performance marks
   - Long task detection
   - Development debugging

3. ✅ **Build Analysis Tools**
   - Bundle visualizer
   - Size checking scripts
   - Compression reports

## Next Steps (Priority Order)

1. **Implement Lazy Loading** for AssessmentPage and RoadmapPage components
2. **Add Service Worker** for offline support and caching
3. **Optimize Images** - Convert to WebP, add responsive sizes
4. **Implement Virtual Scrolling** for long lists
5. **Add Lighthouse CI** to GitHub Actions
6. **Set up RUM** (Real User Monitoring) with analytics
7. **Create Performance Dashboard** for ongoing monitoring

## Performance Budget Enforcement

```javascript
// Add to vite.config.ts
build: {
  rollupOptions: {
    output: {
      // Enforce maximum chunk sizes
      maxParallelFileOps: 3,
      manualChunks(id) {
        // Existing logic...
        // Warn if chunk exceeds budget
        const stats = getChunkSize(id);
        if (stats.size > 500000) {
          console.warn(`⚠️ Chunk exceeds 500KB: ${id}`);
        }
      }
    }
  }
}
```

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Last Updated**: November 2024
**Next Review**: December 2024
**Owner**: DevOps Team