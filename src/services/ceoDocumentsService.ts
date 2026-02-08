// CEO Documents Service
// CRUD operations for ceo_documents and ceo_extracted_facts tables
// NOTE: These are single-user CEO tables - no user_id filtering needed

import { supabase } from '@/integrations/supabase/client';
import type {
  CEODocument,
  CEODocumentCategory,
  CEODocumentUpload,
  CEOExtractedFact,
  CEOFactCategory,
} from '@/types/ceoDashboard';
import { isCEOUser } from './ceoPreferencesService';

// Storage bucket name
const STORAGE_BUCKET = 'ceo-documents';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Edge Function URL for document processing
const PROCESS_DOCUMENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ceo-document`;

// ============================================================================
// DOCUMENT PROCESSING
// ============================================================================

/**
 * Trigger document processing to extract summary, key points, and facts
 * This calls the process-ceo-document Edge Function asynchronously
 */
export const triggerDocumentProcessing = async (documentId: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.warn('[CEODocuments] No auth token, skipping processing trigger');
      return;
    }

    // Fire and forget - don't wait for processing to complete
    fetch(PROCESS_DOCUMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error('[CEODocuments] Processing trigger failed:', response.status);
        } else {
          console.log('[CEODocuments] Processing triggered for:', documentId);
        }
      })
      .catch((error) => {
        console.error('[CEODocuments] Processing trigger error:', error);
      });
  } catch (error) {
    console.error('[CEODocuments] Error triggering processing:', error);
    // Don't throw - processing is async and can fail silently
  }
};

// ============================================================================
// DOCUMENT CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all CEO documents (single-user table - no user_id filter)
 */
export const fetchCEODocuments = async (): Promise<CEODocument[]> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[CEODocuments] User is not authorized');
      return [];
    }

    const { data, error } = await supabase
      .from('ceo_documents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((doc) => ({
      id: doc.id,
      document_name: doc.document_name,
      document_description: doc.document_description,
      category: doc.category as CEODocumentCategory,
      file_type: doc.file_type,
      file_size_kb: doc.file_size_kb,
      storage_path: doc.storage_path,
      document_url: doc.document_url,
      processing_status: doc.processing_status,
      processed_at: doc.processed_at,
      extracted_summary: doc.extracted_summary,
      extracted_key_points: doc.extracted_key_points,
      is_active: doc.is_active,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }));
  } catch (error) {
    console.error('[CEODocuments] Error fetching:', error);
    throw error;
  }
};

/**
 * Fetch a single document by ID
 */
export const fetchCEODocumentById = async (documentId: string): Promise<CEODocument | null> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ceo_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      document_name: data.document_name,
      document_description: data.document_description,
      category: data.category as CEODocumentCategory,
      file_type: data.file_type,
      file_size_kb: data.file_size_kb,
      storage_path: data.storage_path,
      document_url: data.document_url,
      processing_status: data.processing_status,
      processed_at: data.processed_at,
      extracted_summary: data.extracted_summary,
      extracted_key_points: data.extracted_key_points,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEODocuments] Error fetching by ID:', error);
    throw error;
  }
};

/**
 * Upload a document to storage and create database record
 */
export const uploadCEODocument = async (
  upload: CEODocumentUpload
): Promise<CEODocument> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can upload documents');
    }

    const { file, category, document_name, document_description } = upload;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `ceo/${category}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file);

    if (uploadError) {
      console.error('[CEODocuments] Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get signed URL (private bucket)
    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    const documentUrl = urlData?.signedUrl || '';

    // Create database record
    const { data, error: dbError } = await supabase
      .from('ceo_documents')
      .insert([{
        document_name: document_name || file.name,
        document_description: document_description || '',
        category,
        file_type: file.type || getFileExtension(file.name),
        file_size_kb: Math.round(file.size / 1024),
        storage_path: storagePath,
        document_url: documentUrl,
        processing_status: 'pending',
        is_active: true,
      }])
      .select()
      .single();

    if (dbError) {
      // Rollback storage upload on DB error
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw dbError;
    }

    // Trigger async document processing (fire and forget)
    // This will extract summary, key points, and facts in the background
    triggerDocumentProcessing(data.id);

    return {
      id: data.id,
      document_name: data.document_name,
      document_description: data.document_description,
      category: data.category as CEODocumentCategory,
      file_type: data.file_type,
      file_size_kb: data.file_size_kb,
      storage_path: data.storage_path,
      document_url: data.document_url,
      processing_status: data.processing_status,
      processed_at: data.processed_at,
      extracted_summary: data.extracted_summary,
      extracted_key_points: data.extracted_key_points,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEODocuments] Error uploading:', error);
    throw error;
  }
};

