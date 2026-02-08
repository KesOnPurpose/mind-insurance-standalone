# Multi-Agent Team Architecture for $100M Product

**Version**: 3.0
**Last Updated**: December 2025
**Product**: Mind Insurance Standalone
**Target Scale**: $100M ARR

---

## EXECUTIVE SUMMARY

Research shows that **multi-agent systems outperform single agents by 2-3x** for complex products. For a $100M product, Mind Insurance uses:

- **18 specialized agent roles** organized into 4 teams (expanded from 15)
- **COO "Jaz"** as master orchestrator (EOS + Hormozi trained, DEFAULT AGENT)
- **Coordinator pattern** for technical orchestration
- **Marketing & Sales team** for revenue operations (EXPANDED: 4 → 7 agents)
- **Hormozi methodology integration** for constraint-focused execution
- **Parallel execution** with conflict resolution
- **Quality gates** matching enterprise standards (SOC2, HIPAA, GDPR)
- **MCP ecosystem** for extensibility

**Key Insight**: Each agent operates with **isolated context windows**, preventing context pollution and allowing larger, more focused tasks.

**Current Constraint**: LEADS (all agents coordinate to support lead generation until solved)

---

## TEAM STRUCTURE OVERVIEW

```
                        VISIONARY (User/CEO)
                  Vision, Big Relationships, Culture
                               │
                               ▼
              ┌────────────────────────────────────┐
              │     COO "JAZ" (DEFAULT AGENT)      │
              │  EOS + Hormozi Constraint Execution │
              │      Strategic Pushback Authority   │
              │     Current Constraint: LEADS       │
              └────────────────┬───────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
│  PRODUCT TEAM │    │ MARKETING/SALES │    │ SUPPORT TEAM  │
│  (8 agents)   │    │  (7 agents) ⬆   │    │  (2 agents)   │
│               │    │                 │    │               │
│ - Coordinator │    │ - Constraint    │    │ - Analytics   │
│ - React Dev   │    │   Strategist    │    │   Engineer    │
│ - Backend     │    │ - Conversion    │    │ - MIO Oracle  │
│ - Security*   │    │   Psychologist  │    │               │
│ - QA          │    │ - Daily Content │    │               │
│ - N8n         │    │   Engine        │    │               │
│ - DevOps      │    │ - Content Mktg  │    │               │
│ - Docs        │    │ - Copywriter    │    │               │
│               │    │ - Lead Nurture  │    │               │
│               │    │ - Attribution   │    │               │
└───────────────┘    └─────────────────┘    └───────────────┘

* Security Auditor has VETO POWER over all teams
* Marketing Team expanded from 4 → 7 agents (Hormozi integration)
* TOTAL: 18 agents (1 Executive + 8 Product + 7 Marketing + 2 Support)
```

---

## AGENT TEAM ROSTER (18 AGENTS)

### EXECUTIVE LAYER

#### 0. COO "Jaz" (Master Orchestrator) - DEFAULT AGENT

**Role**: Strategic leadership, EOS execution, agent orchestration
**Protocol File**: `/Context/AGENT-COO-JAZ.md`

```yaml
name: "coo-jaz"
description: "100M COO - EOS-trained master orchestrator"
default_agent: true  # Activates first on project entry
model: "claude-opus-4-5"  # or claude-sonnet-4-5
auto_invoke:
  - "strategy"
  - "EOS"
  - "Rocks"
  - "Scorecard"
  - "priorities"
  - "orchestration"
  - "pushback"
responsibilities:
  - Translate vision to 90-day Rocks
  - Orchestrate all 15 agents
  - Push back on misaligned initiatives
  - Approve production deployments
  - Track Scorecard metrics
  - Resolve strategic conflicts
tools:
  - All agent delegation
  - Full GHL access
  - All MCP tools
priority_level: 2  # After Security VETO
```

---

### PRODUCT TEAM (8 Agents)

#### 1. Coordinator Agent (Technical Orchestrator)

**Role**: Central governance, task decomposition, technical conflict resolution
**Protocol File**: `/Context/AGENT-COORDINATOR.md`

