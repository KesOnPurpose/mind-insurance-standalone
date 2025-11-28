import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Heart, Sparkles, Star } from 'lucide-react';
import { VictoryEntry } from '@/hooks/useVaultPractices';

interface VictoryCardProps {
  victory: VictoryEntry;
}

/**
 * Get celebration type display
 */
function getCelebrationDisplay(type: string | null): { label: string; emoji: string } {
  if (!type) return { label: 'Celebrated', emoji: '🎉' };
  switch (type.toLowerCase()) {
    case 'victory_pose':
    case 'victorypose':
      return { label: 'Victory Pose', emoji: '💪' };
    case 'victory_dance':
    case 'victorydance':
      return { label: 'Victory Dance', emoji: '💃' };
    case 'fist_pump':
    case 'fistpump':
      return { label: 'Fist Pump', emoji: '✊' };
    case 'quiet_smile':
    case 'quietsmile':
      return { label: 'Quiet Smile', emoji: '😊' };
    default:
      return { label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), emoji: '🎉' };
  }
}

export function VictoryCard({ victory }: VictoryCardProps) {
  const formattedDate = new Date(victory.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const celebration = getCelebrationDisplay(victory.victory_celebration);
  const hasContent = victory.championship_win || victory.micro_victory || victory.future_self_evidence || victory.championship_gratitude;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow bg-mi-navy-light border border-mi-gold/20 hover:border-mi-gold/40">
      <div className="space-y-3">
        {/* Header: Date, celebration badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mi-gold/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-mi-gold" />
            </div>
            <div>
              {victory.victory_celebration && (
                <Badge variant="outline" className="bg-mi-gold/10 text-mi-gold border-mi-gold/30 text-xs">
                  {celebration.emoji} {celebration.label}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {hasContent && (
          <div className="space-y-3">
            {/* Championship Win */}
            {victory.championship_win && (
              <div className="flex gap-2">
                <Star className="w-4 h-4 text-mi-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Championship Win
                  </p>
                  <p className="text-sm text-gray-300">
                    {victory.championship_win}
                  </p>
                </div>
              </div>
            )}

            {/* Micro Victory */}
            {victory.micro_victory && (
              <div className="flex gap-2">
                <Sparkles className="w-4 h-4 text-mi-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Micro Victory
                  </p>
                  <p className="text-sm text-gray-300">
                    {victory.micro_victory}
                  </p>
                </div>
              </div>
            )}

            {/* Future Self Evidence */}
            {victory.future_self_evidence && (
              <div className="flex gap-2">
                <Sparkles className="w-4 h-4 text-mi-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Future Self Evidence
                  </p>
                  <p className="text-sm text-gray-300 italic">
                    "{victory.future_self_evidence}"
                  </p>
                </div>
              </div>
            )}

            {/* Gratitude */}
            {victory.championship_gratitude && (
              <div className="flex gap-2 pt-2 border-t border-mi-gold/10">
                <Heart className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Gratitude
                  </p>
                  <p className="text-sm text-gray-300">
                    💙 {victory.championship_gratitude}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state for victories with no content */}
        {!hasContent && (
          <p className="text-sm text-gray-400 italic">
            Victory logged - keep celebrating your wins!
          </p>
        )}
      </div>
    </Card>
  );
}

export default VictoryCard;
