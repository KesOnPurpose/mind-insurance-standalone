import { useEffect } from 'react';
import { initPerformanceMonitoring, markPerformance, getPerformanceSnapshot } from '@/lib/performance';

/**
 * Hook to initialize performance monitoring for the application
 * Should be called once at the app root level
 */
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Initialize web vitals monitoring
    const config = {
      debug: import.meta.env.DEV,
      reportToAnalytics: import.meta.env.PROD,
      // Configure your analytics endpoint here
      analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
    };

    initPerformanceMonitoring(config);

    // Mark app initialization
    markPerformance('app-initialized');

    // Log performance snapshot in development
    if (import.meta.env.DEV) {
      // Wait for page to fully load before taking snapshot
      window.addEventListener('load', () => {
        setTimeout(() => {
          const snapshot = getPerformanceSnapshot();
          console.log('📊 Performance Snapshot:', snapshot);
        }, 1000);
      });

      // Monitor route changes
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        markPerformance('route-change-start');
        originalPushState.apply(history, args);
        requestAnimationFrame(() => {
          markPerformance('route-change-complete', 'route-change-start');
        });
      };

      history.replaceState = function(...args) {
        markPerformance('route-change-start');
        originalReplaceState.apply(history, args);
        requestAnimationFrame(() => {
          markPerformance('route-change-complete', 'route-change-start');
        });
      };
    }

    // Cleanup
    return () => {
      if (import.meta.env.DEV) {
        // Restore original history methods
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      }
    };
  }, []);
}

/**
 * Hook to track specific feature performance
 */
export function useFeaturePerformance(featureName: string) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const startMark = `${featureName}-start`;
      const endMark = `${featureName}-ready`;

      // Mark feature start
      markPerformance(startMark);

      // Mark when component is interactive
      requestAnimationFrame(() => {
        markPerformance(endMark, startMark);
      });
    }
  }, [featureName]);
}

/**
 * Hook to track data fetching performance
 */
export function useDataLoadPerformance(queryName: string, isLoading: boolean) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (isLoading) {
        markPerformance(`${queryName}-fetch-start`);
      } else {
        markPerformance(`${queryName}-fetch-complete`, `${queryName}-fetch-start`);
      }
    }
  }, [queryName, isLoading]);
}