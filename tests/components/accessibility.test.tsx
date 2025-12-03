/**
 * Example Accessibility Tests
 * Demonstrates how to test components for WCAG AA compliance
 */

import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { formatViolations, checkA11yRule, getA11yScore } from '@/test/setup-a11y';

// Example component to test
const ExampleButton = ({ onClick, children, disabled = false }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const ExampleForm = () => (
  <form>
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          aria-required="true"
          aria-describedby="email-help"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p id="email-help" className="mt-1 text-sm text-gray-500">
          We'll never share your email with anyone else.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          aria-required="true"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Sign In
      </button>
    </div>
  </form>
);

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should meet WCAG AA standards', async () => {
      const { container } = render(
        <ExampleButton onClick={() => {}}>Click me</ExampleButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient color contrast', async () => {
      const { container } = render(
        <ExampleButton onClick={() => {}}>Click me</ExampleButton>
      );

      const hasGoodContrast = await checkA11yRule(container, 'color-contrast');
      expect(hasGoodContrast).toBe(true);
    });

    it('should be keyboard accessible', async () => {
      const { container, getByRole } = render(
        <ExampleButton onClick={() => {}}>Click me</ExampleButton>
      );

      const button = getByRole('button');

      // Check if button can receive focus
      button.focus();
      expect(document.activeElement).toBe(button);

      // Check for keyboard accessibility rule
      const isAccessible = await checkA11yRule(container, 'keyboard-accessible');
      expect(isAccessible).toBe(true);
    });

    it('should handle disabled state accessibly', async () => {
      const { container } = render(
        <ExampleButton onClick={() => {}} disabled>
          Disabled Button
        </ExampleButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Component', () => {
    it('should meet WCAG AA standards', async () => {
      const { container } = render(<ExampleForm />);

      const results = await axe(container);

      if (results.violations.length > 0) {
        console.error('Accessibility violations:', formatViolations(results.violations));
      }

      expect(results).toHaveNoViolations();
      expect(results).toMeetWCAG_AA();
    });

    it('should have proper form labels', async () => {
      const { container } = render(<ExampleForm />);

      const hasLabels = await checkA11yRule(container, 'label');
      expect(hasLabels).toBe(true);
    });

    it('should have required attributes', async () => {
      const { container, getByLabelText } = render(<ExampleForm />);

      const emailInput = getByLabelText('Email Address');
      const passwordInput = getByLabelText('Password');

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('required');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible error messages', async () => {
      const FormWithError = () => (
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            aria-invalid="true"
            aria-describedby="username-error"
          />
          <span id="username-error" role="alert" className="text-red-600">
            Username is required
          </span>
        </div>
      );

      const { container } = render(<FormWithError />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should achieve high accessibility score', async () => {
      const { container } = render(<ExampleForm />);

      const score = await getA11yScore(container);
      expect(score).toBeGreaterThanOrEqual(90); // Target 90+ score
    });
  });

  describe('Navigation Component', () => {
    it('should have accessible navigation structure', async () => {
      const Navigation = () => (
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      );

      const { container } = render(<Navigation />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should indicate current page', async () => {
      const Navigation = () => (
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      );

      const { container, getByText } = render(<Navigation />);

      const currentLink = getByText('Home');
      expect(currentLink).toHaveAttribute('aria-current', 'page');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal/Dialog Component', () => {
    it('should have accessible modal attributes', async () => {
      const Modal = ({ isOpen }: { isOpen: boolean }) => (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          className={isOpen ? 'block' : 'hidden'}
        >
          <h2 id="modal-title">Confirm Action</h2>
          <p id="modal-description">Are you sure you want to proceed?</p>
          <button>Cancel</button>
          <button>Confirm</button>
        </div>
      );

      const { container } = render(<Modal isOpen={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Table Component', () => {
    it('should have accessible table structure', async () => {
      const DataTable = () => (
        <table>
          <caption>User Data</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td>Admin</td>
            </tr>
            <tr>
              <td>Jane Smith</td>
              <td>jane@example.com</td>
              <td>User</td>
            </tr>
          </tbody>
        </table>
      );

      const { container } = render(<DataTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading States', () => {
    it('should have accessible loading indicators', async () => {
      const Spinner = () => (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      );

      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Images and Icons', () => {
    it('should have proper alt text for images', async () => {
      const ImageComponent = () => (
        <div>
          <img src="/logo.png" alt="Company Logo" />
          <img src="/decorative.png" alt="" /> {/* Decorative image */}
        </div>
      );

      const { container } = render(<ImageComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible icon buttons', async () => {
      const IconButton = () => (
        <button aria-label="Delete item">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      );

      const { container } = render(<IconButton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});