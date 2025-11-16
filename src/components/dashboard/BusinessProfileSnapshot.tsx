import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  MapPin,
  Bed,
  BadgeDollarSign,
  FileCheck,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { getBusinessProfile } from '@/services/businessProfileService';
import { BusinessProfile } from '@/types/assessment';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to format currency
const formatCurrency = (value?: number) => {
  if (!value) return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper to format status labels
const statusLabels: Record<string, string> = {
  'not-started': 'Not Started',
  'researching': 'Researching',
  'searching': 'Searching',
  'offer-pending': 'Offer Pending',
  'under-contract': 'Under Contract',
  'owned': 'Owned',
  'leasing': 'Leasing',
  'documents-gathering': 'Gathering Documents',
  'application-submitted': 'Application Submitted',
  'inspection-scheduled': 'Inspection Scheduled',
  'approved': 'Approved',
  'operational': 'Operational',
};

// Helper to get status color
const getStatusColor = (status?: string) => {
  if (!status) return 'bg-muted text-muted-foreground';

  const successStatuses = ['owned', 'approved', 'operational', 'under-contract'];
  const progressStatuses = ['searching', 'offer-pending', 'documents-gathering', 'application-submitted', 'inspection-scheduled'];
  const startStatuses = ['not-started', 'researching'];

  if (successStatuses.includes(status)) return 'bg-success/10 text-success border-success/30';
  if (progressStatuses.includes(status)) return 'bg-primary/10 text-primary border-primary/30';
  if (startStatuses.includes(status)) return 'bg-muted text-muted-foreground';
  return 'bg-muted text-muted-foreground';
};

interface ProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  badge?: boolean;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function ProfileItem({ icon, label, value, badge, badgeVariant = 'outline' }: ProfileItemProps) {
  const displayValue = value || 'Not set';
  const isSet = value !== undefined && value !== null && value !== '';

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <Badge variant={badgeVariant} className={!isSet ? 'opacity-50' : ''}>
            {displayValue}
          </Badge>
        ) : (
          <p className={`text-sm font-medium truncate ${!isSet ? 'text-muted-foreground italic' : ''}`}>
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}

export function BusinessProfileSnapshot() {
  const { user } = useAuth();
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Business Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const completeness = profile?.profileCompleteness || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            Your Business Snapshot
          </CardTitle>
          <Badge variant={completeness >= 70 ? 'default' : 'secondary'}>
            {completeness}% Complete
          </Badge>
        </div>
        <Progress value={completeness} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core Identity */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Core Identity</h4>

          <ProfileItem
            icon={<Building2 className="w-4 h-4 text-primary" />}
            label="Business Name"
            value={profile?.businessName}
          />

          <ProfileItem
            icon={<MapPin className="w-4 h-4 text-primary" />}
            label="Target State"
            value={profile?.targetState}
            badge
          />

          <ProfileItem
            icon={<Users className="w-4 h-4 text-primary" />}
            label="Entity Type"
            value={profile?.entityType?.toUpperCase().replace('-', ' ')}
            badge
          />
        </div>

        {/* Operations */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground">Operations</h4>

          <ProfileItem
            icon={<Bed className="w-4 h-4 text-primary" />}
            label="Planned Beds"
            value={profile?.bedCount ? `${profile.bedCount} beds` : undefined}
          />

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Property Status</p>
              <Badge
                variant="outline"
                className={getStatusColor(profile?.propertyStatus)}
              >
                {statusLabels[profile?.propertyStatus || ''] || 'Not set'}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FileCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">License Status</p>
              <Badge
                variant="outline"
                className={getStatusColor(profile?.licenseStatus)}
              >
                {statusLabels[profile?.licenseStatus || ''] || 'Not set'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground">Financial</h4>

          <ProfileItem
            icon={<BadgeDollarSign className="w-4 h-4 text-primary" />}
            label="Startup Capital"
            value={formatCurrency(profile?.startupCapitalActual)}
          />

          <ProfileItem
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            label="Monthly Revenue Target"
            value={formatCurrency(profile?.monthlyRevenueTarget)}
          />

          <ProfileItem
            icon={<BadgeDollarSign className="w-4 h-4 text-primary" />}
            label="Funding Source"
            value={profile?.fundingSource?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            badge
          />
        </div>

        {/* Service Model */}
        {profile?.serviceModel && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Service Model:</span>
              <Badge variant="secondary">
                {profile.serviceModel.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>
        )}

        {/* Empty State */}
        {completeness === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Complete tactics in your roadmap to build your business profile.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your profile helps agents give you personalized advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
