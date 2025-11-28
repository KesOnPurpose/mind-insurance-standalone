import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Brain, Target, Cog, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScoreGaugeProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}

function ScoreGauge({ label, score, icon, color }: ScoreGaugeProps) {
  // Color based on score
  const getScoreColor = (value: number) => {
    if (value >= 75) return 'text-green-600';
    if (value >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      <span className="text-xs text-muted-foreground text-center line-clamp-1">{label}</span>
      <Progress value={score} className="h-1.5 w-full mt-2" />
    </div>
  );
}

/**
 * ReadinessScoresCard - Displays assessment readiness scores in a 2x2 grid
 *
 * Shows:
 * - Financial Readiness
 * - Market Knowledge
 * - Operational Readiness
 * - Mindset & Commitment
 * - Link to retake assessment
 */
export function ReadinessScoresCard() {
  const { user } = useAuth();

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('financial_score, market_score, operational_score, mindset_score, overall_score, readiness_level')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default scores if no assessment data
  const scores = {
    financial: assessment?.financial_score ?? 0,
    market: assessment?.market_score ?? 0,
    operational: assessment?.operational_score ?? 0,
    mindset: assessment?.mindset_score ?? 0,
    overall: assessment?.overall_score ?? 0,
    readinessLevel: assessment?.readiness_level ?? 'Not assessed',
  };

  // Calculate overall average if individual scores exist but overall doesn't
  const overallScore = scores.overall || Math.round(
    (scores.financial + scores.market + scores.operational + scores.mindset) / 4
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Readiness Scores</CardTitle>
          </div>
          <span className="text-2xl font-bold text-primary">{overallScore}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <ScoreGauge
            label="Financial"
            score={scores.financial}
            icon={<DollarSign className="w-4 h-4 text-white" />}
            color="bg-green-500"
          />
          <ScoreGauge
            label="Market"
            score={scores.market}
            icon={<Target className="w-4 h-4 text-white" />}
            color="bg-blue-500"
          />
          <ScoreGauge
            label="Operations"
            score={scores.operational}
            icon={<Cog className="w-4 h-4 text-white" />}
            color="bg-orange-500"
          />
          <ScoreGauge
            label="Mindset"
            score={scores.mindset}
            icon={<Brain className="w-4 h-4 text-white" />}
            color="bg-purple-500"
          />
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Readiness: <span className="font-medium text-foreground capitalize">{scores.readinessLevel}</span>
            </span>
            <Link to="/assessment">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                Retake
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReadinessScoresCard;
