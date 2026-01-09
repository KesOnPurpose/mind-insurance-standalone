-- Migration: Insert Nette's Mentorship Lessons 4, 5, 6 Tactics (M027-M048)
-- Created: 2025-12-09
-- Description: Adds 22 new mentorship tactics for Lessons 4-6 based on RAG content

-- ============================================================================
-- LESSON 4: Risk Mitigation Strategies (M027-M034)
-- Theme: Indigo/Violet | Icon: ShieldAlert | Source: Google Doc 1JwCqF0...
-- ============================================================================

INSERT INTO gh_tactic_instructions (
  tactic_id, tactic_name, category, week_assignment,
  why_it_matters, step_by_step, lynettes_tip, common_mistakes, success_criteria,
  estimated_time, is_critical_path, cost_min_usd, cost_max_usd, cost_category,
  duration_minutes_optimistic, duration_minutes_realistic, duration_minutes_pessimistic,
  is_mentorship_tactic, mentorship_week, mentorship_category, tactic_source,
  course_lesson_reference, official_lynette_quote, optimal_energy, best_time_of_day,
  tactic_type, requires_focus, can_be_interrupted, requires_tools, mood_required,
  experience_level, priority_tier
) VALUES
-- M027: Understanding the Four Liability Areas
(
  'M027', 'Understanding the Four Liability Areas', 'Operations', 4,
  'Protecting your business starts with understanding where risk lives. The four liability areas—House/Car (Insurance), Financial (Income Verification), Staffing (Background Checks), and Behavior (Incident Reports)—are the foundation of risk management. Master these and you sleep better at night.',
  '["1. STUDY: Learn the four liability areas framework from Lesson 4", "2. HOUSE/CAR: Verify your insurance covers group home business activities", "3. FINANCIAL: Document your income verification process for residents", "4. STAFFING: Create background check requirements for any staff/caregivers", "5. BEHAVIOR: Set up incident report system for resident behaviors", "6. PRACTICE: Walk through a scenario for each liability area", "7. DOCUMENT: Create a one-page liability protection checklist"]'::jsonb,
  'You need to know where your vulnerabilities are BEFORE something happens. Insurance protects the house and car. Income verification protects your finances. Background checks protect you from negligent hiring. Incident reports protect you from behavior claims.',
  ARRAY['Assuming homeowners insurance covers business activities', 'Not verifying income before move-in', 'Skipping background checks for caregivers'],
  'You understand all four liability areas and have basic protections in place for each.',
  '45 minutes',
  true, 0, 0, 'one_time_fee',
  30, 45, 90,
  true, 4, 'Risk Foundation', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'You need to know where your vulnerabilities are BEFORE something happens.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer', 'notebook'], 'any',
  'beginner', 1
),

-- M028: Essential Documentation Systems
(
  'M028', 'Essential Documentation Systems', 'Operations', 4,
  'Documentation is your legal shield. Move-in/move-out inspections, inventory forms, and photo protocols protect you from disputes and lawsuits. When a resident says "that wasn''t like that when I moved in," you need proof.',
  '["1. CREATE: Move-in inspection checklist (every room, every surface)", "2. CREATE: Move-out inspection checklist (matching move-in)", "3. SETUP: Photo protocol - date-stamped photos of property condition", "4. CREATE: Personal property inventory form for residents", "5. ESTABLISH: Digital storage system for all documentation (Google Drive, Dropbox)", "6. TEMPLATE: Create standard forms you can reuse for every resident", "7. PRACTICE: Do a mock move-in inspection on your current property"]'::jsonb,
  'Take photos of EVERYTHING during move-in. The ceiling, the floors, inside cabinets—everything. When they move out, you have proof of the condition. This saves you from security deposit disputes and damage claims.',
  ARRAY['Not taking enough photos', 'Forgetting to date-stamp documentation', 'Not having residents sign inspection forms'],
  'You have complete move-in/move-out documentation templates and a photo protocol established.',
  '1-2 hours',
  true, 0, 50, 'one_time_fee',
  60, 90, 180,
  true, 4, 'Documentation', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'Take photos of EVERYTHING during move-in. The ceiling, the floors, inside cabinets—everything.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer', 'smartphone'], 'any',
  'beginner', 1
),

