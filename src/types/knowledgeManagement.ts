// ============================================================================
// KNOWLEDGE MANAGEMENT SYSTEM TYPES
// ============================================================================
// Types for the unified Admin Knowledge Base Manager supporting
// all three AI agents: Nette (GroupHome), MIO (Mind Insurance), ME (Money Evolution)
// ============================================================================

import { CoachType } from './coach';

// Re-export CoachType as AgentType for semantic clarity in knowledge context
export type AgentType = CoachType;

// ============================================================================
// SOURCE TYPES
// ============================================================================

export type KnowledgeSourceType = 'google_drive' | 'google_docs' | 'notion' | 'file_upload';

export interface SourceTypeConfig {
  id: KnowledgeSourceType;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  validationPattern?: RegExp;
}

export const SOURCE_TYPE_CONFIGS: Record<KnowledgeSourceType, SourceTypeConfig> = {
  google_drive: {
    id: 'google_drive',
    label: 'Google Drive',
    icon: 'FolderOpen',
    description: 'Import from Google Drive folder or file',
    placeholder: 'https://drive.google.com/...',
    validationPattern: /^https:\/\/drive\.google\.com\//
  },
  google_docs: {
    id: 'google_docs',
    label: 'Google Docs',
    icon: 'FileText',
    description: 'Import from Google Docs document',
    placeholder: 'https://docs.google.com/document/...',
    validationPattern: /^https:\/\/docs\.google\.com\/document\//
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    icon: 'BookOpen',
    description: 'Import from Notion page or database',
    placeholder: 'https://notion.so/...',
    validationPattern: /^https:\/\/(www\.)?notion\.so\//
  },
  file_upload: {
    id: 'file_upload',
    label: 'File Upload',
    icon: 'Upload',
    description: 'Upload PDF, DOCX, TXT, or MD files',
    placeholder: 'Drag and drop files or click to browse'
  }
};

// ============================================================================
// AGENT CATEGORIES
// ============================================================================

// Nette (GroupHome) categories - stored in nette_knowledge_chunks
// Updated 2025-12-09 to match actual database categories
export type NetteCategory =
  | 'mentorship_training'
  | 'group_home_tactics'
  | 'licensing'
  | 'compliance'
  | 'operations'
  | 'demographics'
  | 'staffing'
  | 'funding'
  | 'marketing'
  | 'financial'
  | 'legal'
  | 'setup'
  | 'training'
  | 'resident_care'
  | 'property_search'
  | 'app_navigation'
  | 'general';

// MIO (Mind Insurance) categories - stored in mio_knowledge_chunks
export type MIOCategory =
  | 'identity_patterns'
  | 'protect_practices'
  | 'neural_rewiring'
  | 'behavioral_psychology'
  | 'mindset_coaching'
  | 'accountability'
  | 'general';

// ME (Money Evolution) categories - stored in me_knowledge_chunks
export type MECategory =
  | 'wealth_mindset'
  | 'investment_strategies'
  | 'financial_planning'
  | 'abundance_psychology'
  | 'cash_flow'
  | 'funding_sources'
  | 'general';

// Union type for all categories
export type KnowledgeCategory = NetteCategory | MIOCategory | MECategory;

// Category configuration for UI
export interface CategoryConfig {
  id: string;
  label: string;
  description: string;
  color: string;
}

export const NETTE_CATEGORIES: Record<NetteCategory, CategoryConfig> = {
  mentorship_training: {
    id: 'mentorship_training',
    label: 'Mentorship Training',
    description: 'Keston mentorship and training content',
    color: 'bg-amber-100 text-amber-800'
  },
  group_home_tactics: {
    id: 'group_home_tactics',
    label: 'Group Home Tactics',
    description: 'Weekly tactics and implementation strategies',
    color: 'bg-blue-100 text-blue-800'
  },
  licensing: {
    id: 'licensing',
    label: 'Licensing',
    description: 'State licensing requirements and processes',
    color: 'bg-purple-100 text-purple-800'
  },
  compliance: {
    id: 'compliance',
    label: 'Compliance',
    description: 'Regulatory compliance and documentation',
    color: 'bg-red-100 text-red-800'
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    description: 'Day-to-day operations and procedures',
    color: 'bg-green-100 text-green-800'
  },
  demographics: {
    id: 'demographics',
    label: 'Demographics',
    description: 'Population-specific guidance and resources',
    color: 'bg-yellow-100 text-yellow-800'
  },
  staffing: {
    id: 'staffing',
    label: 'Staffing',
    description: 'Hiring, training, and staff management',
    color: 'bg-orange-100 text-orange-800'
  },
  funding: {
    id: 'funding',
    label: 'Funding',
    description: 'Funding sources and reimbursement',
    color: 'bg-emerald-100 text-emerald-800'
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    description: 'Marketing and referral strategies',
    color: 'bg-pink-100 text-pink-800'
  },
  financial: {
    id: 'financial',
    label: 'Financial',
    description: 'Financial planning and business setup',
    color: 'bg-lime-100 text-lime-800'
  },
  legal: {
    id: 'legal',
    label: 'Legal',
    description: 'Legal requirements and documentation',
    color: 'bg-slate-100 text-slate-800'
  },
  setup: {
    id: 'setup',
    label: 'Setup',
    description: 'Initial business setup and configuration',
    color: 'bg-cyan-100 text-cyan-800'
  },
  training: {
    id: 'training',
    label: 'Training',
    description: 'Staff and operational training',
    color: 'bg-indigo-100 text-indigo-800'
  },
  resident_care: {
    id: 'resident_care',
    label: 'Resident Care',
    description: 'Resident care and support protocols',
    color: 'bg-rose-100 text-rose-800'
  },
  property_search: {
    id: 'property_search',
    label: 'Property Search',
    description: 'Finding and acquiring properties',
    color: 'bg-teal-100 text-teal-800'
  },
  app_navigation: {
    id: 'app_navigation',
    label: 'App Navigation',
    description: 'How to use the application',
    color: 'bg-violet-100 text-violet-800'
  },
  general: {
    id: 'general',
    label: 'General',
    description: 'General group home knowledge',
    color: 'bg-gray-100 text-gray-800'
  }
};

