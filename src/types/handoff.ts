import { CoachType } from "./coach";

export interface HandoffSuggestion {
  suggestedAgent: CoachType;
  reason: string;
  confidence: number;
  detectedKeywords: string[];
  method?: 'semantic_similarity' | 'keyword_match';
}

export interface HandoffContext {
  previousAgent: CoachType;
  conversationSummary: string;
  userProfile: Record<string, any>;
  currentObjective: string;
  suggestedAction: string;
  transferReason: string;
}

export const AGENT_KEYWORDS: Record<CoachType, string[]> = {
  nette: [
    "getting started",
    "requirements",
    "license",
    "licensing",
    "assessment",
    "regulations",
    "compliance",
    "state rules",
    "population",
    "demographics",
    "who to serve",
    "roadmap",
    "onboarding",
    "where to start",
  ],
  mio: [
    "accountability",
    "stuck",
    "pattern",
    "mindset",
    "procrastination",
    "fear",
    "doubt",
    "sabotage",
    "breakthrough",
    "transformation",
    "identity",
    "collision",
    "practice",
    "protect",
    "mental block",
  ],
  me: [
    "financing",
    "funding",
    "money",
    "investment",
    "roi",
    "cash flow",
    "revenue",
    "profit",
    "creative financing",
    "seller finance",
    "subject-to",
    "capital",
    "budget",
    "cost",
    "financial",
  ],
};
