-- Migration: Populate cashflow tactics T461-T480 (Property Selection & Acquisition)
-- Date: 2025-12-01
-- Purpose: Property sourcing, landlord negotiations, and property evaluation tactics from Group Home Cash Flow Course

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
-- TACTIC INSERTION: Property Selection (T461-T480)
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
  -- T461: Search Facebook Real Estate Groups
  (
    'T461',
    'Search Facebook Real Estate Groups for Rental Properties',
    'Property Selection',
    2,
    'Join local Facebook real estate groups to discover rental properties posted by private owners, often before listings hit major rental platforms.',
    to_jsonb(ARRAY[
      'Step 1: Search Facebook for local real estate groups using keywords ''rental real estate housing [your city]'', ''landlord [city]'', ''real estate investors [city]''.',
      'Step 2: Join 5-10 relevant groups - request to join groups focused on rentals, landlords, real estate investing in your metro area.',
      'Step 3: Read group rules - understand posting guidelines, self-promotion policies, introduction requirements before engaging.',
      'Step 4: Engage authentically - comment on posts, answer questions, build credibility before posting your rental needs.',
      'Step 5: Create rental needs post - explain looking for 3-4 bedroom home for shared housing business, budget range, move-in timeline, professional business.',
      'Step 6: Post rental needs directly - share that you operate residential care business seeking long-term rental, emphasize reliability and on-time payments.',
      'Step 7: Monitor daily for new listings - set notifications for group posts, check daily for property owners posting available homes.',
      'Step 8: Respond quickly to listings - private message property owners within hours of posting, express interest, request showing.',
      'Step 9: Use provided landlord script - copy/paste landlord script template from course documents to introduce business professionally.',
      'Step 10: Build relationships - connect with property owners, real estate investors, property managers even if no immediate properties, future opportunities.'
    ]),
    '3-5 hours per week',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'You can join your local communities on Facebook, uh, where it''s related to real estate and you''ll find property owners that might post about available homes that they have for rent. Search for renovate groups using keywords like rental real estate housing in your area. Engage with members and post about your rental needs directly.',
    '{"framework_name": "Facebook Group Property Sourcing", "steps": ["Search for local groups", "Join 5-10 groups", "Read rules", "Engage authentically", "Post rental needs", "Monitor daily", "Respond quickly", "Use landlord script", "Build relationships"], "benefits": ["Access private listings", "Direct owner contact", "Less competition", "Relationship building", "Free resource"], "lynette_insight": "Facebook groups connect you with landlords before properties hit Zillow - engage authentically, use landlord script for professional introduction"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T462: Use Landlord Script
  (
    'T462',
    'Use Landlord Script to Contact Property Owners',
    'Property Selection',
    2,
    'Utilize provided professional landlord script template to direct message property owners explaining group home business model, building trust and credibility.',
    to_jsonb(ARRAY[
      'Step 1: Locate landlord script - find template in course documents section included with cashflow course materials.',
      'Step 2: Customize with your details - replace placeholders with your business name, phone, email, number of homes currently operating.',
      'Step 3: Explain business model clearly - describe shared housing for seniors/recovery/re-entry, emphasize stability, background checks, professional operation.',
      'Step 4: Highlight landlord benefits - on-time payments via business account, property maintained, long-term lease, professional communication.',
      'Step 5: Address common concerns proactively - clarify you maintain insurance, conduct resident screenings, handle all maintenance coordination.',
      'Step 6: Tailor to property type - adjust script based on property size (3BR vs 5BR), location (suburban vs urban), landlord type (individual vs company).',
      'Step 7: Copy/paste to Facebook messages - use script when direct messaging property owners on Facebook Marketplace, rental groups.',
      'Step 8: Follow up professionally - if no response in 3-5 days, send polite follow-up asking if still available, expressing continued interest.',
      'Step 9: Track conversations - keep spreadsheet of properties contacted, landlord names, dates, responses, follow-up needed.',
      'Step 10: Refine based on results - note which script variations get best response rates, adjust language to improve effectiveness.'
    ]),
    '30 minutes per property',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'Message owners who post about available properties. And again, you can use the landlord script and copy and paste it and direct message these individuals.',
    '{"framework_name": "Landlord Outreach Script", "steps": ["Locate script template", "Customize details", "Explain business model", "Highlight benefits", "Address concerns", "Tailor to property", "Copy/paste to messages", "Follow up professionally", "Track conversations", "Refine based on results"], "benefits": ["Professional presentation", "Consistent messaging", "Address objections", "Time savings", "Higher response rate"], "lynette_insight": "Landlord script provided in course documents - copy/paste and customize, direct message property owners professionally"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T463: Join Airbnb Host Groups
  (
    'T463',
    'Join Airbnb Host Groups for Long-Term Rentals',
    'Property Selection',
    2,
    'Connect with Airbnb hosts who may have long-term rental properties available beyond their short-term rental inventory, accessing hidden rental market.',
    to_jsonb(ARRAY[
      'Step 1: Search for Airbnb host groups - Facebook groups named ''Airbnb Hosts [City]'', ''Airbnb Superhosts'', ''Short-Term Rental Hosts''.',
      'Step 2: Join multiple host communities - request membership in 3-5 active Airbnb host groups in your metro area.',
      'Step 3: Introduce yourself - post introduction explaining you operate shared housing business seeking long-term rentals.',
      'Step 4: Explain transition opportunity - many Airbnb hosts want stable long-term income without guest turnover, positioning yourself as solution.',
      'Step 5: Highlight advantages - guaranteed monthly income, no guest damages, no cleaning between guests, reduced management headaches.',
      'Step 6: Monitor for frustrated hosts - watch for posts about difficult guests, low occupancy, platform changes, market saturation.',
      'Step 7: Reach out privately - message hosts expressing frustrations, offer long-term rental alternative with stable income.',
      'Step 8: Negotiate below market rate - Airbnb hosts may accept slightly lower rent for guaranteed income and reduced work.',
      'Step 9: Find fully furnished properties - many Airbnb properties already furnished, reducing your startup furniture costs significantly.',
      'Step 10: Build host relationships - even if no current availability, stay connected for future properties or referrals to other hosts.'
    ]),
    '2-3 hours per week',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    FALSE,
    'Facebook groups are like Airbnb groups. Airbnb hosts may have long term rental properties available. To find these opportunities, join Airbnb host or rent a proper related groups on social media platforms.',
    '{"framework_name": "Airbnb Host Conversion", "steps": ["Search host groups", "Join communities", "Introduce yourself", "Explain transition opportunity", "Highlight advantages", "Monitor frustrated hosts", "Reach out privately", "Negotiate below market", "Find furnished properties", "Build relationships"], "benefits": ["Furnished properties", "Motivated landlords", "Below market rates", "Less competition", "Quality properties"], "lynette_insight": "Airbnb hosts often want stable income without guest hassles - offer long-term rental solution, many properties already furnished"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T464: Network in Landlord Communities
  (
    'T464',
    'Network in Landlord Community Groups',
    'Property Selection',
    2,
    'Join landlord communities where property owners discuss tenant issues, regulations, and resources - express interest in renting for reliable business model.',
    to_jsonb(ARRAY[
      'Step 1: Find landlord communities - search Facebook for ''Landlords [City]'', ''Property Owners Network'', ''Real Estate Landlord Forum''.',
      'Step 2: Join landlord associations - local apartment associations, landlord organizations often have online forums or Facebook groups.',
      'Step 3: Observe discussions - read posts about landlord challenges, tenant issues, vacancy problems, rent collection difficulties.',
      'Step 4: Engage helpfully - answer questions, share insights, establish yourself as knowledgeable professional (not just looking for properties).',
      'Step 5: Build credibility - participate in discussions about screening tenants, lease agreements, maintenance, demonstrating business acumen.',
      'Step 6: Identify pain points - note common complaints (late payments, property damage, evictions, turnover costs).',
      'Step 7: Position as solution - when appropriate, mention you operate professional shared housing business with guaranteed payments, professional management.',
      'Step 8: Private message landlords - reach out to active landlords privately, introduce business, ask about current or future vacancies.',
      'Step 9: Offer references - provide business bank account proof, previous landlord references, insurance certificate to build trust.',
      'Step 10: Stay active long-term - don''t just post once looking for property, maintain presence for ongoing and future opportunities.'
    ]),
    '2-4 hours per week',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    FALSE,
    'Landlords, they have communities where landlords are venting about issues that they are having with their tenants or helping them navigate through different processes where it pertains to being a landlord in laws and things like that. So you can get in those groups and connect with them so that you can also express interest in finding rental properties to use for your group home model.',
    '{"framework_name": "Landlord Community Networking", "steps": ["Find landlord communities", "Join associations", "Observe discussions", "Engage helpfully", "Build credibility", "Identify pain points", "Position as solution", "Private message landlords", "Offer references", "Stay active long-term"], "benefits": ["Direct landlord access", "Understand pain points", "Build trust", "Multiple properties", "Long-term relationships"], "lynette_insight": "Landlord groups are where owners vent about bad tenants - position yourself as dream tenant with professional business, guaranteed payments"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T465: Search BRRRR Groups
  (
    'T465',
    'Search BRRRR Groups (Buy-Rehab-Rent-Refinance-Repeat)',
    'Property Selection',
    2,
    'Join real estate investor BRRRR groups to connect with investors finishing renovation projects who need reliable tenants for newly rehabbed cash flow properties.',
    to_jsonb(ARRAY[
      'Step 1: Understand BRRRR strategy - investors buy distressed properties, renovate, rent out, refinance to pull capital, repeat process.',
      'Step 2: Find BRRRR groups - search Facebook for ''BRRRR Investors'', ''Real Estate Wholesaling'', ''Fix and Flip [City]'', ''Real Estate Investors''.',
      'Step 3: Join 5-10 investor groups - focus on local and regional groups where investors own properties in your target area.',
      'Step 4: Learn investor language - understand ARV (after repair value), cash flow, cap rate, debt service coverage ratio to communicate effectively.',
      'Step 5: Monitor project completions - watch for posts about finished renovations, properties ready to rent, seeking tenant leads.',
      'Step 6: Respond quickly to opportunities - when investor posts finished project, immediately express interest, request showing, provide business overview.',
      'Step 7: Highlight investor benefits - emphasize you provide stable cash flow (investor''s goal), long-term lease, professional operation, on-time payments.',
      'Step 8: Offer slightly above market rent - BRRRR investors focus on cash flow, willing to pay $100-$200 more monthly shows you''re serious.',
      'Step 9: Build relationships before projects finish - connect with active investors, let them know you''re ready renter when next property completes.',
      'Step 10: Become preferred tenant - once you prove reliable with first property, investor will offer you future projects before marketing publicly.'
    ]),
    '2-3 hours per week',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    FALSE,
    'The bird groups are by rehab, rent, refinance, repeat. So these groups are from real estate investors who buy properties and they renovate them, and then they are looking to use them as cash fluent assets by finding people to rent them. So you want to make sure that you''re in those groups to let them know that when they finish a project, you''re able to are available to rent it out.',
    '{"framework_name": "BRRRR Investor Partnership", "steps": ["Understand BRRRR strategy", "Find investor groups", "Join local groups", "Learn investor language", "Monitor project completions", "Respond quickly", "Highlight cash flow benefits", "Offer above market rent", "Build pre-completion relationships", "Become preferred tenant"], "benefits": ["Newly renovated properties", "Motivated landlords", "Multiple property pipeline", "Quality condition", "Investor partnerships"], "lynette_insight": "BRRRR investors need reliable tenants for cash flow - when they finish project, jump on it immediately, they prioritize stable rent over maximum price"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T466: Use HotPads
  (
    'T466',
    'Use HotPads to Find For-Rent-By-Owner Properties',
    'Property Selection',
    2,
    'Search HotPads real estate platform filtering for properties listed directly by owners, enabling direct negotiation without property management middlemen.',
    to_jsonb(ARRAY[
      'Step 1: Visit HotPads website (hotpads.com) or download mobile app - real estate search engine specializing in rental listings.',
      'Step 2: Set search location - enter target city, neighborhoods, or draw custom boundary on map for specific areas.',
      'Step 3: Filter search criteria - select 3+ bedrooms, price range ($1,500-$3,000), property type (single family, townhouse).',
      'Step 4: Enable ''For Rent By Owner'' filter - narrows results to properties listed directly by owners, not property managers.',
      'Step 5: Review listings daily - new properties added constantly, early contact increases likelihood of securing property.',
      'Step 6: Identify owner listings - look for listings with personal contact info (owner cell phone, personal email) vs company phone/website.',
      'Step 7: Contact owners directly - use provided phone number or email, introduce business, request property showing.',
      'Step 8: Explain business model upfront - don''t hide group home model, explain shared housing for [demographic], professional operation.',
      'Step 9: Use landlord script - send customized landlord script via email or text after initial phone contact.',
      'Step 10: Schedule showings quickly - owners manage own calendar, more flexible for evening/weekend showings than property managers.'
    ]),
    '1-2 hours per day',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'HotPads is a real estate search engine that allows you to find rental properties, including those listed by private owners. To use Hot Page, you wanna look up for rent by owner acquisitions. Visit the Hot Page website or use the mobile app that your search criteria to filter for rental properties listed by owners. Reach out to the property, property owners directly through the contact information provided on the listing.',
    '{"framework_name": "HotPads Property Search", "steps": ["Visit HotPads website/app", "Set search location", "Filter criteria", "Enable FRBO filter", "Review daily", "Identify owner listings", "Contact directly", "Explain business upfront", "Use landlord script", "Schedule quickly"], "benefits": ["Direct owner contact", "No management fees", "Flexible negotiations", "Personal relationships", "Market coverage"], "lynette_insight": "HotPads filters for rent-by-owner listings - contact owners directly, more flexible negotiations than property management companies"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T467: Research Eviction Court Records
  (
    'T467',
    'Research Eviction Court Records for Available Properties',
    'Property Selection',
    2,
    'Access public eviction court records to identify properties with recent tenant removals, creating marketing piece to introduce yourself as reliable replacement tenant.',
    to_jsonb(ARRAY[
      'Step 1: Find eviction court location - search ''[County] eviction court'' or ''Justice of the Peace precinct [number]'' handling landlord-tenant cases.',
      'Step 2: Access public records - visit courthouse in person or check county website for online eviction case records (some counties publish online).',
      'Step 3: Review recent eviction filings - look for cases filed within last 30-60 days where judgment granted for possession.',
      'Step 4: Note property addresses - eviction cases include property address, landlord name/contact info, case number in court records.',
      'Step 5: Compile target list - create spreadsheet of properties with recent evictions, landlord names, addresses, case dates.',
      'Step 6: Create marketing flyer - design one-page professional introduction explaining you operate reliable shared housing business.',
      'Step 7: Highlight reliability - emphasize background checks, guaranteed payments, professional management, long-term stability in marketing piece.',
      'Step 8: Mail or hand-deliver flyer - send marketing piece to property owner addresses with personalized cover letter expressing interest.',
      'Step 9: Follow up with phone call - call landlord 5-7 days after mailing, reference letter, ask if property still vacant or re-rented.',
      'Step 10: Position as solution - landlord just dealt with eviction headache, position yourself as hassle-free professional tenant preventing repeat situation.'
    ]),
    '3-4 hours per week',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    50.00,
    'one_time_fee',
    FALSE,
    'Assistant eviction court records can provide information on properties that might be available for rent. Once you identify the potential opportunity, create a marketing piece that introduce yourself as a reliable and responsible tenant to the property investor. Include your contact information in a brief overview of your rental preferences. Distribute this marketing piece to the owners of properties with recent eviction cases.',
    '{"framework_name": "Eviction Court Prospecting", "steps": ["Find eviction court", "Access public records", "Review recent filings", "Note property addresses", "Compile target list", "Create marketing flyer", "Highlight reliability", "Mail or deliver", "Follow up by phone", "Position as solution"], "benefits": ["Motivated landlords", "Vacant properties", "Less competition", "Immediate availability", "Negotiation leverage"], "lynette_insight": "Eviction court records are public - find properties with recent evictions, landlords are motivated to fill vacancy with reliable tenant quickly"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T468: Search Facebook Marketplace
  (
    'T468',
    'Search Facebook Marketplace for Rental Listings',
    'Property Selection',
    2,
    'Browse Facebook Marketplace daily for rental property listings, reaching out quickly to owners before properties rent to other applicants.',
    to_jsonb(ARRAY[
      'Step 1: Access Facebook Marketplace - click Marketplace icon on Facebook, select ''Property Rentals'' category.',
      'Step 2: Set location and filters - enter target city/radius, filter by bedrooms (3+), price range, property type.',
      'Step 3: Enable new listing notifications - turn on alerts for new rental listings matching criteria, get immediate notification on phone.',
      'Step 4: Check multiple times daily - Marketplace listings fill quickly, check morning, midday, evening for new posts.',
      'Step 5: Identify owner vs realtor listings - owner listings typically have personal photos, casual descriptions, phone numbers not company websites.',
      'Step 6: Message immediately - use Facebook Messenger to express interest within minutes/hours of posting, ask if available, request showing.',
      'Step 7: Send landlord script - after initial contact, send customized landlord script explaining business model, professional operation.',
      'Step 8: Provide business credibility - offer to share business bank account proof, insurance, previous landlord references in first message.',
      'Step 9: Be responsive - reply to landlord questions within hours, show you''re serious and professional in communication.',
      'Step 10: Schedule showing same day - if property interests you and owner responsive, push for same-day or next-day showing before other applicants.'
    ]),
    '30-60 minutes per day',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'With Facebook Marketplace, this is where people list their homes on this platform for rent. And so you will just reach out to them to see if they can allow you to use their home to run your business.',
    '{"framework_name": "Facebook Marketplace Rental Search", "steps": ["Access Marketplace", "Set location and filters", "Enable notifications", "Check multiple times daily", "Identify owner listings", "Message immediately", "Send landlord script", "Provide credibility", "Be responsive", "Schedule same-day showing"], "benefits": ["High volume listings", "Direct owner contact", "Fast communication", "Mobile convenience", "Free platform"], "lynette_insight": "Facebook Marketplace has massive rental volume - enable notifications, respond within minutes of new posts to beat competition"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T469: Prepare Marketing Piece
  (
    'T469',
    'Prepare Marketing Piece for Property Investors',
    'Property Selection',
    2,
    'Create professional one-page flyer introducing yourself as reliable responsible tenant to property owners, including contact info, rental preferences, financial stability.',
    to_jsonb(ARRAY[
      'Step 1: Design one-page flyer - use Canva template or Word document, keep design clean and professional (business colors, logo).',
      'Step 2: Create compelling headline - ''Professional Shared Housing Operator Seeking Long-Term Rental Properties'' or ''Reliable Business Tenant Available''.',
      'Step 3: Introduce yourself and business - 2-3 sentences about your company, years operating, number of current homes, business mission.',
      'Step 4: List rental preferences - desired bedrooms (3-4), bathrooms (2+), square footage, neighborhoods, price range.',
      'Step 5: Highlight landlord benefits - guaranteed on-time payments, long-term lease (1-2 years), property maintenance, business insurance, professional communication.',
      'Step 6: Provide financial proof - mention business bank account, payment processor, ability to provide financial references.',
      'Step 7: Include contact information - business phone, email, website, office hours, ''Call or text anytime'' availability.',
      'Step 8: Add professional photo - headshot or business logo builds credibility and memorability.',
      'Step 9: Include brief testimonials - if available, add 1-2 quotes from previous landlords about reliability, property care.',
      'Step 10: Call to action - ''Contact me today to discuss your available properties'' with multiple contact methods listed.'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    50.00,
    'one_time_fee',
    FALSE,
    'With the marking piece, we have a landlord script that will be provided to you in the documents, this included with this course. You will tailor the landlord script to your needs and send it out to our landlord that have properties that you are interested in rinsing.',
    '{"framework_name": "Landlord Marketing Flyer", "steps": ["Design one-page flyer", "Create compelling headline", "Introduce business", "List rental preferences", "Highlight landlord benefits", "Provide financial proof", "Include contact info", "Add professional photo", "Include testimonials", "Strong call to action"], "benefits": ["Professional presentation", "Reusable asset", "Credibility building", "Contact capture", "Differentiation"], "lynette_insight": "Marketing piece shows you''re professional business not typical tenant - mail to eviction court landlords, hand out at networking events"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T470: Contact Small Property Management
  (
    'T470',
    'Contact Small Property Management Companies',
    'Property Selection',
    2,
    'Reach out to unsophisticated small property management companies who know landlords directly, pitching business model showing higher rental income potential.',
    to_jsonb(ARRAY[
      'Step 1: Identify small property management firms - search Google for ''property management [city]'', focus on companies managing 10-50 properties (not large corporate firms).',
      'Step 2: Avoid large corporate companies - big firms have rigid policies, small firms more flexible, owners know landlords personally.',
      'Step 3: Research company portfolio - check website for property types managed, neighborhoods, owner profiles.',
      'Step 4: Call property manager directly - ask to speak with owner or senior property manager about rental opportunity.',
      'Step 5: Explain business model - describe shared housing operation, target demographics, professional management, stable income for landlord.',
      'Step 6: Highlight increased rent potential - show how your model pays $200-$500 more per month than traditional single-family rental.',
      'Step 7: Address management concerns - explain you handle all resident management, property manager just collects rent and coordinates maintenance as usual.',
      'Step 8: Offer property manager incentive - some managers open to referral fee or ongoing management fee for connecting you with owners.',
      'Step 9: Request owner introductions - ask manager to present opportunity to owners with vacant properties or upcoming vacancies.',
      'Step 10: Provide professional materials - send business overview, insurance certificate, bank references to share with property owners.'
    ]),
    '1-2 hours per company',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    FALSE,
    'You can''t buy some small US sophisticated property management companies that will allow you to use the home, because they know the landlords directly. It can pitch your business model to them to see if they''re open to making a little bit more money by allowing you to run a business in their home.',
    '{"framework_name": "Property Management Outreach", "steps": ["Identify small firms", "Avoid large corporate", "Research portfolio", "Call directly", "Explain business model", "Highlight increased rent", "Address concerns", "Offer incentive", "Request introductions", "Provide materials"], "benefits": ["Access to multiple properties", "Landlord credibility", "Professional connections", "Ongoing pipeline", "Trusted intermediary"], "lynette_insight": "Small unsophisticated property management companies know landlords personally - pitch higher rent potential, they can advocate to owners"}'::JSONB,
    'Module 2: Property Acquisition',
    'cashflow_course'
  ),

  -- T471: Determine Optimal Occupancy
  (
    'T471',
    'Determine Optimal Occupancy Using Rule of Thumb',
    'Property Selection',
    2,
    'Calculate safe occupancy using 2 people per bedroom rule to avoid fire code violations, maintain safety standards, and prevent regulatory issues.',
    to_jsonb(ARRAY[
      'Step 1: Learn occupancy rule - general guideline is 2 people per bedroom maximum (3BR = 6 people max, 4BR = 8 people max).',
      'Step 2: Check local fire codes - some jurisdictions have specific occupancy limits, contact fire marshal or building department.',
      'Step 3: Review square footage requirements - some areas require minimum square feet per person (typically 70-150 sq ft).',
      'Step 4: Calculate bedroom-based capacity - count bedrooms, multiply by 2 for maximum safe occupancy.',
      'Step 5: Consider bathroom ratio - maintain reasonable bathroom-to-resident ratio (ideally 1 bathroom per 3-4 residents for quality of life).',
      'Step 6: Avoid overcrowding temptation - Lynette warns against 16 people in 3-bedroom house (fire hazard, negligent, illegal).',
      'Step 7: Document occupancy plan - if asked by city/county, show calculated occupancy based on bedroom count, square footage, safety.',
      'Step 8: Build in buffer - don''t push to absolute maximum, stay at 75-90% of calculated max for comfort and safety.',
      'Step 9: Understand consequences - overcrowding leads to fire code violations, city/county regulation, forced closure, lawsuits.',
      'Step 10: Prioritize safety over revenue - better to have fewer residents legally than more residents risking shutdown and reputation damage.'
    ]),
    '30 minutes',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'We''ll talk a little bit more about rule of thumb when it pertains to occupancy later in the course. Let''s just say if you got a three bedroom house and you put 16 people in a three bedroom house, that is not safe. So it could be considered negligent. They have to regulate things like that and they do that through occupancy.',
    '{"framework_name": "Safe Occupancy Calculation", "steps": ["Learn 2-per-bedroom rule", "Check local fire codes", "Review square footage rules", "Calculate capacity", "Consider bathroom ratio", "Avoid overcrowding", "Document occupancy plan", "Build in buffer", "Understand consequences", "Prioritize safety over revenue"], "benefits": ["Legal compliance", "Safety standards", "Avoid violations", "Resident comfort", "Business sustainability"], "lynette_insight": "Don''t put 16 people in 3-bedroom house - not safe, considered negligent, cities regulate through occupancy limits to prevent abuse"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T472: Inspect Property for Suitability
  (
    'T472',
    'Inspect Property for Group Home Suitability',
    'Property Selection',
    2,
    'Evaluate property for adequate bedrooms, bathrooms, common areas, parking, accessibility features, neighborhood compatibility before signing lease.',
    to_jsonb(ARRAY[
      'Step 1: Count bedrooms and bathrooms - verify bedroom count matches listing, check bathroom functionality (toilet, shower/tub, sink working).',
      'Step 2: Measure bedroom sizes - bedrooms should fit at minimum full/queen bed, dresser, nightstand (typically 100-120 sq ft minimum).',
      'Step 3: Assess common areas - evaluate living room, dining room, kitchen size for number of residents (can accommodate group meals, socializing).',
      'Step 4: Inspect kitchen functionality - check appliances work (stove, oven, refrigerator, dishwasher), adequate cabinet/counter space for multiple residents.',
      'Step 5: Review parking availability - count parking spaces (driveway, garage, street), ensure adequate for residents and staff vehicles.',
      'Step 6: Check accessibility features - note if property has stairs (limits mobility-impaired residents), grab bars, wide doorways, ramps.',
      'Step 7: Test utilities - verify HVAC works throughout house, water pressure adequate, electrical outlets sufficient in each bedroom.',
      'Step 8: Evaluate neighborhood - drive around area at different times, check proximity to grocery stores, medical facilities, public transit.',
      'Step 9: Check for safety hazards - look for mold, water damage, electrical issues, foundation problems, pest infestations.',
      'Step 10: Document with photos/video - take comprehensive photos and video walkthrough to reference later and protect against false damage claims at move-out.'
    ]),
    '1-2 hours per property',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    NULL,
    '{"framework_name": "Property Suitability Assessment", "steps": ["Count bedrooms/bathrooms", "Measure bedroom sizes", "Assess common areas", "Inspect kitchen", "Review parking", "Check accessibility", "Test utilities", "Evaluate neighborhood", "Check safety hazards", "Document with photos"], "benefits": ["Informed decision", "Avoid unsuitable properties", "Resident satisfaction", "Operational efficiency", "Damage protection"], "lynette_insight": "Take photos and video at move-in - protects against false damage claims when lease ends, documents property condition"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T473: Verify Zoning
  (
    'T473',
    'Verify Zoning Allows Shared Housing Model',
    'Property Selection',
    2,
    'Contact local planning and zoning department to ensure no permits required or restrictions prohibiting shared housing operation in target neighborhoods.',
    to_jsonb(ARRAY[
      'Step 1: Locate planning and zoning department - search ''[City] planning and zoning'' or ''[City] permit center'' for contact info.',
      'Step 2: Call anonymously first - don''t immediately identify yourself, ask general questions about housing regulations.',
      'Step 3: Use strategic language - ask ''Do I need permit to house travel nurses, contractors, or flight attendants?'' (avoid ''group home'' term).',
      'Step 4: Understand Fair Housing Act - Federal Fair Housing Act protects right to house unrelated people, prevents discrimination.',
      'Step 5: Research local ordinances - some cities/counties interfere with Fair Housing Act through zoning, permits, occupancy limits.',
      'Step 6: Request documentation - ask zoning officer to email specific ordinances or code sections restricting shared housing.',
      'Step 7: Identify permitted zones - if restrictions exist, ask which zoning districts allow shared housing (commercial, mixed-use, specific residential).',
      'Step 8: Obtain Fair Housing Act document - course includes Fair Housing Act reference document to cite if city creates barriers.',
      'Step 9: Consult attorney if needed - if city clearly violating Fair Housing Act, attorney can send letter citing federal law.',
      'Step 10: Consider alternate jurisdictions - if one city heavily restricted, expand search to neighboring cities/unincorporated county areas.'
    ]),
    '1-2 hours per jurisdiction',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'Typically with the bear Housing Act, you don''t have to worry about these things. But sometimes some cities and counties do interfere with Bear Housing Act. We will have that document for you in the document sections that you will be able to get with this course. In order to find out if there are any regulations, contact your zoning and planning or your permanent center in your city or your county. And how to approach that situation is you would just ask them, do they have any type of permit that you need to house travel nurses, contractors that''s coming in and out or flight attendants.',
    '{"framework_name": "Zoning Verification Process", "steps": ["Locate planning department", "Call anonymously first", "Use strategic language", "Understand Fair Housing Act", "Research local ordinances", "Request documentation", "Identify permitted zones", "Obtain Fair Housing Act doc", "Consult attorney if needed", "Consider alternate jurisdictions"], "benefits": ["Legal compliance", "Avoid violations", "Informed property selection", "Fair Housing protection", "Prevent shutdown"], "lynette_insight": "Fair Housing Act protects shared housing, but some cities interfere - ask about travel nurses/contractors permits not ''group home''"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T474: Negotiate Lease Terms
  (
    'T474',
    'Negotiate Lease Terms with Landlord',
    'Property Selection',
    2,
    'Discuss and negotiate lease length, monthly rent, security deposit, maintenance responsibilities, subletting permissions, and early termination clauses with property owner.',
    to_jsonb(ARRAY[
      'Step 1: Determine ideal lease length - request 1-2 year initial lease for stability, with option to renew for additional years.',
      'Step 2: Negotiate monthly rent - research comparable rentals, consider offering slightly above market for favorable terms.',
      'Step 3: Discuss security deposit - typical 1-2 months rent, negotiate lower if providing multiple months prepayment or excellent references.',
      'Step 4: Clarify maintenance responsibilities - understand what landlord handles (major repairs, HVAC, appliances) vs tenant (minor repairs, lawn care).',
      'Step 5: Request subletting permission - critical for group home model, must have explicit permission to rent rooms to residents.',
      'Step 6: Negotiate early termination clause - include 60-90 day notice option if business circumstances change or property unsuitable.',
      'Step 7: Request rent increase cap - negotiate maximum annual rent increase percentage (3-5%) for budget predictability.',
      'Step 8: Clarify utility responsibilities - determine if utilities included in rent or tenant-paid separately.',
      'Step 9: Request minor modification permission - ability to install grab bars, safety equipment, minor accessibility improvements with landlord approval.',
      'Step 10: Get everything in writing - all negotiated terms must be in signed lease agreement, verbal promises not enforceable.'
    ]),
    '2-4 hours per property',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    NULL,
    '{"framework_name": "Lease Negotiation Strategy", "steps": ["Determine lease length", "Negotiate rent", "Discuss deposit", "Clarify maintenance", "Request subletting permission", "Negotiate early termination", "Request rent cap", "Clarify utilities", "Request modification permission", "Get in writing"], "benefits": ["Favorable terms", "Cost control", "Operational flexibility", "Legal protection", "Predictability"], "lynette_insight": "Subletting permission critical - must explicitly allow renting rooms to residents, get in writing in lease agreement"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T475: Calculate All-In Costs
  (
    'T475',
    'Calculate All-In Housing Costs Per Property',
    'Property Selection',
    2,
    'Add rent plus utilities plus internet plus insurance plus maintenance reserve to determine total monthly cost per property before setting resident pricing.',
    to_jsonb(ARRAY[
      'Step 1: Document base rent - record monthly rent amount from lease agreement.',
      'Step 2: Estimate utility costs - ask landlord for previous utility bills (electric $150-$300, gas $50-$150, water/sewer $75-$150 depending on occupancy).',
      'Step 3: Add internet and cable - budget $100-$150/month for high-speed internet, basic cable optional based on resident expectations.',
      'Step 4: Calculate insurance - general liability insurance typically $500-$3,000 annually ($42-$250 monthly).',
      'Step 5: Budget maintenance reserve - set aside $200-$300 monthly for repairs, replacements, unexpected issues.',
      'Step 6: Include property management - if hiring property manager, add 8-10% of rent ($120-$300 monthly).',
      'Step 7: Add supplies and consumables - household supplies, cleaning products, toilet paper, paper towels ($50-$100 monthly).',
      'Step 8: Calculate total monthly cost - sum all expenses to get true operating cost per property.',
      'Step 9: Divide by bed count - divide total monthly cost by number of beds to get cost per bed.',
      'Step 10: Set pricing with margin - add 30-50% profit margin above cost per bed to determine monthly rent charged to residents.'
    ]),
    '1-2 hours per property',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    NULL,
    '{"framework_name": "All-In Cost Analysis", "steps": ["Document base rent", "Estimate utilities", "Add internet/cable", "Calculate insurance", "Budget maintenance reserve", "Include property management", "Add supplies", "Calculate total monthly cost", "Divide by bed count", "Set pricing with margin"], "benefits": ["Accurate pricing", "Profitability assurance", "Budget planning", "Financial clarity", "Informed decisions"], "lynette_insight": "Calculate ALL costs before setting resident pricing - rent, utilities, internet, insurance, maintenance - then add profit margin"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T476: Assess Neighborhood
  (
    'T476',
    'Assess Neighborhood for Target Demographic',
    'Property Selection',
    2,
    'Research neighborhood safety, amenities, public transportation, medical facilities, grocery stores to ensure match with target resident population needs.',
    to_jsonb(ARRAY[
      'Step 1: Check crime statistics - visit CrimeReports.com, SpotCrime.com, or local police department website for neighborhood crime data.',
      'Step 2: Drive neighborhood at different times - visit morning, afternoon, evening to observe activity levels, safety perception, noise.',
      'Step 3: Map nearby amenities - identify grocery stores, pharmacies, medical clinics, parks, community centers within 1-2 mile radius.',
      'Step 4: Evaluate public transportation - check bus routes, frequency, proximity to stops if residents rely on public transit.',
      'Step 5: Research school quality - if area impacts property values and resident perception, check school ratings on GreatSchools.org.',
      'Step 6: Match demographics to pricing - higher-income neighborhoods support $2,000-$4,000/month pricing, lower-income areas $725-$1,500.',
      'Step 7: Verify medical access - especially critical for senior residents, confirm hospitals, urgent care, specialists within 15-30 minutes.',
      'Step 8: Check walkability - WalkScore.com rates neighborhood walkability, important if residents have limited mobility or no vehicles.',
      'Step 9: Talk to neighbors - knock on doors, introduce yourself (as potential renter), gauge neighborhood receptiveness to shared housing.',
      'Step 10: Trust your instinct - if neighborhood feels unsafe or unwelcoming during visits, likely not suitable for residents or staff.'
    ]),
    '2-3 hours per neighborhood',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'You wanna make sure that if you are look at the target that you are going to middle and upper middle class areas to start your business. For example, you will highly unlikely find people able to pay$4,000 a month in some low income areas. So you wanna make sure that if you are look at the target that you are going to middle and upper middle class areas.',
    '{"framework_name": "Neighborhood Assessment", "steps": ["Check crime statistics", "Drive at different times", "Map amenities", "Evaluate public transit", "Research school quality", "Match demographics to pricing", "Verify medical access", "Check walkability", "Talk to neighbors", "Trust instinct"], "benefits": ["Resident safety", "Appropriate pricing", "Resident satisfaction", "Lower turnover", "Community acceptance"], "lynette_insight": "Match neighborhood to pricing model - middle/upper-middle class areas support $3,500-$4,000 pricing, unlikely to find that market in low-income areas"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T477: Verify Fire Safety
  (
    'T477',
    'Verify Property Meets Fire Safety Requirements',
    'Property Selection',
    2,
    'Ensure property has working smoke detectors, carbon monoxide detectors, fire extinguishers, clear exit paths complying with local fire code.',
    to_jsonb(ARRAY[
      'Step 1: Test all smoke detectors - ensure smoke detector in every bedroom and hallway, test button functionality, verify manufactured within last 10 years.',
      'Step 2: Install if missing - add smoke detectors where needed ($15-$25 each), hardwired models preferred over battery-only.',
      'Step 3: Check carbon monoxide detectors - required near sleeping areas in homes with gas appliances or attached garages.',
      'Step 4: Provide fire extinguishers - place ABC-rated fire extinguisher in kitchen, near exits, instruct residents on use ($20-$50 each).',
      'Step 5: Verify exit paths - ensure two exits from every room (door and window), clear of obstructions, windows operable.',
      'Step 6: Check window egress - basement and second-floor bedroom windows must meet minimum size for emergency escape (typically 5.7 sq ft opening).',
      'Step 7: Inspect electrical system - look for overloaded outlets, frayed wires, proper grounding, circuit breaker panel accessible and labeled.',
      'Step 8: Review heating systems - ensure furnace, water heater, gas appliances inspected recently, vents clear, no gas leaks.',
      'Step 9: Create evacuation plan - develop fire evacuation plan with meeting point, post near exits, practice with residents during orientation.',
      'Step 10: Schedule annual inspection - maintain smoke detectors, extinguishers, and heating systems annually, document for liability protection.'
    ]),
    '2-3 hours',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    50.00,
    300.00,
    'one_time_fee',
    TRUE,
    NULL,
    '{"framework_name": "Fire Safety Compliance", "steps": ["Test smoke detectors", "Install if missing", "Check CO detectors", "Provide extinguishers", "Verify exit paths", "Check window egress", "Inspect electrical", "Review heating systems", "Create evacuation plan", "Schedule annual inspection"], "benefits": ["Resident safety", "Legal compliance", "Liability protection", "Peace of mind", "Insurance compliance"], "lynette_insight": "Fire safety critical - working smoke/CO detectors, extinguishers, clear exits prevent tragedies and legal liability"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T478: Document Property Condition
  (
    'T478',
    'Document Property Condition with Photos/Video',
    'Property Selection',
    2,
    'Take comprehensive photos and video of property condition at move-in to protect against false damage claims at lease end.',
    to_jsonb(ARRAY[
      'Step 1: Schedule move-in walkthrough - coordinate with landlord for joint walkthrough before moving furniture, ideally at key exchange.',
      'Step 2: Bring documentation tools - smartphone camera, tablet, or dedicated camera for photos/video, notepad for written notes.',
      'Step 3: Photograph every room - take wide-angle photos of each room from multiple angles showing overall condition.',
      'Step 4: Document all damage - photograph existing damage (holes, stains, scratches, cracks) with close-up and wide shots showing location.',
      'Step 5: Record video walkthrough - narrate video tour describing condition, existing damage, appliance functionality room by room.',
      'Step 6: Test all appliances - turn on stove, oven, dishwasher, washer, dryer, HVAC, document any issues on video.',
      'Step 7: Check all fixtures - run all faucets, flush toilets, test light switches and outlets, note any issues.',
      'Step 8: Document outdoor areas - photograph yard, driveway, exterior walls, roof (if visible), fencing, gate condition.',
      'Step 9: Share with landlord - email photos/video to landlord within 24 hours, request written acknowledgment of pre-existing damage.',
      'Step 10: Store securely - save photos/video to cloud storage (Google Drive, Dropbox) and external hard drive for entire lease term and 2 years after.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'Take comprehensive photos and video of property condition at move-in to protect against false damage claims at lease end.',
    '{"framework_name": "Move-In Documentation", "steps": ["Schedule walkthrough", "Bring tools", "Photograph every room", "Document all damage", "Record video tour", "Test appliances", "Check fixtures", "Document outdoor areas", "Share with landlord", "Store securely"], "benefits": ["Security deposit protection", "Dispute resolution", "Legal evidence", "Transparency", "Peace of mind"], "lynette_insight": "Photos and video at move-in protect you from false damage claims when lease ends - store for entire lease plus 2 years"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T479: Obtain Landlord Permission
  (
    'T479',
    'Obtain Landlord Permission for Business Use',
    'Property Selection',
    2,
    'Explicitly discuss and get written permission from landlord to operate shared housing business model in rental property before signing lease.',
    to_jsonb(ARRAY[
      'Step 1: Disclose business model upfront - never hide group home operation, explain shared housing concept before lease discussions.',
      'Step 2: Use positive terminology - describe as ''residential care home'', ''shared living'', ''boarding house'' rather than ''group home''.',
      'Step 3: Explain target demographics - clarify who you house (seniors, recovery, re-entry), emphasize screened, stable residents.',
      'Step 4: Address landlord concerns - preemptively answer questions about property damage, noise, neighborhood impact, liability.',
      'Step 5: Highlight financial benefits - show landlord earns above-market rent ($200-$500 more monthly), guaranteed payments from business.',
      'Step 6: Provide business credentials - share EIN, business registration, insurance certificate, bank account proof, previous landlord references.',
      'Step 7: Offer increased security deposit - consider offering 2-3 months deposit instead of standard 1 month for landlord comfort.',
      'Step 8: Request written subletting clause - lease must explicitly state ''Tenant permitted to sublet rooms for residential purposes'' or similar language.',
      'Step 9: Include business addendum - add addendum to lease specifying business operation permitted, outlining resident screening, house rules.',
      'Step 10: Never proceed without permission - operating without explicit permission risks lease termination, eviction, lawsuit, loss of deposits and investment.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    NULL,
    '{"framework_name": "Landlord Permission Process", "steps": ["Disclose upfront", "Use positive terminology", "Explain demographics", "Address concerns", "Highlight financial benefits", "Provide credentials", "Offer increased deposit", "Request written subletting", "Include business addendum", "Never proceed without permission"], "benefits": ["Legal protection", "Avoid eviction", "Landlord partnership", "Clear expectations", "Business sustainability"], "lynette_insight": "NEVER hide group home operation from landlord - get explicit written permission in lease for subletting or risk eviction and loss of investment"}'::JSONB,
    'Module 2: Property Selection',
    'cashflow_course'
  ),

  -- T480: Research Multiple Properties
  (
    'T480',
    'Research Multiple Properties Before Committing',
    'Property Selection',
    2,
    'View and evaluate at least 3-5 properties comparing location, price, condition, landlord responsiveness before making final rental decision.',
    to_jsonb(ARRAY[
      'Step 1: Set evaluation criteria - create checklist of must-haves (bedroom/bath count, price range, location) and nice-to-haves (garage, yard, appliances).',
      'Step 2: Schedule multiple showings - view 3-5 properties before making decision, resist pressure to commit to first property.',
      'Step 3: Create comparison spreadsheet - track address, rent, bedrooms, bathrooms, square footage, parking, pros/cons for each property.',
      'Step 4: Compare all-in costs - calculate total monthly cost (rent + utilities + insurance + maintenance) for each property.',
      'Step 5: Calculate revenue potential - based on bedroom count and neighborhood, project monthly revenue per property.',
      'Step 6: Evaluate landlord responsiveness - note how quickly landlord responds to showing request, questions, concerns (indicator of future responsiveness).',
      'Step 7: Research landlord reputation - search landlord name online, check court records for lawsuits, ask for references from current tenants.',
      'Step 8: Visit neighborhoods multiple times - see each area at different times of day, different days of week before deciding.',
      'Step 9: Run financial analysis - create pro forma for each property showing projected monthly/annual profit based on costs and revenue.',
      'Step 10: Make informed decision - select property with best combination of location, cost, condition, landlord quality, profit potential.'
    ]),
    '1-2 weeks',
    ARRAY['rental_arbitrage', 'property_purchase']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    NULL,
    '{"framework_name": "Property Comparison Analysis", "steps": ["Set evaluation criteria", "Schedule multiple showings", "Create comparison spreadsheet", "Compare all-in costs", "Calculate revenue potential", "Evaluate landlord responsiveness", "Research landlord reputation", "Visit neighborhoods repeatedly", "Run financial analysis", "Make informed decision"], "benefits": ["Better negotiating position", "Optimal property selection", "Informed decision", "Risk reduction", "Maximized profitability"], "lynette_insight": "View 3-5 properties minimum before committing - comparison shopping gives negotiating leverage and ensures best property for business model"}'::JSONB,
    'Module 2: Property Selection',
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
  AND tactic_id >= 'T461' AND tactic_id <= 'T480';

  RAISE NOTICE '✓ Inserted/updated % cashflow course tactics (T461-T480)', inserted_count;
END $$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
╔══════════════════════════════════════════════════════════╗
║   CASHFLOW COURSE TACTICS - T461-T480                   ║
║   Property Selection & Acquisition: 20 tactics           ║
║   Categories: Property Sourcing, Evaluation, Negotiation ║
╚══════════════════════════════════════════════════════════╝
  ';
END $$;