/**
 * Update document metadata
 */
export const updateCEODocument = async (
  documentId: string,
  updates: Partial<Pick<CEODocument, 'document_name' | 'document_description' | 'category' | 'extracted_summary' | 'extracted_key_points' | 'processing_status'>>
): Promise<CEODocument> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ceo_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      document_name: data.document_name,
      document_description: data.document_description,
      category: data.category as CEODocumentCategory,
      file_type: data.file_type,
      file_size_kb: data.file_size_kb,
      storage_path: data.storage_path,
      document_url: data.document_url,
      processing_status: data.processing_status,
      processed_at: data.processed_at,
      extracted_summary: data.extracted_summary,
      extracted_key_points: data.extracted_key_points,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEODocuments] Error updating:', error);
    throw error;
  }
};

/**
 * Delete a document (soft delete by setting is_active = false)
 */
export const deleteCEODocument = async (documentId: string): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    // Soft delete - mark as inactive
    const { error: dbError } = await supabase
      .from('ceo_documents')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('[CEODocuments] Error deleting:', error);
    throw error;
  }
};

/**
 * Hard delete a document from storage and database
 */
export const hardDeleteCEODocument = async (documentId: string): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    // Get document to find storage path
    const doc = await fetchCEODocumentById(documentId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Delete from storage
    if (doc.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([doc.storage_path]);

      if (storageError) {
        console.warn('[CEODocuments] Storage deletion warning:', storageError);
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('ceo_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('[CEODocuments] Error hard deleting:', error);
    throw error;
  }
};

/**
 * Get a fresh signed URL for a document
 */
export const getDocumentSignedUrl = async (storagePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('[CEODocuments] Error getting signed URL:', error);
    throw error;
  }
};

// ============================================================================
// EXTRACTED FACTS CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all extracted facts (single-user table - no user_id filter)
 */
export const fetchCEOFacts = async (): Promise<CEOExtractedFact[]> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[CEOFacts] User is not authorized');
      return [];
    }

    const { data, error } = await supabase
      .from('ceo_extracted_facts')
      .select('*')
      .eq('is_incorrect', false) // Don't show facts marked as incorrect
      .order('confidence_score', { ascending: false });

    if (error) throw error;

    return (data || []).map((fact) => ({
      id: fact.id,
      slack_user_id: fact.slack_user_id,
      fact_category: fact.fact_category as CEOFactCategory,
      fact_key: fact.fact_key,
      fact_value: fact.fact_value,
      confidence_score: fact.confidence_score,
      source_type: fact.source_type,
      source_reference: fact.source_reference,
      is_verified: fact.is_verified,
      is_incorrect: fact.is_incorrect,
      correction_note: fact.correction_note,
      extracted_at: fact.extracted_at,
      last_referenced_at: fact.last_referenced_at,
      updated_at: fact.updated_at,
    }));
  } catch (error) {
    console.error('[CEOFacts] Error fetching:', error);
    throw error;
  }
};

/**
 * Fetch verified facts only
 */
