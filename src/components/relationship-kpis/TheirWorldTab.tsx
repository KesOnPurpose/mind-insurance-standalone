/**
 * TheirWorldTab — Partner's shared insight cards + reactions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePartnerInsights } from '@/hooks/usePartnerInsights';
import { InsightCard } from '@/components/relationship-kpis/InsightCard';
import { YouSaidTheySaid } from '@/components/relationship-kpis/YouSaidTheySaid';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

export function TheirWorldTab() {
  const { partnerInsights, isLoading, addReaction } = usePartnerInsights();
  const [comparisonKpi, setComparisonKpi] = useState<RelationshipKPIName | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-rose-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group partner insights by KPI
  const grouped = new Map<string, typeof partnerInsights>();
  for (const card of partnerInsights) {
    const existing = grouped.get(card.kpi_name) || [];
    existing.push(card);
    grouped.set(card.kpi_name, existing);
  }

  if (partnerInsights.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">
          Waiting for your partner
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          When your partner completes discovery sessions and shares their insights,
          they'll appear here. Invite them to explore what matters to them.
        </p>
      </div>
    );
  }

  if (comparisonKpi) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setComparisonKpi(null)}
          className="text-gray-400 hover:text-white mb-4"
        >
          Back to Their World
        </Button>
        <YouSaidTheySaid kpiName={comparisonKpi} />
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h3 className="text-white text-sm font-medium">
                    {kpiDef?.label || kpiName}
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-rose-500/10 text-rose-300 border-0 text-xs"
                  >
                    {cards.length} shared
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setComparisonKpi(kpiName as RelationshipKPIName)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Compare
                </Button>
              </div>

              <div className="space-y-2">
                {cards.map((card) => (
                  <InsightCard
                    key={card.id}
                    card={card}
                    isPartnerCard
                    onReact={(reaction) => addReaction(card.id, reaction)}
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