export const MIO_CATEGORIES: Record<MIOCategory, CategoryConfig> = {
  identity_patterns: {
    id: 'identity_patterns',
    label: 'Identity Patterns',
    description: 'Identity collision and pattern recognition',
    color: 'bg-cyan-100 text-cyan-800'
  },
  protect_practices: {
    id: 'protect_practices',
    label: 'PROTECT Practices',
    description: 'Daily PROTECT method practices',
    color: 'bg-teal-100 text-teal-800'
  },
  neural_rewiring: {
    id: 'neural_rewiring',
    label: 'Neural Rewiring',
    description: 'Neural pathway and habit formation',
    color: 'bg-indigo-100 text-indigo-800'
  },
  behavioral_psychology: {
    id: 'behavioral_psychology',
    label: 'Behavioral Psychology',
    description: 'Psychology of behavior change',
    color: 'bg-violet-100 text-violet-800'
  },
  mindset_coaching: {
    id: 'mindset_coaching',
    label: 'Mindset Coaching',
    description: 'Mindset shift techniques',
    color: 'bg-fuchsia-100 text-fuchsia-800'
  },
  accountability: {
    id: 'accountability',
    label: 'Accountability',
    description: 'Accountability systems and partner guidance',
    color: 'bg-rose-100 text-rose-800'
  },
  general: {
    id: 'general',
    label: 'General',
    description: 'General mindset knowledge',
    color: 'bg-gray-100 text-gray-800'
  }
};

export const ME_CATEGORIES: Record<MECategory, CategoryConfig> = {
  wealth_mindset: {
    id: 'wealth_mindset',
    label: 'Wealth Mindset',
    description: 'Psychology of wealth and abundance',
    color: 'bg-emerald-100 text-emerald-800'
  },
  investment_strategies: {
    id: 'investment_strategies',
    label: 'Investment Strategies',
    description: 'Investment approaches and ROI optimization',
    color: 'bg-green-100 text-green-800'
  },
  financial_planning: {
    id: 'financial_planning',
    label: 'Financial Planning',
    description: 'Financial planning and budgeting',
    color: 'bg-lime-100 text-lime-800'
  },
  abundance_psychology: {
    id: 'abundance_psychology',
    label: 'Abundance Psychology',
    description: 'Scarcity vs abundance mindset',
    color: 'bg-teal-100 text-teal-800'
  },
  cash_flow: {
    id: 'cash_flow',
    label: 'Cash Flow',
    description: 'Cash flow management and optimization',
    color: 'bg-cyan-100 text-cyan-800'
  },
  funding_sources: {
    id: 'funding_sources',
    label: 'Funding Sources',
    description: 'Creative financing and funding options',
    color: 'bg-sky-100 text-sky-800'
  },
  general: {
    id: 'general',
    label: 'General',
    description: 'General financial knowledge',
    color: 'bg-gray-100 text-gray-800'
  }
};

// Helper to get categories for a specific agent
export function getCategoriesForAgent(agent: AgentType): Record<string, CategoryConfig> {
  switch (agent) {
    case 'nette':
      return NETTE_CATEGORIES;
    case 'mio':
      return MIO_CATEGORIES;
    case 'me':
      return ME_CATEGORIES;
  }
}

// ============================================================================
// KNOWLEDGE CHUNK TYPES (Per-Agent)
// ============================================================================

