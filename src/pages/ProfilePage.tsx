import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Clock,
  Mail,
  Settings,
  Home,
  Map,
  FileText,
  Calculator,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ReadinessScoresCard } from '@/components/dashboard/ReadinessScoresCard';

// GROUPHOME STANDALONE: Simplified profile page

export function ProfilePage() {
  const { user } = useAuth();
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('created_at, timezone')
        .eq('id', user.id)
        .single();

      if (data) {
        setMemberSince(data.created_at);
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px] bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <User className="w-8 h-8 text-primary" />
              My Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Your Grouphomes4newbies account information
            </p>
          </div>
        </div>

        {/* Account Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-foreground">
                    {memberSince
                      ? new Date(memberSince).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                  <p className="text-foreground">{timezone.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  Change
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Readiness Assessment Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Your Readiness Assessment</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your personalized readiness scores based on your assessment
          </p>
          <ReadinessScoresCard />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Navigate to key areas of the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Home className="h-5 w-5 text-primary" />
                  <span className="text-sm">Dashboard</span>
                </Button>
              </Link>
              <Link to="/roadmap">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Map className="h-5 w-5 text-primary" />
                  <span className="text-sm">Roadmap</span>
                </Button>
              </Link>
              <Link to="/chat">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="text-sm">Ask Nette</span>
                </Button>
              </Link>
              <Link to="/resources/documents">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm">Documents</span>
                </Button>
              </Link>
              <Link to="/resources/calculator">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Calculator className="h-5 w-5 text-primary" />
                  <span className="text-sm">Calculator</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}

export default ProfilePage;
