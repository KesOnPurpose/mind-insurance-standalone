// ============================================================================
// PDF EXPORT SERVICE
// ============================================================================
// Generates professional PDF exports of compliance binders for printing
// and sharing with officials. Uses html2pdf.js for reliable
// cross-browser PDF generation.
// ============================================================================

import html2pdf from 'html2pdf.js';
import type {
  ComplianceBinder,
  BinderItem,
  BinderDocument,
  SharePermissions,
} from '@/types/compliance';
import {
  getBinderById,
  getBinderWithItems,
} from './complianceBinderService';
import { getBinderDocuments } from './documentUploadService';

// ============================================================================
// TYPES
// ============================================================================

export interface PDFExportOptions {
  includeSections?: boolean;
  includeDocuments?: boolean;
  includeNotes?: boolean;
  includeCitations?: boolean;
  includeTableOfContents?: boolean;
  includeModelDefinition?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  headerText?: string;
  footerText?: string;
  fontSize?: 'small' | 'medium' | 'large';
  colorScheme?: 'color' | 'grayscale' | 'bw';
}

export interface PDFExportResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  generatedAt: string;
}

export interface PDFSection {
  title: string;
  items: PDFSectionItem[];
}

export interface PDFSectionItem {
  title: string;
  content: string;
  notes?: string;
  citation?: string;
  sourceUrl?: string;
  isStarred?: boolean;
}

export interface PDFMetadata {
  binderName: string;
  stateCode: string;
  city?: string;
  modelDefinition?: string;
  ownerName?: string;
  generatedDate: string;
  totalSections: number;
  totalItems: number;
  totalDocuments: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: PDFExportOptions = {
  includeSections: true,
  includeDocuments: true,
  includeNotes: true,
  includeCitations: true,
  includeTableOfContents: true,
  includeModelDefinition: true,
  includeWatermark: false,
  fontSize: 'medium',
  colorScheme: 'color',
};

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  model_definition: 'Model Definition',
  licensure: 'State Licensure Requirements',
  fha: 'Fair Housing Act Protections',
  local_rules: 'Local Rules & Ordinances',
  operational: 'Operational Classification',
  notes: 'Notes & Interpretations',
  custom: 'Custom Sections',
};

const SECTION_ORDER = [
  'model_definition',
  'licensure',
  'fha',
  'local_rules',
  'operational',
  'notes',
  'custom',
];

// Font sizes based on option
const FONT_SIZES: Record<string, { title: number; heading: number; body: number; small: number }> = {
  small: { title: 18, heading: 12, body: 9, small: 7 },
  medium: { title: 24, heading: 14, body: 11, small: 9 },
  large: { title: 28, heading: 16, body: 13, small: 11 },
};

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML content for PDF export
 */
