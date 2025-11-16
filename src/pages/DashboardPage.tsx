import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  Flame,
  Trophy,
  Clipboard,
  Shield,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/services/progressService";
import { BusinessProfileSnapshot } from "@/components/dashboard/BusinessProfileSnapshot";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: userProgress } = useUserProgress(user?.id || '');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile for gamification data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

  const currentWeek = userProfile?.current_week || 1;
  const totalWeeks = 12;
  const protectStreak = userProfile?.current_streak || 0;
  const totalPoints = userProfile?.total_points || 0;
  const completedTactics = userProfile?.completed_tactics_count || 0;

  // Mock next tactic (in production this would come from the roadmap service)
  const nextTactic = {
    id: 'W1-BP-003',
    name: 'Define Your Target Demographics',
    category: 'BUSINESS PLANNING',
    description: 'Identify the specific population you\'ll serve in your group home. This decision affects licensing, staffing, and revenue potential.',
    estimatedTime: '30 min',
  };

  // Week categories progress (mock data - would come from actual tactic progress)
  const weekCategories = [
    { name: 'Business Planning', completed: 1, total: 8, color: 'bg-blue-500' },
    { name: 'Legal & Compliance', completed: 0, total: 6, color: 'bg-purple-500' },
    { name: 'Financial', completed: 1, total: 7, color: 'bg-green-500' },
    { name: 'Operations', completed: 0, total: 6, color: 'bg-orange-500' },
  ];

  // Real-time subscription for progress updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gh_user_tactic_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          queryClient.invalidateQueries({ queryKey: ['personalizedTactics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  return (
    <div className="space-y-6">
      {/* Hero: Your Next Move */}
      <Card className="p-8 bg-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              WEEK {currentWeek} OF {totalWeeks}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Your Next Move</h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {protectStreak} day streak
            </span>
            <span>{completedTactics}/403 tactics</span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              {totalPoints} pts
            </span>
          </div>
        </div>

        {/* Single Focus Card */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Clipboard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-2">
                {nextTactic.category}
              </Badge>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{nextTactic.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{nextTactic.description}</p>
              <div className="flex items-center gap-4">
                <Link to="/roadmap">
                  <Button className="bg-primary hover:bg-primary/90">
                    Start This Tactic
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <span className="text-xs text-muted-foreground">~{nextTactic.estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Week Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Week {currentWeek}: Foundation & Vision</h3>
              <span className="text-sm text-muted-foreground">
                {weekCategories.reduce((acc, c) => acc + c.completed, 0)}/
                {weekCategories.reduce((acc, c) => acc + c.total, 0)} tactics
              </span>
            </div>

            {/* Overall Week Progress */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: `${(weekCategories.reduce((acc, c) => acc + c.completed, 0) / weekCategories.reduce((acc, c) => acc + c.total, 0)) * 100}%`
                }}
              />
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {weekCategories.map((category) => (
                <div key={category.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.completed}/{category.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(category.completed / category.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Link to="/roadmap">
                <Button variant="link" className="text-primary p-0 h-auto font-medium">
                  View Full Roadmap →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Nette AI Quick Access */}
          <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Need Help? Ask Nette</h3>
                  <p className="text-white/80 text-sm">Your AI group home coach is ready to answer questions</p>
                </div>
              </div>
              <Link to="/chat">
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Chat with Nette
                </Button>
              </Link>
            </div>
          </Card>

          {/* Cross-Product Link: Mind Insurance */}
          <Card className="p-4 bg-purple-50 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Protect Your Mindset Today</p>
                  <p className="text-xs text-gray-600">
                    {protectStreak === 0
                      ? "You haven't started your PROTECT streak yet"
                      : `${protectStreak} day streak - Keep it going!`}
                  </p>
                </div>
              </div>
              <Link to="/protect">
                <Button variant="link" className="text-purple-600 font-medium p-0 h-auto">
                  Start Practice →
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: Business Snapshot */}
        <div className="space-y-6">
          <BusinessProfileSnapshot />

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Your Journey</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Progress</span>
                  <span className="font-semibold">{completedTactics}/403</span>
                </div>
                <Progress value={(completedTactics / 403) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Current Level</span>
                  <span className="font-semibold">{Math.floor(totalPoints / 100)}</span>
                </div>
                <Progress value={totalPoints % 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - (totalPoints % 100)} XP to next level
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/roadmap" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Target className="w-4 h-4 mr-2" />
                  View Roadmap
                </Button>
              </Link>
              <Link to="/model-week" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Model Week
                </Button>
              </Link>
              <Link to="/chat" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Ask Nette AI
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
