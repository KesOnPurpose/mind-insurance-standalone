import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MapPin, Users, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProfileSnapshotCard - Quick business profile summary
 *
 * Shows:
 * - Business name
 * - Target state
 * - Ownership model
 * - Profile completeness %
 * - Edit profile link
 */
export function ProfileSnapshotCard() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-snapshot', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('business_name, target_state, ownership_model, timeline, capital_available, immediate_priority')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate profile completeness based on filled fields
  const calculateCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.business_name,
      profile.target_state,
      profile.ownership_model,
      profile.timeline,
      profile.capital_available,
      profile.immediate_priority,
    ];
    const filledFields = fields.filter(f => f !== null && f !== undefined && f !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  // Format ownership model for display
  const formatOwnershipModel = (model: string | null) => {
    if (!model) return 'Not set';
    return model
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Business Profile</CardTitle>
          </div>
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Business Name */}
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">
              {profile?.business_name || 'Your Group Home Business'}
            </h3>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {profile?.target_state && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.target_state}
              </Badge>
            )}
            {profile?.ownership_model && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatOwnershipModel(profile.ownership_model)}
              </Badge>
            )}
          </div>

          {/* Profile Completeness */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Profile Complete</span>
              <span className="text-sm font-medium">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
            {completeness < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to get personalized recommendations
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileSnapshotCard;
