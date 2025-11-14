import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Zap, 
  Calendar,
  CheckCircle2,
  ArrowRight,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  // Mock data
  const currentWeek = 1;
  const totalWeeks = 12;
  const weekProgress = (currentWeek / totalWeeks) * 100;
  const protectStreak = 3;
  const todaysTactics = [
    { id: 1, name: "Research group home regulations in your state", completed: true },
    { id: 2, name: "Identify 3 potential neighborhoods", completed: false },
    { id: 3, name: "Create initial budget estimate", completed: false },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Future Owner! 🎯</h1>
              <p className="text-white/80">Week {currentWeek} of {totalWeeks} • Keep the momentum going</p>
            </div>
            <Link to="/protect">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary-light">
                <Brain className="w-4 h-4 mr-2" />
                PROTECT Practice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* PROTECT Status */}
            <Card className="p-6 bg-gradient-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Today's PROTECT Practice</h2>
                  <p className="text-muted-foreground">Your daily mental insurance policy</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
                  <Flame className="w-5 h-5 text-success" />
                  <span className="font-bold text-success">{protectStreak} day streak</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-1">Morning</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="font-semibold">Complete</span>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Midday</div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    <span className="font-semibold">Pending</span>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Evening</div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    <span className="font-semibold">Pending</span>
                  </div>
                </div>
              </div>

              <Link to="/protect">
                <Button className="w-full bg-gradient-hero hover:opacity-90 transition-opacity">
                  Complete Midday Practice
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </Card>

            {/* Today's Focus */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-breakthrough flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Today's Focus</h2>
                  <p className="text-sm text-muted-foreground">Maximum 3 tactics per day</p>
                </div>
              </div>

              <div className="space-y-3">
                {todaysTactics.map((tactic) => (
                  <div 
                    key={tactic.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <button
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        tactic.completed 
                          ? 'bg-success border-success' 
                          : 'border-muted-foreground hover:border-primary'
                      }`}
                    >
                      {tactic.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${tactic.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {tactic.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                Ask Nette for Guidance
              </Button>
            </Card>

            {/* Weekly Progress */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-success flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Weekly Progress</h2>
                  <p className="text-sm text-muted-foreground">Week {currentWeek} of {totalWeeks}</p>
                </div>
              </div>

              <Progress value={weekProgress} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                {currentWeek} weeks completed • {totalWeeks - currentWeek} weeks remaining
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/chat" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="w-4 h-4 mr-2" />
                    Ask Nette AI
                  </Button>
                </Link>
                <Link to="/model-week" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Model Week
                  </Button>
                </Link>
                <Link to="/roadmap" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    View Roadmap
                  </Button>
                </Link>
              </div>
            </Card>

            {/* MIO Message */}
            <Card className="p-6 bg-gradient-breakthrough">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-semibold mb-2 text-white">Message from MIO</div>
                  <p className="text-sm text-white/90">
                    Great job maintaining your streak! I noticed you're moving fast through the tactics. Let's make sure we're building solid foundations. 💪
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Your Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Tactics Completed</span>
                    <span className="font-semibold">8/403</span>
                  </div>
                  <Progress value={2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">PROTECT Completion</span>
                    <span className="font-semibold">43%</span>
                  </div>
                  <Progress value={43} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Weekly Goal</span>
                    <span className="font-semibold">3/5 days</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
