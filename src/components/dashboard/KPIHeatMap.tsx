/**
 * RKPI Dashboard: KPIHeatMap
 * 10-tile grid (2 cols mobile, 5 cols desktop). Color-coded backgrounds.
 * Click navigates to /relationship-kpis/trends?kpi={name}.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { HeatMapCell, RelationshipKPIName } from '@/types/relationship-kpis';
import { formatScore, getCategoryStyle, getScoreCategory } from '@/utils/relationshipKpis';

interface KPIHeatMapProps {
  heatMap: HeatMapCell[];
  latestWeek: string | null;
}

export function KPIHeatMap({ heatMap, latestWeek }: KPIHeatMapProps) {
  const navigate = useNavigate();

  const getLatestScore = (kpiName: RelationshipKPIName): HeatMapCell | undefined => {
    if (!latestWeek) return undefined;
    return heatMap.find((c) => c.kpiName === kpiName && c.week === latestWeek);
  };

  const handleClick = (kpiName: RelationshipKPIName) => {
    navigate(`/relationship-kpis/trends?kpi=${kpiName}`);
  };

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white">KPI Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {KPI_DEFINITIONS.map((kpi) => {
            const cell = getLatestScore(kpi.name);
            const score = cell?.score ?? null;
            const category = score !== null ? getScoreCategory(score) : 'unknown';
            const style = getCategoryStyle(category);

            return (
              <button
                key={kpi.name}
                onClick={() => handleClick(kpi.name)}
                className={`${style.bg} ${style.border} border rounded-lg p-3 text-center transition-all hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-400/50`}
              >
                <p className="text-xs text-white/60 truncate mb-1">{kpi.label}</p>
                <p className={`text-lg font-bold ${style.text}`}>
                  {formatScore(score)}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