export const fetchVerifiedFacts = async (): Promise<CEOExtractedFact[]> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) return [];

    const { data, error } = await supabase
      .from('ceo_extracted_facts')
      .select('*')
      .eq('is_verified', true)
      .eq('is_incorrect', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((fact) => ({
      id: fact.id,
      slack_user_id: fact.slack_user_id,
      fact_category: fact.fact_category as CEOFactCategory,
      fact_key: fact.fact_key,
      fact_value: fact.fact_value,
      confidence_score: fact.confidence_score,
      source_type: fact.source_type,
      source_reference: fact.source_reference,
      is_verified: fact.is_verified,
      is_incorrect: fact.is_incorrect,
      correction_note: fact.correction_note,
      extracted_at: fact.extracted_at,
      last_referenced_at: fact.last_referenced_at,
      updated_at: fact.updated_at,
    }));
  } catch (error) {
    console.error('[CEOFacts] Error fetching verified:', error);
    throw error;
  }
};

/**
 * Verify a fact (mark as confirmed correct)
 */
export const verifyFact = async (factId: string): Promise<CEOExtractedFact> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ceo_extracted_facts')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', factId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      slack_user_id: data.slack_user_id,
      fact_category: data.fact_category as CEOFactCategory,
      fact_key: data.fact_key,
      fact_value: data.fact_value,
      confidence_score: data.confidence_score,
      source_type: data.source_type,
      source_reference: data.source_reference,
      is_verified: data.is_verified,
      is_incorrect: data.is_incorrect,
      correction_note: data.correction_note,
      extracted_at: data.extracted_at,
      last_referenced_at: data.last_referenced_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEOFacts] Error verifying:', error);
    throw error;
  }
};

/**
 * Mark a fact as incorrect
 */
export const markFactIncorrect = async (factId: string, correctionNote?: string): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('ceo_extracted_facts')
      .update({
        is_incorrect: true,
        is_verified: false,
        correction_note: correctionNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', factId);

    if (error) throw error;
  } catch (error) {
    console.error('[CEOFacts] Error marking incorrect:', error);
    throw error;
  }
};

/**
 * Delete a fact permanently
 */
export const deleteFact = async (factId: string): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('ceo_extracted_facts')
      .delete()
      .eq('id', factId);

    if (error) throw error;
  } catch (error) {
    console.error('[CEOFacts] Error deleting:', error);
    throw error;
  }
};

/**
 * Update a fact's value
 */
export const updateFact = async (
  factId: string,
  updates: Partial<Pick<CEOExtractedFact, 'fact_key' | 'fact_value' | 'fact_category'>>
): Promise<CEOExtractedFact> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ceo_extracted_facts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', factId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      slack_user_id: data.slack_user_id,
      fact_category: data.fact_category as CEOFactCategory,
      fact_key: data.fact_key,
      fact_value: data.fact_value,
      confidence_score: data.confidence_score,
      source_type: data.source_type,
      source_reference: data.source_reference,
      is_verified: data.is_verified,
      is_incorrect: data.is_incorrect,
      correction_note: data.correction_note,
      extracted_at: data.extracted_at,
      last_referenced_at: data.last_referenced_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEOFacts] Error updating:', error);
    throw error;
  }
};

/**
 * Create a new fact manually
 */
