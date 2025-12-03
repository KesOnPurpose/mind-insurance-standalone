import { lazy } from 'react';

/**
 * Centralized lazy loading configuration for heavy components
 * This helps reduce the initial bundle size by splitting code
 */

// Page-level lazy loading
export const LazyPages = {
  // Heavy pages that should be loaded on demand
  AssessmentPage: lazy(() =>
    import(/* webpackChunkName: "assessment" */ '@/pages/AssessmentPage')
  ),

  RoadmapPage: lazy(() =>
    import(/* webpackChunkName: "roadmap" */ '@/pages/RoadmapPage')
  ),

  AnalyticsPage: lazy(() =>
    import(/* webpackChunkName: "analytics" */ '@/pages/AnalyticsPage')
  ),

  SettingsPage: lazy(() =>
    import(/* webpackChunkName: "settings" */ '@/pages/SettingsPage')
  ),
};

// Component-level lazy loading for heavy features
export const LazyComponents = {
  // Chart components (Recharts is ~95KB)
  ProgressChart: lazy(() =>
    import(/* webpackChunkName: "charts" */ '@/components/charts/ProgressChart')
  ),

  AnalyticsChart: lazy(() =>
    import(/* webpackChunkName: "charts" */ '@/components/charts/AnalyticsChart')
  ),

  // PDF components (PDF.js is ~250KB)
  PDFViewer: lazy(() =>
    import(/* webpackChunkName: "pdf" */ '@/components/pdf/PDFViewer')
  ),

  PDFUploader: lazy(() =>
    import(/* webpackChunkName: "pdf" */ '@/components/pdf/PDFUploader')
  ),

  // Heavy modals and dialogs
  DataExportModal: lazy(() =>
    import(/* webpackChunkName: "modals" */ '@/components/modals/DataExportModal')
  ),

  DetailedSettingsDialog: lazy(() =>
    import(/* webpackChunkName: "modals" */ '@/components/modals/DetailedSettingsDialog')
  ),

  // Rich text editors or heavy input components
  RichTextEditor: lazy(() =>
    import(/* webpackChunkName: "editor" */ '@/components/editor/RichTextEditor')
  ),
};

// Feature modules that can be loaded on demand
export const LazyFeatures = {
  // Complete feature modules
  AssessmentFeature: lazy(() =>
    import(/* webpackChunkName: "feature-assessment" */ '@/features/assessment')
  ),

  RoadmapFeature: lazy(() =>
    import(/* webpackChunkName: "feature-roadmap" */ '@/features/roadmap')
  ),

  AnalyticsFeature: lazy(() =>
    import(/* webpackChunkName: "feature-analytics" */ '@/features/analytics')
  ),

  AdminFeature: lazy(() =>
    import(/* webpackChunkName: "feature-admin" */ '@/features/admin')
  ),
};

/**
 * Preload a lazy component
 * Use this to preload components that are likely to be needed soon
 */
export function preloadComponent(component: any) {
  if (component && typeof component.preload === 'function') {
    component.preload();
  }
}

/**
 * Preload critical routes based on user role or navigation patterns
 */
export function preloadCriticalRoutes(userRole?: string) {
  // Preload based on user role
  if (userRole === 'admin') {
    preloadComponent(LazyFeatures.AdminFeature);
  }

  // Preload commonly accessed pages
  preloadComponent(LazyPages.AssessmentPage);

  // Preload after a delay to not block initial render
  setTimeout(() => {
    preloadComponent(LazyPages.RoadmapPage);
  }, 2000);
}

/**
 * Example usage in router:
 *
 * import { Suspense } from 'react';
 * import { LazyPages } from '@/utils/lazy-load-config';
 * import PageLoader from '@/components/PageLoader';
 *
 * <Route path="/assessment" element={
 *   <Suspense fallback={<PageLoader />}>
 *     <LazyPages.AssessmentPage />
 *   </Suspense>
 * } />
 */

/**
 * Example usage with preloading:
 *
 * import { preloadComponent, LazyPages } from '@/utils/lazy-load-config';
 *
 * // In a navigation component
 * <Link
 *   to="/assessment"
 *   onMouseEnter={() => preloadComponent(LazyPages.AssessmentPage)}
 * >
 *   Assessment
 * </Link>
 */