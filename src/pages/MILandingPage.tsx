import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Zap, CheckCircle2, Target, Sparkles, TrendingUp, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MILogo } from "@/components/brand/MILogo";
import { useState } from "react";

const MILandingPage = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Navigation Header - Clint Pulver Standard */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-mi-navy/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center">
              <MILogo size="sm" variant="icon" showText />
            </Link>

            {/* Desktop Nav - Center */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/for-coaches" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                For Coaches
              </Link>
              <Link to="/founders" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                About Us
              </Link>
              <a href="#how-it-works" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                How It Works
              </a>
            </nav>

            {/* CTA - Right */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Button asChild size="sm" className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                  <Link to="/mind-insurance">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Link to="/auth" className="text-white/70 hover:text-white transition-colors font-medium">
                    Sign In
                  </Link>
                  <Button asChild size="sm" className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-mi-navy border-b border-white/10 py-4">
              <nav className="flex flex-col gap-4 px-4">
                <Link
                  to="/for-coaches"
                  className="text-white/70 hover:text-mi-cyan transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Coaches
                </Link>
                <Link
                  to="/founders"
                  className="text-white/70 hover:text-mi-cyan transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About Us
                </Link>
                <a
                  href="#how-it-works"
                  className="text-white/70 hover:text-mi-cyan transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <div className="border-t border-white/10 pt-4 mt-2">
                  {user ? (
                    <Button asChild className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                      <Link to="/mind-insurance" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button asChild className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Integrated */}
      <section className="relative overflow-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-mi-navy via-mi-navy to-mi-navy/95" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mi-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-mi-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Mind Insurance Logo - icon-only variant to avoid text redundancy with headline */}
            <div className="flex justify-center mb-8 relative z-10">
              <MILogo size="hero" variant="icon" glow />
            </div>

            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl xl:text-[80px] font-bold mb-4 leading-tight uppercase tracking-wide text-mi-cyan">
              Mind Insurance
            </h1>

            <p className="text-2xl md:text-4xl font-semibold text-white mb-4">
              Stop Getting in Your Own Way.
            </p>

            <p className="text-lg md:text-xl text-mi-gold mb-8 max-w-2xl mx-auto">
              AI-powered identity protection that rewires the patterns keeping high achievers stuck—in just 10 minutes a day.
            </p>

            {/* Differentiator Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-10">
              <p className="text-lg text-white/80">
                Unlike apps that track habits <span className="text-mi-red font-bold">AFTER</span> they fail, Mind Insurance catches your self-sabotage <span className="text-mi-cyan font-bold">BEFORE</span> it costs you.
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
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6">
            <MILogo size="lg" variant="lockup" />
          </div>

          {/* Footer Navigation */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-6">
            <Link to="/for-coaches" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              For Coaches
            </Link>
            <Link to="/founders" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              About Us
            </Link>
            <a href="https://kestonglasgow.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              Keston Glasgow
            </a>
            <Link to="/auth" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              Sign In
            </Link>
          </div>

          <p className="text-center text-white/50 text-sm">© 2024 Mind Insurance. Protect your mind, transform your life.</p>
        </div>
      </footer>
    </div>
  );
};

export default MILandingPage;