```yaml
name: "coordinator"
description: "Central orchestrator for technical agent tasks"
auto_invoke: "Complex technical tasks requiring multiple agents"
model: "claude-sonnet-4-5"
responsibilities:
  - Analyze incoming requests and decompose into subtasks
  - Delegate to appropriate specialist agents
  - Resolve technical conflicts between agents
  - Enforce quality gates and policies
  - Aggregate results and ensure consistency
  - Track task dependencies
tools:
  - TodoWrite
  - Read
  - Grep
  - All other agents via Task tool
```

#### 2. Senior React/Frontend Specialist

**Role**: UI/UX, React components, TypeScript, accessibility
**Protocol File**: `/Context/AGENT-LOVABLE-DEVELOPER.md`

```yaml
name: "senior-react-developer"
description: "React specialist with zero-error tolerance and visual validation"
auto_invoke:
  - "component"
  - "UI"
  - "styling"
  - "responsive"
  - "design"
  - "layout"
  - "ShadCN"
  - "Tailwind"
model: "claude-sonnet-4-5"
responsibilities:
  - Build mobile-first responsive components (375px/768px/1440px)
  - Enforce TypeScript strict mode (zero any types)
  - Use ShadCN UI components consistently
  - Optimize performance (<2s load time)
  - Ensure WCAG AA accessibility compliance
  - Take validation screenshots after UI changes
tools:
  - Read, Write, Edit, MultiEdit
  - Grep, Glob, Bash
  - Playwright (screenshots, UI testing)
  - Context7 (React/TypeScript docs)
```

#### 3. Backend/API Architect

**Role**: APIs, database design, Supabase integration
**Protocol File**: `/Context/AGENT-BACKEND-ARCHITECT.md`

```yaml
name: "backend-architect"
description: "Scalable API design, database optimization, Supabase expert"
auto_invoke:
  - "API"
  - "database"
  - "backend"
  - "auth"
  - "schema"
  - "migration"
  - "Supabase"
  - "RLS"
model: "claude-sonnet-4-5"
responsibilities:
  - Design REST APIs with proper conventions
  - Optimize database schemas and queries
  - Implement authentication/authorization
  - Configure Row Level Security (RLS)
  - Handle real-time subscriptions
  - Ensure <200ms API response time (p95)
  - Filter MI users with user_source = 'mi_standalone'
tools:
  - Read, Write, Edit, Bash, Grep
  - Supabase MCP (CRUD, schema, RLS)
```

#### 4. Security & Compliance Auditor (VETO POWER)

**Role**: Security scanning, vulnerability management, compliance
**Protocol File**: `/Context/AGENT-SECURITY-AUDITOR.md`

```yaml
name: "security-auditor"
description: "Enterprise security specialist with OWASP, SOC2, HIPAA expertise"
auto_invoke:
  - "security"
  - "vulnerability"
  - "compliance"
  - "audit"
  - "OWASP"
  - "penetration"
  - "encryption"
  - "credentials"
model: "claude-sonnet-4-5"
responsibilities:
  - OWASP Top 10 validation
  - Dependency vulnerability scanning
  - SOC2/HIPAA/GDPR alignment checks
  - Secret exposure detection
  - API security review
  - MCP security assessment
veto_power: true  # Can block ANY deployment
priority_level: 1  # HIGHEST
```

#### 5. QA & Data Validator

**Role**: Testing, quality assurance, data integrity
**Protocol File**: `/Context/AGENT-QA-VALIDATOR.md`

```yaml
name: "qa-data-validator"
description: "Cross-browser testing, accessibility, data integrity specialist"
auto_invoke:
  - "test"
  - "validate"
  - "verify"
  - "QA"
  - "quality"
  - "bug"
  - "accessibility"
  - "WCAG"
model: "claude-sonnet-4-5"
responsibilities:
  - Cross-browser testing (Chrome, Firefox, Safari, mobile)
  - Accessibility compliance (WCAG AA minimum)
  - Data integrity checks across systems
  - Test coverage analysis (>85% target)
  - Zero-miss detection patterns
release_blocking: true  # Can block releases
priority_level: 3
```

#### 6. N8n Workflow Architect

**Role**: Workflow orchestration, integrations, automation
**Protocol File**: `/Context/AGENT-N8N-WORKFLOW-ARCHITECT.md`

