// Document Management Types
// Database schema mapping for gh_documents, gh_document_tactic_links, gh_user_document_activity

export interface GHDocument {
  id: number;
  document_name: string;
  category: DocumentCategory;
  description: string | null;
  document_url: string;
  applicable_states: string[] | null;
  ownership_model: OwnershipModel[] | null;
  applicable_populations: ApplicablePopulation[] | null;
  difficulty: DifficultyLevel | null;
  created_at: string;
  created_by: string | null;
  file_size_kb: number | null;
  file_type: string | null;
  download_count: number;
  view_count: number;
  avg_rating: number | null;
  updated_at: string;
}

export type DocumentCategory =
  | 'operations'
  | 'marketing'
  | 'financial'
  | 'legal'
  | 'revenue'
  | 'compliance';

export type OwnershipModel =
  | 'individual'
  | 'llc'
  | 'corporation'
  | 'partnership'
  | 'nonprofit';

export type ApplicablePopulation =
  | 'adult'
  | 'youth'
  | 'seniors'
  | 'veterans'
  | 'special_needs';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type TacticLinkType = 'required' | 'recommended' | 'supplemental';

export interface GHDocumentTacticLink {
  id: number;
  document_id: number;
  tactic_id: string;
  link_type: TacticLinkType;
  display_order: number | null;
  created_at: string;
}

export interface GHUserDocumentActivity {
  id: number;
  user_id: string;
  document_id: number;
  activity_type: 'view' | 'download';
  activity_timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
}

// Enhanced types for UI components
export interface DocumentWithLinks extends GHDocument {
  tactic_links: GHDocumentTacticLink[];
}

export interface DocumentUploadPayload {
  file: File;
  metadata: {
    document_name: string;
    category: DocumentCategory;
    description?: string;
    applicable_states?: string[];
    ownership_model?: OwnershipModel[];
    applicable_populations?: ApplicablePopulation[];
    difficulty?: DifficultyLevel;
  };
}

export interface DocumentAnalytics {
  totalDocuments: number;
  totalDownloads: number;
  totalViews: number;
  mostPopularDocument: {
    id: number;
    name: string;
    views: number;
  } | null;
  documentsByCategory: Record<DocumentCategory, number>;
}

export interface DocumentFilters {
  category?: DocumentCategory;
  states?: string[];
  ownershipModel?: OwnershipModel[];
  difficulty?: DifficultyLevel;
  searchQuery?: string;
}

export interface DocumentTableRow extends GHDocument {
  isEditing?: boolean;
}

// US States list for multi-select dropdown
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'operations',
  'marketing',
  'financial',
  'legal',
  'revenue',
  'compliance'
];

export const OWNERSHIP_MODELS: OwnershipModel[] = [
  'individual',
  'llc',
  'corporation',
  'partnership',
  'nonprofit'
];

export const APPLICABLE_POPULATIONS: ApplicablePopulation[] = [
  'adult',
  'youth',
  'seniors',
  'veterans',
  'special_needs'
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced'
];

export const TACTIC_LINK_TYPES: TacticLinkType[] = [
  'required',
  'recommended',
  'supplemental'
];

// Enhanced types for user-facing document display
export type LinkType = 'required' | 'recommended' | 'supplemental';

export interface DocumentTacticLink {
  id: number;
  document_id: number;
  tactic_id: string;
  link_type: LinkType;
  display_order: number;
  created_at: string;
}

export interface TacticDocument extends GHDocument {
  link_type: LinkType;
  display_order: number;
}

// Helper functions for display
export const formatCategory = (category: DocumentCategory): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export const formatOwnershipModel = (model: OwnershipModel): string => {
  if (model === 'llc') return 'LLC';
  return model.charAt(0).toUpperCase() + model.slice(1);
};

export const formatPopulation = (population: ApplicablePopulation): string => {
  return population.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const formatFileSize = (kb: number | null): string => {
  if (!kb) return 'Unknown';
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
};

// AI-powered tactic suggestion types
export interface AITacticSuggestion {
  documentId: number;
  documentName: string;
  tacticId: string;
  tacticName: string;
  confidence: number;
  suggestedLinkType: TacticLinkType;
  matchReasons: string;
}

export interface AITacticSuggestionDisplay {
  tacticId: string;
  tacticName: string;
  confidence: number;
  suggestedLinkType: TacticLinkType;
  matchReasons: string;
}

// Helper function to get confidence badge variant
export const getConfidenceBadgeVariant = (confidence: number): 'default' | 'secondary' | 'outline' => {
  if (confidence >= 90) return 'default'; // Green (default is primary)
  if (confidence >= 75) return 'default'; // Blue
  if (confidence >= 60) return 'secondary'; // Yellow
  return 'outline'; // Gray
};

// Helper function to get confidence color class
export const getConfidenceColorClass = (confidence: number): string => {
  if (confidence >= 90) return 'bg-green-500 text-white';
  if (confidence >= 75) return 'bg-blue-500 text-white';
  if (confidence >= 60) return 'bg-yellow-500 text-black';
  return 'bg-gray-400 text-white';
};
