-- Migration: Populate cashflow course tactics (Phase 2 - Corrected Schema)
-- Date: 2025-12-02
-- Purpose: Insert tactics T439-T441 from Group Home Cash Flow Course by Lynette Wheaton
-- Schema-compliant version matching existing gh_tactic_instructions structure

BEGIN;

-- ============================================
-- SECTION 1: VALIDATION
-- ============================================

-- Check table and column exist
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
-- SECTION 2: TACTIC INSERTION
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
  -- T439: Register Business Entity
  (
    'T439',
    'Register Business Entity (LLC/S-Corp/Sole Proprietorship)',
    'Business Formation',
    1,
    'Establish legal business structure with state and federal authorities to create legitimate entity, obtain tax ID, and separate personal finances from business operations.',
    to_jsonb(ARRAY[
      'Step 1: Determine legal structure - LLC (recommended for liability protection), S-Corp (tax advantages), or Sole Proprietorship (simplest). LLC protects personal assets while maintaining tax flexibility.',
      'Step 2: Check business name availability at IRS.gov Business Name Search tool. Verify name not already registered in your state''s business registry.',
      'Step 3: Register with Secretary of State online portal (fees vary $50-$500 by state). Submit Articles of Organization with business name, registered agent, business purpose.',
      'Step 4: Apply for EIN (Employer Identification Number) on IRS.gov - FREE process, treated as business Social Security number. Required for banking and taxes.',
      'Step 5: File for business license with city/county clerk office. Requirements vary by jurisdiction - call first to understand specific local permits needed.',
      'Step 6: Set up business bank account using EIN and Articles of Organization. Separates personal finances from business transactions.',
      'Step 7: Register for state taxes if applicable (sales tax, payroll tax). Check with state Department of Revenue for requirements.',
      'Step 8: Create Operating Agreement (LLC) defining ownership structure, profit distribution, management responsibilities. Critical for multi-member LLCs.',
      'Step 9: File annual reports and maintain good standing with state. Mark calendar for renewal deadlines to avoid penalties.',
      'Step 10: Consider business insurance (general liability, property) once entity established. Protects business assets from lawsuits.'
    ]),
    '2-4 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    50.00,
    500.00,
    'one_time_fee',
    TRUE,
    'Make sure that you register your business, so whether it''s gonna be a LLC, so proprietorship or corporation, make sure that you register the business.',
    '{"framework_name": "Business Foundation Framework", "steps": ["Choose structure", "Check name", "Register with state", "Get EIN", "Open bank account", "Get licenses", "File taxes", "Create agreements", "Maintain compliance"], "benefits": ["Legal protection", "Tax separation", "Professional credibility", "Banking access", "Scalability"], "lynette_insight": "LLC is best middle ground - protection without corporation complexity"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T440: Verify Business Name Availability
  (
    'T440',
    'Verify Business Name Availability Before Registration',
    'Business Formation',
    1,
    'Conduct comprehensive business name search across state registries, trademark databases, and domain availability to ensure your chosen name is available and protectable.',
    to_jsonb(ARRAY[
      'Step 1: Visit IRS.gov and search Business Name Registry for federal availability.',
      'Step 2: Search your state''s Secretary of State business database for existing registrations matching your desired name.',
      'Step 3: Check USPTO (United States Patent and Trademark Office) database for national trademark conflicts.',
      'Step 4: Verify social media handle availability on Facebook, Instagram, LinkedIn for brand consistency.',
      'Step 5: Check domain name availability on GoDaddy or Namecheap. Reserve domain immediately if available.',
      'Step 6: Search Google for existing businesses with similar names in your geographic area.',
      'Step 7: Document all search results and dates for future reference if challenged.',
      'Step 8: If name unavailable, create alternative names and repeat search process.'
    ]),
    '1-2 hours',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    200.00,
    'one_time_fee',
    TRUE,
    'Before creating a name, make sure that name is available, which means make sure nobody else is doing business with the name you want.',
    '{"framework_name": "Name Availability Check Process", "steps": ["IRS search", "State search", "Trademark search", "Domain check", "Social media check"], "benefits": ["Avoid legal conflicts", "Secure brand identity", "Enable digital presence", "Protect trademark"], "lynette_insight": "Check all channels - missing one can cost you later"}'::JSONB,
    'Module 1: Business Foundation',
    'cashflow_course'
  ),

  -- T441: Obtain EIN
  (
    'T441',
    'Obtain EIN (Employer Identification Number) from IRS',
    'Business Formation',
    1,
    'Apply for federal tax identification number (EIN) from IRS - required for business banking, payment processing, hiring employees, and tax filing. Free and immediate process.',
    to_jsonb(ARRAY[
      'Step 1: Navigate to IRS.gov/EIN and click "Apply for an EIN Online" - FREE service, avoid third-party sites charging fees.',
      'Step 2: Prepare required information: Business legal name, business structure (LLC/sole proprietor), responsible party SSN, business address, business purpose.',
      'Step 3: Complete online application Form SS-4 - takes 10-15 minutes. Answer questions about business type, employees, reason for applying.',
      'Step 4: Receive EIN immediately upon completion - will display on confirmation page. Print and save confirmation letter for permanent records.',
      'Step 5: Store EIN securely - treat like Social Security number. Required for all business tax documents, banking, contracts.',
      'Step 6: Use EIN to open business bank account immediately. Banks require EIN and Articles of Organization for business accounts.',
      'Step 7: Provide EIN to payment processors (Quickbooks, Strike, Square) for accepting resident payments. Required for merchant accounts.',
      'Step 8: File business taxes using EIN - sole proprietors use Schedule C with personal return, LLCs may elect S-Corp status.',
      'Step 9: Give EIN to contractors/vendors for 1099 reporting if paying over $600/year. IRS requires tracking business payments.',
      'Step 10: Update EIN with IRS if changing business structure, name, or ownership. Must notify within 60 days of material changes.'
    ]),
    '15-30 minutes',
    ARRAY['rental_arbitrage', 'property_purchase', 'partnership']::TEXT[],
    ARRAY['any']::TEXT[],
    0.00,
    0.00,
    'free',
    TRUE,
    'Consider Ein is like your business Social Security number, so this number is gonna separate your business from your personal.',
    '{"framework_name": "EIN Application Process", "steps": ["Navigate to IRS.gov/EIN", "Prepare information", "Complete Form SS-4", "Receive EIN immediately", "Store securely", "Use for banking", "Set up payment processing", "File taxes", "Provide to vendors"], "benefits": ["Free process", "Instant issuance", "Enables banking", "Tax separation", "Professional credibility"], "lynette_insight": "Get your EIN before anything else - can''t open business bank account without it"}'::JSONB,
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
-- SECTION 3: VALIDATION
-- ============================================

DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inserted_count
  FROM gh_tactic_instructions
  WHERE tactic_source = 'cashflow_course'
  AND tactic_id >= 'T439';

  RAISE NOTICE '✓ Inserted/updated % cashflow course tactics (T439-T441)', inserted_count;
END $$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
╔══════════════════════════════════════════════════════════╗
║   CASHFLOW COURSE TACTICS - PHASE 2 TEST                ║
║   Tactics inserted: T439-T441 (3 tactics)                ║
║   Schema-compliant version ready for expansion          ║
╚══════════════════════════════════════════════════════════╝
  ';
END $$;