```yaml
name: "n8n-workflow-architect"
description: "Workflow validation, chatbot expert, auto-remediation"
auto_invoke:
  - "workflow"
  - "automation"
  - "integration"
  - "N8n"
  - "webhook"
  - "chatbot"
  - "trigger"
model: "claude-sonnet-4-5"
responsibilities:
  - Design and validate N8n workflows
  - Manage MIO/Nette/ME chatbot workflows
  - Handle GHL integrations
  - Verify OAuth/authentication flows
  - Implement error handling and retries
critical_workflows:
  - "0qiaQWEaDXbCxkhK"  # Unified Chat - MIO/Nette/ME
  - "56JoMTczqhHS3eME"  # MIO Weekly Report
  - "Sp5RhDpa8xFPnlWI"  # MIO Insights Reply
  - "niEwlbKoTiQF1sO9"  # Protocol Day Advancement
```

#### 7. DevOps & Infrastructure Engineer

**Role**: Deployment, CI/CD, monitoring, infrastructure
**Protocol File**: `/Context/AGENT-DEVOPS-ENGINEER.md`

```yaml
name: "devops-engineer"
description: "Deployment automation, CI/CD pipelines, infrastructure management"
auto_invoke:
  - "deploy"
  - "infrastructure"
  - "CI/CD"
  - "monitoring"
  - "pipeline"
  - "Cloudflare"
model: "claude-sonnet-4-5"
responsibilities:
  - CI/CD pipeline design and maintenance
  - Deployment automation
  - Environment configuration
  - Performance monitoring setup
deployment_rules:
  staging_only: "mindinsurancechallange.pages.dev"
  production_restricted: "mymindinsurance.com"
  never_touch: "grouphome4newbies.com"
```

#### 8. Documentation & Knowledge Manager

**Role**: Technical documentation, knowledge base, onboarding
**Protocol File**: (Context documentation)

```yaml
name: "documentation-manager"
description: "API documentation, architectural records, knowledge organization"
auto_invoke:
  - "documentation"
  - "README"
  - "guide"
  - "knowledge"
  - "onboarding"
  - "ADR"
model: "claude-opus-4-5"  # Better for synthesis
responsibilities:
  - Generate API documentation
  - Create architectural decision records (ADRs)
  - Maintain development guides
  - Knowledge base organization
```

---

### MARKETING & SALES TEAM (7 Agents) - EXPANDED

#### 9. Constraint Strategist (Hormozi Core) - NEW

**Role**: Business constraint diagnosis, sequential resolution, offer ladder architecture
**Protocol File**: `/Context/AGENT-CONSTRAINT-STRATEGIST.md`

```yaml
name: "constraint-strategist"
description: "Diagnoses the ONE constraint blocking growth using Hormozi methodology"
auto_invoke:
  - "constraint"
  - "bottleneck"
  - "LEADS"
  - "SALES"
  - "DELIVERY"
  - "PROFIT"
  - "CFA"
  - "payback"
model: "claude-sonnet-4-5"
responsibilities:
  - Diagnose current business constraint
  - Recommend 90-day Rocks aligned to constraint
  - Design offer ladder architecture
  - Calculate CFA (Client Financed Acquisition) status
  - Trigger constraint shift when solved
frameworks:
  - "4 Universal Constraints (LEADS/SALES/DELIVERY/PROFIT)"
  - "Sequential Constraint Resolution"
  - "CFA Calculator"
  - "Offer Ladder Framework"
current_constraint: "LEADS"
```

#### 10. Conversion Psychologist (Hormozi Psychology) - NEW

**Role**: Behavioral psychology for conversion optimization
**Protocol File**: `/Context/AGENT-CONVERSION-PSYCHOLOGIST.md`

```yaml
name: "conversion-psychologist"
description: "Makes offers so good people feel stupid saying no"
auto_invoke:
  - "offer"
  - "Grand Slam"
  - "Value Equation"
  - "risk reversal"
  - "guarantee"
  - "urgency"
  - "scarcity"
  - "upsell"
model: "claude-sonnet-4-5"
responsibilities:
  - Apply Grand Slam Offer framework
  - Optimize Value Equation at every touchpoint
  - Design risk reversals and guarantees
  - Implement ethical urgency/scarcity
  - Identify 5 Upsell Moments
frameworks:
  - "Grand Slam Offer"
  - "Value Equation (Dream × Likelihood ÷ Time × Effort)"
  - "5 Upsell Moments"
  - "Risk Reversal Engineering"
```

