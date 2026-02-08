/**
 * RKPI-011: CEO Dashboard — Relational Section
 * Widget: Overall score, trend badge, partner name, last check-in date, critical KPIs alert.
 * Links to the full RKPI module.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useRelationship } from '@/contexts/RelationshipContext';
import { getScoreStyle, getScoreCategory, getTrendDirection } from '@/utils/relationshipKpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';

export function RelationalSection() {
  const navigate = useNavigate();
  const {
    partnership,
    pairingStatus,
    latestCheckIn,
    overallScore,
    currentStreak,
    recentCheckIns,
    isLoading,
  } = useRelationship();

  if (isLoading) {
    return (
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-mi-cyan" />
        </CardContent>
      </Card>
    );
  }

  // Compute trend from recent check-ins
  const recentScores = recentCheckIns
    .filter((c) => c.overall_score !== null)
    .map((c) => c.overall_score as number);
  const trend = getTrendDirection(recentScores);

  // Critical KPIs (score ≤ 3) from latest check-in
  const criticalKPIs = (latestCheckIn?.scores ?? [])
    .filter((s) => s.score !== null && s.score <= 3)
    .map((s) => {
      const def = KPI_DEFINITIONS.find((k) => k.name === s.kpi_name);
      return def?.label ?? s.kpi_name;
    });

  // Last check-in date
  const lastCheckInDate = latestCheckIn?.completed_at
    ? new Date(latestCheckIn.completed_at).toLocaleDateString()
    : null;

  // Overall score styling
  const scoreStyle = overallScore !== null ? getScoreStyle(overallScore) : null;
  const scoreCategory = overallScore !== null ? getScoreCategory(overallScore) : null;

  const isPaired = pairingStatus === 'paired';

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-rose-400" />
            Relationship Health
          </CardTitle>
          <CardDescription className="text-white/50">
            Weekly check-in insights for your relational pillar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score + Trend row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Score circle */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                scoreStyle
                  ? `${scoreStyle.bg} ${scoreStyle.border}`
                  : 'border-white/10 bg-white/5'
              }`}>
                <span className={`text-2xl font-bold ${scoreStyle?.text ?? 'text-white/30'}`}>
                  {overallScore !== null ? overallScore.toFixed(1) : '—'}
                </span>
              </div>
              <div>
                <p className="text-sm text-white/70">Overall Score</p>
                {scoreCategory && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${scoreStyle?.text} ${scoreStyle?.border} ${scoreStyle?.bg}`}
                  >
                    {scoreCategory === 'critical' ? 'Critical' :
                     scoreCategory === 'needs_attention' ? 'Needs Attention' :
                     scoreCategory === 'good' ? 'Good' : 'Excellent'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Trend badge */}
            <div className="flex items-center gap-1.5">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-white/30" />}
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-emerald-400' :
                trend === 'down' ? 'text-red-400' :
                'text-white/30'
              }`}>
                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Partner */}
            <div className="rounded-lg bg-white/[0.03] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <Users className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Partner</span>
              </div>
              <p className="text-sm text-white font-medium truncate">
                {isPaired
                  ? partnership?.partner_name || 'Paired'
                  : pairingStatus === 'invited'
                  ? 'Invited'
                  : 'Solo'}
              </p>
            </div>

            {/* Streak */}
            <div className="rounded-lg bg-white/[0.03] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <TrendingUp className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Streak</span>
              </div>
              <p className="text-sm text-white font-medium">
                {currentStreak} week{currentStreak !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Last Check-In */}
            <div className="rounded-lg bg-white/[0.03] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <CalendarDays className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Last Check-In</span>
              </div>
              <p className="text-sm text-white font-medium">
                {lastCheckInDate || 'None yet'}
              </p>
            </div>

            {/* Check-Ins Count */}
            <div className="rounded-lg bg-white/[0.03] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <Heart className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Total</span>
              </div>
              <p className="text-sm text-white font-medium">
                {recentCheckIns.length} check-in{recentCheckIns.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Critical KPIs Alert */}
          {criticalKPIs.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-300">Critical Areas</p>
                <p className="text-[10px] text-red-400/80 mt-0.5">
                  {criticalKPIs.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            variant="outline"
            className="w-full border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
            onClick={() => navigate('/relationship-kpis')}
          >
            Open Relationship Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
