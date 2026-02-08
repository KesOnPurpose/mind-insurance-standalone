import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Award,
  Brain,
  Users,
  Target,
  Cpu,
  Building2,
  Briefcase,
  Heart,
  BarChart3,
  Lightbulb,
  Scale,
  Layers,
  Menu,
  X,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { MILogo } from "@/components/brand/MILogo";
import { useState } from "react";

// ============================================================================
// FOUNDERS PAGE - Meet the Team Behind Mind Insurance
// ============================================================================
// 7-Section structure per feature_list.json:
// 1. Hero - "Meet the Founders" + partnership concept
// 2. Keston Section - The Identity Shift Architect
// 3. Ani Section - The Strategy Architect
// 4. Partnership Section - Visionary + Integrator dynamic
// 5. Credentials Grid - Combined credentials from both founders
// 6. Mission Section - Henry Ford vision + 1M entrepreneurs goal
// 7. CTA Section - Dual paths (B2C + B2B)
// ============================================================================

const FoundersPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Combined credentials from both founders
  const credentials = [
    // Keston's credentials
    {
      icon: Award,
      title: "Certified High Performance Coach",
      description: "Brendon Burchard certified methodology",
      founder: "Keston"
    },
    {
      icon: Building2,
      title: "8 Years Wall Street Cybersecurity",
      description: "Systems architecture & threat detection",
      founder: "Keston"
    },
    {
      icon: Cpu,
      title: "Agentic AI Expert & Speaker",
      description: "Corporate workshops on AI implementation",
      founder: "Keston"
    },
    // Ani's credentials
    {
      icon: Layers,
      title: "35 Years Operational Strategy",
      description: "Scaling businesses across 12+ industries",
      founder: "Ani"
    },
    {
      icon: BarChart3,
      title: "Lead Integrator of MIO",
      description: "Operationalized P.R.O.T.E.C.T. into data-driven system",
      founder: "Ani"
    },
    {
      icon: Scale,
      title: "Visionary-Realist Balance",
      description: "Grounding dreams in metrics and behavioral data",
      founder: "Ani"
    }
  ];

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
              <Link to="/for-coaches" className="text-white/70 hover:text-mi-cyan transition-colors font-medium">
                For Coaches
              </Link>
              <Link to="/founders" className="text-mi-cyan font-medium">
                About Us
              </Link>
            </nav>

            {/* CTA - Right */}
            <div className="hidden md:flex items-center gap-4">
              <Button asChild size="sm" className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                <Link to="/auth">Get Started</Link>
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
                  className="text-white/70 hover:text-mi-cyan transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Coaches
                </Link>
                <Link
                  to="/founders"
                  className="text-mi-cyan font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About Us
                </Link>
                <div className="border-t border-white/10 pt-4 mt-2">
                  <Button asChild className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ================================================================== */}
      {/* SECTION 1: HERO */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-mi-navy via-mi-navy to-mi-navy/95" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mi-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-mi-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-mi-gold/10 border border-mi-gold/30 rounded-full mb-8">
              <Users className="w-4 h-4 text-mi-gold" />
              <span className="text-mi-gold text-sm font-semibold uppercase tracking-wider">
                The Team Behind Mind Insurance
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6 uppercase tracking-wide">
              Meet the <span className="text-mi-cyan">Founders</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto">
              The convergence of Wall Street systems thinking, high-performance coaching,
              and AI innovation. Building the future of identity transformation.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 2: KESTON SECTION */}
      {/* ================================================================== */}
      <section className="py-20 bg-gradient-to-b from-mi-navy to-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Keston's Photo */}
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-mi-navy border-2 border-mi-cyan/30 overflow-hidden">
                  <img
                    src="/images/keston/headshot-clean.png"
                    alt="Keston Glasgow - Creator of Mind Insurance"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-mi-gold/20 rounded-xl blur-xl" />
              </div>

              {/* Content */}
              <div>
                <p className="text-mi-gold font-semibold uppercase tracking-wider mb-3">
                  The Identity Shift Architect
                </p>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
                  Keston Glasgow
                </h2>
                <p className="text-lg text-white/80 italic mb-6">
                  "From Cybersecurity to Identity Security"
                </p>

                {/* 3-Paragraph Condensed Story */}
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    <span className="text-mi-cyan font-semibold">The Tech Foundation:</span>{" "}
                    8 years on Wall Street as a Cybersecurity Analyst. Incident response,
                    compliance, architecture. I was the guy they called when systems were under attack.
                  </p>
                  <p>
                    <span className="text-mi-cyan font-semibold">The Transformation:</span>{" "}
                    After building a $10M real estate portfolio and coaching hundreds of high performers,
                    I discovered the biggest threat isn't external—it's internal. Identity Collision.
                    The gap between who you were programmed to be and who you're trying to become.
                  </p>
                  <p>
                    <span className="text-mi-cyan font-semibold">The Convergence:</span>{" "}
                    MIO is the convergence of both worlds. The cybersecurity engineer who built
                    threat detection systems. The certified High Performance Coach who understands
                    human behavior. The Agentic AI expert who knows how to scale transformation.
                    Same architecture, different domain.
                  </p>
                </div>

                {/* Learn More Link */}
                <div className="mt-8">
                  <a
                    href="https://kestonglasgow.com/story"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-mi-cyan hover:text-mi-cyan/80 transition-colors"
                  >
                    Read the full story
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3: ANI SIMMONS */}
      {/* ================================================================== */}
      <section className="py-20 bg-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Photo - Reversed order for visual balance */}
              <div className="lg:order-2 relative">
                <div className="aspect-square rounded-2xl bg-mi-navy border-2 border-mi-gold/30 overflow-hidden">
                  {/* Photo placeholder - gradient with initials until photo is provided */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mi-gold/10 to-mi-cyan/10">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto rounded-full bg-mi-gold/20 flex items-center justify-center mb-4">
                        <span className="text-5xl font-bold text-mi-gold">AS</span>
                      </div>
                      <p className="text-white/50 text-sm">Photo coming soon</p>
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-mi-cyan/20 rounded-xl blur-xl" />
              </div>

              {/* Content */}
              <div className="lg:order-1">
                <p className="text-mi-gold font-semibold uppercase tracking-wider mb-3">
                  Co-Founder & Strategy Architect
                </p>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
                  Ani Simmons
                </h2>
                <p className="text-lg text-white/80 italic mb-6">
                  "Balancing the Visionary Dreamer with the Realism of Metrics"
                </p>

                {/* 3-Paragraph Story aligned with Brand Strategy */}
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    <span className="text-mi-gold font-semibold">The Behavioral Laboratory:</span>{" "}
                    35 years building and scaling businesses across 12+ industries—management consulting,
                    high-stakes real estate, debt collection, hospitality. This vast experience revealed
                    a singular truth: most failures aren't caused by lack of strategy, but by{" "}
                    <span className="text-mi-cyan">limiting beliefs</span> and{" "}
                    <span className="text-mi-cyan">Identity Collision</span> that cause even the most
                    talented entrepreneurs to falter when pressure is highest.
                  </p>
                  <p>
                    <span className="text-mi-gold font-semibold">The Integrator:</span>{" "}
                    As the lead integrator behind MIO, Ani took the proprietary P.R.O.T.E.C.T. Method
                    and operationalized it into a data-driven system capable of pinpointing exactly
                    where a high-achiever's internal architecture is breaking down. The ability to
                    lead teams with more technical experience by grounding decisions in clear identity
                    and a relentless search for "The Truth."
                  </p>
                  <p>
                    <span className="text-mi-gold font-semibold">The Mission:</span>{" "}
                    While vision is necessary, it must be grounded in facts and behavioral data to be
                    sustainable. Ani's mission: use MIO to help{" "}
                    <span className="text-mi-cyan font-semibold">1 million entrepreneurs</span> free
                    their dreams from the trap of unrealistic projections and self-sabotage—moving
                    them toward consistent, aligned excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 4: THE PARTNERSHIP - Visionary + Integrator */}
      {/* ================================================================== */}
      <section className="py-20 bg-mi-navy">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-gold font-semibold uppercase tracking-wider mb-4">
              The Visionary + Integrator Dynamic
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Where Vision Meets <span className="text-mi-cyan">Execution</span>
            </h2>
            <p className="text-lg text-white/70">
              Mind Insurance was built by two founders with complementary superpowers—
              the Identity Shift Architect who sees patterns others miss, and the Strategy
              Architect who turns vision into scalable systems.
            </p>
          </div>

          {/* Two-column Visionary/Integrator comparison */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <Card className="p-8 bg-mi-navy/50 border border-mi-cyan/30 hover:border-mi-cyan/50 transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-mi-cyan/20 flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-mi-cyan" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wide">Keston Glasgow</h3>
                <p className="text-mi-cyan text-sm font-semibold mt-1">The Visionary</p>
              </div>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-cyan mt-1 flex-shrink-0" />
                  <span>Created the P.R.O.T.E.C.T. Method and 3 Identity Prisons framework</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-cyan mt-1 flex-shrink-0" />
                  <span>Sees the patterns that cause Identity Collision</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-cyan mt-1 flex-shrink-0" />
                  <span>Translates cybersecurity thinking to identity protection</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-mi-navy/50 border border-mi-gold/30 hover:border-mi-gold/50 transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-mi-gold/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-mi-gold" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wide">Ani Simmons</h3>
                <p className="text-mi-gold text-sm font-semibold mt-1">The Integrator</p>
              </div>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-gold mt-1 flex-shrink-0" />
                  <span>Operationalized P.R.O.T.E.C.T. into a data-driven system</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-gold mt-1 flex-shrink-0" />
                  <span>Grounds vision in metrics and behavioral data</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-mi-gold mt-1 flex-shrink-0" />
                  <span>35 years scaling businesses across 12+ industries</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 bg-mi-navy/50 border border-white/10 text-center hover:border-mi-cyan/30 transition-all">
              <div className="w-12 h-12 mx-auto rounded-full bg-mi-cyan/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-mi-cyan" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pattern Recognition</h3>
              <p className="text-white/60 text-sm">
                Identifying the 7 mindset patterns that cause 80% of struggles
              </p>
            </Card>

            <Card className="p-6 bg-mi-navy/50 border border-white/10 text-center hover:border-mi-gold/30 transition-all">
              <div className="w-12 h-12 mx-auto rounded-full bg-mi-gold/20 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-mi-gold" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Data-Driven Truth</h3>
              <p className="text-white/60 text-sm">
                Behavioral metrics that reveal where internal architecture breaks down
              </p>
            </Card>

            <Card className="p-6 bg-mi-navy/50 border border-white/10 text-center hover:border-mi-cyan/30 transition-all">
              <div className="w-12 h-12 mx-auto rounded-full bg-mi-cyan/20 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-mi-cyan" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Powered Scale</h3>
              <p className="text-white/60 text-sm">
                MIO delivers transformation to 1 million entrepreneurs
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 5: CREDENTIALS GRID */}
      {/* ================================================================== */}
      <section className="py-20 bg-gradient-to-b from-mi-navy to-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-mi-cyan font-semibold uppercase tracking-wider mb-4">
              Credentials & Experience
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Built on a Foundation of <span className="text-mi-gold">Excellence</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {credentials.map((credential, index) => (
              <Card
                key={index}
                className="p-6 bg-mi-navy/50 border border-white/10 hover:border-mi-cyan/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mi-cyan/20 flex items-center justify-center flex-shrink-0">
                    <credential.icon className="w-6 h-6 text-mi-cyan" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white mb-1 uppercase tracking-wide">{credential.title}</h3>
                    <p className="text-white/60 text-sm">{credential.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 6: THE MISSION */}
      {/* ================================================================== */}
      <section className="py-20 bg-mi-navy-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-mi-gold font-semibold uppercase tracking-wider mb-4">
              The Henry Ford Mission
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 uppercase tracking-wide">
              Democratizing <span className="text-mi-cyan">Transformation</span>
            </h2>

            <Card className="p-8 md:p-12 bg-mi-navy/50 border border-mi-gold/30 mb-8">
              <blockquote className="text-xl md:text-2xl text-white/80 italic leading-relaxed">
                "Henry Ford took a product that was a luxury, only available to wealthy people,
                and made it a commodity. That's my goal with Mind Insurance—take personal development
                that's typically reserved for the wealthy and make it so simple and accessible
                that ANYONE can transform and rewire their subconscious mind to achieve
                the life they've always dreamed of."
              </blockquote>
              <div className="mt-6 text-mi-gold font-semibold">— Keston Glasgow</div>
            </Card>

            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              We're building the Model T of personal transformation—making identity shift
              technology accessible to everyone who has a dream but is fighting invisible ceilings.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 7: CTA */}
      {/* ================================================================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mi-cyan/10 to-mi-gold/10" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              Ready to Transform?
            </h2>
            <p className="text-lg text-white/70 mb-10">
              Whether you're looking to protect your own mind or scale your coaching practice,
              we've built something for you.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
              {/* B2C Path */}
              <Card className="p-6 bg-mi-navy/80 border border-mi-cyan/30 hover:border-mi-cyan/50 transition-all">
                <Target className="w-10 h-10 text-mi-cyan mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">For Individuals</h3>
                <p className="text-white/60 text-sm mb-6">
                  Discover your Identity Collision pattern and start your transformation.
                </p>
                <Button asChild className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-semibold">
                  <Link to="/mind-insurance/assessment">
                    Take the Assessment
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </Card>

              {/* B2B Path */}
              <Card className="p-6 bg-mi-navy/80 border border-mi-gold/30 hover:border-mi-gold/50 transition-all">
                <Users className="w-10 h-10 text-mi-gold mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">For Coaches</h3>
                <p className="text-white/60 text-sm mb-6">
                  Scale your expertise with MIO's behavioral forensics engine.
                </p>
                <Button asChild variant="outline" className="w-full border-mi-gold text-mi-gold hover:bg-mi-gold/10">
                  <Link to="/for-coaches">
                    Learn About MIO
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </Card>
            </div>
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
            <Link to="/for-coaches" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              For Coaches
            </Link>
            <Link to="/founders" className="text-mi-cyan text-sm">
              About Us
            </Link>
            <Link to="/auth" className="text-white/60 hover:text-mi-cyan transition-colors text-sm">
              Sign In
            </Link>
          </div>

          {/* Cross-site Link */}
          <div className="flex justify-center mb-6">
            <a
              href="https://kestonglasgow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-mi-gold transition-colors text-sm inline-flex items-center gap-1"
            >
              <span>KestonGlasgow.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-center text-white/50 text-sm">© 2024 Mind Insurance. Protect your mind, transform your life.</p>
        </div>
      </footer>
    </div>
  );
};

export default FoundersPage;