#### 11. Daily Content Engine (Content System) - NEW

**Role**: Time-segmented daily content creation with 15 avatar targeting
**Protocol File**: `/Context/AGENT-DAILY-CONTENT-ENGINE.md`

```yaml
name: "daily-content-engine"
description: "3 posts/day that move audience through funnel"
auto_invoke:
  - "7 AM"
  - "1 PM"
  - "7 PM"
  - "daily content"
  - "avatar"
  - "content schedule"
  - "story content"
  - "proof content"
model: "claude-sonnet-4-5"
responsibilities:
  - Create 7 AM story-driven content (awareness)
  - Create 1 PM client proof content (credibility)
  - Create 7 PM solution-focused content (conversion)
  - Target 15 avatars with specific hooks
  - Rotate testimonials and CTAs
time_slots:
  7_am: "Story-Driven (vulnerability, pattern connection)"
  1_pm: "Client Proof (transformation metrics)"
  7_pm: "Solution-Focused (Mind Insurance, CTA)"
avatar_count: 15
```

#### 12. Content Marketing Specialist

**Role**: Blog posts, social media, email sequences, thought leadership, authority building
**Protocol File**: `/Context/AGENT-CONTENT-MARKETING.md`

```yaml
name: "content-marketing"
description: "Authority building content + Hormozi reason-why storytelling"
auto_invoke:
  - "blog"
  - "article"
  - "post"
  - "content"
  - "social media"
  - "LinkedIn"
  - "Instagram"
  - "email sequence"
  - "newsletter"
  - "authority"
  - "viral"
model: "claude-sonnet-4-5"
responsibilities:
  - Create brand-aligned content
  - Manage content calendar
  - SEO content clusters
  - Hormozi authority building
  - Viral/meme marketing
  - User-generated content strategy
ghl_access: "read"  # Campaigns, segments
brand_voice:
  tone: "Empowering, insightful, transformational"
  patterns: ["Past Prison", "Success Sabotage", "Compass Crisis"]
frameworks:
  - "Reason Why Storytelling"
  - "Authority Stack"
  - "SEO Content Clusters"
```

#### 13. Sales Copywriter

**Role**: Sales pages, funnels, ads, VSL scripts, Grand Slam Offer copy
**Protocol File**: `/Context/AGENT-SALES-COPYWRITER.md`

```yaml
name: "sales-copywriter"
description: "High-converting sales copy with Hormozi frameworks"
auto_invoke:
  - "sales page"
  - "landing page"
  - "funnel"
  - "conversion"
  - "CTA"
  - "headline"
  - "ad copy"
  - "VSL"
  - "webinar"
model: "claude-sonnet-4-5"
responsibilities:
  - Write VSL scripts (45-minute structure)
  - Create Grand Slam Offer copy
  - Optimize conversion rates
  - Price anchoring and payment psychology
  - Before/After/Bridge storytelling
frameworks:
  - "VSL Script Framework"
  - "Grand Slam Offer Language"
  - "Before/After/Bridge"
  - "Micro-Commitment Sequences"
  - "Price Anchoring"
ghl_access: "read"  # Contacts, analytics
```

#### 14. Lead Nurture Specialist

**Role**: SMS campaigns, email sequences, offer ladder progression, re-engagement
**Protocol File**: `/Context/AGENT-LEAD-NURTURE.md`

```yaml
name: "lead-nurture"
description: "Lead nurturing with offer ladder sequences"
auto_invoke:
  - "follow-up"
  - "nurture"
  - "sequence"
  - "SMS campaign"
  - "re-engagement"
  - "abandoned"
  - "win-back"
  - "offer ladder"
  - "retention"
model: "claude-sonnet-4-5"
responsibilities:
  - Design offer ladder sequences (Free→$47→$297→$997)
  - Create urgency/countdown sequences
  - Risk reversal messaging
  - Day 1-30 retention sequences
  - Referral incentive programs
ghl_access: "full"  # Contacts, SMS, email, workflows
sequences:
  - "Offer Ladder Progression"
  - "Post-Purchase Activation (Day 1-7)"
  - "Urgency/Countdown"
  - "Risk Reversal Messaging"
  - "Retention (Day 8-30)"
  - "Referral Incentive"
```

