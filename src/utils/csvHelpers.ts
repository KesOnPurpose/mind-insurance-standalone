// CSV Helper Utilities
// Client-side CSV parsing and generation for document-tactic links

import type { GHDocumentTacticLink, TacticLinkType } from '@/types/documents';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CSVLinkRow {
  document_id: number;
  document_name: string;
  tactic_id: string;
  tactic_name: string;
  link_type: TacticLinkType;
  created_at: string;
}

export interface CSVImportRow {
  document_id: string;
  tactic_id: string;
  link_type: string;
  // Optional fields that might exist
  document_name?: string;
  tactic_name?: string;
  created_at?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ValidationResult {
  valid: CSVImportRow[];
  errors: ValidationError[];
  duplicates: CSVImportRow[];
}

// ============================================================================
// CSV EXPORT FUNCTIONS
// ============================================================================

/**
 * Convert link data to CSV format
 */
export const generateCSV = (data: CSVLinkRow[]): string => {
  if (data.length === 0) {
    return 'document_id,document_name,tactic_id,tactic_name,link_type,created_at\n';
  }

  const headers = [
    'document_id',
    'document_name',
    'tactic_id',
    'tactic_name',
    'link_type',
    'created_at',
  ];

  const csvRows = [headers.join(',')];

  data.forEach((row) => {
    const values = [
      row.document_id,
      `"${row.document_name.replace(/"/g, '""')}"`, // Escape quotes in names
      row.tactic_id,
      `"${row.tactic_name.replace(/"/g, '""')}"`,
      row.link_type,
      row.created_at,
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Trigger browser download of CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
};

// ============================================================================
// CSV IMPORT FUNCTIONS
// ============================================================================

/**
 * Parse CSV file content into structured data (browser-compatible)
 */
export const parseCSV = (fileContent: string): CSVImportRow[] => {
  try {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Parse data rows
    const records: CSVImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted values)
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

      // Create row object
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      records.push(row as CSVImportRow);
    }

    return records;
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV file. Please check the file format.');
  }
};

/**
 * Validate CSV import data
 */
export const validateCSVData = (
  data: CSVImportRow[],
  existingDocumentIds: Set<number>,
  existingTacticIds: Set<string>,
  existingLinks: Set<string> // Format: "documentId-tacticId"
): ValidationResult => {
  const valid: CSVImportRow[] = [];
  const errors: ValidationError[] = [];
  const duplicates: CSVImportRow[] = [];

  const validLinkTypes: TacticLinkType[] = ['required', 'recommended', 'supplemental'];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index 0 is row 2 (after header)
    let hasError = false;

    // Validate document_id
    if (!row.document_id || row.document_id.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'document_id',
        message: 'Missing document_id',
        value: row.document_id || '',
      });
      hasError = true;
    } else {
      const docId = parseInt(row.document_id, 10);
      if (isNaN(docId)) {
        errors.push({
          row: rowNumber,
          field: 'document_id',
          message: 'Invalid document_id (must be a number)',
          value: row.document_id,
        });
        hasError = true;
      } else if (!existingDocumentIds.has(docId)) {
        errors.push({
          row: rowNumber,
          field: 'document_id',
          message: 'Document ID does not exist in database',
          value: row.document_id,
        });
        hasError = true;
      }
    }

    // Validate tactic_id
    if (!row.tactic_id || row.tactic_id.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'tactic_id',
        message: 'Missing tactic_id',
        value: row.tactic_id || '',
      });
      hasError = true;
    } else if (!existingTacticIds.has(row.tactic_id.trim())) {
      errors.push({
        row: rowNumber,
        field: 'tactic_id',
        message: 'Tactic ID does not exist in database',
        value: row.tactic_id,
      });
      hasError = true;
    }

    // Validate link_type
    if (!row.link_type || row.link_type.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'link_type',
        message: 'Missing link_type',
        value: row.link_type || '',
      });
      hasError = true;
    } else if (!validLinkTypes.includes(row.link_type.trim() as TacticLinkType)) {
      errors.push({
        row: rowNumber,
        field: 'link_type',
        message: `Invalid link_type (must be: ${validLinkTypes.join(', ')})`,
        value: row.link_type,
      });
      hasError = true;
    }

    // Check for duplicates (in database)
    const linkKey = `${row.document_id}-${row.tactic_id}`;
    if (existingLinks.has(linkKey)) {
      duplicates.push(row);
      hasError = true;
    }

    if (!hasError) {
      valid.push(row);
    }
  });

  return { valid, errors, duplicates };
};

/**
 * Read file content as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Validate file before processing
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a .csv file' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check for empty file
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

/**
 * Generate filename for export
 */
export const generateExportFilename = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `document-links-export-${year}-${month}-${day}.csv`;
};

/**
 * Format date for CSV export
 */
export const formatDateForCSV = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return dateString;
  }
};
