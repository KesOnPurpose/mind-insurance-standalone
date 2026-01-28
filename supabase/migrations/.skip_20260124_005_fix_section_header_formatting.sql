-- ============================================================================
-- MIGRATION: Fix Section Header Formatting in local_compliance_binders
-- ============================================================================
-- Purpose: Remove ** markdown bold syntax from section_headers titles
--          so they display cleanly in the UI
-- ============================================================================

-- ============================================================================
-- 1. PITTSBURGH, PA
-- ============================================================================
UPDATE public.local_compliance_binders
SET section_headers = '[
  {"id": "section-introduction", "title": "Introduction", "level": 2},
  {"id": "section-highlight-instructions", "title": "Highlight Instructions", "level": 3},
  {"id": "section-1a-purpose", "title": "1A. Purpose & Use of This Binder", "level": 3},
  {"id": "section-1b-housing-model", "title": "1B. Housing Model Overview", "level": 3},
  {"id": "section-1c-language", "title": "1C. Language & Operations Guardrails", "level": 3},
  {"id": "section-2a-licensed-vs-unlicensed", "title": "2A. Licensed vs Unlicensed Facility Definitions", "level": 3},
  {"id": "section-2b-distinction", "title": "2B. Distinction From Rooming / Boarding Houses", "level": 3},
  {"id": "section-3a-state-local-zoning", "title": "3A. State & Local Zoning Authority", "level": 3},
  {"id": "section-3b-zoning-permitting", "title": "3B. Zoning & Permitting Requirements", "level": 3},
  {"id": "section-4a-fair-housing", "title": "4A. Fair Housing Act Guidance", "level": 3},
  {"id": "section-4b-ada-guidance", "title": "4B. ADA Guidance (If Applicable)", "level": 3}
]'::jsonb,
updated_at = NOW()
WHERE location_name = 'Pittsburgh' AND state_code = 'PA';

-- ============================================================================
-- 2. LINDEN, NJ
-- ============================================================================
UPDATE public.local_compliance_binders
SET section_headers = '[
  {"id": "section-introduction", "title": "Introduction", "level": 2},
  {"id": "section-highlight-instructions", "title": "Highlight Instructions", "level": 3},
  {"id": "section-1a-purpose", "title": "1A. Purpose & Use of This Binder", "level": 3},
  {"id": "section-1b-housing-model", "title": "1B. Housing Model Overview", "level": 3},
  {"id": "section-1c-language", "title": "1C. Language & Operations Guardrails", "level": 3},
  {"id": "section-2a-licensed-vs-unlicensed", "title": "2A. Licensed vs Unlicensed Facility Definitions", "level": 3},
  {"id": "section-2b-distinction", "title": "2B. Distinction From Rooming / Boarding Houses", "level": 3},
  {"id": "section-3a-state-local-zoning", "title": "3A. State & Local Zoning Authority", "level": 3},
  {"id": "section-3b-zoning-permitting", "title": "3B. Zoning & Permitting Requirements", "level": 3},
  {"id": "section-4a-fair-housing", "title": "4A. Fair Housing Act Guidance", "level": 3},
  {"id": "section-4b-ada-guidance", "title": "4B. ADA Guidance (If Applicable)", "level": 3}
]'::jsonb,
updated_at = NOW()
WHERE location_name = 'Linden' AND state_code = 'NJ';

-- ============================================================================
-- 3. QUEENS COUNTY, NY
-- ============================================================================
UPDATE public.local_compliance_binders
SET section_headers = '[
  {"id": "section-introduction", "title": "Introduction", "level": 2},
  {"id": "section-highlight-instructions", "title": "Highlight Instructions", "level": 3},
  {"id": "section-1a-purpose", "title": "1A. Purpose & Use of This Binder", "level": 3},
  {"id": "section-1b-housing-model", "title": "1B. Housing Model Overview", "level": 3},
  {"id": "section-1c-language", "title": "1C. Language & Operations Guardrails", "level": 3},
  {"id": "section-2a-licensed-vs-unlicensed", "title": "2A. Licensed vs Unlicensed Facility Definitions", "level": 3},
  {"id": "section-2b-distinction", "title": "2B. Distinction From Rooming / Boarding Houses", "level": 3},
  {"id": "section-3a-state-local-zoning", "title": "3A. State & Local Zoning Authority", "level": 3},
  {"id": "section-3b-zoning-permitting", "title": "3B. Zoning & Permitting Requirements", "level": 3},
  {"id": "section-4a-fair-housing", "title": "4A. Fair Housing Act Guidance", "level": 3},
  {"id": "section-4b-ada-guidance", "title": "4B. ADA Guidance (If Applicable)", "level": 3}
]'::jsonb,
updated_at = NOW()
WHERE location_name = 'Queens County' AND state_code = 'NY';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to confirm the fix:
--
-- SELECT location_name, state_code, section_headers->0->>'title' as first_section
-- FROM public.local_compliance_binders;
--
-- Expected: titles should NOT contain ** asterisks
-- ============================================================================
