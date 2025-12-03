import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Brain, Calendar } from 'lucide-react';
import { PatternEntry, getCollisionTypeLabel, getCollisionTypeColor } from '@/hooks/useVaultPractices';

interface PatternCardProps {
  pattern: PatternEntry;
}

export function PatternCard({ pattern }: PatternCardProps) {
  const formattedDate = new Date(pattern.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const collisionLabel = getCollisionTypeLabel(pattern.collision_type);
  const collisionColor = getCollisionTypeColor(pattern.collision_type);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow bg-mi-navy-light border border-mi-cyan/20 hover:border-mi-cyan/40">
      <div className="space-y-3">
        {/* Header: Date, collision type, caught status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mi-cyan/20 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-mi-cyan" />
            </div>
            <div>
              <Badge variant="outline" className={`${collisionColor} text-xs bg-mi-navy border-mi-cyan/30`}>
                {collisionLabel}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Caught status indicator */}
          <div className={`flex items-center gap-1 text-sm ${
            pattern.caught_pattern ? 'text-mi-cyan' : 'text-mi-gold'
          }`}>
            {pattern.caught_pattern ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Caught</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Missed</span>
              </>
            )}
          </div>
        </div>

        {/* Situation description */}
        {pattern.situation_description && (
          <div className="pl-13">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Situation
            </p>
            <p className="text-sm text-gray-300">
              {pattern.situation_description}
            </p>
          </div>
        )}

        {/* Reframe description */}
        {pattern.reframe_description && (
          <div className="pl-13 pt-2 border-t border-mi-cyan/10">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Reframe
            </p>
            <p className="text-sm text-gray-300 italic">
              "{pattern.reframe_description}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default PatternCard;