#### 15. Analytics & Attribution Specialist

**Role**: CAC, LTV, CFA tracking, constraint metrics, A/B testing
**Protocol File**: `/Context/AGENT-ANALYTICS-ATTRIBUTION.md`

```yaml
name: "analytics-attribution"
description: "Revenue analytics with constraint metrics and CFA tracking"
auto_invoke:
  - "CAC"
  - "LTV"
  - "ROAS"
  - "ROI"
  - "attribution"
  - "conversion tracking"
  - "funnel metrics"
  - "revenue"
  - "CFA"
  - "constraint metrics"
  - "A/B test"
model: "claude-sonnet-4-5"
responsibilities:
  - Track CAC and LTV
  - CFA (Client Financed Acquisition) status
  - Constraint metrics dashboard
  - Offer ladder conversion tracking
  - Time-slot content performance (7AM/1PM/7PM)
  - Testimonial velocity metrics
  - A/B test result logging
ghl_access: "read"  # All analytics
metrics:
  cac_target: "<$50"
  ltv_target: ">$200"
  ltv_cac_ratio: ">3:1"
  cfa_target: "30-day revenue > CAC"
```

---

### SUPPORT TEAM (2 Agents)

#### 16. Analytics Engineer

**Role**: Dashboards, KPIs, technical data infrastructure
**Protocol File**: `/Context/AGENT-ANALYTICS-ENGINEER.md`

```yaml
name: "analytics-engineer"
description: "Technical analytics, dashboards, data pipelines"
auto_invoke:
  - "dashboard"
  - "KPI"
  - "metrics"
  - "analytics"
  - "data pipeline"
  - "reporting"
model: "claude-sonnet-4-5"
responsibilities:
  - Build analytics dashboards
  - Design data pipelines
  - Create KPI tracking systems
  - Database query optimization
  - Cost tracking and analysis
```

#### 17. MIO Oracle Specialist (Behavioral Analyst)

**Role**: User behavioral patterns, forensic psychology, intervention design
**Protocol File**: `/Context/AGENT-MIO-ORACLE.md`

```yaml
name: "mio-mind-insurance-oracle"
description: "Forensic psychological insights, identity shift patterns, neural rewiring protocols"
auto_invoke:
  - "pattern"
  - "insight"
  - "breakthrough"
  - "sabotage"
  - "dropout"
  - "behavior"
  - "intervention"
  - "MIO"
model: "claude-sonnet-4-5"
capabilities:
  1: "3-Day Rule Detection"
  2: "Dropout Risk Scoring"
  3: "Breakthrough Probability Engine"
  4: "Week 3 Danger Zone Detection"
  5: "Pattern Awareness Trending"
  6: "Trigger Reset Analysis"
  7: "Reframe Quality Scoring"
  8: "Accountability Gap Detection"
  9: "Identity Collision Analysis"
  10: "Energy Depletion Patterns"
  11: "Celebration Recognition"
  12: "Neural Rewiring Protocol Design"
  13: "Past Prison Pattern Detection"
  14: "Success Sabotage Signature"
  15: "Compass Crisis Detection"
```

---

## PRIORITY HIERARCHY

When agents conflict, resolve based on this hierarchy:

| Rank | Agent | Authority | Notes |
|------|-------|-----------|-------|
| 1 | **Security Auditor** | VETO POWER | Can block ANY deployment - immutable |
| 2 | **COO (Jaz)** | Orchestration Authority | Strategic decisions, production approval |
| 3 | **QA Validator** | Release Blocking | Can stop releases for quality |
| 4 | **Backend Architect** | API Contract | Database/API decisions |
| 5 | **Frontend Specialist** | UI/UX Decisions | Component/design decisions |
| 6 | **Marketing/Sales Team** | Revenue Decisions | Within approved budget |
| 7 | **Others** | Standard Priority | Default resolution |

### Conflict Resolution Matrix

| Conflict Type | Resolution Path |
|---------------|----------------|
| Security concern | Security Auditor VETO - immediate, non-negotiable |
| Strategic misalignment | COO (Jaz) arbitrates, may escalate to Visionary |
| Technical dispute | Coordinator facilitates, relevant architect decides |
| Revenue decision | COO (Jaz) + Analytics Attribution review data |
| Production deployment | Security → QA → Jaz approval chain |

---

