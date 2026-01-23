/**
 * Binder Section Parser
 *
 * Parses state compliance binder markdown content and maps sections
 * to appropriate BinderSectionType values for auto-population.
 *
 * Phase 1: Rule-based mapping using markdown headers
 */

import { BinderSectionType } from '@/types/compliance';

export interface ParsedSection {
  title: string;
  content: string;
  sectionType: BinderSectionType;
  startIndex: number;
  endIndex: number;
}

// Mapping of markdown header patterns to section types
const SECTION_MAPPINGS: Array<{
  patterns: RegExp[];
  sectionType: BinderSectionType;
}> = [
  {
    // Regulatory authority, purpose, licensing info
    patterns: [
      /regulatory\s*authority/i,
      /purpose\s*of\s*this\s*binder/i,
      /licensing\s*authority/i,
      /regulatory\s*basis/i,
      /state\s*regulation/i,
    ],
    sectionType: 'licensure',
  },
  {
    // Licensed care categories, housing types
    patterns: [
      /licensed\s*care\s*categories/i,
      /care\s*categories/i,
      /housing\s*types/i,
      /facility\s*types/i,
      /residential\s*care/i,
      /adult\s*residential/i,
    ],
    sectionType: 'housing_categories',
  },
  {
    // Fair housing requirements
    patterns: [
      /fair\s*housing/i,
      /fha/i,
      /discrimination/i,
      /protected\s*classes/i,
      /reasonable\s*accommodation/i,
    ],
    sectionType: 'fha',
  },
  {
    // Local requirements, zoning, permits
    patterns: [
      /local\s*requirements/i,
      /zoning/i,
      /permits/i,
      /municipal/i,
      /city\s*regulations/i,
      /county\s*regulations/i,
      /local\s*compliance/i,
    ],
    sectionType: 'local',
  },
  {
    // Operational requirements
    patterns: [
      /operational/i,
      /staffing/i,
      /staff\s*requirements/i,
      /training/i,
      /record\s*keeping/i,
      /documentation/i,
      /fire\s*safety/i,
      /health\s*and\s*safety/i,
      /inspections/i,
    ],
    sectionType: 'operational',
  },
  {
    // Model definition, unlicensed housing
    patterns: [
      /model\s*definition/i,
      /unlicensed\s*housing/i,
      /sober\s*living/i,
      /transitional\s*housing/i,
      /recovery\s*residence/i,
    ],
    sectionType: 'model_definition',
  },
];

/**
 * Determines the section type based on the section title
 */
function determineSectionType(title: string): BinderSectionType {
  for (const mapping of SECTION_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(title)) {
        return mapping.sectionType;
      }
    }
  }
  // Default to 'general' if no match found
  return 'general';
}

/**
 * Parses markdown content and extracts sections based on ## headers
 */
export function parseBinderSections(markdownContent: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Match ## headers (level 2 headings)
  const headerRegex = /^(#{2,3})\s+(.+)$/gm;
  const matches: Array<{ level: number; title: string; index: number }> = [];

  let match;
  while ((match = headerRegex.exec(markdownContent)) !== null) {
    matches.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index,
    });
  }

  // Extract content between headers
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    const startIndex = currentMatch.index;
    const endIndex = nextMatch ? nextMatch.index : markdownContent.length;

    // Get the full content including the header
    const fullContent = markdownContent.slice(startIndex, endIndex).trim();

    // Get just the content after the header line
    const headerLineEnd = fullContent.indexOf('\n');
    const contentWithoutHeader = headerLineEnd > -1
      ? fullContent.slice(headerLineEnd + 1).trim()
      : '';

    // Skip empty sections
    if (!contentWithoutHeader) continue;

    const sectionType = determineSectionType(currentMatch.title);

    sections.push({
      title: currentMatch.title,
      content: fullContent, // Include header for context
      sectionType,
      startIndex,
      endIndex,
    });
  }

  return sections;
}

/**
 * Groups parsed sections by their section type
 */
export function groupSectionsByType(
  sections: ParsedSection[]
): Map<BinderSectionType, ParsedSection[]> {
  const grouped = new Map<BinderSectionType, ParsedSection[]>();

  for (const section of sections) {
    const existing = grouped.get(section.sectionType) || [];
    existing.push(section);
    grouped.set(section.sectionType, existing);
  }

  return grouped;
}

/**
 * Creates a consolidated section content by combining related sections
 */
export function consolidateSections(
  sections: ParsedSection[]
): { title: string; content: string } {
  if (sections.length === 0) {
    return { title: '', content: '' };
  }

  if (sections.length === 1) {
    return {
      title: sections[0].title,
      content: sections[0].content,
    };
  }

  // Multiple sections of same type - combine them
  const combinedContent = sections.map(s => s.content).join('\n\n---\n\n');
  const combinedTitle = sections.map(s => s.title).join(' / ');

  return {
    title: combinedTitle,
    content: combinedContent,
  };
}

/**
 * Main function to prepare auto-populated binder items from state binder content
 */
export interface AutoPopulatedItem {
  title: string;
  content: string;
  sectionType: BinderSectionType;
  sourceSection: string; // Original header(s) this came from
}

export function prepareAutoPopulatedItems(
  markdownContent: string,
  stateName: string
): AutoPopulatedItem[] {
  const parsedSections = parseBinderSections(markdownContent);
  const groupedSections = groupSectionsByType(parsedSections);

  const items: AutoPopulatedItem[] = [];

  // Process each section type that has content
  for (const [sectionType, sections] of groupedSections) {
    // Skip 'general' sections for auto-population
    // (these will be saved as the full binder instead)
    if (sectionType === 'general') continue;

    const consolidated = consolidateSections(sections);

    if (consolidated.content) {
      items.push({
        title: `${stateName} - ${getSectionTypeLabel(sectionType)}`,
        content: consolidated.content,
        sectionType,
        sourceSection: consolidated.title,
      });
    }
  }

  return items;
}

