import { Card } from '@/components/ui/card';
import { VaultStats as VaultStatsType, formatTotalDuration } from '@/hooks/useVaultRecordings';
import { PatternStats } from '@/hooks/useVaultPractices';
import { Mic, Clock, Brain, Trophy, CheckCircle2 } from 'lucide-react';

interface VaultStatsProps {
  stats: VaultStatsType;
  patternStats?: PatternStats;
  victoriesCount?: number;
  isLoading?: boolean;
}

/**
 * Component to display vault statistics
 * Now shows: Recordings, Total Time, Patterns Caught, Victories
 */
export function VaultStats({ stats, patternStats, victoriesCount = 0, isLoading }: VaultStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Recordings */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalRecordings}</p>
            <p className="text-xs text-muted-foreground">Recordings</p>
          </div>
        </div>
      </Card>

      {/* Total Duration */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatTotalDuration(stats.totalDuration)}</p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </div>
        </div>
      </Card>

      {/* Patterns Caught */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {patternStats?.caught || 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{patternStats?.total || 0}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Patterns Caught</p>
          </div>
        </div>
      </Card>

      {/* Victories Logged */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{victoriesCount}</p>
            <p className="text-xs text-muted-foreground">Victories</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default VaultStats;
