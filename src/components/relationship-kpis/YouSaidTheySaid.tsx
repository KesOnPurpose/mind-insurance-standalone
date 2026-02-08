/**
 * YouSaidTheySaid — Comparison view when both partners complete same KPI
 */

import { motion } from 'framer-motion';
import { Users, Lightbulb, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { usePartnerInsights } from '@/hooks/usePartnerInsights';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

interface YouSaidTheySaidProps {
  kpiName: RelationshipKPIName;
}

export function YouSaidTheySaid({ kpiName }: YouSaidTheySaidProps) {
  const { myInsights, partnerInsights, isLoading } = usePartnerInsights(kpiName);
  const kpiDef = KPI_DEFINITIONS.find((k) => k.name === kpiName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const myShared = myInsights.filter((c) => c.shared_with_partner);
  const hasComparison = myShared.length > 0 && partnerInsights.length > 0;

  if (!hasComparison) {
    return (
      <div className="text-center py-12">
        <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <h3 className="text-white text-base font-medium mb-2">
          Comparison not available yet
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Both partners need to complete the{' '}
          <span className="text-white">{kpiDef?.label}</span> discovery session
          and share insights for comparison to unlock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-rose-400" />
          <h2 className="text-white font-medium">
            {kpiDef?.label}: What Each of You Said
          </h2>
        </div>

        {/* Comparison cards */}
        <div className="space-y-4">
          {/* Show the top insights side by side */}
          {myShared.slice(0, 3).map((myCard, i) => {
            const theirCard = partnerInsights[i];
            return (
              <motion.div
                key={myCard.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    {/* You said */}
                    <div className="p-4 border-b border-white/5">
                      <p className="text-xs text-mi-cyan font-medium uppercase tracking-wide mb-1">
                        You said
                      </p>
                      <p className="text-white text-sm font-medium mb-0.5">
                        {myCard.insight_title}
                      </p>
                      <p className="text-gray-400 text-sm">{myCard.insight_text}</p>
                    </div>

                    {/* They said */}
                    {theirCard ? (
                      <div className="p-4 border-b border-white/5">
                        <p className="text-xs text-rose-400 font-medium uppercase tracking-wide mb-1">
                          They said
                        </p>
                        <p className="text-white text-sm font-medium mb-0.5">
                          {theirCard.insight_title}
                        </p>
                        <p className="text-gray-400 text-sm">{theirCard.insight_text}</p>
                      </div>
                    ) : (
                      <div className="p-4 border-b border-white/5">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
                          They haven't shared a matching insight yet
                        </p>
                      </div>
                    )}

                    {/* MIO insight (generated from the pair) */}
                    {theirCard && (
                      <div className="p-4 bg-purple-500/5">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-purple-400 font-medium mb-1">
                              MIO's Insight
                            </p>
                            <p className="text-gray-300 text-sm">
                              You both care deeply about {kpiDef?.label.toLowerCase()},
                              but you express and receive it differently. The beautiful
                              part? These aren't competing needs — they're complementary.
                              Understanding this difference is the first step to meeting
                              each other where you are.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
