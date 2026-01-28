-- ============================================================================
-- Migration: Add Custom Expenses Column to Property Financials
-- Created: 2026-01-22
-- Purpose: Allow users to add custom expense categories beyond the defaults
-- ============================================================================

-- Add custom_expenses JSONB column to property_financials table
-- This stores an array of custom expense objects: [{ "name": string, "amount": number }]
ALTER TABLE property_financials
ADD COLUMN IF NOT EXISTS custom_expenses JSONB DEFAULT '[]'::jsonb;

-- Add check constraint to ensure valid format
ALTER TABLE property_financials
ADD CONSTRAINT custom_expenses_format_check
CHECK (
  custom_expenses IS NULL
  OR jsonb_typeof(custom_expenses) = 'array'
);

-- Add comment for documentation
COMMENT ON COLUMN property_financials.custom_expenses IS
  'Array of custom expense objects: [{ "name": string, "amount": number }]. Used for user-defined expense categories beyond the standard categories.';

-- Create index for better query performance on custom expenses
CREATE INDEX IF NOT EXISTS idx_property_financials_custom_expenses
ON property_financials USING GIN (custom_expenses);

-- ============================================================================
-- Verification Query (run manually to verify)
-- ============================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'property_financials'
-- AND column_name = 'custom_expenses';