// Base knowledge chunk interface
export interface BaseKnowledgeChunk {
  id: string;
  content: string;
  category: string;
  source_url?: string;
  source_type?: KnowledgeSourceType;
  source_title?: string;
  metadata?: Record<string, unknown>;
  chunk_index?: number;
  total_chunks?: number;
  created_at: string;
  updated_at?: string;
}

// Nette knowledge chunk (gh_training_chunks)
export interface NetteKnowledgeChunk extends BaseKnowledgeChunk {
  agent_type: 'nette';
  chunk_text: string; // gh_training_chunks uses chunk_text instead of content
  source_file?: string;
  tactic_id?: string;
  week_number?: number;
  priority_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  upload_metadata?: Record<string, unknown>;
  uploaded_by?: string;
}

// MIO knowledge chunk (mio_knowledge_chunks)
export interface MIOKnowledgeChunk extends BaseKnowledgeChunk {
  agent_type: 'mio';
  created_by?: string;
}

// ME knowledge chunk (me_knowledge_chunks)
export interface MEKnowledgeChunk extends BaseKnowledgeChunk {
  agent_type: 'me';
  created_by?: string;
}

// Union type for all knowledge chunks
export type KnowledgeChunkUnion = NetteKnowledgeChunk | MIOKnowledgeChunk | MEKnowledgeChunk;

// Normalized knowledge chunk for UI display
export interface NormalizedKnowledgeChunk {
  id: string;
  agent_type: AgentType;
  content: string;
  category: string;
  source_url?: string;
  source_type?: KnowledgeSourceType;
  source_title?: string;
  metadata?: Record<string, unknown>;
  chunk_index?: number;
  total_chunks?: number;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// PROCESSING QUEUE TYPES
// ============================================================================

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingQueueItem {
  id: string;
  agent_type: AgentType;
  source_type: KnowledgeSourceType;
  source_url?: string;
  source_title?: string;
  category: string;
  status: ProcessingStatus;
  error_message?: string;
  chunks_created: number;
  submitted_by?: string;
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// ============================================================================
// KNOWLEDGE STATS TYPES
// ============================================================================

export interface KnowledgeStats {
  agent_type: AgentType;
  category: string;
  chunk_count: number;
  last_updated: string;
}

export interface AgentKnowledgeSummary {
  agent: AgentType;
  totalChunks: number;
  categoryCounts: Record<string, number>;
  lastUpdated: string;
}

// ============================================================================
// INGESTION REQUEST TYPES
// ============================================================================

export interface KnowledgeIngestionRequest {
  agent_type: AgentType;
  source_type: KnowledgeSourceType;
  source_url?: string;
  source_title?: string;
  category: string;
  content?: string; // For direct text/file upload
  file?: File; // For file uploads
  metadata?: Record<string, unknown>;
}

export interface BulkIngestionRequest {
  agent_type: AgentType;
  items: Array<{
    source_type: KnowledgeSourceType;
    source_url?: string;
    source_title?: string;
    category: string;
    content?: string;
  }>;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface KnowledgeManagerState {
  selectedAgent: AgentType;
  selectedCategory: string | null;
  selectedSourceType: KnowledgeSourceType;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface KnowledgeFilter {
  agent?: AgentType;
  category?: string;
  sourceType?: KnowledgeSourceType;
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  color: string;
  gradient: string;
  tableName: string;
  categories: Record<string, CategoryConfig>;
}

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  nette: {
    id: 'nette',
    name: 'Nette',
    description: 'Group Home Expert - Tactics, licensing, compliance, operations',
    color: 'hsl(221 83% 53%)',
    gradient: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(221 70% 60%))',
    tableName: 'nette_knowledge_chunks', // Updated from gh_training_chunks (2025-12-09)
    categories: NETTE_CATEGORIES
  },
  mio: {
    id: 'mio',
    name: 'MIO',
    description: 'Mind Insurance Oracle - Identity patterns, PROTECT practices, neural rewiring',
    color: '#05c3dd',
    gradient: 'linear-gradient(135deg, #05c3dd, #0099aa)',
    tableName: 'mio_knowledge_chunks',
    categories: MIO_CATEGORIES
  },
  me: {
    id: 'me',
    name: 'ME',
    description: 'Money Evolution - Wealth mindset, investment strategies, financial planning',
    color: 'hsl(142 70% 45%)',
    gradient: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 55%))',
    tableName: 'me_knowledge_chunks',
    categories: ME_CATEGORIES
  }
};

// ============================================================================
// N8N WEBHOOK TYPES
// ============================================================================

export interface N8NWebhookPayload {
  action: 'process_knowledge';
  agent_type: AgentType;
  source_type: KnowledgeSourceType;
  source_url?: string;
  source_title?: string;
  category: string;
  queue_id: string;
  metadata?: Record<string, unknown>;
}

export interface N8NWebhookResponse {
  success: boolean;
  queue_id: string;
  message: string;
  chunks_created?: number;
  error?: string;
}
