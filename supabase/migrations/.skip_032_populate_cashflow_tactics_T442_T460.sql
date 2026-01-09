-- Migration: Populate cashflow tactics T442-T460 (Business Formation completion)
-- Date: 2025-12-01
-- Purpose: Complete Business Formation category with 18 additional tactics from Group Home Cash Flow Course

BEGIN;

-- ============================================
-- VALIDATION
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'tactic_source'
  ) THEN
    RAISE EXCEPTION 'tactic_source column does not exist';
  END IF;
END $$;

-- ============================================
-- TACTIC INSERTION: Business Formation (T442-T460)
-- ============================================

INSERT INTO gh_tactic_instructions (
  tactic_id,
  tactic_name,
  category,
  week_assignment,
  why_it_matters,
  step_by_step,
  estimated_time,
  ownership_model,
  applicable_populations,
  cost_min_usd,
  cost_max_usd,
  cost_category,
  is_critical_path,
  official_lynette_quote,
  expert_frameworks,
  course_lesson_reference,
  tactic_source
) VALUES
  -- T442: Set Up Business Bank Account
  (
    'T442',
    'Set Up Business Bank Account',
    'Business Formation',
    1,
    'Open dedicated business banking account to separate personal and business finances, enabling professional payment processing and financial tracking required for group home operations.',
    to_jsonb(ARRAY[
      'Step 1: Gather required documents - EIN confirmation letter from IRS, Articles of Organization from Secretary of State, government-issued ID, Operating Agreement if LLC.',
      'Step 2: Research business banking options comparing fees, minimum balances, transaction limits. Consider Chase Business, Bank of America Business Advantage, local credit unions.',
      'Step 3: Schedule appointment with business banker or complete online application. Bring all required documentation to branch if in-person.',
      'Step 4: Complete account application providing business name, EIN, business address, ownership structure, anticipated monthly deposits/transactions.',
      'Step 5: Fund initial deposit (typically $100-$500 minimum) using personal check or cash to activate account.',
      'Step 6: Order business checks and debit card for account access. Request mobile banking app access for remote deposits.',
      'Step 7: Set up online banking portal with security questions, two-factor authentication for account protection.',
      'Step 8: Link business bank account to payment processor (QuickBooks, Stripe, Square) for automated resident payment collection.',
      'Step 9: Set up automatic transfers if needed for savings account, tax reserves, or personal distributions from profits.',
      'Step 10: Maintain clean separation - NEVER mix personal expenses with business account to preserve liability protection and simplify tax filing.'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    500.00,
    'one_time_fee',
    TRUE,
    'You wanna open up a business bank account, set up a payment processor center, so your payment processor center will be where you will receive payments for your resonance in your home.',
    '{"framework_name": "Business Banking Setup", "steps": ["Gather EIN and formation docs", "Research bank options", "Complete application", "Fund account", "Order checks/cards", "Set up online access", "Link to payment processor", "Maintain separation"], "benefits": ["Legal protection", "Professional credibility", "Financial tracking", "Tax simplification", "Payment processing"], "lynette_insight": "Use QuickBooks connected to business account - tracks expenses AND collects payments in one system"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T443: Set Up Payment Processor
  (
    'T443',
    'Set Up Payment Processor (QuickBooks/Stripe/Square)',
    'Business Formation',
    1,
    'Configure merchant account to accept debit/credit card payments from residents, enabling automated billing, expense tracking, and professional payment collection.',
    to_jsonb(ARRAY[
      'Step 1: Choose payment processor - QuickBooks (recommended for expense tracking + payments), Stripe (developer-friendly), Square (POS hardware options).',
      'Step 2: Sign up for account using business name, EIN, business bank account details, owner personal information for verification.',
      'Step 3: Complete identity verification - upload government ID, provide SSN for background check, verify business legitimacy.',
      'Step 4: Link business bank account for automatic deposit of collected payments (typically 1-2 day processing time).',
      'Step 5: Set up payment processing fees structure - understand rates (typically 2.6-2.9% + 30¢ per transaction for card-not-present).',
      'Step 6: Create invoice templates with business logo, payment terms, late fee policies, services description.',
      'Step 7: Set up recurring billing for monthly resident rent payments - automate charges on 1st of month.',
      'Step 8: Enable payment methods - credit cards (Visa, Mastercard, Amex, Discover), debit cards, ACH bank transfers.',
      'Step 9: Configure payment reminders - automated emails 5 days before due date, day of due date, 3 days after for late payments.',
      'Step 10: Test payment system with small test transaction before going live with residents.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    50.00,
    'monthly_per_home',
    TRUE,
    'I use Quickbook because it helps me keep track of my business expenses as well as allow me to collect payments. So I do use Quickbooks and with the Quickbooks payment system, it pretty much take all debit cards.',
    '{"framework_name": "Payment Processing Setup", "steps": ["Choose processor", "Create account", "Verify identity", "Link bank account", "Create invoice templates", "Set up recurring billing", "Enable payment methods", "Configure reminders", "Test system"], "benefits": ["Automated collections", "Professional invoicing", "Expense tracking", "Reduced late payments", "Financial reporting"], "lynette_insight": "QuickBooks is game-changer - does bookkeeping AND payment processing, switched from Stripe for integrated expense tracking"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T444: Obtain Business Address
  (
    'T444',
    'Obtain Business Address (Physical/Virtual)',
    'Business Formation',
    1,
    'Secure professional business address using physical storefront or virtual mailbox service for legal documents, credibility, and compliance with business registration requirements.',
    to_jsonb(ARRAY[
      'Step 1: Determine address needs - physical storefront for walk-in services vs virtual mailbox for mail only vs home address.',
      'Step 2: Research virtual mailbox services if physical location not needed - iPostal1 ($9.99-$24.99/month), Regus ($50-$200/month), Anytime Mailbox.',
      'Step 3: Compare features - street address (not PO Box), mail scanning/forwarding, package acceptance, notary services, conference room access.',
      'Step 4: Sign up for service providing government ID, completing USPS Form 1583 (authorization for commercial mail receiving agency).',
      'Step 5: Get address verification - service will provide street address format (not PO Box) acceptable for business registration.',
      'Step 6: Update business registration with Secretary of State if changing from home address to professional address.',
      'Step 7: Update business bank account, EIN records, business license with new address for consistency.',
      'Step 8: Add address to website, business cards, email signature, invoices for professional appearance.',
      'Step 9: Set up mail forwarding preferences - scan and email, forward weekly, hold for pickup based on needs.',
      'Step 10: Maintain address in good standing - pay fees on time, update if moving, ensure compliance with registered agent requirements.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    10.00,
    200.00,
    'monthly_per_home',
    FALSE,
    'Make sure that you get your business address, so whether that''s gonna be your regular storefront, or you can use a virtual option. So these are a few virtual options I postal in Regas a website.',
    '{"framework_name": "Business Address Setup", "steps": ["Determine needs", "Research virtual mailbox services", "Compare features", "Sign up and verify", "Update all registrations", "Add to branding materials", "Set forwarding preferences"], "benefits": ["Professional credibility", "Privacy protection", "Legitimate address for registration", "Mail management", "Scalability"], "lynette_insight": "Virtual mailbox gives professional street address without physical office cost - iPostal and Regus are top options"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T445: Create Professional Website
  (
    'T445',
    'Create Professional Website (GoDaddy Template)',
    'Business Formation',
    1,
    'Build company website using affordable GoDaddy templates to establish online presence, professional credibility, and provide information to potential residents, families, and partners.',
    to_jsonb(ARRAY[
      'Step 1: Purchase domain name on GoDaddy ($12-$20/year) matching business name - prioritize .com extension for credibility.',
      'Step 2: Select website builder plan - GoDaddy Website Builder ($10-$25/month) includes templates, hosting, SSL certificate.',
      'Step 3: Choose template from GoDaddy library - search healthcare, senior living, assisted living, hospitality categories for appropriate design.',
      'Step 4: Customize homepage - add business name, logo, hero image, value proposition (''Safe, Affordable, Dignified Shared Living'').',
      'Step 5: Create About Us page - explain business model, owner background, mission, values, years in operation.',
      'Step 6: Build Services page - detail room types, amenities, pricing structure, what''s included in monthly rent.',
      'Step 7: Add Contact page - business phone, email, address, contact form for inquiries, office hours.',
      'Step 8: Include Photos page - high-quality photos of homes (bedrooms, common areas, dining, outdoor spaces).',
      'Step 9: Create FAQ page - answer common questions about move-in process, payment, house rules, visitors policy.',
      'Step 10: Publish website and submit to Google My Business for local search visibility.'
    ]),
    '4-6 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    12.00,
    500.00,
    'annual',
    FALSE,
    'So with my website, I did a website to get started on Go Daddy. You can go on go Daddy, and may have templates that you can use, and you make modification to those templates based on your business model and the things that you want on your website.',
    '{"framework_name": "Website Creation Process", "steps": ["Purchase domain", "Select builder plan", "Choose template", "Customize homepage", "Create core pages", "Add photos", "Build FAQ", "Publish and promote"], "benefits": ["24/7 online presence", "Professional credibility", "Information accessibility", "Lead generation", "Marketing asset"], "lynette_insight": "Don''t overspend on custom website - GoDaddy templates work great, you can modify yourself without paying developer thousands"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T446: Set Up Professional Business Email
  (
    'T446',
    'Set Up Professional Business Email',
    'Business Formation',
    1,
    'Create custom domain email address (info@yourbusiness.com) through GoDaddy or Google Workspace for professional communication with residents, families, referral sources, and vendors.',
    to_jsonb(ARRAY[
      'Step 1: Determine email needs - number of email addresses (owner, admin, admissions), storage requirements, mobile access.',
      'Step 2: Choose email provider - GoDaddy Email ($6-$12/month per address), Google Workspace ($6-$18/month), Microsoft 365 ($6-$22/month).',
      'Step 3: Purchase email plan through domain registrar - if bought domain on GoDaddy, they will prompt you to add email.',
      'Step 4: Create primary email addresses - info@business.com (general inquiries), admissions@business.com (resident inquiries), billing@business.com (payment questions).',
      'Step 5: Set up email client access - configure on phone (iPhone Mail, Gmail app), computer (Outlook, Thunderbird, webmail).',
      'Step 6: Create professional email signature - name, title, business name, phone, website, logo (keep under 4 lines).',
      'Step 7: Set up email forwarding rules if needed - forward info@ to personal phone for immediate notifications.',
      'Step 8: Configure spam filters and security - enable two-factor authentication, set up spam filtering, create password recovery.',
      'Step 9: Update all business materials with professional email - website, business cards, invoices, contracts, social media.',
      'Step 10: Train staff on email professionalism - response time standards (24 hours), tone, grammar, signature usage.'
    ]),
    '1 hour',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    6.00,
    18.00,
    'monthly_per_home',
    FALSE,
    'Once you create a website, you will be paying for a, a domain name on Go Data. It automatically prompts you to create an email address should you want one, but I recommend you having that professional email address when you are conducting business.',
    '{"framework_name": "Professional Email Setup", "steps": ["Determine needs", "Choose provider", "Purchase plan", "Create addresses", "Configure clients", "Design signature", "Set up forwarding", "Enable security", "Update materials", "Train on standards"], "benefits": ["Professional appearance", "Trust building", "Organization", "Branding consistency", "Security"], "lynette_insight": "When you buy domain on GoDaddy it prompts you to add email - do it immediately, unprofessional to use Gmail for business"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T447: Design Business Logo
  (
    'T447',
    'Design Business Logo (Canva/Freelancer)',
    'Business Formation',
    1,
    'Create professional logo for branding consistency across all marketing materials, website, business cards, and communications using DIY tools or affordable freelancers.',
    to_jsonb(ARRAY[
      'Step 1: Define logo style and colors - consider your business values (trust, care, home, community), target demographics, competitor logos.',
      'Step 2: Choose creation method - DIY on Canva (free-$13/month), hire freelancer on Fiverr ($25-$150), use 99Designs contest ($299+).',
      'Step 3: If using Canva - create free account, search ''logo'' templates, filter by industry (healthcare, senior care, hospitality).',
      'Step 4: Customize Canva template - change business name, adjust colors to brand palette, select fonts (maximum 2 fonts), add icon/symbol.',
      'Step 5: If hiring freelancer - write clear brief including business name, industry, values, preferred colors, style examples, deliverable formats.',
      'Step 6: Request multiple concepts (3-5 options) and revision rounds (2-3 rounds) to refine design to vision.',
      'Step 7: Get final files in multiple formats - PNG (transparent background), JPG, SVG (vector for scaling), AI/EPS (for professional printing).',
      'Step 8: Test logo legibility - check if readable at small sizes (business card), large sizes (signage), black and white printing.',
      'Step 9: Apply logo consistently - website header, email signature, business cards, letterhead, invoices, social media profiles.',
      'Step 10: Protect logo - consider trademark registration if unique ($225-$400 USPTO fee) to prevent competitors from copying.'
    ]),
    '2-4 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    150.00,
    'one_time_fee',
    FALSE,
    'You wanna make sure that you have a logo for your branding. You can create your own logo on Canva, or you can hire a freelancer to create this logo for you.',
    '{"framework_name": "Logo Design Process", "steps": ["Define style and colors", "Choose creation method", "Use Canva or hire freelancer", "Customize design", "Request revisions", "Get final files in formats", "Test legibility", "Apply consistently", "Consider trademark"], "benefits": ["Brand recognition", "Professional appearance", "Marketing consistency", "Differentiation", "Credibility"], "lynette_insight": "Start with Canva free templates - looks professional without designer cost, can always upgrade later when revenue flowing"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T448: Set Up Business Phone Number
  (
    'T448',
    'Set Up Business Phone Number (Virtual Line)',
    'Business Formation',
    1,
    'Obtain dedicated business phone line using virtual phone services to separate business calls from personal communications, maintain professional appearance, and enable call management features.',
    to_jsonb(ARRAY[
      'Step 1: Choose virtual phone service - RingCentral ($20-$35/month), Grasshopper ($26-$80/month), Google Voice (free but unprofessional tone), MyOffice ($10-$25/month).',
      'Step 2: Avoid Google Voice - Lynette specifically warns it has ''nasty little tone'' that doesn''t give professional vibes.',
      'Step 3: Select phone number - choose local area code matching your city for local credibility, or toll-free 800 number for regional presence.',
      'Step 4: Set up call routing rules - forward to personal cell during business hours, voicemail after hours, route to staff if team.',
      'Step 5: Record professional voicemail greeting - ''Thank you for calling [Business Name], please leave message with name, number, best time to call back.''',
      'Step 6: Configure business hours - set when calls forward to you vs when go straight to voicemail (9am-6pm typical).',
      'Step 7: Enable call features - voicemail to email transcription, call recording (check state laws), caller ID with business name.',
      'Step 8: Download mobile app - RingCentral or Grasshopper app on smartphone to receive/make calls using business number anywhere.',
      'Step 9: Add business number to all materials - website, business cards, email signature, invoices, social media, directory listings.',
      'Step 10: Train on professional phone etiquette - answer within 3 rings, use greeting script, take detailed messages, return calls within 24 hours.'
    ]),
    '1 hour',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    10.00,
    35.00,
    'monthly_per_home',
    FALSE,
    'You wanna make sure that you have a business phone number this way, you know that all of your calls are coming in through your business line. So you can conduct business to separate it from your personal phone. I don''t really like Google Voice because Google Voice have a nasty little tone when someone''s calling it, and so it''s, it doesn''t really give professional vibes.',
    '{"framework_name": "Business Phone Setup", "steps": ["Choose virtual service", "Avoid Google Voice", "Select number", "Set call routing", "Record greeting", "Configure hours", "Enable features", "Download app", "Add to materials", "Train on etiquette"], "benefits": ["Professional separation", "Call management", "Voicemail features", "Credibility", "Accessibility"], "lynette_insight": "Skip Google Voice unprofessional tone - use RingCentral or MyOffice for professional appearance that separates business from personal"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T449: Create Financial Plan
  (
    'T449',
    'Create Financial Plan for Group Home',
    'Business Formation',
    1,
    'Develop comprehensive financial projections including startup costs, operating expenses, revenue models, and break-even analysis for first 12-24 months of operations.',
    to_jsonb(ARRAY[
      'Step 1: Calculate total startup costs - business registration ($50-$500), first month rent + security deposit ($2,000-$5,000), furniture ($1,500-$3,000), supplies ($500-$1,000).',
      'Step 2: Project monthly operating expenses per home - rent ($1,500-$3,000), utilities ($200-$400), internet/cable ($100-$150), insurance ($100-$200), maintenance reserve ($200).',
      'Step 3: Determine revenue model - calculate beds per home (3-6), price per bed ($725-$4,000/month), multiply for total potential monthly revenue.',
      'Step 4: Calculate occupancy assumptions - start conservative at 50% occupancy month 1, ramp to 75% month 3, target 90%+ by month 6.',
      'Step 5: Compute monthly profit/loss - subtract operating expenses from projected revenue at different occupancy levels.',
      'Step 6: Identify break-even point - determine occupancy % needed to cover all expenses (typically 40-60% depending on rent charged).',
      'Step 7: Project 12-month cash flow - month-by-month revenue, expenses, net profit assuming gradual occupancy ramp-up.',
      'Step 8: Plan for contingencies - emergency fund (3 months expenses = $6,000-$10,000), vacancy reserve, unexpected repairs.',
      'Step 9: Calculate return on investment - total startup cost divided by monthly profit = months to payback initial investment.',
      'Step 10: Update financial plan quarterly - compare actual vs projected, adjust pricing/expenses, refine assumptions for accuracy.'
    ]),
    '3-5 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'What I do not have here is a financial plan in a business plan, but the business plan and the financial plan will be included in the document.',
    '{"framework_name": "Financial Planning Framework", "steps": ["Calculate startup costs", "Project operating expenses", "Determine revenue model", "Set occupancy assumptions", "Compute profit/loss", "Find break-even point", "Project 12-month cash flow", "Plan contingencies", "Calculate ROI", "Update quarterly"], "benefits": ["Financial clarity", "Realistic expectations", "Investor confidence", "Decision making", "Risk management"], "lynette_insight": "Financial plan and business plan templates included in course documents - modify based on your specific situation"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T450: Create Business Plan
  (
    'T450',
    'Create Business Plan with Roadmap',
    'Business Formation',
    1,
    'Write detailed business plan outlining mission, target demographics, competitive analysis, marketing strategy, operations plan, and financial projections as roadmap to success.',
    to_jsonb(ARRAY[
      'Step 1: Executive Summary - write 1-2 page overview of business concept, target market, competitive advantage, financial highlights (write this last after completing other sections).',
      'Step 2: Company Description - explain business name, legal structure (LLC/S-Corp), ownership, location, mission statement, values.',
      'Step 3: Market Analysis - research local group home market, identify target demographics (seniors, recovery, re-entry), analyze demand vs supply.',
      'Step 4: Competitive Analysis - identify 3-5 local competitors, compare pricing, services, occupancy, identify gaps you will fill.',
      'Step 5: Organization & Management - define ownership structure, key roles (owner, house manager, staff), org chart if team.',
      'Step 6: Services & Pricing - detail room types, amenities, services included, pricing structure ($725-$4,000/month based on demographics).',
      'Step 7: Marketing Strategy - outline how you will find residents (referral sources, online marketing, community partnerships, networking).',
      'Step 8: Operations Plan - explain day-to-day operations, staffing needs, resident onboarding, house rules, emergency procedures.',
      'Step 9: Financial Projections - include startup costs, 3-year revenue/expense projections, break-even analysis, cash flow statements.',
      'Step 10: Use as living document - review quarterly, update with actual results, refine strategies, track progress against roadmap.'
    ]),
    '6-10 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'The business plan is designed to have a plan, like your road map to succeed in this business.',
    '{"framework_name": "Business Plan Framework", "steps": ["Executive summary", "Company description", "Market analysis", "Competitive analysis", "Organization structure", "Services and pricing", "Marketing strategy", "Operations plan", "Financial projections", "Quarterly review"], "benefits": ["Strategic clarity", "Roadmap to success", "Investor readiness", "Team alignment", "Decision framework"], "lynette_insight": "Business plan template included in course - it''s lengthy so modify based on where you are, use as roadmap not just one-time document"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T451: Choose Business Name
  (
    'T451',
    'Choose Business Name (Avoid ''Group Home'' Term)',
    'Business Formation',
    1,
    'Select professional business name using alternative terms to avoid negative stigma associated with ''group home'' while maintaining clarity about shared living model.',
    to_jsonb(ARRAY[
      'Step 1: Understand stigma - ''group home'' has gotten bad reputation over years due to abuse, neglect, overcrowding stories in media.',
      'Step 2: Research alternative terms - Residential Care Homes, Independent Living Homes, Boarding Homes, Transitional Living Homes, Rolling Homes, Shared Living Homes, Communal Homes.',
      'Step 3: Consider target demographic - seniors prefer ''Residential Care'' or ''Shared Living'', recovery prefer ''Transitional Living'', general prefer ''Boarding Home''.',
      'Step 4: Brainstorm name ideas - combine alternative term with positive words (Haven, Oasis, Sanctuary, Gardens, Manor, Place, House).',
      'Step 5: Check name availability - search Secretary of State database, IRS business name registry, USPTO trademark database.',
      'Step 6: Verify domain availability - search GoDaddy/Namecheap for .com matching business name before finalizing.',
      'Step 7: Test name with target audience - say name out loud, get feedback from potential residents/families, ensure easy to remember and pronounce.',
      'Step 8: Avoid geographic limitations - don''t include city name if planning to expand to other areas (''Houston Care Homes'' limits expansion).',
      'Step 9: Consider SEO and marketing - include keywords people search (''senior living'', ''affordable housing'', ''shared housing'') in name or tagline.',
      'Step 10: Finalize and register - once name selected and availability confirmed, register with Secretary of State and purchase domain immediately.'
    ]),
    '2-4 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'With unlicensed homes, we typically try to use other names for them outside of group homes. Group homes has gotten a bad name over the years, so I would prefer you adopt one of these terms so that you''re not falling in the hole with group homes in the negative.',
    '{"framework_name": "Business Naming Strategy", "steps": ["Understand group home stigma", "Research alternative terms", "Consider demographics", "Brainstorm combinations", "Check availability", "Verify domain", "Test with audience", "Avoid geographic limits", "Consider SEO", "Finalize and register"], "benefits": ["Avoid negative stigma", "Professional positioning", "Marketing advantage", "Family acceptance", "Community relations"], "lynette_insight": "Group home has bad reputation - use Residential Care, Independent Living, Boarding Home, Shared Living, or Communal Home instead"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T452: Register Domain Name
  (
    'T452',
    'Register Domain Name for Business',
    'Business Formation',
    1,
    'Purchase and register .com domain name matching business name through domain registrar before competitors claim it, securing online brand identity.',
    to_jsonb(ARRAY[
      'Step 1: Check domain availability - use GoDaddy, Namecheap, or Google Domains search tool to verify desired domain is available.',
      'Step 2: Prioritize .com extension - most recognized and trusted, avoid .net, .org, .biz unless .com truly unavailable.',
      'Step 3: Keep domain simple - match business name exactly, avoid hyphens, numbers, or misspellings that confuse potential visitors.',
      'Step 4: Purchase domain immediately - domains are first-come-first-served, don''t delay or someone may register it.',
      'Step 5: Buy for multiple years - register for 2-5 years upfront ($24-$100 total) for discount and avoid forgetting renewal.',
      'Step 6: Add domain privacy protection - hide personal contact info from public WHOIS database ($8-$15/year), reduces spam.',
      'Step 7: Set auto-renewal - enable automatic renewal to prevent accidental domain expiration and loss.',
      'Step 8: Consider buying common misspellings - if budget allows, register common variations and redirect to main domain.',
      'Step 9: Link domain to website builder - connect domain to GoDaddy Website Builder, WordPress, or other hosting platform.',
      'Step 10: Set up email using domain - create professional email addresses once domain registered and connected.'
    ]),
    '30 minutes',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    12.00,
    20.00,
    'annual',
    FALSE,
    'Check domain name availability on GoDaddy or Namecheap. Reserve domain immediately if available.',
    '{"framework_name": "Domain Registration Process", "steps": ["Check availability", "Prioritize .com", "Keep simple", "Purchase immediately", "Buy multiple years", "Add privacy protection", "Enable auto-renewal", "Consider variations", "Link to website", "Set up email"], "benefits": ["Brand protection", "Online presence", "Professional credibility", "Email capability", "Marketing asset"], "lynette_insight": "Register domain immediately when available - first-come-first-served, can''t risk losing it to competitor or squatter"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T453: Verify Social Media Handles
  (
    'T453',
    'Verify Social Media Handle Availability',
    'Business Formation',
    1,
    'Check and secure consistent social media handles (Facebook, Instagram, LinkedIn) matching business name for unified branding across all platforms.',
    to_jsonb(ARRAY[
      'Step 1: List target platforms - Facebook (families research here), Instagram (visual showcase), LinkedIn (professional networking), Twitter/X (optional).',
      'Step 2: Use Namecheckr.com - free tool searches handle availability across 100+ social platforms simultaneously.',
      'Step 3: Check Facebook Page availability - facebook.com/[yourbusinessname] - can create Business Page even if name taken as personal profile.',
      'Step 4: Check Instagram handle - instagram.com/[yourbusinessname] - try to match exactly, avoid underscores/numbers if possible.',
      'Step 5: Check LinkedIn Company Page - linkedin.com/company/[yourbusinessname] - important for B2B referral sources.',
      'Step 6: Claim handles immediately - even if not ready to post content, reserve handles to prevent others from taking them.',
      'Step 7: Keep branding consistent - use same handle across all platforms, same logo as profile photo, same bio description.',
      'Step 8: If exact match unavailable - add location (''BusinessNameHouston''), industry (''BusinessNameSeniorCare''), or ''Official'' prefix.',
      'Step 9: Create placeholder posts - add profile photo, cover image, basic info, ''Coming Soon'' post to show active even before launch.',
      'Step 10: Set up social media management - use Later, Buffer, or Hootsuite to schedule posts across platforms from one dashboard.'
    ]),
    '1 hour',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    FALSE,
    'Verify social media handle availability on Facebook, Instagram, LinkedIn for brand consistency.',
    '{"framework_name": "Social Media Handle Strategy", "steps": ["List target platforms", "Use Namecheckr tool", "Check Facebook availability", "Check Instagram handle", "Check LinkedIn company", "Claim immediately", "Keep consistent branding", "Handle alternatives if taken", "Create placeholder posts", "Set up management tool"], "benefits": ["Brand consistency", "Online presence", "Marketing channels", "Credibility", "Discoverability"], "lynette_insight": "Claim social handles even if not posting yet - prevents competitors from taking your business name on platforms"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T454: Set Up Business Credit Card
  (
    'T454',
    'Set Up Business Credit Card',
    'Business Formation',
    1,
    'Apply for business credit card to build business credit history, separate expenses from personal finances, and access rewards or cash back on business purchases.',
    to_jsonb(ARRAY[
      'Step 1: Establish business first - get EIN, open business bank account, register with state before applying for credit.',
      'Step 2: Check personal credit score - most business cards require personal guarantee, good credit (680+) gets better terms.',
      'Step 3: Research business credit cards - Chase Ink Business Cash (5% cash back categories), American Express Blue Business Cash (2% back), Capital One Spark.',
      'Step 4: Compare features - cash back vs points, annual fee ($0-$550), intro 0% APR periods, sign-up bonuses ($500-$1,000 value).',
      'Step 5: Gather required documents - EIN, business name, revenue estimate, years in business, personal SSN, annual income.',
      'Step 6: Apply online - complete application with business and personal information, submit for instant decision (often approved immediately).',
      'Step 7: Receive and activate card - arrives in 7-10 business days, activate online or by phone before first use.',
      'Step 8: Set spending limits - establish budget for business purchases, avoid personal purchases on business card.',
      'Step 9: Pay in full monthly - avoid interest charges by paying statement balance in full every month, builds credit faster.',
      'Step 10: Track for tax deductions - all business credit card expenses are tax deductible if legitimate business expenses, keep receipts.'
    ]),
    '30 minutes',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    550.00,
    'annual',
    FALSE,
    NULL,
    '{"framework_name": "Business Credit Card Setup", "steps": ["Establish business first", "Check personal credit", "Research card options", "Compare features", "Gather documents", "Apply online", "Activate card", "Set spending limits", "Pay in full monthly", "Track for taxes"], "benefits": ["Build business credit", "Expense separation", "Rewards and cash back", "Purchase protection", "Tax simplification"], "lynette_insight": "Business credit card separates expenses, builds credit, and earns rewards - pay in full monthly to avoid interest"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T455: File for Business License
  (
    'T455',
    'File for Business License with City/County',
    'Business Formation',
    1,
    'Obtain general business license from local city or county clerk office authorizing legal operation of business within jurisdiction, fees vary $50-$500 by location.',
    to_jsonb(ARRAY[
      'Step 1: Identify licensing authority - determine if city or county issues business licenses in your area (call city clerk to confirm).',
      'Step 2: Research license requirements - visit city/county website business section or call clerk office for specific requirements.',
      'Step 3: Gather required documents - EIN letter, Articles of Organization, business address proof, owner ID, zoning approval (if required).',
      'Step 4: Complete application - fill out business license application online or in-person with business details, owner info, activity description.',
      'Step 5: Describe business carefully - use ''residential rental'' or ''shared housing'' not ''group home'' to avoid unnecessary scrutiny.',
      'Step 6: Pay license fee - fees range $50-$500 depending on jurisdiction, business type, and sometimes revenue projections.',
      'Step 7: Submit for review - clerk processes application checking for zoning compliance, tax clearances, complete information.',
      'Step 8: Receive license certificate - arrives by mail or email in 2-6 weeks depending on jurisdiction, display prominently at business location.',
      'Step 9: Note renewal date - business licenses typically renew annually, mark calendar to renew before expiration.',
      'Step 10: Maintain compliance - keep license current, update if changing business name/address/ownership, avoid penalties for expired license.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    50.00,
    500.00,
    'annual',
    TRUE,
    'File for business license with city/county clerk office. Requirements vary by jurisdiction - call first to understand specific local permits needed.',
    '{"framework_name": "Business License Process", "steps": ["Identify authority", "Research requirements", "Gather documents", "Complete application", "Describe business carefully", "Pay fee", "Submit for review", "Receive certificate", "Note renewal date", "Maintain compliance"], "benefits": ["Legal operation", "Compliance", "Credibility", "Tax deductions", "Avoids penalties"], "lynette_insight": "Call city/county clerk first to understand exact requirements - describe as residential rental or shared housing not group home"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T456: Research State Tax Registration
  (
    'T456',
    'Research State Tax Registration Requirements',
    'Business Formation',
    1,
    'Determine if business must register for state sales tax, payroll tax, or other state-specific taxes through Department of Revenue to maintain compliance.',
    to_jsonb(ARRAY[
      'Step 1: Visit state Department of Revenue website - search ''[Your State] Department of Revenue business taxes''.',
      'Step 2: Identify applicable taxes - sales tax (if selling taxable goods/services), payroll tax (if employees), corporate income tax (if corporation).',
      'Step 3: Determine sales tax obligation - most states don''t tax residential rent, but some tax short-term rentals (under 30 days).',
      'Step 4: Check payroll tax requirements - if hiring employees (house managers, caregivers), must register for unemployment tax, withholding tax.',
      'Step 5: Research corporate income tax - LLCs typically pass-through to personal taxes, S-Corps and C-Corps may owe state corporate tax.',
      'Step 6: Register online - complete state tax registration through Department of Revenue online portal with EIN, business info.',
      'Step 7: Receive tax ID numbers - state will issue sales tax permit number, unemployment account number, withholding account number as applicable.',
      'Step 8: Understand filing frequency - sales tax may be monthly/quarterly/annual depending on revenue, payroll tax typically quarterly.',
      'Step 9: Set up accounting system - configure QuickBooks or accounting software to track taxable transactions for reporting.',
      'Step 10: Mark filing deadlines - add state tax return due dates to calendar, set reminders 2 weeks before to prepare.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'Register for state taxes if applicable (sales tax, payroll tax). Check with state Department of Revenue for requirements.',
    '{"framework_name": "State Tax Registration", "steps": ["Visit Department of Revenue", "Identify applicable taxes", "Determine sales tax obligation", "Check payroll requirements", "Research corporate tax", "Register online", "Receive tax IDs", "Understand filing frequency", "Set up accounting", "Mark deadlines"], "benefits": ["Legal compliance", "Avoid penalties", "Professional operation", "Employee hiring capability", "Clean tax records"], "lynette_insight": "Most states don''t tax residential rent over 30 days, but check your state - payroll tax required if hiring employees"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T457: Create LLC Operating Agreement
  (
    'T457',
    'Create LLC Operating Agreement',
    'Business Formation',
    1,
    'Draft Operating Agreement defining ownership percentages, profit distribution, management responsibilities, and dissolution procedures for LLC liability protection.',
    to_jsonb(ARRAY[
      'Step 1: Understand purpose - Operating Agreement is internal LLC document defining how business operates, required for multi-member LLCs.',
      'Step 2: Download template - use free templates from LegalZoom, Rocket Lawyer, or state bar association website.',
      'Step 3: Define members and ownership - list all LLC members (owners) with ownership percentages (must total 100%).',
      'Step 4: Specify capital contributions - document initial investment each member contributed (cash, property, services).',
      'Step 5: Establish profit distribution - define how profits/losses distributed (typically proportional to ownership, can be different).',
      'Step 6: Define management structure - member-managed (all owners involved) vs manager-managed (designated manager runs operations).',
      'Step 7: Outline voting rights - specify major decisions requiring member vote (selling business, adding members, taking loans).',
      'Step 8: Detail member responsibilities - who handles daily operations, finances, marketing, resident care, property management.',
      'Step 9: Include buyout provisions - process for member leaving, how ownership valued, right of first refusal for remaining members.',
      'Step 10: Get signatures and store safely - all members sign and date, keep original in safe place with formation documents.'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    500.00,
    'one_time_fee',
    TRUE,
    'Create Operating Agreement (LLC) defining ownership structure, profit distribution, management responsibilities. Critical for multi-member LLCs.',
    '{"framework_name": "Operating Agreement Creation", "steps": ["Understand purpose", "Download template", "Define members and ownership", "Specify capital contributions", "Establish profit distribution", "Define management structure", "Outline voting rights", "Detail responsibilities", "Include buyout provisions", "Sign and store"], "benefits": ["Legal protection", "Dispute prevention", "Clear expectations", "Bank requirements", "IRS compliance"], "lynette_insight": "Operating Agreement critical for multi-member LLCs - prevents disputes by documenting ownership, profits, responsibilities upfront"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T458: Set Up Annual Report Reminders
  (
    'T458',
    'Set Up Annual Report Calendar Reminders',
    'Business Formation',
    1,
    'Create recurring calendar reminders for state annual report filing deadlines to maintain good standing and avoid penalties, administrative dissolution, or loss of liability protection.',
    to_jsonb(ARRAY[
      'Step 1: Find annual report requirements - check Secretary of State website for LLC/corporation annual report or statement of information.',
      'Step 2: Identify due date - annual reports typically due on business anniversary month or specific date (April 15, May 1, etc.).',
      'Step 3: Note filing fee - fees range $0-$800 depending on state (California $20-$25, Texas $0, Delaware $300+).',
      'Step 4: Set calendar reminder 60 days before - gives time to gather information, prepare filing, avoid last-minute rush.',
      'Step 5: Set second reminder 30 days before - backup reminder in case first one missed or forgotten.',
      'Step 6: Set final reminder 7 days before - last chance to file before due date and late penalties.',
      'Step 7: Make recurring annually - set all reminders to repeat every year on same dates automatically.',
      'Step 8: Include filing instructions in reminder - add link to Secretary of State filing portal, login credentials, required information.',
      'Step 9: Track confirmation - save annual report receipt/confirmation in business records folder each year.',
      'Step 10: Update business information - verify business address, registered agent, member/officer names current before filing.'
    ]),
    '30 minutes',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    800.00,
    'annual',
    TRUE,
    'File annual reports and maintain good standing with state. Mark calendar for renewal deadlines to avoid penalties.',
    '{"framework_name": "Annual Report Compliance", "steps": ["Find requirements", "Identify due date", "Note filing fee", "Set 60-day reminder", "Set 30-day reminder", "Set 7-day reminder", "Make recurring", "Include instructions", "Track confirmations", "Update information"], "benefits": ["Maintain good standing", "Avoid penalties", "Preserve liability protection", "Prevent dissolution", "Professional compliance"], "lynette_insight": "Missing annual report can dissolve your LLC and lose liability protection - set multiple calendar reminders to never miss deadline"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T459: Obtain General Liability Insurance
  (
    'T459',
    'Obtain General Liability Insurance Quote',
    'Business Formation',
    1,
    'Contact insurance brokers to get quotes for general liability insurance protecting business assets from lawsuits and property damage claims arising from operations.',
    to_jsonb(ARRAY[
      'Step 1: Understand coverage needs - general liability covers bodily injury, property damage, personal injury claims from residents, visitors, vendors.',
      'Step 2: Research insurance types - general liability (required), property insurance (if you own building), professional liability (E&O), workers comp (if employees).',
      'Step 3: Find specialized brokers - search ''group home insurance broker'' or ''boarding house insurance'' for industry-specific coverage.',
      'Step 4: Request multiple quotes - contact 3-5 brokers for competitive pricing, coverage varies $500-$3,000/year depending on home size, residents.',
      'Step 5: Provide business details - number of homes, beds per home, resident demographics, services provided, revenue, claims history.',
      'Step 6: Review coverage limits - typical policy $1M per occurrence / $2M aggregate, consider higher limits if high-risk residents.',
      'Step 7: Check exclusions - understand what''s NOT covered (intentional acts, professional medical services, employee injuries without workers comp).',
      'Step 8: Add landlord as additional insured - many landlords require being named on policy, provide certificate of insurance.',
      'Step 9: Set up automatic payments - pay annually for discount (10-15% savings) or monthly for cash flow management.',
      'Step 10: Review and update annually - increase coverage as you add homes, notify insurer of significant changes (new services, more beds).'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    500.00,
    3000.00,
    'annual',
    TRUE,
    'Consider business insurance (general liability, property) once entity established. Protects business assets from lawsuits.',
    '{"framework_name": "Business Insurance Setup", "steps": ["Understand coverage needs", "Research insurance types", "Find specialized brokers", "Request multiple quotes", "Provide business details", "Review coverage limits", "Check exclusions", "Add landlord as insured", "Set up payments", "Review annually"], "benefits": ["Lawsuit protection", "Asset protection", "Landlord compliance", "Professional credibility", "Risk management"], "lynette_insight": "Get general liability insurance once established - protects from resident injury lawsuits, landlords often require it on lease"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T460: Open QuickBooks Account
  (
    'T460',
    'Open QuickBooks Account for Bookkeeping',
    'Business Formation',
    1,
    'Set up QuickBooks Online or Desktop to track income, expenses, invoices, payments, and generate financial reports for tax preparation and business analysis.',
    to_jsonb(ARRAY[
      'Step 1: Choose QuickBooks version - QuickBooks Online ($15-$90/month, cloud-based, mobile) vs QuickBooks Desktop ($299-$549 one-time, local software).',
      'Step 2: Select pricing tier - Simple Start (1 user, basic tracking), Essentials (3 users, bill pay), Plus (5 users, inventory, projects).',
      'Step 3: Sign up for account - use business email, set strong password, start with 30-day free trial to test features.',
      'Step 4: Connect business bank account - link to automatically import transactions daily, categorize for accurate tracking.',
      'Step 5: Set up chart of accounts - create categories for income (rent, fees), expenses (rent, utilities, supplies, payroll, insurance).',
      'Step 6: Configure invoice templates - add logo, payment terms, late fee policy, accepted payment methods, customize for branding.',
      'Step 7: Enable QuickBooks Payments - accept credit/debit cards and ACH transfers from residents, fees 2.9% + 25¢ for cards, 1% for ACH.',
      'Step 8: Set up recurring invoices - automate monthly rent invoices to residents, schedule for 1st of month, email automatically.',
      'Step 9: Create expense tracking - snap photos of receipts with mobile app, categorize expenses for tax deductions, track mileage.',
      'Step 10: Generate financial reports - profit & loss (monthly), balance sheet, cash flow, expense reports for tax prep and decision making.'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    15.00,
    90.00,
    'monthly_per_home',
    TRUE,
    'I use Quickbook because it helps me keep track of my business expenses as well as allow me to collect payments.',
    '{"framework_name": "QuickBooks Setup", "steps": ["Choose version", "Select pricing tier", "Sign up with trial", "Connect bank account", "Set up chart of accounts", "Configure invoice templates", "Enable QuickBooks Payments", "Set up recurring invoices", "Create expense tracking", "Generate financial reports"], "benefits": ["Automated bookkeeping", "Payment processing", "Tax preparation", "Financial insights", "Professional invoicing"], "lynette_insight": "QuickBooks game-changer - tracks expenses AND collects payments in one system, switched from Stripe for integrated approach"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  )

ON CONFLICT (tactic_id) DO UPDATE SET
  tactic_name = EXCLUDED.tactic_name,
  why_it_matters = EXCLUDED.why_it_matters,
  step_by_step = EXCLUDED.step_by_step,
  tactic_source = EXCLUDED.tactic_source,
  official_lynette_quote = EXCLUDED.official_lynette_quote,
  expert_frameworks = EXCLUDED.expert_frameworks
WHERE gh_tactic_instructions.tactic_source != 'cashflow_course';

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inserted_count
  FROM gh_tactic_instructions
  WHERE tactic_source = 'cashflow_course'
  AND tactic_id >= 'T442' AND tactic_id <= 'T460';

  RAISE NOTICE '✓ Inserted/updated % cashflow course tactics (T442-T460)', inserted_count;
END $$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
╔══════════════════════════════════════════════════════════╗
║   CASHFLOW COURSE TACTICS - T442-T460                   ║
║   Business Formation completion: 18 tactics              ║
║   Categories: Business Setup, Banking, Branding          ║
╚══════════════════════════════════════════════════════════╝
  ';
END $$;