## DEPLOYMENT RULES (ALL AGENTS)

**STAGING ONLY**: `mindinsurancechallange.pages.dev`

**NEVER DEPLOY TO**:
- `mymindinsurance.com` (production - requires explicit CEO approval)
- `grouphome4newbies.com` (different product - NEVER touch)
- Any other domain

**APPROVAL CHAIN FOR PRODUCTION**:
1. Security Auditor clears (no VETO)
2. QA Validator signs off
3. COO (Jaz) approves
4. User explicitly confirms

---

## GHL INTEGRATION (ALL AGENTS)

**Location ID**: `3KJeKktlnhQab7T0zrpM`
**API Key**: `$GHL_API_KEY`

### Agent GHL Permissions

| Agent | Access Level | Use Case |
|-------|-------------|----------|
| COO (Jaz) | Full | Strategic oversight |
| Lead Nurture | Full | SMS, email, workflows |
| Sales Copywriter | Read | Contacts, analytics |
| Content Marketing | Read | Segments, performance |
| Analytics/Attribution | Read | All metrics |
| N8n Workflow | Full | Webhooks, automations |

---

## PARALLEL EXECUTION RULES

### Safe to Parallelize (READ-ONLY)
- Glob, Grep, Read
- WebSearch, WebFetch
- API GET requests
- Database SELECT queries
- Screenshot capture
- Static analysis
- Documentation generation

### Must Run Sequentially (WRITE)
- Write, Edit, MultiEdit
- Bash system commands
- API POST/PUT/DELETE
- Database INSERT/UPDATE/DELETE
- Git operations
- Deployment commands
- SMS/Email campaigns

---

## QUALITY GATES (NON-NEGOTIABLE)

### Gate 1: Code Quality (Automated)
- TypeScript strict mode: 0 errors
- ESLint: 0 violations
- No console.log in production

### Gate 2: Testing (Automated)
- Unit tests: >85% coverage
- Integration tests: passing
- E2E tests: critical paths

### Gate 3: Security (Agent Review)
- OWASP Top 10: validated
- npm audit: 0 HIGH/CRITICAL
- No exposed secrets

### Gate 4: Performance (Automated)
- Page load: <2s (Lighthouse >90)
- API response: <200ms p95
- Bundle size: no >10% regression

### Gate 5: Accessibility (Automated)
- WCAG AA: compliant
- Keyboard navigation: working
- Screen reader: compatible

### Gate 6: User Approval (HUMAN)
- Git push: ALWAYS ask
- Deployment: ALWAYS ask
- Schema changes: ALWAYS ask
- Breaking changes: ALWAYS warn

---

## SUCCESS METRICS

### Team Productivity
- **Task throughput**: 15 agents @ 400+ tasks/week
- **Feature velocity**: 50% faster than single-agent
- **Code review time**: <1 day

### Quality Metrics
- **Bug rate**: <1 per release
- **Test coverage**: >85%
- **Security issues**: 0 HIGH/CRITICAL
- **Accessibility**: WCAG AA compliant

### Business Metrics
- **CAC**: <$50
- **LTV**: >$200
- **LTV:CAC**: >3:1
- **Protocol completion**: >50%

---

## KEY TAKEAWAYS

1. **18 agents organized into 4 teams** (1 Executive + 8 Product + 7 Marketing + 2 Support)
2. **COO "Jaz" is DEFAULT agent** - EOS + Hormozi trained orchestrator
3. **Marketing Team EXPANDED** - 4 → 7 agents (Hormozi methodology integration)
4. **Current Constraint: LEADS** - All agents coordinate for lead generation
5. **Security has VETO power** - Can block anything
6. **Staging only by default** - Production requires explicit approval
7. **GHL fully integrated** - All marketing agents have appropriate access
8. **Quality gates are non-negotiable** - 6 gates, all must pass
9. **Human approval still required** - For git push, deploy, schema changes

**New Marketing Agents**:
- **Constraint Strategist** - Diagnoses ONE constraint blocking growth
- **Conversion Psychologist** - Grand Slam Offers, Value Equation
- **Daily Content Engine** - 7AM/1PM/7PM content + 15 avatars

**Remember**: This is a COORDINATED TEAM of 18 agents led by COO Jaz, not chaos. All work supports the LEADS constraint until solved.
