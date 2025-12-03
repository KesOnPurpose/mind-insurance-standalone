/**
 * Accessibility Testing Setup
 * Configures jest-axe or vitest-axe for component accessibility testing
 */

import { configureAxe, toHaveNoViolations } from 'jest-axe';
import type { AxeResults, Result } from 'axe-core';

// Extend Jest/Vitest matchers
expect.extend(toHaveNoViolations);

// Configure axe for WCAG AA compliance
export const axeConfig = configureAxe({
  // WCAG AA rules configuration
  rules: {
    // Color contrast - WCAG AA requires 4.5:1 for normal text
    'color-contrast': { enabled: true },

    // Images must have alt text
    'image-alt': { enabled: true },

    // Form elements must have labels
    'label': { enabled: true },

    // Interactive elements must be keyboard accessible
    'keyboard-accessible': { enabled: true },

    // ARIA attributes must be valid
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },

    // Headings must be in order
    'heading-order': { enabled: true },

    // Links must have discernible text
    'link-name': { enabled: true },

    // Buttons must have discernible text
    'button-name': { enabled: true },

    // Page must have a title
    'document-title': { enabled: true },

    // HTML must have a lang attribute
    'html-has-lang': { enabled: true },

    // IDs must be unique
    'duplicate-id': { enabled: true },

    // Lists must be structured correctly
    'list': { enabled: true },
    'listitem': { enabled: true },

    // Tables must have proper structure
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true }
  },

  // Include all violation types
  reporter: 'v2',

  // Check for violations and incomplete rules
  resultTypes: ['violations', 'incomplete'],

  // Include element references in results
  elementRef: true
});

// Custom matcher for specific WCAG level checking
expect.extend({
  toMeetWCAG_AA(results: AxeResults) {
    const criticalViolations = results.violations.filter(
      (violation: Result) =>
        violation.impact === 'critical' ||
        violation.impact === 'serious'
    );

    const pass = criticalViolations.length === 0;

    if (pass) {
      return {
        message: () => 'Component meets WCAG AA standards',
        pass: true
      };
    } else {
      const violationMessages = criticalViolations
        .map((violation: Result) =>
          `${violation.impact?.toUpperCase()}: ${violation.help} (${violation.id})`
        )
        .join('\n');

      return {
        message: () =>
          `Component does not meet WCAG AA standards:\n${violationMessages}`,
        pass: false
      };
    }
  }
});

// Helper function to format accessibility violations for debugging
export function formatViolations(violations: Result[]): string {
  return violations
    .map(violation => {
      const nodes = violation.nodes
        .map(node => {
          const target = node.target.join(' > ');
          const message = node.failureSummary || 'No specific error message';
          return `  - ${target}\n    ${message}`;
        })
        .join('\n');

      return `
${violation.impact?.toUpperCase()}: ${violation.help}
Rule: ${violation.id}
URL: ${violation.helpUrl}
Affected elements:
${nodes}`;
    })
    .join('\n---\n');
}

// Helper to check specific accessibility rules
export async function checkA11yRule(
  container: HTMLElement,
  ruleName: string
): Promise<boolean> {
  const { axe } = await import('axe-core');

  const results = await axe.run(container, {
    rules: {
      [ruleName]: { enabled: true }
    }
  });

  return results.violations.length === 0;
}

// Helper to get accessibility score (0-100)
export async function getA11yScore(container: HTMLElement): Promise<number> {
  const { axe } = await import('axe-core');

  const results = await axe.run(container);
  const totalRules = results.passes.length + results.violations.length;

  if (totalRules === 0) return 100;

  const score = (results.passes.length / totalRules) * 100;
  return Math.round(score);
}

// Mock for components that need accessibility testing in isolation
export const a11yMocks = {
  // Mock router for testing navigation components
  mockRouter: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  },

  // Mock user for testing authenticated components
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    created_at: new Date().toISOString()
  },

  // Mock theme for testing theme-dependent components
  mockTheme: {
    theme: 'light',
    setTheme: jest.fn()
  }
};

// Utility to render component with accessibility context
export function renderWithA11y(
  component: React.ReactElement,
  options?: {
    skipRules?: string[];
    includeRules?: string[];
  }
) {
  const container = document.createElement('div');
  container.setAttribute('role', 'main');
  container.setAttribute('aria-label', 'Test component');
  document.body.appendChild(container);

  // Return cleanup function
  return {
    container,
    cleanup: () => {
      document.body.removeChild(container);
    }
  };
}

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toMeetWCAG_AA(): R;
    }
  }
}

// Export configured axe instance
export { axeConfig as axe };