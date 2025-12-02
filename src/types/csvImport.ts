// ============================================================================
// CSV IMPORT TYPES
// ============================================================================
// Type definitions for CSV bulk user import feature
// Used by CSV parser, validation, and import components
// ============================================================================

export type UserTier = 'user' | 'coach' | 'admin' | 'super_admin' | 'owner';

export interface CsvRow {
  email: string;
  full_name?: string;
  phone?: string;
  tier: UserTier;
  notes?: string;
  payment_source?: string;
}

export interface CsvRowError {
  row: number;
  email: string;
  field: string;
  message: string;
}

export interface ParsedCsvData {
  valid: CsvRow[];
  invalid: CsvRowError[];
  duplicates: string[]; // Duplicate emails within CSV
}

export interface CsvImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}

export interface CsvImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
}