export const createFact = async (
  fact: Omit<CEOExtractedFact, 'id' | 'extracted_at' | 'last_referenced_at' | 'updated_at'>
): Promise<CEOExtractedFact> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ceo_extracted_facts')
      .insert([{
        fact_category: fact.fact_category,
        fact_key: fact.fact_key,
        fact_value: fact.fact_value,
        confidence_score: fact.confidence_score || 1.0,
        source_type: fact.source_type || 'manual',
        source_reference: fact.source_reference,
        is_verified: true, // Manual entries are verified by default
        is_incorrect: false,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      slack_user_id: data.slack_user_id,
      fact_category: data.fact_category as CEOFactCategory,
      fact_key: data.fact_key,
      fact_value: data.fact_value,
      confidence_score: data.confidence_score,
      source_type: data.source_type,
      source_reference: data.source_reference,
      is_verified: data.is_verified,
      is_incorrect: data.is_incorrect,
      correction_note: data.correction_note,
      extracted_at: data.extracted_at,
      last_referenced_at: data.last_referenced_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('[CEOFacts] Error creating:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (sizeKb: number): string => {
  if (sizeKb === 0) return '0 KB';
  if (sizeKb < 1024) return `${sizeKb} KB`;
  return `${(sizeKb / 1024).toFixed(1)} MB`;
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: CEODocumentCategory): string => {
  const names: Record<CEODocumentCategory, string> = {
    assessment: 'Assessment',
    financial: 'Financial',
    strategic: 'Strategic',
    personal: 'Personal',
    other: 'Other',
  };
  return names[category] || category;
};

/**
 * Get fact category display name
 */
export const getFactCategoryDisplayName = (category: CEOFactCategory): string => {
  const names: Record<CEOFactCategory, string> = {
    personal: 'Personal',
    business: 'Business',
    preferences: 'Preferences',
    relationships: 'Relationships',
    goals: 'Goals',
    habits: 'Habits',
    insights: 'Insights',
  };
  return names[category] || category;
};

/**
 * Get processing status display
 */
export const getProcessingStatusDisplay = (status: string): { label: string; color: string } => {
  const statuses: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'yellow' },
    processing: { label: 'Processing', color: 'blue' },
    processed: { label: 'Processed', color: 'green' },
    failed: { label: 'Failed', color: 'red' },
  };
  return statuses[status] || { label: status, color: 'gray' };
};

// ============================================================================
// CONVERSATION FACT EXTRACTION
// ============================================================================

const EXTRACT_FACTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-facts`;

/**
 * Extract facts from recent MIO conversations
 * Fetches conversations from the last N days and extracts facts
 */
export const extractFactsFromConversations = async (daysBack = 7): Promise<{
  success: boolean;
  facts_extracted: number;
  error?: string;
}> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      return { success: false, facts_extracted: 0, error: 'Unauthorized' };
    }

    // Get CEO user_id (hardcoded for now since it's a single-user feature)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, facts_extracted: 0, error: 'Not authenticated' };
    }

    // Fetch recent conversations
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: conversations, error: fetchError } = await supabase
      .from('agent_conversations')
      .select('id, user_message, agent_response, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[CEOFacts] Error fetching conversations:', fetchError);
      return { success: false, facts_extracted: 0, error: fetchError.message };
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, facts_extracted: 0 };
    }

    // Build conversation transcript
    const transcript = conversations
      .map((c) => `User: ${c.user_message}\nMIO: ${c.agent_response}`)
      .join('\n\n---\n\n');

    // Get existing fact keys
    const { data: existingFacts } = await supabase
      .from('ceo_extracted_facts')
      .select('fact_key')
      .eq('is_incorrect', false);

    const existingFactKeys = (existingFacts || []).map((f) => f.fact_key);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return { success: false, facts_extracted: 0, error: 'No auth token' };
    }

    // Call extract-facts Edge Function
    const response = await fetch(EXTRACT_FACTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        source_type: 'conversation',
        source_reference: `conversations_${startDate.toISOString().split('T')[0]}_to_${new Date().toISOString().split('T')[0]}`,
        content: transcript,
        existing_facts: existingFactKeys,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CEOFacts] Extract facts API error:', errorText);
      return { success: false, facts_extracted: 0, error: `API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('[CEOFacts] Extracted from conversations:', result);

    return {
      success: true,
      facts_extracted: result.facts_extracted || 0,
    };
  } catch (error) {
    console.error('[CEOFacts] Error extracting from conversations:', error);
    return {
      success: false,
      facts_extracted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Manually trigger fact extraction for a specific document
 */
export const reprocessDocument = async (documentId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return { success: false, error: 'No auth token' };
    }

    const response = await fetch(PROCESS_DOCUMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[CEODocuments] Error reprocessing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
