/**
 * Lighthouse CI Configuration
 * WCAG AA Compliance & Performance Standards for Mind Insurance Grouphome App
 */

module.exports = {
  ci: {
    // Collection settings
    collect: {
      // URLs to test
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/assessment',
        'http://localhost:5173/profile',
        'http://localhost:5173/admin',
        'http://localhost:5173/admin/analytics'
      ],

      // Number of times to run Lighthouse per URL
      numberOfRuns: 3,

      // Start server before running tests
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,

      // Settings for each Lighthouse run
      settings: {
        // Device emulation
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: false,
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          disabled: false
        },

        // Categories to test
        onlyCategories: [
          'accessibility',
          'performance',
          'best-practices',
          'seo'
        ],

        // Skip specific audits that may not apply
        skipAudits: [
          'uses-http2', // May not be available in dev
          'canonical', // SEO canonical URLs
          'maskable-icon' // PWA specific
        ]
      },

      // Chrome flags for testing
      chromeFlags: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox'
      ]
    },

    // Assertions (what must pass)
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // WCAG AA Compliance Requirements
        'categories:accessibility': ['error', { minScore: 0.90 }],

        // Performance Requirements (from QUALITY-GATES-FRAMEWORK.md)
        'categories:performance': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.90 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.90 }],

        // Critical Accessibility Rules for WCAG AA
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'tabindex': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'heading-order': 'warn',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'duplicate-id-active': 'error',
        'duplicate-id-aria': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',

        // Keyboard Navigation
        'focusable-controls': 'error',
        'interactive-element-affordance': 'error',
        'logical-tab-order': 'error',

        // Forms
        'form-field-multiple-labels': 'warn',
        'input-button-name': 'error',
        'input-image-alt': 'error',
        'select-name': 'error',

        // Security
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',

        // Performance-related accessibility
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'warn',
        'uses-rel-preconnect': 'warn',

        // Mobile-first requirements
        'viewport': 'error',
        'tap-targets': 'warn'
      }
    },

    // Upload settings (optional - for storing results)
    upload: {
      target: 'temporary-public-storage',
      uploadUrlMap: true,

      // Optional: Configure for Lighthouse CI Server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
      // token: 'YOUR_LHCI_BUILD_TOKEN',
    }
  }
};

// Mobile-specific configuration
module.exports.mobile = {
  ci: {
    ...module.exports.ci,
    collect: {
      ...module.exports.ci.collect,
      settings: {
        ...module.exports.ci.collect.settings,
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        }
      }
    }
  }
};

// Tablet-specific configuration
module.exports.tablet = {
  ci: {
    ...module.exports.ci,
    collect: {
      ...module.exports.ci.collect,
      settings: {
        ...module.exports.ci.collect.settings,
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 768,
          height: 1024,
          deviceScaleFactor: 2,
          disabled: false
        }
      }
    }
  }
};