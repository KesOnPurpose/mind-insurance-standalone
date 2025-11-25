// Document Management Service
// All Supabase CRUD operations for gh_documents, gh_document_tactic_links, gh_user_document_activity

import { supabase } from '@/integrations/supabase/client';
import type {
  GHDocument,
  GHDocumentTacticLink,
  GHUserDocumentActivity,
  DocumentFilters,
  DocumentAnalytics,
  DocumentCategory,
  TacticLinkType,
  DocumentWithLinks,
} from '@/types/documents';

// ============================================================================
// DOCUMENT CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all documents with optional filters
 */
export const fetchDocuments = async (
  filters?: DocumentFilters
): Promise<GHDocument[]> => {
  try {
    let query = supabase
      .from('gh_documents')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.states && filters.states.length > 0) {
      query = query.overlaps('applicable_states', filters.states);
    }

    if (filters?.ownershipModel && filters.ownershipModel.length > 0) {
      query = query.overlaps('ownership_model', filters.ownershipModel);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `document_name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

/**
 * Fetch a single document by ID with tactic links
 */
export const fetchDocumentById = async (
  documentId: number
): Promise<DocumentWithLinks | null> => {
  try {
    const { data: document, error: docError } = await supabase
      .from('gh_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;
    if (!document) return null;

    const { data: tacticLinks, error: linksError } = await supabase
      .from('gh_document_tactic_links')
      .select('*')
      .eq('document_id', documentId)
      .order('display_order', { ascending: true });

    if (linksError) throw linksError;

    return {
      ...document,
      tactic_links: tacticLinks || [],
    };
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    throw error;
  }
};

/**
 * Upload file to Supabase Storage and create document record
 */
export const uploadDocument = async (
  file: File,
  category: DocumentCategory,
  adminId: string
): Promise<{ documentUrl: string; storagePath: string }> => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${category}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-materials')
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('training-materials')
      .getPublicUrl(storagePath);

    return {
      documentUrl: publicUrl,
      storagePath: uploadData.path,
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Create document record in database
 */
export const createDocumentRecord = async (
  documentData: Partial<GHDocument>,
  adminId: string
): Promise<GHDocument> => {
  try {
    const { data, error } = await supabase
      .from('gh_documents')
      .insert([
        {
          ...documentData,
          created_by: adminId,
          download_count: 0,
          view_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating document record:', error);
    throw error;
  }
};

/**
 * Update document metadata
 */
export const updateDocument = async (
  documentId: number,
  updates: Partial<GHDocument>
): Promise<GHDocument> => {
  try {
    const { data, error } = await supabase
      .from('gh_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete document (hard delete - no soft delete available without is_active column)
 */
export const deleteDocument = async (documentId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('gh_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Hard delete document and file from storage
 */
export const hardDeleteDocument = async (
  documentId: number,
  storagePath: string
): Promise<void> => {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('training-materials')
      .remove([storagePath]);

    if (storageError) console.warn('Storage deletion failed:', storageError);

    // Delete from database
    const { error: dbError } = await supabase
      .from('gh_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error hard deleting document:', error);
    throw error;
  }
};

// ============================================================================
// TACTIC LINK OPERATIONS
// ============================================================================

/**
 * Fetch tactic links for a document
 */
export const fetchTacticLinks = async (
  documentId: number
): Promise<GHDocumentTacticLink[]> => {
  try {
    const { data, error } = await supabase
      .from('gh_document_tactic_links')
      .select('*')
      .eq('document_id', documentId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tactic links:', error);
    throw error;
  }
};

/**
 * Create tactic link
 */
export const createTacticLink = async (
  documentId: number,
  tacticId: string,
  linkType: TacticLinkType,
  displayOrder: number | null,
  adminId: string
): Promise<GHDocumentTacticLink> => {
  try {
    const { data, error } = await supabase
      .from('gh_document_tactic_links')
      .insert([
        {
          document_id: documentId,
          tactic_id: tacticId,
          link_type: linkType,
          display_order: displayOrder,
          // Note: created_at is auto-generated by database default
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating tactic link:', error);
    throw error;
  }
};

/**
 * Update tactic link
 */
export const updateTacticLink = async (
  linkId: number,
  updates: Partial<GHDocumentTacticLink>
): Promise<GHDocumentTacticLink> => {
  try {
    const { data, error } = await supabase
      .from('gh_document_tactic_links')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating tactic link:', error);
    throw error;
  }
};

/**
 * Delete tactic link
 */
export const deleteTacticLink = async (linkId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('gh_document_tactic_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting tactic link:', error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

/**
 * Fetch document analytics summary
 */
export const fetchDocumentAnalytics = async (): Promise<DocumentAnalytics> => {
  try {
    const { data: documents, error } = await supabase
      .from('gh_documents')
      .select('id, document_name, category, download_count, view_count');

    if (error) throw error;

    const totalDocuments = documents?.length || 0;
    const totalDownloads = documents?.reduce(
      (sum, doc) => sum + (doc.download_count || 0),
      0
    ) || 0;
    const totalViews = documents?.reduce(
      (sum, doc) => sum + (doc.view_count || 0),
      0
    ) || 0;

    // Find most popular document by views
    const mostPopular = documents?.reduce((prev, current) =>
      (current.view_count || 0) > (prev.view_count || 0) ? current : prev
    , documents[0]);

    // Count documents by category
    const documentsByCategory = documents?.reduce((acc, doc) => {
      acc[doc.category as DocumentCategory] = (acc[doc.category as DocumentCategory] || 0) + 1;
      return acc;
    }, {} as Record<DocumentCategory, number>) || {} as Record<DocumentCategory, number>;

    return {
      totalDocuments,
      totalDownloads,
      totalViews,
      mostPopularDocument: mostPopular
        ? {
            id: mostPopular.id,
            name: mostPopular.document_name,
            views: mostPopular.view_count || 0,
          }
        : null,
      documentsByCategory,
    };
  } catch (error) {
    console.error('Error fetching document analytics:', error);
    throw error;
  }
};

/**
 * Increment document view count
 */
export const incrementViewCount = async (documentId: number): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_document_views', {
      doc_id: documentId,
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const { data: doc } = await supabase
        .from('gh_documents')
        .select('view_count')
        .eq('id', documentId)
        .single();

      if (doc) {
        await supabase
          .from('gh_documents')
          .update({ view_count: (doc.view_count || 0) + 1 })
          .eq('id', documentId);
      }
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

/**
 * Increment document download count
 */
export const incrementDownloadCount = async (documentId: number): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_document_downloads', {
      doc_id: documentId,
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const { data: doc } = await supabase
        .from('gh_documents')
        .select('download_count')
        .eq('id', documentId)
        .single();

      if (doc) {
        await supabase
          .from('gh_documents')
          .update({ download_count: (doc.download_count || 0) + 1 })
          .eq('id', documentId);
      }
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};

/**
 * Log user document activity
 */
export const logDocumentActivity = async (
  userId: string,
  documentId: number,
  activityType: 'view' | 'download'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('gh_user_document_activity')
      .insert([
        {
          user_id: userId,
          document_id: documentId,
          activity_type: activityType,
          activity_timestamp: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging document activity:', error);
  }
};

// ============================================================================
// SEARCH & FILTER HELPERS
// ============================================================================

/**
 * Search documents by name or description
 */
export const searchDocuments = async (query: string): Promise<GHDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('gh_documents')
      .select('*')
      .or(`document_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Fetch all tactics for linking dropdown
 */
export const fetchAllTactics = async (): Promise<{ tactic_id: string; tactic_name: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('gh_tactic_instructions')
      .select('tactic_id, tactic_name')
      .order('tactic_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tactics:', error);
    throw error;
  }
};

// ============================================================================
// AI SUGGESTION OPERATIONS
// ============================================================================

/**
 * Fetch AI-powered tactic suggestions for a document
 * This function queries the review queue data (stored in database or CSV)
 * and returns the top suggestions sorted by confidence score
 */
export const fetchAISuggestions = async (
  documentId: number,
  limit: number = 10
): Promise<import('@/types/documents').AITacticSuggestionDisplay[]> => {
  try {
    // First, check if we have a review_queue table in Supabase
    // If not, we'll need to parse the CSV or implement alternative logic

    // For now, using a direct query approach
    // This assumes review queue data is in gh_document_tactic_suggestions table
    // If this table doesn't exist, we'll get an error and handle it

    const { data: suggestions, error } = await supabase
      .from('gh_document_tactic_suggestions')
      .select('*')
      .eq('document_id', documentId)
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist, fall back to empty array
      // In production, you might want to implement CSV parsing here
      console.warn('AI suggestions table not found, using fallback:', error);
      return [];
    }

    // Transform to display format
    return (suggestions || []).map((s) => ({
      tacticId: s.tactic_id,
      tacticName: s.tactic_name,
      confidence: s.confidence,
      suggestedLinkType: s.suggested_link_type,
      matchReasons: s.match_reasons,
    }));
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    // Return empty array instead of throwing to gracefully handle missing feature
    return [];
  }
};

/**
 * Fetch AI suggestions excluding already linked tactics
 */
export const fetchAvailableAISuggestions = async (
  documentId: number,
  existingTacticIds: string[],
  limit: number = 10
): Promise<import('@/types/documents').AITacticSuggestionDisplay[]> => {
  try {
    const allSuggestions = await fetchAISuggestions(documentId, 50); // Fetch more to filter

    // Filter out already linked tactics
    const availableSuggestions = allSuggestions.filter(
      (suggestion) => !existingTacticIds.includes(suggestion.tacticId)
    );

    // Return top N suggestions
    return availableSuggestions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching available AI suggestions:', error);
    return [];
  }
};
