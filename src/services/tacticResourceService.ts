// Tactic Resource Service
// Fetches training materials and knowledge chunks for tactics

import { supabase } from '@/integrations/supabase/client';
import type { TacticDocument } from '@/types/documents';
import type { KnowledgeChunk, TacticResource } from '@/types/knowledge';

/**
 * Fetch documents linked to a specific tactic
 */
export const getTacticDocuments = async (tacticId: string): Promise<TacticDocument[]> => {
  // First get the document IDs with their link metadata
  const { data: links, error: linksError } = await supabase
    .from('gh_document_tactic_links')
    .select('document_id, link_type, display_order')
    .eq('tactic_id', tacticId)
    .order('link_type')
    .order('display_order');

  if (linksError) {
    console.error('Error fetching document links:', linksError);
    return [];
  }

  if (!links || links.length === 0) {
    return [];
  }

  // Then fetch the documents
  const documentIds = links.map(link => link.document_id);
  const { data: documents, error: docsError } = await supabase
    .from('gh_documents')
    .select('*')
    .in('id', documentIds);

  if (docsError) {
    console.error('Error fetching documents:', docsError);
    return [];
  }

  // Merge the link data with documents
  return (documents || []).map((doc: any) => {
    const link = links.find(l => l.document_id === doc.id);
    return {
      ...doc,
      link_type: link?.link_type || 'supplemental',
      display_order: link?.display_order || 0,
    };
  }).sort((a, b) => {
    // Sort by link_type first, then display_order
    if (a.link_type !== b.link_type) {
      const order = { required: 0, recommended: 1, supplemental: 2 };
      return order[a.link_type as keyof typeof order] - order[b.link_type as keyof typeof order];
    }
    return a.display_order - b.display_order;
  });
};

/**
 * Fetch knowledge chunks linked to a specific tactic
 */
export const getTacticKnowledge = async (tacticId: string): Promise<KnowledgeChunk[]> => {
  const { data, error } = await supabase
    .from('nette_knowledge_chunks')
    .select('*')
    .eq('tactic_id', tacticId)
    .order('priority_level', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching tactic knowledge:', error);
    throw error;
  }

  return data || [];
};

/**
 * Convert documents and knowledge chunks into unified TacticResource format
 */
export const getTacticResources = async (tacticId: string): Promise<TacticResource[]> => {
  const [documents, knowledge] = await Promise.all([
    getTacticDocuments(tacticId),
    getTacticKnowledge(tacticId),
  ]);

  const documentResources: TacticResource[] = documents.map((doc) => ({
    type: 'document' as const,
    id: doc.id,
    title: doc.document_name,
    description: doc.description || '',
    badge: getBadgeForLinkType(doc.link_type),
    badgeVariant: getBadgeVariantForLinkType(doc.link_type),
    data: doc,
  }));

  const knowledgeResources: TacticResource[] = knowledge.map((chunk) => ({
    type: 'knowledge' as const,
    id: chunk.id,
    title: chunk.source_file,
    description: chunk.chunk_text.substring(0, 200) + '...',
    badge: chunk.priority_level,
    badgeVariant: getBadgeVariantForPriority(chunk.priority_level),
    data: chunk,
  }));

  return [...documentResources, ...knowledgeResources];
};

/**
 * Helper: Get badge text for link type
 */
const getBadgeForLinkType = (linkType: string): string => {
  switch (linkType) {
    case 'required':
      return 'Required';
    case 'recommended':
      return 'Recommended';
    case 'supplemental':
      return 'Supplemental';
    default:
      return 'Resource';
  }
};

/**
 * Helper: Get badge variant for link type
 */
const getBadgeVariantForLinkType = (linkType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (linkType) {
    case 'required':
      return 'destructive'; // Red
    case 'recommended':
      return 'default'; // Yellow/gold
    case 'supplemental':
      return 'outline'; // Blue
    default:
      return 'secondary';
  }
};

/**
 * Helper: Get badge variant for priority level
 */
const getBadgeVariantForPriority = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (priority) {
    case 'HIGH':
      return 'destructive'; // Red
    case 'MEDIUM':
      return 'default'; // Yellow
    case 'LOW':
      return 'secondary'; // Gray
    default:
      return 'secondary';
  }
};
