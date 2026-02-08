/**
 * RKPI Page: TrendsAnalytics
 * Trends analytics page with overall score chart, KPI breakdown, insight patterns.
 * Supports date range filtering.
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationship } from '@/contexts/RelationshipContext';
import type { TrendTimeframe, RelationshipKPIName } from '@/types/relationship-kpis';
import { DateRangePicker } from '@/components/relationship-kpis/trends/DateRangePicker';
import { OverallScoreChart } from '@/components/relationship-kpis/trends/OverallScoreChart';
import { KPIBreakdownChart } from '@/components/relationship-kpis/trends/KPIBreakdownChart';
import { InsightPatterns } from '@/components/relationship-kpis/trends/InsightPatterns';

export default function TrendsAnalytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recentCheckIns } = useRelationship();

  const [timeframe, setTimeframe] = useState<TrendTimeframe>('4_weeks');

  // Filter check-ins by timeframe
  const filteredCheckIns = useMemo(() => {
    const completed = recentCheckIns.filter((ci) => ci.status === 'completed');
    if (timeframe === 'all_time') return completed;

    const now = new Date();
    let cutoffDays = 28; // 4 weeks
    if (timeframe === '3_months') cutoffDays = 90;
    if (timeframe === '6_months') cutoffDays = 180;

    const cutoff = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);
    return completed.filter((ci) => {
      const date = new Date(ci.completed_at ?? ci.check_in_date);
      return date >= cutoff;
    });
  }, [recentCheckIns, timeframe]);

  // Active tab based on URL param
  const focusKpi = searchParams.get('kpi') as RelationshipKPIName | null;
  const [activeTab, setActiveTab] = useState<'overall' | 'breakdown' | 'patterns'>(
    focusKpi ? 'breakdown' : 'overall'
  );

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/60 h-8 w-8"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Trends & Analytics</h1>
            <p className="text-xs text-white/40">
              {filteredCheckIns.length} check-in{filteredCheckIns.length !== 1 ? 's' : ''} in range
            </p>
          </div>
        </div>

        {/* Date range */}
        <div className="mb-6">
          <DateRangePicker value={timeframe} onChange={setTimeframe} />
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
          {(['overall', 'breakdown', 'patterns'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/40 hover:text-white/60'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overall' ? 'Overall' : tab === 'breakdown' ? 'By KPI' : 'Patterns'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredCheckIns.length === 0 && (
          <div className="text-center py-16">
            <BarChart3 className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No check-ins in this time range.</p>
            <p className="text-white/30 text-xs mt-1">
              Try expanding your date range or complete more check-ins.
            </p>
          </div>
        )}

        {/* Tab content */}
        {filteredCheckIns.length > 0 && (
          <div>
            {activeTab === 'overall' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                    Overall Score Trend
                  </p>
                  <OverallScoreChart checkIns={filteredCheckIns} />
                </div>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                    KPI Breakdown
                  </p>
                  <KPIBreakdownChart checkIns={filteredCheckIns} />
                </div>
              </div>
            )}

            {activeTab === 'patterns' && (
              <InsightPatterns checkIns={filteredCheckIns} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
