import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Home,
  Building2,
  Handshake,
  Users,
  Brain,
  Baby,
  Heart,
  DollarSign,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Shield,
  RefreshCw
} from 'lucide-react';

interface PersonalizationBadgeProps {
  totalTactics: number;           // Always 343 (total in database)
  filteredTactics: number;        // Current tactics shown (from filtering)
  completedTactics?: number;      // Number of completed tactics (for progress display)
  strategy?: string;              // ownership_model value
  populations?: string[];         // target_populations array
  budget?: string;                // capital_available value
  immediatePriority?: string;     // immediate_priority value
  className?: string;
  showProgress?: boolean;         // Show completion progress instead of filtering
}

// Strategy icon mapping
const getStrategyIcon = (strategy?: string) => {
  switch (strategy) {
    case 'ownership':
      return <Home className="w-4 h-4" />;
    case 'rental_arbitrage':
      return <Handshake className="w-4 h-4" />;
    case 'hybrid':
      return <Building2 className="w-4 h-4" />;
    default:
      return <Building2 className="w-4 h-4" />;
  }
};

// Population icon mapping
const getPopulationIcon = (population: string) => {
  const lowerPop = population.toLowerCase();
  if (lowerPop.includes('senior')) return <Users className="w-4 h-4" />;
  if (lowerPop.includes('mental')) return <Brain className="w-4 h-4" />;
  if (lowerPop.includes('child') || lowerPop.includes('youth')) return <Baby className="w-4 h-4" />;
  if (lowerPop.includes('disability') || lowerPop.includes('developmental')) return <Heart className="w-4 h-4" />;
  if (lowerPop.includes('veteran')) return <Shield className="w-4 h-4" />;
  if (lowerPop.includes('reentry') || lowerPop.includes('returning')) return <RefreshCw className="w-4 h-4" />;
  if (lowerPop.includes('substance')) return <Brain className="w-4 h-4" />;
  return <User className="w-4 h-4" />;
};

// Format budget string
const formatBudget = (budget?: string): string => {
  if (!budget) return 'Not Set';

  // Handle ranges like "5k-15k"
  if (budget.includes('k')) {
    const parts = budget.split('-');
    if (parts.length === 2) {
      const min = parts[0].replace('k', '');
      const max = parts[1].replace('k', '');
      return `$${min}k-$${max}k`;
    }
    return `$${budget}`;
  }

  return budget;
};

// Format strategy name
const formatStrategy = (strategy?: string): string => {
  if (!strategy) return 'Not Set';
  return strategy.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Format priority name
const formatPriority = (priority?: string): string => {
  if (!priority) return 'Not Set';
  return priority.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Get filtering status color
const getFilteringColor = (filteredTactics: number, totalTactics: number) => {
  const percentage = (filteredTactics / totalTactics) * 100;

  if (percentage === 100) {
    return 'text-green-600 dark:text-green-400'; // All tactics shown
  } else if (percentage >= 60) {
    return 'text-blue-600 dark:text-blue-400'; // Some filtering
  } else {
    return 'text-purple-600 dark:text-purple-400'; // Heavy filtering
  }
};

// Get progress color based on completion percentage
const getProgressColor = (completed: number, total: number) => {
  const percentage = (completed / total) * 100;

  if (percentage >= 75) {
    return 'text-green-600 dark:text-green-400'; // Almost done!
  } else if (percentage >= 50) {
    return 'text-blue-600 dark:text-blue-400'; // Halfway there
  } else if (percentage >= 25) {
    return 'text-amber-600 dark:text-amber-400'; // Getting started
  } else {
    return 'text-purple-600 dark:text-purple-400'; // Just beginning
  }
};

export const PersonalizationBadge = ({
  totalTactics,
  filteredTactics,
  completedTactics = 0,
  strategy,
  populations,
  budget,
  immediatePriority,
  className = '',
  showProgress = false
}: PersonalizationBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const filteringColor = getFilteringColor(filteredTactics, totalTactics);
  const progressColor = getProgressColor(completedTactics, filteredTactics || totalTactics);
  const progressPercent = filteredTactics > 0 ? Math.round((completedTactics / filteredTactics) * 100) : 0;

  return (
    <>
      {/* Desktop View (≥768px) */}
      <Card className={`hidden md:block p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                Your Personalized Roadmap
              </h3>
            </div>
            <div className={`text-sm font-medium ${showProgress ? progressColor : filteringColor}`}>
              {showProgress
                ? `${completedTactics}/${filteredTactics} completed (${progressPercent}%)`
                : `Showing ${filteredTactics} of ${totalTactics} tactics`}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Strategy */}
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-teal-600 dark:text-teal-400">
                {getStrategyIcon(strategy)}
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Strategy</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatStrategy(strategy)}
                </p>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Budget</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatBudget(budget)}
                </p>
              </div>
            </div>

            {/* Focus */}
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-teal-600 dark:text-teal-400">
                {populations && populations.length > 0 ? getPopulationIcon(populations[0]) : <Users className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Focus</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {populations && populations.length > 0
                    ? populations.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')).join(', ')
                    : 'Not Set'}
                </p>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Priority</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatPriority(immediatePriority)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile View (<768px) */}
      <Card className={`md:hidden p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800 ${className}`}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-3">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="font-semibold text-sm text-teal-900 dark:text-teal-100">
                  Personalized Roadmap
                </span>
              </div>
              <span className={`text-xs font-medium ${showProgress ? progressColor : filteringColor}`}>
                {showProgress
                  ? `${completedTactics}/${filteredTactics} done`
                  : `${filteredTactics}/${totalTactics} tactics`}
              </span>
            </div>

            {/* Mobile Summary Line */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {formatStrategy(strategy)}
              </Badge>
              {populations && populations.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {populations[0].charAt(0).toUpperCase() + populations[0].slice(1).replace(/_/g, ' ')}
                  {populations.length > 1 && ` +${populations.length - 1}`}
                </Badge>
              )}
            </div>

            {/* Mobile Expand Button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs text-teal-700 dark:text-teal-300 hover:bg-teal-100/50 dark:hover:bg-teal-900/50"
              >
                <span>Details</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Mobile Expanded Content */}
            <CollapsibleContent>
              <div className="space-y-2 pt-2 border-t border-teal-200 dark:border-teal-800">
                {/* Strategy */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    {getStrategyIcon(strategy)}
                    <span>Strategy</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatStrategy(strategy)}
                  </span>
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Budget</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBudget(budget)}
                  </span>
                </div>

                {/* Populations */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Focus</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-right">
                    {populations && populations.length > 0
                      ? populations.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')).join(', ')
                      : 'Not Set'}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Target className="w-4 h-4" />
                    <span>Priority</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatPriority(immediatePriority)}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </Card>
    </>
  );
};