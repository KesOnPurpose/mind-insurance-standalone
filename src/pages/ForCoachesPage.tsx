import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  MessageCircle,
  Award,
  ExternalLink,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { MILogo } from "@/components/brand/MILogo";
import { useState } from "react";

// ============================================================================
// MIO FOR COACHES - Streamlined 7-Section Landing Page
// ============================================================================
// REFACTORED: From 10 sections to 7 using Hormozi Value Equation
// VALUE = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort)
//
// 1. Hero - Hook + pain agitation (Dream Outcome)
// 2. Problem Amplification - "80% of calls = same patterns" (Pain)
// 3. Solution Introduction - "MIO detects patterns 24/7" (Perceived Likelihood)
// 4. How It Works - 3-step visual (Effort Reduction)
// 5. Economics/ROI - "$75K leak, 30→5 hrs" (Time Delay + Results)
// 6. Social Proof - Keston intro + cross-site links (Perceived Likelihood)
// 7. CTA - "Apply for Founding Partner" (Action)
//
// Deep-dive content moved to kestonglasgow.com cross-links:
// - Identity Collision / 3 Prisons → kestonglasgow.com/framework
// - P.R.O.T.E.C.T. Method details → kestonglasgow.com/approach
// - Full case studies → kestonglasgow.com/results
// ============================================================================

const ForCoachesPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mi-navy font-body">
      {/* Navigation Header - Consistent with MILandingPage */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-mi-navy/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center">
              <MILogo size="sm" variant="icon" showText />
            </Link>

            {/* Desktop Nav - Center */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                Home
              </Link>
              <Link to="/for-coaches" className="text-mi-cyan font-medium">
                For Coaches
              </Link>
              <Link to="/founders" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                About Us
              </Link>
            </nav>

            {/* CTA - Right */}
            <div className="hidden md:flex items-center gap-4">
              <Button asChild size="sm" className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                <a href="#founding-partner">Become a Partner</a>
              </Button>
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
                  to="/"
                  className="text-white/70 hover:text-mi-cyan transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/for-coaches"
                  className="text-mi-cyan font-medium py-2"
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
                <div className="border-t border-white/10 pt-4 mt-2">
                  <Button asChild className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                    <a href="#founding-partner" onClick={() => setMobileMenuOpen(false)}>Become a Partner</a>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ================================================================== */}
      {/* SECTION 1: HERO - Hook + Pain Agitation */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-mi-navy via-mi-navy to-mi-navy/95" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mi-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-mi-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-mi-gold/10 border border-mi-gold/30 rounded-full mb-8 w-fit">
              <span className="w-2 h-2 bg-mi-gold rounded-full animate-pulse" />
              <span className="text-mi-gold text-sm font-semibold uppercase tracking-wider">
                For High-Ticket Coaches Only
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-[80px] font-bold text-white leading-[1.1] mb-6 uppercase tracking-wide">
              <span className="block">You Became a Coach to{" "}
                <span className="text-mi-cyan">Transform Lives.</span>
              </span>
              <span className="block mt-2">Not to Be a</span>
              <span className="block mt-2 text-mi-gold">Part-Time Therapist.</span>
            </h1>

            {/* Subheadline - Pain Agitation */}
            <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-10 max-w-3xl">
              Your content is solid. But <span className="text-mi-red font-semibold">80% of your calls</span> are spent
              unpacking why clients self-sabotage instead of teaching what you're best at.
              MIO detects those patterns <span className="text-mi-cyan font-semibold">BEFORE</span> they
              hijack your calendar—and intervenes before they quit.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                <a href="#founding-partner">Become a Founding Partner</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-white/30 text-white hover:bg-white/10">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-mi-cyan">$75K</div>
                <div className="text-white/50 text-sm uppercase tracking-wider mt-1">Avg. Annual Revenue Leak</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-mi-cyan">7</div>
                <div className="text-white/50 text-sm uppercase tracking-wider mt-1">Mindset Patterns Detected</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-mi-cyan">6 Days</div>
                <div className="text-white/50 text-sm uppercase tracking-wider mt-1">Early Warning Before Dropout</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 2: PROBLEM AMPLIFICATION */}
      {/* ================================================================== */}
      <section className="py-20 bg-gradient-to-b from-mi-navy to-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-red font-semibold uppercase tracking-wider mb-4">
              The Invisible Leak
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              The Content Isn't the Problem. The <span className="text-mi-red">Mindset</span> Is.
            </h2>
            <p className="text-lg text-white/70">
              Every refund, every dropout, every client who ghosts—they're not quitting your content.
              They're losing a war with their own identity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: DollarSign,
                stat: "$75K",
                title: "Revenue Walking Out the Door",
                description: "Every refund, every dropout, every client who ghosts—that's revenue you'll never see again.",
                color: "mi-red"
              },
              {
                icon: Clock,
                stat: "30 hrs",
                title: "Weekly Support That Should Be Automated",
                description: "Your expertise is buried under emotional support calls. You're playing therapist, not coach.",
                color: "mi-red"
              },
              {
                icon: Eye,
                stat: "0 Days",
                title: "Warning Before Refund Requests",
                description: "By the time they ask for a refund, the decision was made 6 days ago. You never got a chance to intervene.",
                color: "mi-red"
              },
              {
                icon: Brain,
                stat: "80%",
                title: "Of Your Calls Are the Same Patterns",
                description: "Imposter syndrome. Self-sabotage. Fear of failure. The same 7 patterns, over and over.",
                color: "cyan"
              },
            ].map((pain, index) => (
              <Card key={index} className={`p-6 bg-mi-navy/50 border ${pain.color === 'mi-red' ? 'border-mi-red/30' : 'border-mi-cyan/30'} hover:border-opacity-50 transition-all`}>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl ${pain.color === 'mi-red' ? 'bg-mi-red/20' : 'bg-mi-cyan/20'} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-2xl font-bold ${pain.color === 'mi-red' ? 'text-mi-red' : 'text-mi-cyan'}`}>{pain.stat}</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-2 uppercase tracking-wide">{pain.title}</h3>
                    <p className="text-white/60">{pain.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Cross-site Link: Deep-dive on Identity Collision */}
          <div className="mt-12 text-center">
            <a
              href="https://kestonglasgow.com/framework"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-mi-cyan hover:text-mi-cyan/80 transition-colors"
            >
              <span className="underline">Learn why all 7 patterns trace back to Identity Collision</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3: SOLUTION INTRODUCTION */}
      {/* ================================================================== */}
      <section className="py-20 bg-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-cyan font-semibold uppercase tracking-wider mb-4">
              Meet MIO
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Your 24/7 Behavioral Forensics System
            </h2>
            <p className="text-lg text-white/70">
              MIO detects the 7 patterns that kill completion rates—and intervenes
              before your clients even know they're stuck.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* Engine 1: Knowledge Base */}
            <Card className="p-8 bg-mi-navy/50 border border-mi-cyan/30 hover:border-mi-cyan/50 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-mi-cyan/20 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-mi-cyan" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4 uppercase tracking-wide">
                What Your Students See
              </h3>
              <p className="text-white/70 mb-4">
                An always-available assistant that answers questions in YOUR voice,
                with YOUR frameworks, 24/7.
              </p>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                  <span>Instant answers to content questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                  <span>Delivers YOUR methodology consistently</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                  <span>Feels like having you on speed dial</span>
                </li>
              </ul>
            </Card>

            {/* Engine 2: Behavioral Forensics */}
            <Card className="p-8 bg-mi-navy/50 border border-mi-gold/30 hover:border-mi-gold/50 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-mi-gold/20 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-mi-gold" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4 uppercase tracking-wide">
                What Runs in the Background
              </h3>
              <p className="text-white/70 mb-4">
                A behavioral forensics engine that detects patterns
                6 days before the refund request.
              </p>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-gold mt-0.5 flex-shrink-0" />
                  <span>33 behavioral signals tracked</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-gold mt-0.5 flex-shrink-0" />
                  <span>7 mindset patterns detected in real-time</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mi-gold mt-0.5 flex-shrink-0" />
                  <span>Automatic intervention when patterns spike</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Medicine in the Candy */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-mi-navy border border-mi-cyan/30 rounded-lg">
              <Zap className="w-5 h-5 text-mi-gold" />
              <span className="text-white font-semibold">
                Medicine in the Candy—Students get instant support. You get early warnings.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 4: HOW IT WORKS */}
      {/* ================================================================== */}
      <section id="how-it-works" className="py-20 bg-mi-navy">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-cyan font-semibold uppercase tracking-wider mb-4">
              Zero-Friction Deployment
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              How MIO Protects Your Revenue
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-mi-cyan/20 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-mi-cyan">1</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3 uppercase tracking-wide">Students Ask Questions</h3>
              <p className="text-white/60">MIO answers in your voice, with your frameworks. Students feel supported 24/7.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-mi-gold/20 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-mi-gold">2</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3 uppercase tracking-wide">MIO Analyzes Patterns</h3>
              <p className="text-white/60">Behind every conversation, MIO tracks 33 signals. Detects imposter syndrome, self-sabotage, fear...</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-mi-cyan/20 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-mi-cyan">3</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3 uppercase tracking-wide">Intervention in Flow</h3>
              <p className="text-white/60">Pattern detected → Intervention delivered. They get unstuck without knowing they were being coached on mindset.</p>
            </div>
          </div>

          {/* Cross-site Link: P.R.O.T.E.C.T. Method */}
          <div className="text-center">
            <a
              href="https://kestonglasgow.com/approach"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-mi-gold hover:text-mi-gold/80 transition-colors"
            >
              <span className="underline">See the P.R.O.T.E.C.T. Method behind MIO's interventions</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 5: ECONOMICS / ROI */}
      {/* ================================================================== */}
      <section className="py-20 bg-gradient-to-b from-mi-navy to-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-gold font-semibold uppercase tracking-wider mb-4">
              The Math That Matters
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Reclaim Your Week. Keep Your Revenue.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Before */}
            <Card className="p-8 bg-mi-red/10 border border-mi-red/30">
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="w-8 h-8 text-mi-red" />
                <h3 className="font-heading text-xl font-bold text-mi-red uppercase tracking-wide">Before MIO</h3>
              </div>
              <ul className="space-y-4 text-white/70">
                <li className="flex items-center gap-3">
                  <span className="text-mi-red font-bold text-2xl">30+</span>
                  <span>hours/week on support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-mi-red font-bold text-2xl">$75K</span>
                  <span>annual revenue leak</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-mi-red font-bold text-2xl">0</span>
                  <span>days warning before refunds</span>
                </li>
              </ul>
            </Card>

            {/* After */}
            <Card className="p-8 bg-mi-cyan/10 border border-mi-cyan/30">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-mi-cyan" />
                <h3 className="font-heading text-xl font-bold text-mi-cyan uppercase tracking-wide">After MIO</h3>
              </div>
              <ul className="space-y-4 text-white/70">
                <li className="flex items-center gap-3">
                  <span className="text-mi-cyan font-bold text-2xl">5</span>
                  <span>hours/week on support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-mi-cyan font-bold text-2xl">30%</span>
                  <span>reduction in refunds (guaranteed)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-mi-cyan font-bold text-2xl">6</span>
                  <span>days early warning system</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Big Number Summary */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-gold">25+</div>
              <div className="text-white/50 text-sm mt-1">Hours Reclaimed Weekly</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-gold">80%</div>
              <div className="text-white/50 text-sm mt-1">Q&A Automated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-gold">$22K+</div>
              <div className="text-white/50 text-sm mt-1">Saved Per Year (at 30% reduction)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 6: SOCIAL PROOF - Keston + Cross-Site Links */}
      {/* ================================================================== */}
      <section className="py-20 bg-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-cyan font-semibold uppercase tracking-wider mb-4">
              Meet the Creator
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Built by a Coach Who Lived the Problem
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12 bg-mi-navy/50 border border-white/10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Keston's Photo */}
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-mi-cyan/20 to-mi-gold/20 flex-shrink-0 overflow-hidden border-2 border-mi-cyan/30">
                  <img
                    src="/images/keston/headshot-clean.png"
                    alt="Keston Glasgow - Creator of Mind Insurance"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-heading text-2xl font-bold text-white mb-2 uppercase tracking-wide">
                    Keston Glasgow
                  </h3>
                  <p className="text-mi-cyan font-semibold mb-4">Creator of Mind Insurance & The P.R.O.T.E.C.T. Method</p>

                  <p className="text-white/70 mb-6">
                    After 8 years on Wall Street and coaching thousands of high-achievers,
                    Keston discovered that the same 7 mindset patterns were responsible for
                    80% of client struggles. MIO is the AI system he built to detect and
                    intervene on those patterns—automatically.
                  </p>

                  {/* Cross-site Links */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <a
                      href="https://kestonglasgow.com/story"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-mi-cyan/10 border border-mi-cyan/30 rounded-lg text-mi-cyan hover:bg-mi-cyan/20 transition-colors"
                    >
                      <span>Read Keston's Full Story</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href="https://kestonglasgow.com/results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-mi-gold/10 border border-mi-gold/30 rounded-lg text-mi-gold hover:bg-mi-gold/20 transition-colors"
                    >
                      <span>See Client Results</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats - Social Proof */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-12 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-cyan">3,000+</div>
              <div className="text-white/50 text-sm mt-1">High-Achievers Assessed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-cyan">8</div>
              <div className="text-white/50 text-sm mt-1">Years on Wall Street</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-mi-cyan">95%</div>
              <div className="text-white/50 text-sm mt-1">Breakthrough Prediction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 7: CTA - Founding Partner Offer */}
      {/* ================================================================== */}
      <section id="founding-partner" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-mi-gold font-semibold uppercase tracking-wider mb-4">
                Founding Partner Program
              </p>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
                Become a Mind Insurance <span className="text-mi-cyan">Founding Partner</span>
              </h2>
              <p className="text-xl text-white/70">
                Limited to 10 coaches in this cohort.
              </p>
            </div>

            <Card className="p-8 md:p-12 bg-mi-navy/80 border border-mi-gold/30 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-12">
                {/* What You Get */}
                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <Award className="w-6 h-6 text-mi-gold" />
                    What You Get
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "MIO fully deployed (7-day onboarding)",
                      "Voice training on YOUR content library",
                      "33 behavioral detection signals active",
                      "P.R.O.T.E.C.T. intervention protocols",
                      "Monthly analytics dashboard",
                      "Quarterly voice calibration",
                      "Direct Slack access to MIO team",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-white/80">
                        <CheckCircle2 className="w-5 h-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The Guarantee */}
                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <Shield className="w-6 h-6 text-mi-cyan" />
                    The Guarantee
                  </h3>
                  <Card className="p-6 bg-mi-cyan/10 border border-mi-cyan/30 mb-8">
                    <p className="text-lg text-white font-semibold text-center">
                      30% Refund Reduction in 90 Days—Or Your Investment Back
                    </p>
                  </Card>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-mi-gold/20 rounded-full mb-6">
                      <span className="text-mi-gold font-semibold">7 of 10 spots claimed</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button asChild size="lg" className="w-full text-lg py-6 bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                      <a href="https://calendly.com/purposewaze" target="_blank" rel="noopener noreferrer">
                        Apply for Founding Partner Access
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </a>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full text-lg py-6 bg-transparent border-white/30 text-white hover:bg-white/10">
                      <a href="https://calendly.com/purposewaze" target="_blank" rel="noopener noreferrer">
                        Book Discovery Call First
                      </a>
                    </Button>
                  </div>

                  <p className="text-white/50 text-sm text-center mt-4">
                    No commitment until discovery call
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="bg-mi-navy border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6">
            <MILogo size="lg" variant="lockup" />
          </div>

          {/* Footer Navigation - Internal Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-4">
            <Link to="/" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              Home
            </Link>
            <Link to="/for-coaches" className="text-mi-cyan text-sm">
              For Coaches
            </Link>
            <Link to="/founders" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              About Us
            </Link>
            <Link to="/auth" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              Sign In
            </Link>
          </div>

          {/* Cross-site Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <a
              href="https://kestonglasgow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-mi-gold transition-colors text-sm inline-flex items-center gap-1"
            >
              <span>KestonGlasgow.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://kestonglasgow.com/framework"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-mi-gold transition-colors text-sm inline-flex items-center gap-1"
            >
              <span>The Framework</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://kestonglasgow.com/approach"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-mi-gold transition-colors text-sm inline-flex items-center gap-1"
            >
              <span>P.R.O.T.E.C.T. Method</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-center text-white/50 text-sm">© 2024 Mind Insurance. Protect your mind, transform your life.</p>
        </div>
      </footer>
    </div>
  );
};

export default ForCoachesPage;
