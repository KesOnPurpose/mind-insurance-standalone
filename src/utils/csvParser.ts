// ============================================================================
// CSV PARSER UTILITY
// ============================================================================
// Parse and validate CSV data for bulk user import
// Supports both comma and semicolon delimiters
// Returns validated rows and error details
// ============================================================================

import type { CsvRow, CsvRowError, ParsedCsvData, UserTier } from '@/types/csvImport';

const VALID_TIERS: UserTier[] = ['user', 'coach', 'admin', 'super_admin', 'owner'];

/**
 * Parse CSV text into structured data with validation
 * @param csvText - Raw CSV text content
 * @returns Parsed data with valid/invalid rows and duplicates
 */
export function parseCsvText(csvText: string): ParsedCsvData {
  const valid: CsvRow[] = [];
  const invalid: CsvRowError[] = [];
  const emailsSeen = new Set<string>();
  const duplicates: string[] = [];

  // Split into lines and remove empty lines
  const lines = csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { valid, invalid, duplicates };
  }

  // Skip header row if it looks like a header
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

  // Parse each data row
  for (let i = startIndex; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i];

    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line);

    // Extract fields
    const email = fields[0]?.trim().toLowerCase() || '';
    const full_name = fields[1]?.trim() || undefined;
    const phone = fields[2]?.trim() || undefined;
    const tier = (fields[3]?.trim().toLowerCase() as UserTier) || 'user';
    const notes = fields[4]?.trim() || undefined;

    // Validate email
    if (!email) {
      invalid.push({
        row: rowNumber,
        email: '',
        field: 'email',
        message: 'Email is required',
      });
      continue;
    }

    if (!email.includes('@') || email.length < 3) {
      invalid.push({
        row: rowNumber,
        email,
        field: 'email',
        message: 'Invalid email format',
      });
      continue;
    }

    // Check for duplicates within CSV
    if (emailsSeen.has(email)) {
      duplicates.push(email);
      invalid.push({
        row: rowNumber,
        email,
        field: 'email',
        message: 'Duplicate email in CSV',
      });
      continue;
    }
    emailsSeen.add(email);

    // Validate tier
    if (tier && !VALID_TIERS.includes(tier)) {
      invalid.push({
        row: rowNumber,
        email,
        field: 'tier',
        message: `Invalid tier: ${tier}. Must be one of: ${VALID_TIERS.join(', ')}`,
      });
      continue;
    }

    // Valid row
    valid.push({
      email,
      full_name,
      phone,
      tier,
      notes,
      payment_source: 'manual', // Default for CSV imports
    });
  }

  return { valid, invalid, duplicates };
}

/**
 * Parse CSV file into structured data with validation
 * @param file - CSV File object
 * @returns Promise resolving to parsed data
 */
export async function parseCsvFile(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      if (!csvText) {
        reject(new Error('Failed to read file'));
        return;
      }
      resolve(parseCsvText(csvText));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line, handling quoted fields with commas
 * @param line - Single CSV line
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      // Field delimiter (not inside quotes)
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add last field
  fields.push(currentField);

  return fields;
}

/**
 * Validate a single CSV row
 * @param row - CSV row data
 * @returns Validation errors (empty array if valid)
 */
export function validateCsvRow(row: CsvRow): string[] {
  const errors: string[] = [];

  // Email validation
  if (!row.email) {
    errors.push('Email is required');
  } else if (!row.email.includes('@') || row.email.length < 3) {
    errors.push('Invalid email format');
  }

  // Tier validation
  if (row.tier && !VALID_TIERS.includes(row.tier)) {
    errors.push(`Invalid tier: ${row.tier}`);
  }

  return errors;
}
