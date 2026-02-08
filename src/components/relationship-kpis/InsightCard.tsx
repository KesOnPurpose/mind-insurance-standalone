/**
 * InsightCard — Reusable insight card display + sharing toggle + reactions
 */

import { useState } from 'react';
import { Heart, Share2, Lock, Eye, Trash2, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PartnerInsightCard, InsightCardType } from '@/types/partner-discovery';

interface InsightCardProps {
  card: PartnerInsightCard;
  isPartnerCard?: boolean;
  onToggleShare?: (share: boolean) => void;
  onReact?: (reaction: string) => void;
  onDelete?: () => void;
  onGoDeeper?: () => void;
}

const TYPE_CONFIG: Record<InsightCardType, { label: string; color: string }> = {
  preference: { label: 'Preference', color: 'bg-blue-500/20 text-blue-300' },
  boundary: { label: 'Boundary', color: 'bg-red-500/20 text-red-300' },
  love_language: { label: 'Love Language', color: 'bg-rose-500/20 text-rose-300' },
  memory: { label: 'Memory', color: 'bg-purple-500/20 text-purple-300' },
  dream: { label: 'Dream', color: 'bg-indigo-500/20 text-indigo-300' },
  trigger: { label: 'Trigger', color: 'bg-amber-500/20 text-amber-300' },
  need: { label: 'Need', color: 'bg-emerald-500/20 text-emerald-300' },
};

const REACTIONS = ['❤️', '😮', '📝'];

export function InsightCard({
  card,
  isPartnerCard = false,
  onToggleShare,
  onReact,
  onDelete,
  onGoDeeper,
}: InsightCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const typeConfig = TYPE_CONFIG[card.insight_type as InsightCardType] || TYPE_CONFIG.preference;

  return (
    <Card className="bg-white/[0.03] border-white/10 hover:border-white/15 transition-all">
      <CardContent className="p-4">
        {/* Header: title + type badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-white text-sm font-medium leading-snug flex-1">
            {card.insight_title}
          </h4>
          <Badge variant="outline" className={`${typeConfig.color} border-0 text-xs flex-shrink-0`}>
            {typeConfig.label}
          </Badge>
        </div>

        {/* Body */}
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          {card.insight_text}
        </p>

        {/* Footer: actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Sharing indicator */}
            {!isPartnerCard && (
              card.shared_with_partner ? (
                <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-0 text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Shared
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-white/5 text-gray-500 border-0 text-xs gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )
            )}

            {/* Partner reaction display */}
            {card.partner_reaction && (
              <span className="text-sm ml-2">{card.partner_reaction}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Partner card: reaction buttons */}
            {isPartnerCard && onReact && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReactions(!showReactions)}
                  className="text-gray-500 hover:text-rose-300 h-7 px-2"
                >
                  <Heart className="h-3.5 w-3.5" />
                </Button>
                {showReactions && (
                  <div className="absolute bottom-full right-0 mb-1 flex gap-1 bg-mi-navy-light border border-white/10 rounded-lg p-1.5">
                    {REACTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          onReact(r);
                          setShowReactions(false);
                        }}
                        className="text-lg hover:scale-125 transition-transform"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Own card: go deeper */}
            {!isPartnerCard && onGoDeeper && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoDeeper}
                className="text-cyan-400 hover:text-cyan-300 h-7 px-2 gap-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs">Deepen</span>
              </Button>
            )}

            {/* Own card: share toggle */}
            {!isPartnerCard && onToggleShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleShare(!card.shared_with_partner)}
                className={`h-7 px-2 gap-1 ${
                  card.shared_with_partner
                    ? 'text-rose-400 hover:text-gray-400'
                    : 'text-gray-500 hover:text-rose-300'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {card.shared_with_partner ? 'Unshare' : 'Share'}
                </span>
              </Button>
            )}

            {/* Delete */}
            {!isPartnerCard && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-gray-600 hover:text-red-400 h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
