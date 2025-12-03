import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPin,
  DollarSign,
  Edit,
  ChevronRight,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { getBusinessProfile } from '@/services/businessProfileService';
import { BusinessProfile } from '@/types/assessment';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';

interface ProfileInsightsCardProps {
  onEditClick?: () => void;
}

// Helper to format currency
const formatCurrency = (value?: number) => {
  if (!value) return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

// Map readiness levels to human-readable labels
const readinessLabels: Record<string, string> = {
  'ready_to_launch': 'Ready to Launch',
  'advanced': 'Advanced',
  'intermediate': 'Intermediate',
  'beginner': 'Beginner',
  'exploring': 'Exploring',
};

/**
 * ProfileInsightsCard - Condensed profile display with assessment highlights
 *
 * Shows:
 * - Business name and state
 * - Assessment scores (overall, financial, knowledge)
 * - Readiness level
 * - Quick edit button
 */
export function ProfileInsightsCard({ onEditClick }: ProfileInsightsCardProps) {
  const { user } = useAuth();
  const { assessment } = usePersonalizedTactics();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const data = await getBusinessProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error('Error fetching business profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-2 w-full mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  const completeness = profile?.profileCompleteness || 0;
  const overallScore = assessment?.overall_score || 0;
  const financialScore = assessment?.financial_score || 0;
  const knowledgeScore = assessment?.knowledge_score || 0;
  const readinessLevel = assessment?.readiness_level || 'exploring';

  return (
    <Card className="p-6">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">
              {profile?.businessName || 'Your Business'}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{profile?.targetState || 'State not set'}</span>
            </div>
          </div>
        </div>
        {onEditClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEditClick}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Profile Completeness */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Profile Complete</span>
          <span className="font-medium">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2" />
      </div>

      {/* Assessment Scores Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{overallScore}</p>
          <p className="text-xs text-muted-foreground">Overall</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-green-600" />
          </div>
          <p className="text-lg font-bold text-foreground">{financialScore}</p>
          <p className="text-xs text-muted-foreground">Financial</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-foreground">{knowledgeScore}</p>
          <p className="text-xs text-muted-foreground">Knowledge</p>
        </div>
      </div>

      {/* Readiness Level */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Readiness Level</span>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {readinessLabels[readinessLevel] || readinessLevel}
        </Badge>
      </div>

      {/* Capital & Model Info */}
      {(assessment?.capital_available || assessment?.ownership_model) && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{formatCurrency(assessment?.capital_available)}</span>
          </div>
          {assessment?.ownership_model && (
            <Badge variant="secondary" className="text-xs">
              {assessment.ownership_model.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      )}

      {/* Edit Profile Link */}
      {onEditClick && (
        <Button
          variant="ghost"
          className="w-full mt-4 justify-between text-sm"
          onClick={onEditClick}
        >
          View Full Profile
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}

export default ProfileInsightsCard;
