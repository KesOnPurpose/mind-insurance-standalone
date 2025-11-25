// Knowledge Base Types
// Database schema mapping for nette_knowledge_chunks

import type { TacticDocument } from './documents';

export interface KnowledgeChunk {
  id: string;
  chunk_text: string;
  source_file: string;
  category: string;
  tactic_id?: string;
  week_number?: number;
  priority_level: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TacticResource {
  type: 'document' | 'knowledge';
  id: string | number;
  title: string;
  description: string;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  data: TacticDocument | KnowledgeChunk;
}

export const formatPriorityLevel = (level: 'HIGH' | 'MEDIUM' | 'LOW' | number | any): string => {
  // Handle case where level might be a number or other unexpected type
  const levelStr = String(level).toUpperCase();

  if (levelStr === 'HIGH' || levelStr === 'MEDIUM' || levelStr === 'LOW') {
    return levelStr.charAt(0) + levelStr.slice(1).toLowerCase();
  }

  // Default fallback
  return 'Medium';
};
