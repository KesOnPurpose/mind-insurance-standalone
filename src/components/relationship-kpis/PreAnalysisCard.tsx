/**
 * PreAnalysisCard — "MIO already sees something" card shown before chat starts
 * Displays score trends, cross-KPI correlations, and partner gaps.
 */

import { motion } from 'framer-motion';
import { Brain, TrendingDown, TrendingUp, Minus, Users, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { PreAnalysisData } from '@/types/partner-discovery';

interface PreAnalysisCardProps {
  data: PreAnalysisData;
}

export function PreAnalysisCard({ data }: PreAnalysisCardProps) {
  const hasInsights =
    data.scoreTrend !== null ||
    data.correlatedKpis.length > 0 ||
    data.partnerSharedCount > 0;

  if (!hasInsights) return null;

  const kpiLabel =
    KPI_DEFINITIONS.find((k) => k.name === data.kpiName)?.label || data.kpiName;

  const TrendIcon =
    data.scoreTrend === 'declining' ? TrendingDown
    : data.scoreTrend === 'improving' ? TrendingUp
    : Minus;

  const trendColor =
    data.scoreTrend === 'declining' ? 'text-red-400'
    : data.scoreTrend === 'improving' ? 'text-emerald-400'
    : 'text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="bg-gradient-to-br from-purple-500/10 to-rose-500/10 border-purple-500/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 text-xs font-medium uppercase tracking-wide">
              MIO already sees something
            </span>
          </div>

          <div className="space-y-3">
            {/* Score trend */}
            {data.scoreTrend !== null && data.currentScore !== null && (
              <div className="flex items-start gap-2">
                <TrendIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${trendColor}`} />
                <p className="text-gray-300 text-sm">
                  {data.scoreTrend === 'declining' ? (
                    <>
                      Your <span className="text-white font-medium">{kpiLabel.toLowerCase()}</span> score
                      dropped from{' '}
                      <span className="text-white">{data.previousScore}</span> to{' '}
                      <span className={trendColor}>{data.currentScore}</span>.
                      {data.correlatedKpis.length > 0 && (
                        <>
                          {' '}And something interesting:{' '}
                          <span className="text-white">
                            {KPI_DEFINITIONS.find((k) => k.name === data.correlatedKpis[0].name)?.label}
                          </span>{' '}
                          dropped at the same time.
                        </>
                      )}
                    </>
                  ) : data.scoreTrend === 'improving' ? (
                    <>
                      Your <span className="text-white font-medium">{kpiLabel.toLowerCase()}</span> score
                      is climbing — from{' '}
                      <span className="text-white">{data.previousScore}</span> to{' '}
                      <span className={trendColor}>{data.currentScore}</span>.
                      Let's explore what's fueling this growth.
                    </>
                  ) : (
                    <>
                      Your <span className="text-white font-medium">{kpiLabel.toLowerCase()}</span> score
                      has been steady at{' '}
                      <span className="text-white">{data.currentScore}</span>.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Cross-KPI correlations */}
            {data.correlatedKpis.length > 1 && (
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
                <p className="text-gray-300 text-sm">
                  I noticed{' '}
                  {data.correlatedKpis.map((c, i) => (
                    <span key={c.name}>
                      {i > 0 && (i === data.correlatedKpis.length - 1 ? ' and ' : ', ')}
                      <span className="text-white">
                        {KPI_DEFINITIONS.find((k) => k.name === c.name)?.label}
                      </span>
                    </span>
                  ))}{' '}
                  moved in the same direction. For you, these seem linked.
                </p>
              </div>
            )}

            {/* Partner shared insights */}
            {data.partnerSharedCount > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <p className="text-gray-300 text-sm">
                  Your partner has shared{' '}
                  <span className="text-rose-300">
                    {data.partnerSharedCount} insight{data.partnerSharedCount !== 1 ? 's' : ''}
                  </span>{' '}
                  about what {kpiLabel.toLowerCase()} means to them.
                  {data.partnerInsightSummary && (
                    <span className="text-gray-500 italic">
                      {' '}({data.partnerInsightSummary})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Suggested focus */}
            {data.suggestedFocus && (
              <p className="text-purple-300/80 text-xs italic mt-2">
                My hypothesis: {data.suggestedFocus}. Am I reading that right?
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
