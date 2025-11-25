/**
 * Glossary Parser Utility
 * Handles parsing and manipulation of glossary tooltip markup
 */

// Regular expression to match {{term||definition}} pattern
export const TOOLTIP_REGEX = /\{\{([^|]+)\|\|([^}]+)\}\}/g;

/**
 * Parsed tooltip data structure
 */
export interface ParsedTooltip {
  fullMatch: string;
  term: string;
  definition: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Parse text to extract all tooltip markup
 */
export function parseTooltips(text: string): ParsedTooltip[] {
  const tooltips: ParsedTooltip[] = [];
  let match;

  // Reset regex lastIndex to ensure fresh search
  TOOLTIP_REGEX.lastIndex = 0;

  while ((match = TOOLTIP_REGEX.exec(text)) !== null) {
    tooltips.push({
      fullMatch: match[0],
      term: match[1].trim(),
      definition: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return tooltips;
}

/**
 * Count the number of tooltips in text
 */
export function countTooltips(text: string): number {
  return parseTooltips(text).length;
}

/**
 * Extract all unique terms from tooltip markup
 */
export function extractTooltipTerms(text: string): string[] {
  const tooltips = parseTooltips(text);
  const uniqueTerms = new Set(tooltips.map(t => t.term));
  return Array.from(uniqueTerms).sort();
}

/**
 * Check if text contains any tooltip markup
 */
export function hasTooltips(text: string): boolean {
  TOOLTIP_REGEX.lastIndex = 0;
  return TOOLTIP_REGEX.test(text);
}

/**
 * Strip all tooltip markup from text, leaving only the terms
 */
export function stripTooltipMarkup(text: string): string {
  return text.replace(TOOLTIP_REGEX, '$1');
}

/**
 * Strip all tooltips entirely from text (remove terms and definitions)
 */
export function removeAllTooltips(text: string): string {
  return text.replace(TOOLTIP_REGEX, '');
}

/**
 * Get plain text with tooltips converted to just terms
 */
export function getPlainText(text: string): string {
  return stripTooltipMarkup(text);
}

/**
 * Validate tooltip markup format
 */
export function validateTooltipFormat(markup: string): boolean {
  const match = markup.match(/^\{\{([^|]+)\|\|([^}]+)\}\}$/);
  if (!match) return false;

  const term = match[1].trim();
  const definition = match[2].trim();

  // Ensure both term and definition are non-empty
  return term.length > 0 && definition.length > 0;
}

/**
 * Create tooltip markup from term and definition
 */
export function createTooltipMarkup(term: string, definition: string): string {
  if (!term || !definition) {
    throw new Error('Both term and definition are required');
  }
  return `{{${term.trim()}||${definition.trim()}}}`;
}

/**
 * Replace a specific tooltip in text
 */
export function replaceTooltip(
  text: string,
  oldTerm: string,
  newTerm: string,
  newDefinition?: string
): string {
  const tooltips = parseTooltips(text);
  let result = text;

  // Work backwards to preserve indices
  for (let i = tooltips.length - 1; i >= 0; i--) {
    const tooltip = tooltips[i];
    if (tooltip.term === oldTerm) {
      const definition = newDefinition || tooltip.definition;
      const newMarkup = createTooltipMarkup(newTerm, definition);
      result =
        result.substring(0, tooltip.startIndex) +
        newMarkup +
        result.substring(tooltip.endIndex);
    }
  }

  return result;
}

/**
 * Merge overlapping or nested tooltips
 */
export function mergeNestedTooltips(text: string): string {
  const tooltips = parseTooltips(text);
  if (tooltips.length === 0) return text;

  // Sort by start index
  tooltips.sort((a, b) => a.startIndex - b.startIndex);

  let result = '';
  let lastEnd = 0;

  for (const tooltip of tooltips) {
    // Skip if this tooltip is nested within the previous one
    if (tooltip.startIndex < lastEnd) continue;

    // Add text before this tooltip
    result += text.substring(lastEnd, tooltip.startIndex);

    // Add the tooltip
    result += tooltip.fullMatch;

    lastEnd = tooltip.endIndex;
  }

  // Add remaining text
  result += text.substring(lastEnd);

  return result;
}

/**
 * Calculate statistics about tooltips in text
 */
export interface TooltipStats {
  totalCount: number;
  uniqueTerms: number;
  averageDefinitionLength: number;
  termsWithMultipleDefinitions: string[];
  coverage: number; // Percentage of text that is tooltipped
}

export function calculateTooltipStats(text: string): TooltipStats {
  const tooltips = parseTooltips(text);

  if (tooltips.length === 0) {
    return {
      totalCount: 0,
      uniqueTerms: 0,
      averageDefinitionLength: 0,
      termsWithMultipleDefinitions: [],
      coverage: 0,
    };
  }

  // Group by term to find multiple definitions
  const termMap = new Map<string, Set<string>>();
  let totalDefinitionLength = 0;

  for (const tooltip of tooltips) {
    if (!termMap.has(tooltip.term)) {
      termMap.set(tooltip.term, new Set());
    }
    termMap.get(tooltip.term)!.add(tooltip.definition);
    totalDefinitionLength += tooltip.definition.length;
  }

  // Find terms with multiple definitions
  const termsWithMultiple = Array.from(termMap.entries())
    .filter(([_, defs]) => defs.size > 1)
    .map(([term]) => term);

  // Calculate coverage
  const tooltipCharCount = tooltips.reduce(
    (sum, t) => sum + t.term.length,
    0
  );
  const coverage = (tooltipCharCount / getPlainText(text).length) * 100;

  return {
    totalCount: tooltips.length,
    uniqueTerms: termMap.size,
    averageDefinitionLength: totalDefinitionLength / tooltips.length,
    termsWithMultipleDefinitions: termsWithMultiple,
    coverage: Math.round(coverage * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Export all tooltips to a structured format for storage
 */
export interface ExportedTooltip {
  term: string;
  definition: string;
  occurrences: number;
}

export function exportTooltips(text: string): ExportedTooltip[] {
  const tooltips = parseTooltips(text);
  const termMap = new Map<string, { definition: string; count: number }>();

  for (const tooltip of tooltips) {
    const key = `${tooltip.term}||${tooltip.definition}`;
    if (!termMap.has(key)) {
      termMap.set(key, { definition: tooltip.definition, count: 0 });
    }
    termMap.get(key)!.count++;
  }

  return Array.from(termMap.entries())
    .map(([key, data]) => {
      const [term] = key.split('||');
      return {
        term,
        definition: data.definition,
        occurrences: data.count,
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences);
}