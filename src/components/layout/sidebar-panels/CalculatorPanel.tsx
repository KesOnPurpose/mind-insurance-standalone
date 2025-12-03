import { Calculator, TrendingUp, DollarSign, AlertCircle, Lightbulb, Target, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

/**
 * CalculatorPanel - Sidebar for calculator page context
 *
 * Shows:
 * - Quick tips for using the calculator
 * - Industry benchmarks
 * - Common scenarios
 * - Links to related resources
 */
export function CalculatorPanel() {
  return (
    <div className="px-2 py-2 space-y-3">
      {/* Calculator Tips Card */}
      <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-green-500/5 p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium">Quick Tips</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-1.5">
            <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
            <span>Start with conservative estimates for first-year projections</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
            <span>Include at least 3 months of operating reserves</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
            <span>Factor in vacancy rates (10-15% typical)</span>
          </li>
        </ul>
      </div>

      {/* Industry Benchmarks */}
      <div className="rounded-lg border bg-card p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium">Industry Benchmarks</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground truncate flex-shrink">Revenue/Resident</span>
            <Badge variant="outline" className="h-5 font-mono text-[10px] flex-shrink-0 whitespace-nowrap">$2.5-4K/mo</Badge>
          </div>
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground truncate flex-shrink">Operating Margin</span>
            <Badge variant="outline" className="h-5 font-mono text-[10px] flex-shrink-0 whitespace-nowrap">20-35%</Badge>
          </div>
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground truncate flex-shrink">Staff:Resident</span>
            <Badge variant="outline" className="h-5 font-mono text-[10px] flex-shrink-0 whitespace-nowrap">1:4-1:6</Badge>
          </div>
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground truncate flex-shrink">Break-even</span>
            <Badge variant="outline" className="h-5 font-mono text-[10px] flex-shrink-0 whitespace-nowrap">12-18 mo</Badge>
          </div>
        </div>
      </div>

      {/* Common Scenarios */}
      <div className="rounded-lg border bg-card p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <span className="text-sm font-medium">Common Scenarios</span>
        </div>
        <div className="space-y-2">
          <div className="p-2 rounded bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
            <p className="text-xs font-medium truncate">4-Bed Starter Home</p>
            <p className="text-xs text-muted-foreground truncate">$150K-$200K startup</p>
          </div>
          <div className="p-2 rounded bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
            <p className="text-xs font-medium truncate">6-Bed Standard Home</p>
            <p className="text-xs text-muted-foreground truncate">$200K-$300K startup</p>
          </div>
          <div className="p-2 rounded bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
            <p className="text-xs font-medium truncate">8+ Bed Large Facility</p>
            <p className="text-xs text-muted-foreground truncate">$350K+ startup</p>
          </div>
        </div>
      </div>

      {/* Important Reminders */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-400">Remember</span>
        </div>
        <ul className="text-xs text-amber-700 dark:text-amber-300/80 space-y-1">
          <li className="truncate">• Estimates only</li>
          <li className="truncate">• Consult local regulations</li>
          <li className="truncate">• Verify rates with state</li>
        </ul>
      </div>

      {/* Related Documents Link */}
      <div className="rounded-lg border bg-card p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">Related Resources</span>
        </div>
        <Link
          to="/resources/documents?category=financial"
          className="block p-2 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <p className="text-xs font-medium text-primary truncate">Financial Templates</p>
          <p className="text-xs text-muted-foreground truncate">Budgets, projections & more</p>
        </Link>
      </div>
    </div>
  );
}

export default CalculatorPanel;