-- M029: Creating Your Policies & Procedures Manual
(
  'M029', 'Creating Your Policies & Procedures Manual', 'Operations', 4,
  'A policies and procedures manual isn''t just documentation—it''s your business bible. It shows professionalism to referral sources, protects you legally, and ensures consistency in how you run your home. Agencies want to see this.',
  '["1. OUTLINE: List all operational areas needing policies", "2. DRAFT: House rules and resident expectations", "3. DRAFT: Medication management procedures (if applicable)", "4. DRAFT: Emergency procedures (fire, medical, natural disaster)", "5. DRAFT: Visitor policy and quiet hours", "6. DRAFT: Discharge and eviction procedures", "7. DRAFT: Staff responsibilities (if you have caregivers)", "8. COMPILE: Combine into professional-looking manual", "9. REVIEW: Have mentor or attorney review critical policies"]'::jsonb,
  'When referral sources visit, they want to see your policies and procedures manual. It shows you run a professional operation, not just a house with people in it. This is what separates serious operators from hobbyists.',
  ARRAY['Making policies too vague', 'Not including emergency procedures', 'Forgetting to update policies as rules change'],
  'You have a comprehensive policies and procedures manual ready to show referral sources.',
  '3-5 hours',
  true, 50, 200, 'one_time_fee',
  120, 240, 480,
  true, 4, 'Documentation', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'When referral sources visit, they want to see your policies and procedures manual. It shows you run a professional operation.',
  ARRAY['focused'], ARRAY['morning'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M030: Camera & Surveillance Setup
(
  'M030', 'Camera & Surveillance Setup', 'Operations', 4,
  'Cameras protect everyone—you, your residents, and your property. They deter theft, document incidents, and provide evidence when disputes arise. Strategic placement is key: entrances, common areas, but NEVER private spaces.',
  '["1. RESEARCH: Review state laws on surveillance in residential settings", "2. PLAN: Identify camera placement locations (entrances, common areas)", "3. PURCHASE: Buy quality cameras with cloud storage capability", "4. INSTALL: Set up cameras at all entry/exit points minimum", "5. CONFIGURE: Set up motion detection and cloud storage", "6. DOCUMENT: Create written disclosure for residents about cameras", "7. MAINTAIN: Schedule monthly camera system checks", "8. POLICY: Establish footage retention policy (30-90 days recommended)"]'::jsonb,
  'Cameras at every entrance, never in bedrooms or bathrooms. Make sure residents know about cameras before move-in—put it in writing. Footage has saved me multiple times from false accusations.',
  ARRAY['Putting cameras in private areas', 'Not disclosing cameras to residents', 'Cheap cameras with no cloud backup'],
  'Cameras installed at all entrances with cloud storage and resident disclosure signed.',
  '2-4 hours',
  false, 100, 500, 'one_time_fee',
  90, 180, 300,
  true, 4, 'Risk Prevention', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'Cameras at every entrance, never in bedrooms or bathrooms. Footage has saved me multiple times from false accusations.',
  ARRAY['any'], ARRAY['any'],
  'general', false, true, ARRAY['tools'], 'any',
  'beginner', 2
),

-- M031: Written Warning & Discharge Protocols
(
  'M031', 'Written Warning & Discharge Protocols', 'Operations', 4,
  'You need a clear escalation path for resident issues: verbal warning → first written warning → second written warning → 30-day discharge notice. Without this paper trail, you have no legal protection when you need to remove a resident.',
  '["1. CREATE: Verbal warning documentation template", "2. CREATE: First written warning template", "3. CREATE: Second written warning template", "4. CREATE: 30-day discharge notice template", "5. ESTABLISH: Clear criteria for each warning level", "6. DOCUMENT: Process for delivering and storing warnings", "7. REVIEW: Have attorney review discharge notice for compliance", "8. PRACTICE: Role-play delivering a written warning professionally"]'::jsonb,
  'The escalation is: verbal, first written, second written, 30-day notice. Every step must be documented. When you hand them a written warning, have them sign it acknowledging receipt—even if they disagree with it.',
  ARRAY['Skipping warning steps', 'Not getting signatures on warnings', 'Verbal warnings without documentation'],
  'Complete warning and discharge template system with clear escalation criteria.',
  '1-2 hours',
  true, 0, 0, 'one_time_fee',
  45, 90, 180,
  true, 4, 'Risk Prevention', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'The escalation is: verbal, first written, second written, 30-day notice. Every step must be documented.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M032: Red Flag Recognition & Response
(
  'M032', 'Red Flag Recognition & Response', 'Operations', 4,
  'Knowing red flags before they become problems saves you time, money, and legal headaches. Financial manipulation, property damage patterns, and resident conflicts all have warning signs. Learn to spot them early.',
  '["1. STUDY: Learn the common red flag categories from Lesson 4", "2. IDENTIFY: Financial manipulation warning signs", "3. IDENTIFY: Property damage escalation patterns", "4. IDENTIFY: Resident conflict early indicators", "5. IDENTIFY: Substance abuse relapse signs", "6. CREATE: Response protocol for each red flag type", "7. DOCUMENT: Red flag observation log template", "8. PRACTICE: Review past situations through red flag lens"]'::jsonb,
  'Red flags don''t appear overnight—they escalate. A resident borrowing $5 becomes borrowing $50 becomes not paying rent. Watch for patterns: isolation, mood changes, disappearing money, new "friends" visiting frequently.',
  ARRAY['Ignoring early warning signs', 'Hoping problems will resolve themselves', 'Not documenting concerning behaviors'],
  'You can identify and respond to common red flags before they become major issues.',
  '45 minutes',
  true, 0, 0, 'one_time_fee',
  30, 45, 90,
  true, 4, 'Risk Assessment', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'Red flags don''t appear overnight—they escalate. Watch for patterns.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['notebook'], 'any',
  'beginner', 1
),

-- M033: Incident Reporting & CYA Documentation
(
  'M033', 'Incident Reporting & CYA Documentation', 'Operations', 4,
  'CYA—Cover Your Ass—documentation is non-negotiable. Every incident, no matter how small, gets documented: who, what, when, where, why, how. This paper trail is your protection when situations escalate.',
  '["1. CREATE: Incident report template (who, what, when, where, why, how)", "2. ESTABLISH: Timeline requirements (document within 24 hours)", "3. SETUP: Digital and physical filing system for incident reports", "4. TRAIN: Anyone in your home on how to complete incident reports", "5. PRACTICE: Document a practice incident using your template", "6. REVIEW: Monthly review of incident reports for patterns", "7. ARCHIVE: Long-term storage system (keep records 7+ years)"]'::jsonb,
  'When something happens, write it down immediately. Who was involved, what happened, when did it happen, where, why do you think it happened, and how was it resolved. This report could be your only evidence years later.',
  ARRAY['Waiting too long to document', 'Being vague in descriptions', 'Not keeping copies of all reports'],
  'You have an incident reporting system in place and have practiced using it.',
  '1 hour',
  true, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 4, 'Documentation', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'When something happens, write it down immediately. This report could be your only evidence years later.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M034: Lesson 4 Master Checklist & Accountability (AGGREGATOR)
(
  'M034', 'Lesson 4 Action Checklist & Accountability', 'Operations', 4,
  'This checklist ensures you''ve built your risk mitigation foundation BEFORE problems arise. Complete all M027-M033 tactics plus this accountability checklist to master Lesson 4 and protect your business.',
  '["1. REQUIRED: Watch Lesson 4 completely - take notes on risk areas", "2. REQUIRED: Complete the Four Liability Areas assessment (M027)", "3. REQUIRED: Create move-in/move-out documentation system (M028)", "4. REQUIRED: Draft your Policies & Procedures Manual (M029)", "5. OPTIONAL: Set up camera surveillance system (M030)", "6. REQUIRED: Create written warning templates (M031)", "7. REQUIRED: Document red flag recognition protocols (M032)", "8. REQUIRED: Set up incident reporting system (M033)", "9. ACCOUNTABILITY: Post in Skool - Risk Mitigation Complete", "10. DEADLINE: Complete required items within 7 days before moving to Lesson 5"]'::jsonb,
  'Risk mitigation isn''t optional—it''s how you stay in business long-term. Every successful operator I know has these systems in place. The ones who don''t? They learn the hard way with lawsuits and lost residents.',
  NULL,
  NULL,
  'Varies (aggregate of other tactics)',
  true, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 4, 'Risk Management', 'mentorship',
  'Lesson 4 - Risk Mitigation Strategies', 'Risk mitigation isn''t optional—it''s how you stay in business long-term.',
  ARRAY['any'], ARRAY['any'],
  'general', false, true, ARRAY['computer'], 'any',
  'beginner', 1
),

-- ============================================================================
-- LESSON 5: Property Selection (M035-M041)
-- Theme: Rose/Pink | Icon: Home | Source: Google Doc 14UY1ji...
-- ============================================================================

-- M035: Own vs. Rent Decision Framework
(
  'M035', 'Own vs. Rent Decision Framework', 'Property', 5,
  'The own vs. rent decision shapes your entire business model. Rental arbitrage gets you started faster with less capital ($7k-$15k), while ownership builds long-term wealth but requires more upfront ($40k+). Both work—choose based on YOUR situation.',
  '["1. ASSESS: Calculate your available startup capital", "2. COMPARE: Rental arbitrage pros (low capital, flexibility, fast start)", "3. COMPARE: Rental arbitrage cons (landlord risk, no equity, rent increases)", "4. COMPARE: Ownership pros (equity building, control, stability)", "5. COMPARE: Ownership cons (high capital, maintenance responsibility)", "6. ANALYZE: Your local market rental vs purchase prices", "7. DECIDE: Choose your model based on capital and goals", "8. DOCUMENT: Write your decision and reasoning"]'::jsonb,
  'Don''t let lack of capital stop you. Rental arbitrage is how most of us started. You can always buy later when you have more capital from operating. The key is getting started.',
  ARRAY['Waiting until you can afford to buy', 'Not calculating true arbitrage costs', 'Ignoring landlord relationship risks'],
  'Clear decision documented on own vs rent with supporting reasoning.',
  '1-2 hours',
  true, 0, 0, 'one_time_fee',
  45, 90, 180,
  true, 5, 'Property Acquisition', 'mentorship',
  'Lesson 5 - Property Selection', 'Don''t let lack of capital stop you. Rental arbitrage is how most of us started.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer', 'calculator'], 'any',
  'beginner', 1
),

-- M036: Ideal Property Features Checklist
(
  'M036', 'Ideal Property Features Checklist', 'Property', 5,
  'Not every property works for a group home. You need specific features: single-story preferred, 3-5 bedrooms, open common areas, adequate bathrooms, and ADA accessibility potential. Create your must-have checklist before property hunting.',
  '["1. PRIORITIZE: Single-story properties (mobility, safety, ease)", "2. DETERMINE: Bedroom count needed (3-5 beds typical for unlicensed)", "3. ASSESS: Bathroom ratio requirements (1:3 residents minimum)", "4. EVALUATE: Common area space for living room, dining, activities", "5. CHECK: Kitchen size for meal prep for multiple residents", "6. CONSIDER: ADA accessibility features or modification potential", "7. VERIFY: Parking for staff, visitors, residents if applicable", "8. CREATE: Your personalized property must-have checklist"]'::jsonb,
  'Single-story is king. You don''t want to deal with residents on stairs, and it''s easier for mobility issues. Open floor plans work better for supervision. Three to five bedrooms is the sweet spot for unlicensed homes.',
  ARRAY['Choosing properties with too many stairs', 'Inadequate bathroom count', 'Kitchens too small for meal prep'],
  'Written property features checklist with prioritized requirements.',
  '45 minutes',
  true, 0, 0, 'one_time_fee',
  30, 45, 90,
  true, 5, 'Property Selection', 'mentorship',
  'Lesson 5 - Property Selection', 'Single-story is king. Three to five bedrooms is the sweet spot for unlicensed homes.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['notebook'], 'any',
  'beginner', 1
),

-- M037: Occupancy Rules & Local Requirements
(
  'M037', 'Occupancy Rules & Local Requirements', 'Property', 5,
  'Every city has occupancy rules. The standard is 2 persons per bedroom plus 2 (so a 4-bedroom = 10 people max). Research your specific area''s zoning, HOA restrictions, and fair housing exemptions before committing to a property.',
  '["1. RESEARCH: Your city/county occupancy limits", "2. CALCULATE: Using 2 per bedroom + 2 formula", "3. CHECK: Zoning regulations for your target areas", "4. VERIFY: HOA restrictions if applicable", "5. UNDERSTAND: Fair Housing Act family status protections", "6. DOCUMENT: Local requirements for your reference", "7. CONSULT: Local housing authority if unclear", "8. MAP: Target areas that meet all requirements"]'::jsonb,
  'The formula is usually 2 persons per bedroom plus 2. So a 4-bedroom house can have 10 people legally. But check YOUR city—some are stricter. And remember, HOAs cannot discriminate against group homes under Fair Housing.',
  ARRAY['Assuming all areas have same rules', 'Not checking HOA restrictions', 'Overlooking zoning requirements'],
  'Documented local occupancy rules and list of compliant target areas.',
  '1-2 hours',
  true, 0, 100, 'one_time_fee',
  45, 90, 180,
  true, 5, 'Compliance', 'mentorship',
  'Lesson 5 - Property Selection', 'The formula is usually 2 persons per bedroom plus 2. Check YOUR city—some are stricter.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M038: Landlord Pitching Scripts & Strategies
(
  'M038', 'Landlord Pitching Scripts & Strategies', 'Property', 5,
  'Getting a landlord to say yes to a group home requires the right pitch. Emphasize stability, guaranteed rent, property care, and your professional operation. Most landlords fear damage and non-payment—address those fears directly.',
  '["1. PREPARE: Your professional introduction script", "2. HIGHLIGHT: Income stability (SSI/SSDI is guaranteed)", "3. EMPHASIZE: Property care and maintenance commitment", "4. OFFER: Higher security deposit if needed", "5. SHOW: Your policies and procedures manual", "6. PROVIDE: References from other landlords or professionals", "7. PRACTICE: Role-play your pitch until smooth", "8. FOLLOW UP: Professional thank-you after meetings"]'::jsonb,
  'Lead with stability: "My residents have guaranteed income from Social Security that deposits directly. They''re not going anywhere because they have stable housing they love." Landlords want reliable tenants—that''s us.',
  ARRAY['Being vague about business use', 'Not addressing landlord concerns upfront', 'Unprofessional presentation'],
  'Polished landlord pitch script practiced and ready to deliver confidently.',
  '1 hour',
  true, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 5, 'Negotiation', 'mentorship',
  'Lesson 5 - Property Selection', 'Lead with stability: My residents have guaranteed income from Social Security. Landlords want reliable tenants—that''s us.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['notebook'], 'any',
  'beginner', 1
),

-- M039: Fair Housing Defense Preparation
(
  'M039', 'Fair Housing Defense Preparation', 'Property', 5,
  'The Fair Housing Act protects group homes from discrimination. Familial status protections mean landlords and HOAs cannot treat group homes differently than families. Know your rights and prepare responses for common pushback.',
  '["1. STUDY: Fair Housing Act protections for group homes", "2. LEARN: Familial status protection details", "3. RESEARCH: Reasonable accommodation requirements", "4. DOCUMENT: Past fair housing cases in your area", "5. PREPARE: Response scripts for common objections", "6. IDENTIFY: Local fair housing enforcement agency", "7. CONSULT: Fair housing attorney for complex situations", "8. CREATE: File of fair housing resources and contacts"]'::jsonb,
  'When someone says you can''t have a group home in their neighborhood, that''s often discrimination. Group homes are protected under familial status. Know your rights—most landlords and HOAs back down when you cite the Fair Housing Act.',
  ARRAY['Not knowing your legal protections', 'Getting emotional instead of factual', 'Not documenting discriminatory statements'],
  'Understanding of Fair Housing protections with prepared responses for objections.',
  '1-2 hours',
  true, 0, 500, 'one_time_fee',
  45, 90, 180,
  true, 5, 'Compliance', 'mentorship',
  'Lesson 5 - Property Selection', 'Group homes are protected under familial status. Know your rights—most landlords and HOAs back down when you cite the Fair Housing Act.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M040: Property Modification Planning
(
  'M040', 'Property Modification Planning', 'Property', 5,
  'Most properties need some modifications for group home use: grab bars, ramps, fire safety equipment, bedroom door locks. Plan and budget these before move-in. Some modifications are landlord responsibilities, others are yours.',
  '["1. ASSESS: Property modification needs walkthrough", "2. PRIORITIZE: Safety modifications (smoke detectors, fire extinguishers)", "3. PLAN: Accessibility modifications (grab bars, ramps if needed)", "4. BUDGET: Cost estimates for each modification", "5. NEGOTIATE: Which modifications landlord will cover", "6. SCHEDULE: Modification timeline before resident move-in", "7. DOCUMENT: Before/after photos of all modifications", "8. VERIFY: All modifications meet local codes"]'::jsonb,
  'Grab bars in bathrooms are cheap and prevent falls. Fire extinguishers on every floor. Good lighting everywhere. These modifications cost hundreds but prevent thousands in liability.',
  ARRAY['Skipping safety modifications', 'Not budgeting for modifications', 'Making modifications without landlord approval'],
  'Property modification plan with budget and timeline established.',
  '2-3 hours',
  false, 500, 2000, 'one_time_fee',
  90, 150, 300,
  true, 5, 'Property Setup', 'mentorship',
  'Lesson 5 - Property Selection', 'Grab bars in bathrooms are cheap and prevent falls. These modifications cost hundreds but prevent thousands in liability.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['measuring tape', 'notebook'], 'any',
  'beginner', 2
),

-- M041: Lesson 5 Master Checklist & Accountability (AGGREGATOR)
(
  'M041', 'Lesson 5 Action Checklist & Accountability', 'Property', 5,
  'This checklist ensures you''ve completed your property selection foundation. Complete all M035-M040 tactics plus this accountability checklist to master Lesson 5 and find your perfect property.',
  '["1. REQUIRED: Watch Lesson 5 completely - take notes on property strategy", "2. REQUIRED: Complete own vs rent decision framework (M035)", "3. REQUIRED: Create your property features checklist (M036)", "4. REQUIRED: Document local occupancy rules (M037)", "5. REQUIRED: Practice your landlord pitch script (M038)", "6. REQUIRED: Study Fair Housing protections (M039)", "7. OPTIONAL: Plan property modifications (M040)", "8. ACCOUNTABILITY: Post in Skool - Property Strategy Complete", "9. DEADLINE: Complete required items within 7 days before moving to Lesson 6"]'::jsonb,
  'Finding the right property is half the battle. Don''t rush this—a bad property choice haunts you for years. Take time to find something that checks all your boxes.',
  NULL,
  NULL,
  'Varies (aggregate of other tactics)',
  true, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 5, 'Property Strategy', 'mentorship',
  'Lesson 5 - Property Selection', 'Finding the right property is half the battle. Don''t rush this—a bad property choice haunts you for years.',
  ARRAY['any'], ARRAY['any'],
  'general', false, true, ARRAY['computer'], 'any',
  'beginner', 1
),

-- ============================================================================
-- LESSON 6: Resident Assessments (M042-M048)
-- Theme: Amber/Orange | Icon: UserCheck | Source: Google Doc 1oCpmYg...
-- ============================================================================

-- M042: Phone Screening Protocols
(
  'M042', 'Phone Screening Protocols', 'Intake', 6,
  'The phone screening is your first filter. It saves you time by weeding out bad fits before in-person meetings. Have a structured script that covers needs assessment, compatibility, and red flag detection in 10-15 minutes.',
  '["1. CREATE: Phone screening script with key questions", "2. ASK: About their current living situation", "3. ASK: Income source and amount (SSI/SSDI verification)", "4. ASK: Reason for needing new housing", "5. ASK: Any special needs or accommodations required", "6. LISTEN: For red flags in tone, story consistency", "7. EXPLAIN: Your house rules and expectations briefly", "8. SCHEDULE: In-person visit if they pass phone screen"]'::jsonb,
  'You can tell a lot from a phone call. Are they coherent? Do their answers make sense? Is someone coaching them in the background? Trust your gut—if something feels off on the phone, it''ll be worse in person.',
  ARRAY['Skipping phone screen to fill beds faster', 'Not asking about income', 'Ignoring red flags to fill vacancies'],
  'Phone screening script created and practiced with call evaluation criteria.',
  '30-45 minutes',
  true, 0, 0, 'one_time_fee',
  20, 35, 60,
  true, 6, 'Initial Screening', 'mentorship',
  'Lesson 6 - Resident Assessments', 'You can tell a lot from a phone call. Trust your gut—if something feels off on the phone, it''ll be worse in person.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['phone', 'notebook'], 'any',
  'beginner', 1
),

-- M043: Documentation Review Process
(
  'M043', 'Documentation Review Process', 'Intake', 6,
  'Before anyone moves in, you need to verify their documentation: ID, income statements, benefit award letters, medical records if relevant, and references. This verification protects you from fraud and ensures you can actually get paid.',
  '["1. CREATE: Required documents checklist", "2. REQUIRE: Government-issued ID (driver''s license, state ID)", "3. REQUIRE: Income verification (SSI/SSDI award letter, pay stubs)", "4. REQUIRE: Proof of income deposit (bank statement showing deposits)", "5. REQUEST: Previous landlord/facility references", "6. OPTIONAL: Medical records for care planning", "7. VERIFY: All documents are current and authentic", "8. FILE: Copies of all verified documents securely"]'::jsonb,
  'Get the award letter showing their monthly amount. Then get a bank statement showing it actually deposits. I''ve had people show fake award letters—the bank statement is the proof. No verification, no move-in.',
  ARRAY['Accepting verbal claims without documentation', 'Not verifying documents are current', 'Skipping reference checks'],
  'Documentation checklist created with verification process established.',
  '30-45 minutes',
  true, 0, 0, 'one_time_fee',
  20, 35, 60,
  true, 6, 'Verification', 'mentorship',
  'Lesson 6 - Resident Assessments', 'Get the award letter showing their monthly amount. Then get a bank statement showing it actually deposits. No verification, no move-in.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer'], 'any',
  'beginner', 1
),

-- M044: In-Person Assessment Techniques
(
  'M044', 'In-Person Assessment Techniques', 'Intake', 6,
  'The in-person assessment is where you evaluate fit. Give a property tour, observe their behavior and interactions, conduct a structured interview, and assess compatibility with existing residents. First impressions matter—both ways.',
  '["1. PREPARE: Property for professional showing", "2. GREET: Professional welcome, explain assessment process", "3. TOUR: Walk through entire property explaining features", "4. OBSERVE: Behavior, hygiene, communication style", "5. INTERVIEW: Ask about daily routines, preferences, goals", "6. INTRODUCE: To current residents if possible", "7. EXPLAIN: House rules, expectations, and rent details", "8. ASSESS: Overall compatibility with your home environment"]'::jsonb,
  'Watch how they interact with the space. Do they seem comfortable? How do they react to other residents? Are they asking good questions? A resident who doesn''t ask questions might not care about the rules.',
  ARRAY['Rushing the assessment', 'Not involving current residents', 'Ignoring hygiene or behavior issues'],
  'In-person assessment process documented with evaluation criteria.',
  '1 hour per assessment',
  true, 0, 0, 'one_time_fee',
  45, 60, 90,
  true, 6, 'Assessment', 'mentorship',
  'Lesson 6 - Resident Assessments', 'Watch how they interact with the space. A resident who doesn''t ask questions might not care about the rules.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['assessment forms'], 'any',
  'beginner', 1
),

-- M045: Income & Benefit Verification
(
  'M045', 'Income & Benefit Verification', 'Intake', 6,
  'Income verification is non-negotiable. You need to confirm SSI/SSDI amounts, understand payee arrangements, and verify income stability. If someone can''t prove their income, they can''t pay rent—period.',
  '["1. REQUEST: Social Security award letter (shows monthly amount)", "2. REQUEST: Bank statements showing deposits", "3. UNDERSTAND: Payee arrangements if applicable", "4. VERIFY: Amounts match what they stated", "5. CALCULATE: Can they afford rent plus personal needs?", "6. DOCUMENT: All income verification in resident file", "7. ESTABLISH: Direct deposit arrangements if possible", "8. FLAG: Any income that seems unstable"]'::jsonb,
  'SSI is currently around $943, SSDI varies based on work history. Know what you''re looking at. If they say they get $1,500 in SSI, they''re either wrong or lying—that''s above the max. Verify everything.',
  ARRAY['Accepting verbal income claims', 'Not understanding SSI vs SSDI differences', 'Not calculating affordability'],
  'Income verification process with payee understanding documented.',
  '30 minutes per verification',
  true, 0, 0, 'one_time_fee',
  15, 30, 60,
  true, 6, 'Financial', 'mentorship',
  'Lesson 6 - Resident Assessments', 'SSI is currently around $943. If they say they get $1,500 in SSI, they''re either wrong or lying. Verify everything.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['computer', 'calculator'], 'any',
  'beginner', 1
),

-- M046: The 24-Hour Trial Period
(
  'M046', 'The 24-Hour Trial Period', 'Intake', 6,
  'A 24-hour trial stay is like a test drive before buying the car. Both you and the potential resident get to see if it''s a good fit without full commitment. It reveals issues that don''t show up in interviews.',
  '["1. EXPLAIN: Trial period concept and expectations", "2. SCHEDULE: 24-hour stay (or weekend if possible)", "3. PREPARE: Room and necessities for trial", "4. OBSERVE: How they interact with current residents", "5. OBSERVE: Daily living skills (hygiene, meal behavior)", "6. DOCUMENT: Any concerns during trial period", "7. DEBRIEF: With current residents about impressions", "8. DECIDE: Move forward or decline after trial"]'::jsonb,
  'The 24-hour trial reveals everything. How do they act at night? In the morning? During meals? Do the other residents like them? This trial has saved me from bad placements more times than I can count.',
  ARRAY['Skipping trial to fill beds faster', 'Not observing closely during trial', 'Ignoring resident feedback'],
  '24-hour trial protocol established with observation checklist.',
  '24+ hours',
  false, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 6, 'Evaluation', 'mentorship',
  'Lesson 6 - Resident Assessments', 'The 24-hour trial reveals everything. This trial has saved me from bad placements more times than I can count.',
  ARRAY['any'], ARRAY['any'],
  'general', false, true, ARRAY['observation forms'], 'any',
  'beginner', 2
),

-- M047: Red Flag Recognition in Residents
(
  'M047', 'Red Flag Recognition in Residents', 'Intake', 6,
  'Some red flags are immediate disqualifiers: aggression history, active substance abuse, eviction patterns. Others are yellow flags requiring extra consideration. Learn to distinguish between manageable issues and deal-breakers.',
  '["1. IDENTIFY: Immediate disqualifier red flags", "2. IDENTIFY: Yellow flags requiring consideration", "3. ASK: About eviction history directly", "4. ASK: About criminal background honestly", "5. ASK: About substance use history", "6. VERIFY: Stories are consistent across sources", "7. CHECK: References for honesty about issues", "8. TRUST: Your gut instinct on major concerns"]'::jsonb,
  'Red flags: recent violence, active addiction, multiple evictions, sexual offense history. Yellow flags: old criminal history, past addiction with recovery, one eviction with explanation. Know the difference—red means stop, yellow means proceed with caution.',
  ARRAY['Ignoring red flags to fill beds', 'Not asking hard questions', 'Believing everything without verification'],
  'Red flag and yellow flag lists created with decision criteria.',
  '30 minutes',
  true, 0, 0, 'one_time_fee',
  20, 30, 60,
  true, 6, 'Risk Assessment', 'mentorship',
  'Lesson 6 - Resident Assessments', 'Red means stop, yellow means proceed with caution. Know the difference.',
  ARRAY['focused'], ARRAY['morning', 'afternoon'],
  'general', true, false, ARRAY['notebook'], 'any',
  'beginner', 1
),

-- M048: Lesson 6 Master Checklist & Accountability (AGGREGATOR)
(
  'M048', 'Lesson 6 Action Checklist & Accountability', 'Intake', 6,
  'This checklist ensures you''ve built your resident assessment foundation. Complete all M042-M047 tactics plus this accountability checklist to master Lesson 6 and fill your beds with quality residents.',
  '["1. REQUIRED: Watch Lesson 6 completely - take notes on assessment process", "2. REQUIRED: Create phone screening script (M042)", "3. REQUIRED: Build documentation checklist (M043)", "4. REQUIRED: Develop in-person assessment process (M044)", "5. REQUIRED: Establish income verification protocol (M045)", "6. OPTIONAL: Implement 24-hour trial period (M046)", "7. REQUIRED: Document red flag recognition criteria (M047)", "8. ACCOUNTABILITY: Post in Skool - Resident Assessment Complete", "9. DEADLINE: Complete required items within 7 days"]'::jsonb,
  'Quality residents are everything. One bad placement can ruin your other residents'' experience and cost you thousands. Take the time to screen properly—your future self will thank you.',
  NULL,
  NULL,
  'Varies (aggregate of other tactics)',
  true, 0, 0, 'one_time_fee',
  30, 60, 120,
  true, 6, 'Resident Screening', 'mentorship',
  'Lesson 6 - Resident Assessments', 'Quality residents are everything. One bad placement can ruin your other residents'' experience and cost you thousands.',
  ARRAY['any'], ARRAY['any'],
  'general', false, true, ARRAY['computer'], 'any',
  'beginner', 1
);

-- Verify insertion
SELECT tactic_id, tactic_name, mentorship_week, mentorship_category
FROM gh_tactic_instructions
WHERE tactic_id LIKE 'M0%' AND mentorship_week >= 4
ORDER BY tactic_id;