export function generatePDFHtml(
  metadata: PDFMetadata,
  sections: PDFSection[],
  documents: BinderDocument[],
  options: PDFExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fonts = FONT_SIZES[opts.fontSize || 'medium'];
  const isGrayscale = opts.colorScheme === 'grayscale' || opts.colorScheme === 'bw';
  const isBW = opts.colorScheme === 'bw';

  // Color scheme
  const colors = {
    primary: isBW ? '#000000' : isGrayscale ? '#333333' : '#2563eb',
    secondary: isBW ? '#000000' : isGrayscale ? '#666666' : '#64748b',
    border: isBW ? '#000000' : isGrayscale ? '#cccccc' : '#e2e8f0',
    background: isBW ? '#ffffff' : isGrayscale ? '#f8f8f8' : '#f8fafc',
    accent: isBW ? '#000000' : isGrayscale ? '#444444' : '#3b82f6',
    star: isBW ? '#000000' : isGrayscale ? '#555555' : '#eab308',
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Binder - ${metadata.binderName}</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }

    * {
      box-sizing: border-box;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    body {
      margin: 0;
      padding: 0;
      color: #1f2937;
      line-height: 1.5;
      font-size: ${fonts.body}pt;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 40px;
    }

    .cover-title {
      font-size: ${fonts.title + 8}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 16px;
    }

    .cover-subtitle {
      font-size: ${fonts.heading + 2}pt;
      color: ${colors.secondary};
      margin-bottom: 8px;
    }

    .cover-state {
      font-size: ${fonts.heading}pt;
      color: ${colors.secondary};
      margin-bottom: 40px;
    }

    .cover-model {
      font-size: ${fonts.body}pt;
      color: ${colors.secondary};
      font-style: italic;
      max-width: 500px;
      margin: 0 auto 40px;
      padding: 20px;
      border: 1px solid ${colors.border};
      background: ${colors.background};
    }

    .cover-model-label {
      font-weight: bold;
      font-style: normal;
      margin-bottom: 8px;
      color: ${colors.primary};
    }

    .cover-meta {
      font-size: ${fonts.small}pt;
      color: ${colors.secondary};
      margin-top: 60px;
    }

    /* Table of Contents */
    .toc {
      padding: 20px 0;
    }

    .toc-title {
      font-size: ${fonts.title}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 24px;
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 8px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted ${colors.border};
    }

    .toc-section {
      font-weight: bold;
      color: ${colors.primary};
    }

    .toc-page {
      color: ${colors.secondary};
    }

    /* Section Headers */
    .section-header {
      font-size: ${fonts.title}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.primary};
    }

    /* Items */
    .item {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid ${colors.border};
      border-radius: 4px;
      background: #ffffff;
    }

    .item-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .item-title {
      font-size: ${fonts.heading}pt;
      font-weight: bold;
      color: ${colors.primary};
      flex: 1;
    }

    .item-star {
      color: ${colors.star};
      font-size: ${fonts.heading}pt;
      margin-left: 8px;
    }

    .item-content {
      font-size: ${fonts.body}pt;
      color: #374151;
      white-space: pre-wrap;
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .item-notes {
      font-size: ${fonts.body}pt;
      color: ${colors.secondary};
      background: ${colors.background};
      padding: 12px;
      border-left: 3px solid ${colors.accent};
      margin-top: 12px;
    }

    .item-notes-label {
      font-weight: bold;
      font-size: ${fonts.small}pt;
      color: ${colors.primary};
      margin-bottom: 4px;
    }

    .item-citation {
      font-size: ${fonts.small}pt;
      color: ${colors.secondary};
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid ${colors.border};
    }

    .item-citation a {
      color: ${colors.accent};
      text-decoration: none;
    }

    /* Documents Section */
    .documents-list {
      margin-top: 16px;
    }

    .document-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 1px solid ${colors.border};
      border-radius: 4px;
      margin-bottom: 8px;
      background: #ffffff;
    }

    .document-icon {
      font-size: ${fonts.heading}pt;
      margin-right: 12px;
    }

    .document-info {
      flex: 1;
    }

    .document-name {
      font-weight: bold;
      font-size: ${fonts.body}pt;
      color: ${colors.primary};
    }

    .document-type {
      font-size: ${fonts.small}pt;
      color: ${colors.secondary};
    }

    .document-date {
      font-size: ${fonts.small}pt;
      color: ${colors.secondary};
    }

    /* Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 20px;
      font-size: ${fonts.small}pt;
      color: ${colors.secondary};
      text-align: center;
      border-top: 1px solid ${colors.border};
    }

    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.05);
      white-space: nowrap;
      pointer-events: none;
      z-index: -1;
    }

    /* Print adjustments */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
`;

  // Watermark
  if (opts.includeWatermark && opts.watermarkText) {
    html += `<div class="watermark">${escapeHtml(opts.watermarkText)}</div>`;
  }

  // Cover Page
  html += `
  <div class="cover-page">
    <div class="cover-title">COMPLIANCE BINDER</div>
    <div class="cover-subtitle">${escapeHtml(metadata.binderName)}</div>
    <div class="cover-state">${getStateName(metadata.stateCode)}${metadata.city ? ` - ${escapeHtml(metadata.city)}` : ''}</div>
`;

  // Model Definition on cover
  if (opts.includeModelDefinition && metadata.modelDefinition) {
    html += `
    <div class="cover-model">
      <div class="cover-model-label">Model Definition</div>
      ${escapeHtml(metadata.modelDefinition)}
    </div>
`;
  }

  html += `
    <div class="cover-meta">
      Generated on ${metadata.generatedDate}<br>
      ${metadata.totalSections} sections | ${metadata.totalItems} items | ${metadata.totalDocuments} documents
    </div>
  </div>
`;

  // Table of Contents
  if (opts.includeTableOfContents) {
    html += `
  <div class="page-break"></div>
  <div class="toc">
    <div class="toc-title">Table of Contents</div>
`;

    let pageNum = 3; // Start after cover and TOC
    sections.forEach((section) => {
      html += `
    <div class="toc-item">
      <span class="toc-section">${escapeHtml(section.title)}</span>
      <span class="toc-page">${section.items.length} items</span>
    </div>
`;
      pageNum++;
    });

    if (opts.includeDocuments && documents.length > 0) {
      html += `
    <div class="toc-item">
      <span class="toc-section">Uploaded Documents</span>
      <span class="toc-page">${documents.length} documents</span>
    </div>
`;
    }

    html += `</div>`;
  }

  // Sections
  if (opts.includeSections) {
    sections.forEach((section) => {
      html += `
  <div class="page-break"></div>
  <div class="section-header">${escapeHtml(section.title)}</div>
`;

      section.items.forEach((item) => {
        html += `
  <div class="item avoid-break">
    <div class="item-header">
      <div class="item-title">${escapeHtml(item.title)}</div>
      ${item.isStarred ? '<div class="item-star">★</div>' : ''}
    </div>
    <div class="item-content">${escapeHtml(item.content)}</div>
`;

        if (opts.includeNotes && item.notes) {
          html += `
    <div class="item-notes">
      <div class="item-notes-label">My Notes</div>
      ${escapeHtml(item.notes)}
    </div>
`;
        }

        if (opts.includeCitations && (item.citation || item.sourceUrl)) {
          html += `
    <div class="item-citation">
      ${item.citation ? `<strong>Reference:</strong> ${escapeHtml(item.citation)}` : ''}
      ${item.sourceUrl ? `<br><a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.sourceUrl)}</a>` : ''}
    </div>
`;
        }

        html += `</div>`;
      });
    });
  }

  // Documents
  if (opts.includeDocuments && documents.length > 0) {
    html += `
  <div class="page-break"></div>
  <div class="section-header">Uploaded Documents</div>
  <div class="documents-list">
`;

    documents.forEach((doc) => {
      const icon = getDocumentIcon(doc.document_type);
      html += `
    <div class="document-item avoid-break">
      <div class="document-icon">${icon}</div>
      <div class="document-info">
        <div class="document-name">${escapeHtml(doc.file_name)}</div>
        <div class="document-type">${formatDocumentType(doc.document_type)}</div>
      </div>
      <div class="document-date">${formatDate(doc.created_at)}</div>
    </div>
`;
    });

    html += `</div>`;
  }

  // Footer
  if (opts.footerText) {
    html += `<div class="footer">${escapeHtml(opts.footerText)}</div>`;
  }

  html += `
</body>
</html>
`;

  return html;
}

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Export binder as actual PDF using html2pdf.js
 * Generates a real PDF file from HTML content
 */
export async function exportBinderToPDF(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<PDFExportResult> {
  // Fetch binder data
  const binderData = await getBinderWithItems(binderId);
  if (!binderData) {
    throw new Error('Binder not found');
  }

  // Fetch documents
  const documents = await getBinderDocuments(binderId);

  // Organize items by section
  const sections = organizeBySections(binderData.items);

  // Build metadata
  const metadata: PDFMetadata = {
    binderName: binderData.binder.name,
    stateCode: binderData.binder.state_code,
    city: binderData.binder.city,
    modelDefinition: binderData.binder.model_definition,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    totalSections: sections.length,
    totalItems: binderData.items.length,
    totalDocuments: documents.length,
  };

  // Generate HTML
  const html = generatePDFHtml(metadata, sections, documents, options);

  // Generate filename
  const filename = generateFilename(binderData.binder);

  // Create a temporary container to render HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    // Configure html2pdf options
    const pdfOptions = {
      margin: [0.5, 0.5, 0.5, 0.5], // inches
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // Generate PDF blob
    const pdfBlob = await html2pdf()
      .set(pdfOptions)
      .from(container)
      .outputPdf('blob');

    return {
      blob: pdfBlob,
      filename,
      pageCount: estimatePageCount(sections, documents, options),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    // Clean up the temporary container
    document.body.removeChild(container);
  }
}

/**
 * Export binder as HTML (fallback/legacy method)
 * Returns HTML blob for printing or saving
 */
export async function exportBinderToHTML(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<PDFExportResult> {
  // Fetch binder data
  const binderData = await getBinderWithItems(binderId);
  if (!binderData) {
    throw new Error('Binder not found');
  }

  // Fetch documents
  const documents = await getBinderDocuments(binderId);

  // Organize items by section
  const sections = organizeBySections(binderData.items);

  // Build metadata
  const metadata: PDFMetadata = {
    binderName: binderData.binder.name,
    stateCode: binderData.binder.state_code,
    city: binderData.binder.city,
    modelDefinition: binderData.binder.model_definition,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    totalSections: sections.length,
    totalItems: binderData.items.length,
    totalDocuments: documents.length,
  };

  // Generate HTML
  const html = generatePDFHtml(metadata, sections, documents, options);

  // Create blob
  const blob = new Blob([html], { type: 'text/html' });

  // Generate filename
  const filename = generateFilename(binderData.binder);

  return {
    blob,
    filename: filename.replace('.pdf', '.html'),
    pageCount: estimatePageCount(sections, documents, options),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Open print dialog for binder
 */
export async function printBinder(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  // Use HTML version for printing (better browser compatibility)
  const result = await exportBinderToHTML(binderId, options);

  // Create URL and open in new window for printing
  const url = URL.createObjectURL(result.blob);
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    // Wait for the content to load, then trigger print
    printWindow.onload = () => {
      // Small delay to ensure styles are applied
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

/**
 * Download binder as actual PDF file
 */
export async function downloadBinderPDF(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const result = await exportBinderToPDF(binderId, options);

  // Create download link for PDF
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download binder as HTML file (fallback/legacy method)
 */
export async function downloadBinderHTML(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const result = await exportBinderToHTML(binderId, options);

  // Create download link
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// PREVIEW
// ============================================================================

/**
 * Generate preview HTML (for in-app preview before export)
 */
export async function generatePreview(
  binderId: string,
  options: PDFExportOptions = {}
): Promise<string> {
  const result = await exportBinderToPDF(binderId, options);
  return await result.blob.text();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Organize binder items into sections
 */
function organizeBySections(items: BinderItem[]): PDFSection[] {
  const sectionMap = new Map<string, PDFSectionItem[]>();

  // Initialize sections in order
  SECTION_ORDER.forEach((sectionType) => {
    sectionMap.set(sectionType, []);
  });

  // Group items by section
  items.forEach((item) => {
    const sectionType = item.section_type || 'notes';
    const sectionItems = sectionMap.get(sectionType) || [];

    sectionItems.push({
      title: item.title || 'Untitled',
      content: item.chunk_content || '',
      notes: item.user_notes,
      citation: item.regulation_code,
      sourceUrl: item.source_url,
      isStarred: item.is_starred,
    });

    sectionMap.set(sectionType, sectionItems);
  });

  // Convert to array, filtering empty sections
  const sections: PDFSection[] = [];
  SECTION_ORDER.forEach((sectionType) => {
    const sectionItems = sectionMap.get(sectionType) || [];
    if (sectionItems.length > 0) {
      sections.push({
        title: SECTION_DISPLAY_NAMES[sectionType] || sectionType,
        items: sectionItems,
      });
    }
  });

  return sections;
}

/**
 * Generate filename for PDF export
 */
function generateFilename(binder: ComplianceBinder): string {
  const name = binder.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const state = binder.state_code;
  const date = new Date().toISOString().split('T')[0];
  return `compliance_binder_${name}_${state}_${date}.pdf`;
}

/**
 * Estimate page count for PDF
 */
function estimatePageCount(
  sections: PDFSection[],
  documents: BinderDocument[],
  options: PDFExportOptions
): number {
  let pages = 2; // Cover + TOC

  if (options.includeSections) {
    sections.forEach((section) => {
      pages += 1; // Section header
      // Estimate ~3 items per page
      pages += Math.ceil(section.items.length / 3);
    });
  }

  if (options.includeDocuments && documents.length > 0) {
    pages += 1; // Documents page
    // Estimate ~8 documents per page
    pages += Math.ceil(documents.length / 8);
  }

  return pages;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get state full name from code
 */
function getStateName(stateCode: string): string {
  const states: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'District of Columbia',
  };
  return states[stateCode] || stateCode;
}

/**
 * Get document type icon
 */
function getDocumentIcon(documentType: string): string {
  const icons: Record<string, string> = {
    business_license: '📋',
    permit: '📄',
    insurance: '🛡️',
    lease: '📝',
    inspection: '✅',
    fire_safety: '🔥',
    health_permit: '🏥',
    zoning: '🏗️',
    other: '📁',
  };
  return icons[documentType] || '📁';
}

/**
 * Format document type for display
 */
function formatDocumentType(documentType: string): string {
  const names: Record<string, string> = {
    business_license: 'Business License',
    permit: 'Permit',
    insurance: 'Insurance Certificate',
    lease: 'Lease Agreement',
    inspection: 'Inspection Report',
    fire_safety: 'Fire Safety Certificate',
    health_permit: 'Health Permit',
    zoning: 'Zoning Documentation',
    other: 'Other Document',
  };
  return names[documentType] || documentType;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Main functions
  exportBinderToPDF,
  exportBinderToHTML,
  printBinder,
  downloadBinderPDF,
  downloadBinderHTML,
  generatePreview,
  generatePDFHtml,
  // Helpers
  organizeBySections,
  generateFilename,
  getStateName,
  // Constants
  SECTION_DISPLAY_NAMES,
  SECTION_ORDER,
  DEFAULT_OPTIONS,
};
