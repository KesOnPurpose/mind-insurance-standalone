/**
 * MyInsightsTab — Your saved insight cards grouped by KPI
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePartnerInsights } from '@/hooks/usePartnerInsights';
import { InsightCard } from '@/components/relationship-kpis/InsightCard';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { PartnerInsightCard } from '@/types/partner-discovery';

interface MyInsightsTabProps {
  onGoDeeper?: (card: PartnerInsightCard) => void;
}

export function MyInsightsTab({ onGoDeeper }: MyInsightsTabProps) {
  const { myInsights, isLoading, toggleShare, removeInsight } = usePartnerInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group insights by KPI
  const grouped = new Map<string, typeof myInsights>();
  for (const card of myInsights) {
    const existing = grouped.get(card.kpi_name) || [];
    existing.push(card);
    grouped.set(card.kpi_name, existing);
  }

  if (myInsights.length === 0) {
    return (
      <div className="text-center py-16">
        <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">
          No insight cards yet
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Complete a discovery session to see your insight cards here.
          MIO will surface patterns, preferences, and boundaries as you explore.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {Array.from(grouped.entries()).map(([kpiName, cards], i) => {
          const kpiDef = KPI_DEFINITIONS.find((k) => k.name === kpiName);
          return (
            <motion.div
              key={kpiName}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="text-white text-sm font-medium">
                  {kpiDef?.label || kpiName}
                </h3>
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-300 border-0 text-xs"
                >
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </Badge>
              </div>

              <div className="space-y-2">
                {cards.map((card) => (
                  <InsightCard
                    key={card.id}
                    card={card}
                    isPartnerCard={false}
                    onToggleShare={(share) => toggleShare(card.id, share)}
                    onDelete={() => removeInsight(card.id)}
                    onGoDeeper={onGoDeeper ? () => onGoDeeper(card) : undefined}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
