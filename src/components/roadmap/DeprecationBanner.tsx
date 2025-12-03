import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeprecationBannerProps {
  replacementTacticName: string;
  deprecationReason?: string;
  onViewReplacement: () => void;
}

/**
 * DeprecationBanner - Shows when a tactic has been replaced with updated content
 *
 * Displays:
 * - Visual warning that tactic is deprecated
 * - Reason for deprecation (optional)
 * - Button to view the updated replacement tactic
 * - Maintains user progress from old tactic
 *
 * Usage: Shown above deprecated T-tactics that have been replaced by M-tactics
 */
export function DeprecationBanner({
  replacementTacticName,
  deprecationReason,
  onViewReplacement
}: DeprecationBannerProps) {
  return (
    <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400 text-xs">
              Deprecated
            </Badge>
            <p className="text-sm font-semibold text-amber-900">
              Updated Version Available
            </p>
          </div>

          {deprecationReason && (
            <p className="text-xs text-amber-700 mb-2">
              {deprecationReason}
            </p>
          )}

          <p className="text-xs text-amber-700 mb-2">
            This tactic has been replaced with updated content from Nette's Mentorship program.
            Your progress has been preserved.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={onViewReplacement}
            className="text-xs border-amber-300 hover:bg-amber-100"
          >
            View Updated: {replacementTacticName}
          </Button>
        </div>
      </div>
    </div>
  );
}
