// Intelligent Document-Tactic Matching Algorithm
// Confidence scoring system with multi-factor analysis

import type { GHDocument } from '../src/types/documents';

export interface TacticInfo {
  tactic_id: string;
  tactic_name: string;
  category: string;
  parent_category: string;
  week_assignment: number;
  why_it_matters?: string;
}

export interface MatchResult {
  tacticId: string;
  tacticName: string;
  confidence: number;
  linkType: 'required' | 'recommended' | 'supplemental';
  matchReasons: string[];
}

/**
 * Calculate keyword overlap between two strings
 */
const calculateKeywordScore = (text1: string, text2: string): number => {
  const normalize = (str: string) =>
    str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out short words

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Category mapping for intelligent matching
 * Maps document categories to tactic parent_category patterns
 */
const categoryMapping: Record<string, string[]> = {
  'legal': ['legal', 'compliance', 'licensing', 'contract'],
  'financial': ['financial', 'revenue', 'budget', 'funding', 'capital'],
  'operations': ['operations', 'property', 'staffing', 'resident', 'daily'],
  'marketing': ['marketing', 'lead generation', 'branding', 'referral'],
  'compliance': ['compliance', 'legal', 'licensing', 'certification', 'regulation'],
  'revenue': ['revenue', 'financial', 'income', 'payment'],
};

/**
 * Find matching tactics for a document using intelligent scoring
 */
export const findMatchingTactics = (
  document: GHDocument,
  tactics: TacticInfo[]
): MatchResult[] => {
  const matches: MatchResult[] = [];

  for (const tactic of tactics) {
    let confidence = 0;
    const reasons: string[] = [];

    // 1. Category-based matching (40 points)
    const docCategory = document.category.toLowerCase();
    const tacticCategories = categoryMapping[docCategory] || [];

    if (tacticCategories.some(cat =>
      tactic.parent_category?.toLowerCase().includes(cat.toLowerCase()) ||
      tactic.category?.toLowerCase().includes(cat.toLowerCase())
    )) {
      confidence += 40;
      reasons.push(`Category match: ${docCategory} → ${tactic.parent_category}`);
    }

    // 2. Keyword matching in document name vs tactic name (30 points max)
    const nameScore = calculateKeywordScore(
      document.document_name,
      tactic.tactic_name
    );
    const namePoints = Math.round(nameScore * 30);
    if (namePoints > 0) {
      confidence += namePoints;
      reasons.push(`Keyword overlap: ${Math.round(nameScore * 100)}%`);
    }

    // 3. Description semantic matching (20 points max)
    if (document.description && tactic.why_it_matters) {
      const descScore = calculateKeywordScore(
        document.description,
        tactic.why_it_matters
      );
      const descPoints = Math.round(descScore * 20);
      if (descPoints > 0) {
        confidence += descPoints;
        reasons.push(`Description relevance: ${Math.round(descScore * 100)}%`);
      }
    }

    // 4. Temporal relevance bonus (10 points)
    const weekKeywords = ['week', 'w1', 'w2', 'w3', 'phase'];
    const hasTemporalRef = weekKeywords.some(kw =>
      document.document_name.toLowerCase().includes(kw)
    );
    if (hasTemporalRef && tactic.week_assignment) {
      confidence += 10;
      reasons.push(`Temporal alignment: Week ${tactic.week_assignment}`);
    }

    // 5. Ownership model bonus (5 points)
    if (document.ownership_model && document.ownership_model.length > 0) {
      confidence += 5;
      reasons.push(`Ownership context: ${document.ownership_model.join(', ')}`);
    }

    // Determine link type based on confidence
    let linkType: 'required' | 'recommended' | 'supplemental';
    if (confidence >= 75) {
      linkType = 'required';
    } else if (confidence >= 55) {
      linkType = 'recommended';
    } else {
      linkType = 'supplemental';
    }

    // Only include matches with confidence >= 40%
    if (confidence >= 40) {
      matches.push({
        tacticId: tactic.tactic_id,
        tacticName: tactic.tactic_name,
        confidence,
        linkType,
        matchReasons: reasons,
      });
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Filter matches by confidence threshold
 */
export const filterByConfidence = (
  matches: MatchResult[],
  minConfidence: number
): MatchResult[] => {
  return matches.filter(m => m.confidence >= minConfidence);
};

/**
 * Group matches by confidence level
 */
export const groupByConfidenceLevel = (matches: MatchResult[]) => {
  return {
    highConfidence: matches.filter(m => m.confidence >= 70),
    mediumConfidence: matches.filter(m => m.confidence >= 55 && m.confidence < 70),
    lowConfidence: matches.filter(m => m.confidence >= 40 && m.confidence < 55),
  };
};
