-- ============================================================================
-- Migration: Add Expanded Expense Columns to Property Financials
-- Created: 2026-01-22
-- Purpose: Add new expense categories (water, gas, internet, supplies, repairs)
-- ============================================================================

-- Add new utility expense columns
ALTER TABLE property_financials
ADD COLUMN IF NOT EXISTS actual_water DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_gas DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_internet DECIMAL(10,2) DEFAULT 0;

-- Add new operations expense columns
ALTER TABLE property_financials
ADD COLUMN IF NOT EXISTS actual_supplies DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_repairs DECIMAL(10,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN property_financials.actual_water IS 'Monthly water bill expense';
COMMENT ON COLUMN property_financials.actual_gas IS 'Monthly gas/heating expense';
COMMENT ON COLUMN property_financials.actual_internet IS 'Monthly internet/wifi expense';
COMMENT ON COLUMN property_financials.actual_supplies IS 'Monthly supplies expense (cleaning, paper goods, etc.)';
COMMENT ON COLUMN property_financials.actual_repairs IS 'Monthly repairs expense (distinct from scheduled maintenance)';

-- ============================================================================
-- Verification Query (run manually to verify)
-- ============================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'property_financials'
-- AND column_name IN ('actual_water', 'actual_gas', 'actual_internet', 'actual_supplies', 'actual_repairs');
