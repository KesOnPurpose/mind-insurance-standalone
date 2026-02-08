/**
 * RKPI Dashboard: RecentCheckIns
 * Last 3 check-ins: date, score badge, action item count.
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CheckInWithScores } from '@/types/relationship-kpis';
import { formatScore, getScoreStyle } from '@/utils/relationshipKpis';

interface RecentCheckInsProps {
  checkIns: CheckInWithScores[];
}

function formatCheckInDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentCheckIns({ checkIns }: RecentCheckInsProps) {
  const navigate = useNavigate();
  const recent = checkIns.filter((ci) => ci.status === 'completed').slice(0, 3);

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium text-white">Recent Check-Ins</CardTitle>
        {recent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
            onClick={() => navigate('/relationship-kpis/history')}
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">
            No completed check-ins yet
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((ci) => {
              const style = ci.overall_score !== null ? getScoreStyle(ci.overall_score) : null;
              const actionCount = ci.action_items?.length ?? 0;

              return (
                <div
                  key={ci.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-white/40" />
                    <div>
                      <p className="text-sm text-white/80">
                        {formatCheckInDate(ci.check_in_date)}
                      </p>
                      <p className="text-xs text-white/40">{ci.check_in_week}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {actionCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{actionCount}</span>
                      </div>
                    )}
                    {ci.overall_score !== null && style && (
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                        {formatScore(ci.overall_score)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
