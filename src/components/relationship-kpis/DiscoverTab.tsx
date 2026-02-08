/**
 * DiscoverTab — 10 KPI discovery cards with gap detection badges
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, MessageCircle, Eye, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { KPIDiscoveryCardData, GapBadgeType } from '@/types/partner-discovery';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

interface DiscoverTabProps {
  cardData: KPIDiscoveryCardData[];
  onStartChat: (kpiName: RelationshipKPIName) => void;
}

const BADGE_STYLES: Record<NonNullable<GapBadgeType>, { bg: string; text: string; pulse: boolean }> = {
  mio_noticed: { bg: 'bg-amber-500/20', text: 'text-amber-300', pulse: true },
  partner_shared: { bg: 'bg-rose-500/20', text: 'text-rose-300', pulse: true },
  revisit: { bg: 'bg-purple-500/20', text: 'text-purple-300', pulse: false },
  aligned: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', pulse: false },
};

const KPI_ICONS: Record<string, string> = {
  affection: '💕',
  sexual_fulfillment: '🔥',
  intimate_conversation: '💬',
  recreational_companionship: '🎯',
  honesty_openness: '🤝',
  physical_attractiveness: '✨',
  financial_support: '💰',
  domestic_support: '🏠',
  family_commitment: '👨‍👩‍👧',
  admiration: '🌟',
};

export function DiscoverTab({ cardData, onStartChat }: DiscoverTabProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {cardData.map((card, i) => (
          <motion.div
            key={card.kpiName}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <KPIDiscoveryCard card={card} onStart={onStartChat} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function KPIDiscoveryCard({
  card,
  onStart,
}: {
  card: KPIDiscoveryCardData;
  onStart: (kpiName: RelationshipKPIName) => void;
}) {
  const isCompleted = card.session?.session_status === 'completed';
  const isInProgress = card.session?.session_status === 'in_progress';
  const badge = card.gapBadge;
  const badgeStyle = badge?.type ? BADGE_STYLES[badge.type] : null;

  return (
    <Card className="bg-white/[0.03] border-white/10 hover:border-white/20 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{KPI_ICONS[card.kpiName] || '💡'}</span>
              <h3 className="text-white font-medium text-sm sm:text-base truncate">
                {card.label}
              </h3>
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-2">
              {card.description}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {card.insightCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {card.insightCount} insight{card.insightCount !== 1 ? 's' : ''}
                </span>
              )}
              {card.sharedCount > 0 && (
                <span className="flex items-center gap-1 text-rose-400/70">
                  <MessageCircle className="h-3 w-3" />
                  {card.sharedCount} shared
                </span>
              )}
            </div>

            {/* Gap detection badge */}
            {badge && badgeStyle && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`${badgeStyle.bg} ${badgeStyle.text} border-0 text-xs ${
                    badgeStyle.pulse ? 'animate-pulse-once' : ''
                  }`}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Right: action button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStart(card.kpiName)}
            className={`flex-shrink-0 gap-1 transition-all ${
              isCompleted
                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                : isInProgress
                ? 'text-mi-cyan hover:text-mi-cyan hover:bg-mi-cyan/10'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            {isCompleted ? (
              <>Review</>
            ) : isInProgress ? (
              <>
                Continue
                <ArrowRight className="h-3 w-3" />
              </>
            ) : (
              <>
                Explore with MIO
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
