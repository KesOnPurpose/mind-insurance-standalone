import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, TrendingUp, Target, Shield, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/hero-background.jpg";

const LandingPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Your Path to $100K Starts Here</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Your Life Through
              <span className="block bg-gradient-breakthrough bg-clip-text text-transparent">
                Group Home Ownership
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              A personalized system combining real estate education, high-performance planning, and mental breakthrough coaching to help you achieve your first $100,000 in revenue.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link to="/auth">Get Started Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-light" />
                <span>No Overwhelm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-light" />
                <span>Daily Accountability</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-light" />
                <span>Personalized Path</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why 95% of Aspiring Entrepreneurs Never Start
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              It's not lack of knowledge. It's the invisible barriers in your mind combined with overwhelming information and no clear next step.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The Mind Insurance System
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four integrated pillars that work together to ensure your success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 bg-gradient-card border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real Estate Education</h3>
              <p className="text-muted-foreground mb-4">
                403 tactics organized into a 12-week journey. Learn through our AI chatbot Nette - no overwhelming video libraries, just answers when you need them.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Location-specific guidance and regulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Marketing materials and resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Just-in-time learning via AI</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-card border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-breakthrough flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">High Performance Planning</h3>
              <p className="text-muted-foreground mb-4">
                Your personalized roadmap that fits your life. Build your Model Week and get a clear daily focus with just 1-3 tactics per day.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Time-blocking that respects your schedule</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Progressive disclosure - no overwhelm</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dynamic updates as you progress</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-card border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mind Insurance (PROTECT)</h3>
              <p className="text-muted-foreground mb-4">
                Daily 10-minute practice to break through mental barriers. MIO, your AI coach, provides 3x daily check-ins and weekly forensic analysis.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Pattern detection and breakthrough protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Proactive coaching throughout the day</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Weekly insights you won't see yourself</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-card border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Millionaire Essentials</h3>
              <p className="text-muted-foreground mb-4">
                Secure funding and build business credit. Get guidance on business formation, credit repair, and funding strategies to make your first acquisition.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Business formation (LLC vs S-Corp)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Credit repair protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Funding timeline and strategies</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Path */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              Your 180-Day Journey to $100K
            </h2>
            
            <div className="space-y-8">
              {[
                { week: "Week 1-3", title: "Foundation & Habit Formation", desc: "Complete assessments, build your Model Week, and establish daily PROTECT practice. Survive the critical Week 3 dropout point." },
                { week: "Week 4-6", title: "Momentum Building", desc: "Execute 3-5 tactics daily, identify property leads, and experience your first mental breakthroughs with MIO coaching." },
                { week: "Week 7-9", title: "First Deal Pursuit", desc: "Property tours, licensing applications, and intensive execution. MIO provides extra support during this crucial phase." },
                { week: "Week 10-12", title: "Operations & Success", desc: "Close your first property, set up operations, place first resident, and celebrate your transformation." },
              ].map((phase, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary mb-1">{phase.week}</div>
                    <h3 className="text-xl font-bold mb-2">{phase.title}</h3>
                    <p className="text-muted-foreground">{phase.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Break Through?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the platform that combines tactical knowledge, execution planning, and mental breakthroughs to ensure your success.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light shadow-xl text-lg px-12">
              Start Your Free Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/70 mt-4 text-sm">No credit card required • 7-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">© 2024 Mind Insurance. Transforming lives through group home ownership.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
