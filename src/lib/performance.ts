import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';

/**
 * Performance monitoring configuration
 * Tracks Core Web Vitals and sends data to analytics (if configured)
 */
interface PerformanceConfig {
  debug?: boolean;
  reportToAnalytics?: boolean;
  analyticsEndpoint?: string;
}

interface PerformanceData {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
}

// Performance thresholds based on Web Vitals standards
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },  // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },  // Time to First Byte (ms)
};

// Singleton to track if monitoring is initialized
let isInitialized = false;

/**
 * Get performance rating based on metric value and thresholds
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format performance data for logging/reporting
 */
function formatPerformanceData(metric: Metric): PerformanceData {
  return {
    metric: metric.name,
    value: Math.round(metric.value),
    rating: getRating(metric.name, metric.value),
    delta: metric.delta ? Math.round(metric.delta) : undefined,
    navigationType: metric.navigationType,
  };
}

/**
 * Log performance metric to console (development mode)
 */
function logMetric(data: PerformanceData, debug: boolean) {
  if (!debug && process.env.NODE_ENV === 'production') return;

  const emoji = data.rating === 'good' ? '✅' : data.rating === 'poor' ? '❌' : '⚠️';
  const style = data.rating === 'good' ? 'color: green' : data.rating === 'poor' ? 'color: red' : 'color: orange';

  console.log(
    `%c${emoji} ${data.metric}: ${data.value}${data.metric === 'CLS' ? '' : 'ms'} (${data.rating})`,
    style,
    {
      delta: data.delta,
      navigationType: data.navigationType,
    }
  );
}

/**
 * Report metric to analytics endpoint
 */
async function reportToAnalytics(data: PerformanceData, endpoint: string) {
  try {
    // Only report in production
    if (process.env.NODE_ENV !== 'production') return;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType,
      }),
    });
  } catch (error) {
    console.error('Failed to report performance metrics:', error);
  }
}

/**
 * Main handler for all performance metrics
 */
function handleMetric(metric: Metric, config: PerformanceConfig) {
  const data = formatPerformanceData(metric);

  // Log to console in development or if debug is enabled
  logMetric(data, config.debug || false);

  // Report to analytics if configured
  if (config.reportToAnalytics && config.analyticsEndpoint) {
    reportToAnalytics(data, config.analyticsEndpoint);
  }

  // Store in performance buffer for later analysis
  if ('performance' in window && 'measure' in window.performance) {
    try {
      window.performance.measure(`web-vital-${metric.name}`, {
        start: 0,
        duration: metric.value,
        detail: data,
      });
    } catch (e) {
      // Ignore errors from performance.measure
    }
  }
}

/**
 * Initialize performance monitoring
 * Should be called once on app startup
 */
export function initPerformanceMonitoring(config: PerformanceConfig = {}) {
  if (isInitialized) {
    console.warn('Performance monitoring already initialized');
    return;
  }

  isInitialized = true;

  // Set up Core Web Vitals monitoring
  getCLS((metric) => handleMetric(metric, config));
  getFCP((metric) => handleMetric(metric, config));
  getFID((metric) => handleMetric(metric, config));
  getLCP((metric) => handleMetric(metric, config));
  getTTFB((metric) => handleMetric(metric, config));

  // Monitor long tasks (>50ms)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            if (config.debug || process.env.NODE_ENV !== 'production') {
              console.warn(
                `%c⚠️ Long Task: ${Math.round(entry.duration)}ms`,
                'color: orange',
                {
                  startTime: entry.startTime,
                  name: entry.name,
                }
              );
            }
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported for longtask
    }
  }

  // Log initial page load performance
  if (config.debug || process.env.NODE_ENV !== 'production') {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        console.log('%c📊 Page Load Performance', 'color: blue; font-weight: bold');
        console.table({
          'DNS Lookup': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
          'TCP Connection': Math.round(perfData.connectEnd - perfData.connectStart),
          'Request Time': Math.round(perfData.responseStart - perfData.requestStart),
          'Response Time': Math.round(perfData.responseEnd - perfData.responseStart),
          'DOM Processing': Math.round(perfData.domComplete - perfData.domInteractive),
          'Load Complete': Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          'Total Time': Math.round(perfData.loadEventEnd - perfData.fetchStart),
        });
      }
    });
  }
}

/**
 * Get current performance metrics snapshot
 * Useful for debugging and monitoring
 */
export function getPerformanceSnapshot() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const measures = performance.getEntriesByType('measure');
  const resources = performance.getEntriesByType('resource');

  return {
    navigation: navigation ? {
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    } : null,
    webVitals: measures
      .filter(m => m.name.startsWith('web-vital-'))
      .reduce((acc, m) => ({
        ...acc,
        [m.name.replace('web-vital-', '')]: {
          value: Math.round(m.duration),
          detail: (m as any).detail,
        },
      }), {}),
    resources: {
      count: resources.length,
      totalSize: resources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0),
      totalDuration: Math.round(Math.max(...resources.map(r => r.responseEnd)) - Math.min(...resources.map(r => r.startTime))),
    },
  };
}

/**
 * Custom hook for React components to track render performance
 */
export function useRenderPerformance(componentName: string) {
  if (process.env.NODE_ENV === 'production') return;

  const renderStart = performance.now();

  // Track render time after paint
  requestAnimationFrame(() => {
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) { // Longer than one frame (60fps)
      console.warn(
        `%c⚠️ Slow Render: ${componentName} took ${Math.round(renderTime)}ms`,
        'color: orange'
      );
    }
  });
}

/**
 * Mark custom performance events
 */
export function markPerformance(eventName: string, startMark?: string) {
  if (!('performance' in window)) return;

  try {
    if (startMark) {
      // Measure between two marks
      performance.measure(eventName, startMark);
      const measure = performance.getEntriesByName(eventName).pop();
      if (measure && (process.env.NODE_ENV !== 'production')) {
        console.log(
          `%c⏱️ ${eventName}: ${Math.round(measure.duration)}ms`,
          'color: purple'
        );
      }
    } else {
      // Just mark a point in time
      performance.mark(eventName);
    }
  } catch (e) {
    // Ignore performance API errors
  }
}

// Export types for use in components
export type { PerformanceConfig, PerformanceData };