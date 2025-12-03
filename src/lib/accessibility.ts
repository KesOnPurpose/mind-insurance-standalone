/**
 * Accessibility Runtime Checker
 * Initializes axe-core for development-time accessibility validation
 * WCAG AA compliance monitoring for Mind Insurance Grouphome App
 *
 * NOTE: This module is disabled by default to prevent ESM/CommonJS issues.
 * axe-core is loaded dynamically only when explicitly initialized.
 */

// Define types inline to avoid importing axe-core at module level
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxeCore = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Spec = any;

// Only run in development mode
const isDevelopment = import.meta.env.DEV;

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  timestamp: Date;
}

class AccessibilityChecker {
  private axe: AxeCore | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime = 0;
  private readonly CHECK_DELAY = 2000; // Debounce checks by 2 seconds

  async initialize(): Promise<void> {
    if (!isDevelopment) {
      console.log('[A11y] Accessibility checker disabled in production');
      return;
    }

    try {
      // Dynamically import axe-core to avoid bundling in production
      const axeModule = await import('axe-core');
      this.axe = axeModule.default;

      // Configure axe for WCAG AA compliance
      this.configureAxe();

      // Start monitoring
      this.startMonitoring();

      console.log('[A11y] ✅ Accessibility checker initialized for WCAG AA compliance');
    } catch (error) {
      console.error('[A11y] Failed to initialize accessibility checker:', error);
    }
  }

  private configureAxe(): void {
    if (!this.axe) return;

    // Configure for WCAG AA compliance
    const wcagAARules: Spec = {
      rules: {
        // Color contrast rules (AA level)
        'color-contrast': { enabled: true },

        // Keyboard navigation
        'keyboard-accessible': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },

        // Screen reader compatibility
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-hidden-focus': { enabled: true },

        // Form accessibility
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },

        // Image accessibility
        'image-alt': { enabled: true },

        // Link accessibility
        'link-name': { enabled: true },

        // Heading structure
        'heading-order': { enabled: true },
        'empty-heading': { enabled: true },

        // Language
        'html-lang': { enabled: true },
        'lang': { enabled: true },

        // Focus indicators
        'focus-visible': { enabled: true }
      },
      reporter: 'v2',
      resultTypes: ['violations', 'incomplete'],
      elementRef: true
    };

    this.axe.configure(wcagAARules);
  }

  private startMonitoring(): void {
    if (!isDevelopment || !this.axe) return;

    // Run initial check after page loads
    if (document.readyState === 'complete') {
      this.runAccessibilityCheck();
    } else {
      window.addEventListener('load', () => this.runAccessibilityCheck());
    }

    // Monitor for DOM changes
    const observer = new MutationObserver(() => {
      this.scheduleCheck();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-describedby', 'role', 'tabindex']
    });

    // Monitor route changes (for SPAs)
    window.addEventListener('popstate', () => this.scheduleCheck());

    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this.scheduleCheck();
    };

    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this.scheduleCheck();
    };
  }

  private scheduleCheck(): void {
    const now = Date.now();
    if (now - this.lastCheckTime < this.CHECK_DELAY) {
      // Clear existing timeout if any
      if (this.checkInterval) {
        clearTimeout(this.checkInterval);
      }

      // Schedule a check after the delay
      this.checkInterval = setTimeout(() => {
        this.runAccessibilityCheck();
      }, this.CHECK_DELAY);
    } else {
      this.runAccessibilityCheck();
    }
  }

  async runAccessibilityCheck(): Promise<AccessibilityReport | null> {
    if (!this.axe || !isDevelopment) return null;

    this.lastCheckTime = Date.now();

    try {
      const results = await this.axe.run(document);

      const report: AccessibilityReport = {
        violations: results.violations.map(v => ({
          id: v.id,
          impact: v.impact as AccessibilityViolation['impact'],
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.map(n => ({
            html: n.html,
            target: n.target as string[],
            failureSummary: n.failureSummary
          }))
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        timestamp: new Date()
      };

      this.logResults(report);
      return report;
    } catch (error) {
      console.error('[A11y] Error running accessibility check:', error);
      return null;
    }
  }

  private logResults(report: AccessibilityReport): void {
    const { violations, passes, incomplete } = report;

    if (violations.length === 0) {
      console.log(
        '%c[A11y] ✅ No accessibility violations found!',
        'color: green; font-weight: bold'
      );
      console.log(`[A11y] ${passes} rules passed, ${incomplete} incomplete`);
      return;
    }

    // Group violations by impact
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');
    const moderate = violations.filter(v => v.impact === 'moderate');
    const minor = violations.filter(v => v.impact === 'minor');

    console.group(
      `%c[A11y] ⚠️ ${violations.length} accessibility violations detected`,
      'color: red; font-weight: bold'
    );

    // Log critical and serious violations prominently
    if (critical.length > 0) {
      console.group(`%c🚨 CRITICAL (${critical.length})`, 'color: red; font-weight: bold');
      critical.forEach(v => this.logViolation(v));
      console.groupEnd();
    }

    if (serious.length > 0) {
      console.group(`%c⚠️ SERIOUS (${serious.length})`, 'color: orange; font-weight: bold');
      serious.forEach(v => this.logViolation(v));
      console.groupEnd();
    }

    if (moderate.length > 0) {
      console.group(`%cMODERATE (${moderate.length})`, 'color: yellow');
      moderate.forEach(v => this.logViolation(v));
      console.groupEnd();
    }

    if (minor.length > 0) {
      console.group(`MINOR (${minor.length})`);
      minor.forEach(v => this.logViolation(v));
      console.groupEnd();
    }

    console.log(`[A11y] Summary: ${passes} passed, ${incomplete} incomplete`);
    console.groupEnd();
  }

  private logViolation(violation: AccessibilityViolation): void {
    console.log(`📋 ${violation.description}`);
    console.log(`   Help: ${violation.help}`);
    console.log(`   Learn more: ${violation.helpUrl}`);

    if (violation.nodes.length > 0) {
      console.log('   Affected elements:');
      violation.nodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.target.join(' > ')}`);
        if (node.failureSummary) {
          console.log(`      Issue: ${node.failureSummary}`);
        }
      });
    }
  }

  // Public method for manual checks
  async check(): Promise<AccessibilityReport | null> {
    return this.runAccessibilityCheck();
  }

  // Get current violation count
  async getViolationCount(): Promise<number> {
    const report = await this.runAccessibilityCheck();
    return report?.violations.length ?? 0;
  }

  // Check if page meets WCAG AA standards
  async meetsWCAG_AA(): Promise<boolean> {
    const report = await this.runAccessibilityCheck();
    if (!report) return false;

    // No critical or serious violations allowed for WCAG AA
    return !report.violations.some(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
  }
}

// Create singleton instance
export const accessibilityChecker = new AccessibilityChecker();

// Note: Auto-initialization disabled due to axe-core ESM compatibility issues with Vite
// To use accessibility checking, manually call:
// import { accessibilityChecker } from '@/lib/accessibility';
// accessibilityChecker.initialize();
//
// if (isDevelopment) {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//       accessibilityChecker.initialize();
//     });
//   } else {
//     accessibilityChecker.initialize();
//   }
// }

// Export for testing purposes
export default accessibilityChecker;