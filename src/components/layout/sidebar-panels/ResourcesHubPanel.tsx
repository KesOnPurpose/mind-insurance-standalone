import { FileText, Calculator, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ResourcesHubPanel - Simple sidebar for the Resources Hub page
 *
 * Shows quick links to:
 * - Documents section
 * - Calculator section
 */
export function ResourcesHubPanel() {
  return (
    <div className="px-2 py-2 space-y-3">
      {/* Quick Navigation */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Access</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Jump to a specific resource section
        </p>

        <div className="space-y-2">
          <Link
            to="/resources/documents"
            className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Documents</span>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/resources/calculator"
            className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Calculator</span>
            </div>
            <ArrowRight className="h-4 w-4 text-green-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Help Card */}
      <div className="rounded-lg border bg-card p-3">
        <h4 className="text-sm font-medium mb-1">Need Help?</h4>
        <p className="text-xs text-muted-foreground">
          Browse documents for templates, guides, and compliance materials. Use the calculator to plan your financials.
        </p>
      </div>
    </div>
  );
}

export default ResourcesHubPanel;