/**
 * Human-readable labels for section types
 */
function getSectionTypeLabel(sectionType: BinderSectionType): string {
  const labels: Record<BinderSectionType, string> = {
    model_definition: 'Model Definition',
    licensure: 'Licensure Requirements',
    housing_categories: 'Housing Categories',
    local: 'Local Requirements',
    fha: 'Fair Housing',
    operational: 'Operational Requirements',
    notes: 'Notes',
    general: 'General',
  };
  return labels[sectionType] || sectionType;
}

export { getSectionTypeLabel };

// ============================================================================
// PHASE 2: Enhanced Extraction with Bullet Points
// ============================================================================

export interface ExtractedKeyPoint {
  text: string;
  importance: 'high' | 'medium' | 'low';
}

export interface EnhancedSection extends ParsedSection {
  keyPoints: ExtractedKeyPoint[];
  summary: string;
}

/**
 * Extracts key points from section content
 * Looks for:
 * - Bullet points (- or *)
 * - Numbered lists
 * - Bold text (**text**)
 * - Key regulatory phrases
 */
function extractKeyPoints(content: string): ExtractedKeyPoint[] {
  const keyPoints: ExtractedKeyPoint[] = [];
  const lines = content.split('\n');

  // Patterns for important content
  const highImportancePatterns = [
    /must|required|mandatory|shall|prohibited|illegal|violation/i,
    /license|permit|certification|registration/i,
    /penalty|fine|revocation|suspension/i,
    /\*\*([^*]+)\*\*/g, // Bold text
  ];

  const mediumImportancePatterns = [
    /should|recommended|advised|expected/i,
    /resident|occupant|client/i,
    /safety|health|welfare/i,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip headers and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Check for bullet points
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)/);
    const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)/);

    if (bulletMatch || numberedMatch) {
      const pointText = bulletMatch ? bulletMatch[1] : numberedMatch![1];

      // Determine importance
      let importance: 'high' | 'medium' | 'low' = 'low';

      for (const pattern of highImportancePatterns) {
        if (pattern.test(pointText)) {
          importance = 'high';
          break;
        }
      }

      if (importance === 'low') {
        for (const pattern of mediumImportancePatterns) {
          if (pattern.test(pointText)) {
            importance = 'medium';
            break;
          }
        }
      }

      keyPoints.push({ text: pointText.trim(), importance });
    }
  }

  // Also extract bold text as key points
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(content)) !== null) {
    const boldText = boldMatch[1].trim();
    // Avoid duplicates
    if (!keyPoints.some(p => p.text.includes(boldText))) {
      keyPoints.push({ text: boldText, importance: 'high' });
    }
  }

  return keyPoints;
}

/**
 * Generates a brief summary of section content
 * Takes first sentence or first 150 characters
 */
function generateSummary(content: string): string {
  // Skip the header line
  const lines = content.split('\n').filter(l => !l.trim().startsWith('#'));
  const textContent = lines.join(' ').trim();

  // Find first complete sentence
  const sentenceMatch = textContent.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch && sentenceMatch[0].length <= 200) {
    return sentenceMatch[0].trim();
  }

  // Otherwise, take first 150 characters
  if (textContent.length <= 150) {
    return textContent;
  }

  return textContent.substring(0, 147) + '...';
}

/**
 * Phase 2: Enhanced parsing with key points and summaries
 */
export function parseBinderSectionsEnhanced(markdownContent: string): EnhancedSection[] {
  const basicSections = parseBinderSections(markdownContent);

  return basicSections.map(section => ({
    ...section,
    keyPoints: extractKeyPoints(section.content),
    summary: generateSummary(section.content),
  }));
}

/**
 * Phase 2: Prepare auto-populated items with key points
 */
export interface AutoPopulatedItemEnhanced extends AutoPopulatedItem {
  keyPoints: ExtractedKeyPoint[];
  summary: string;
}

export function prepareAutoPopulatedItemsEnhanced(
  markdownContent: string,
  stateName: string
): AutoPopulatedItemEnhanced[] {
  const enhancedSections = parseBinderSectionsEnhanced(markdownContent);
  const groupedSections = new Map<BinderSectionType, EnhancedSection[]>();

  // Group by section type
  for (const section of enhancedSections) {
    const existing = groupedSections.get(section.sectionType) || [];
    existing.push(section);
    groupedSections.set(section.sectionType, existing);
  }

  const items: AutoPopulatedItemEnhanced[] = [];

  for (const [sectionType, sections] of groupedSections) {
    // Skip 'general' sections for auto-population
    if (sectionType === 'general') continue;

    // Combine key points from all sections of same type
    const allKeyPoints: ExtractedKeyPoint[] = [];
    for (const section of sections) {
      allKeyPoints.push(...section.keyPoints);
    }

    // Deduplicate key points
    const uniqueKeyPoints = allKeyPoints.filter((point, index, self) =>
      index === self.findIndex(p => p.text === point.text)
    );

    // Sort by importance
    uniqueKeyPoints.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.importance] - order[b.importance];
    });

    const consolidated = consolidateSections(sections);

    if (consolidated.content) {
      items.push({
        title: `${stateName} - ${getSectionTypeLabel(sectionType)}`,
        content: consolidated.content,
        sectionType,
        sourceSection: consolidated.title,
        keyPoints: uniqueKeyPoints.slice(0, 10), // Top 10 key points
        summary: sections[0]?.summary || '',
      });
    }
  }

  return items;
}
