import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Shield, Zap, CheckCircle2, Target, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const MILandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Hero Section - Integrated */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-mi-navy via-mi-navy to-mi-navy/95" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mi-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-mi-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Shield Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-mi-navy border border-mi-cyan/30 flex items-center justify-center shadow-lg shadow-mi-cyan/10">
                <Shield className="w-10 h-10 text-mi-cyan" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Welcome to <span className="text-mi-cyan">Mind Insurance</span>
            </h1>

            <p className="text-xl md:text-2xl mb-4 text-mi-gold font-semibold">
              AI-Powered Pattern Interruption Coach
            </p>

            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Built for entrepreneurs and high-achievers who keep getting in their own way.
            </p>

            {/* Differentiator Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-10">
              <p className="text-lg text-white/80">
                Unlike apps that track habits <span className="text-red-400 font-bold">AFTER</span> they fail, Mind Insurance catches your self-sabotage <span className="text-mi-cyan font-bold">BEFORE</span> it costs you.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                  <Link to="/mind-insurance">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                    <Link to="/auth">Get Started Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-mi-gold/50 text-mi-gold hover:bg-mi-gold/10">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-mi-cyan" />
                <span>Daily 10-Minute Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-mi-cyan" />
                <span>AI-Powered Coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-mi-cyan" />
                <span>Pattern Detection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-mi-navy">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              The <span className="text-mi-cyan">PROTECT</span> System
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Seven daily practices that rewire your neural pathways for success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { letter: "P", title: "Pattern Check", desc: "Identify the mental patterns running your day before they run you." },
              { letter: "R", title: "Reinforce Identity", desc: "Strengthen the identity of who you're becoming, not who you were." },
              { letter: "O", title: "Outcome Visualization", desc: "Program your mind with vivid images of your desired outcomes." },
              { letter: "T", title: "Trigger Reset", desc: "Neutralize the triggers that send you into old patterns." },
              { letter: "E", title: "Energy Audit", desc: "Optimize your mental and physical energy for peak performance." },
              { letter: "C", title: "Celebrate Wins", desc: "Wire your brain to notice and celebrate every victory, big or small." },
              { letter: "T", title: "Tomorrow Setup", desc: "Pre-program tomorrow's success the night before." },
            ].map((practice, index) => (
              <Card key={index} className="p-6 bg-mi-navy/50 border border-white/10 hover:border-mi-cyan/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mi-cyan/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-mi-cyan">{practice.letter}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-white">{practice.title}</h3>
                    <p className="text-sm text-white/60">{practice.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MIO AI Coach */}
      <section className="py-20 bg-gradient-to-b from-mi-navy to-mi-navy/90">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-mi-gold/10 px-4 py-2 rounded-full mb-4">
                  <Brain className="w-4 h-4 text-mi-gold" />
                  <span className="text-sm font-medium text-mi-gold">AI-Powered</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Meet <span className="text-mi-cyan">MIO</span>
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Your Mind Insurance Oracle. MIO analyzes your patterns,
                  predicts breakthrough moments, and delivers personalized insights
                  that you can't see yourself.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">Forensic Pattern Analysis</span>
                      <p className="text-sm text-white/60">Detects hidden patterns in your behavior</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">Breakthrough Prediction</span>
                      <p className="text-sm text-white/60">Knows when you're close to a breakthrough</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">Weekly Insights</span>
                      <p className="text-sm text-white/60">Deep analysis of your progress and patterns</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-mi-cyan/20 to-mi-gold/10 rounded-3xl blur-2xl" />
                <Card className="relative p-8 bg-mi-navy/80 border border-white/10 rounded-3xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-mi-cyan/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-mi-cyan" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">MIO Insight</h3>
                      <p className="text-sm text-white/50">Just now</p>
                    </div>
                  </div>
                  <p className="text-white/80 italic">
                    "I noticed something interesting about your pattern this week.
                    Every time you approach a major win, you create small distractions.
                    This is your Success Sabotage pattern at work. Let's talk about
                    what's really happening..."
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to <span className="text-mi-cyan">Protect Your Mind</span>?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands who are breaking through their mental barriers
            and achieving what they once thought impossible.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-mi-cyan text-mi-navy hover:bg-mi-cyan/90 shadow-xl text-lg px-12 font-semibold">
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/50 mt-4 text-sm">Legacy users: Sign in with your existing account</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mi-navy border-t border-white/10 py-12">
        <div className="container mx-auto px-4 text-center text-white/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-mi-cyan" />
            <span className="text-xl font-bold text-white">Mind Insurance</span>
          </div>
          <p className="text-sm">© 2024 Mind Insurance. Protect your mind, transform your life.</p>
        </div>
      </footer>
    </div>
  );
};

export default MILandingPage;
