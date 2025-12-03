// ============================================================================
// KNOWLEDGE INGESTION SERVICE
// ============================================================================
// Service for managing knowledge base operations across all three AI agents:
// - Nette (GroupHome) → gh_training_chunks
// - MIO (Mind Insurance) → mio_knowledge_chunks
// - ME (Money Evolution) → me_knowledge_chunks
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  AgentType,
  KnowledgeSourceType,
  ProcessingQueueItem,
  ProcessingStatus,
  QueueStats,
  KnowledgeStats,
  AgentKnowledgeSummary,
  KnowledgeIngestionRequest,
  NormalizedKnowledgeChunk,
  KnowledgeFilter,
  N8NWebhookPayload,
  AGENT_CONFIGS,
} from '@/types/knowledgeManagement';

// N8N Webhook URL for knowledge processing
const N8N_KNOWLEDGE_WEBHOOK_URL = import.meta.env.VITE_N8N_KNOWLEDGE_WEBHOOK_URL ||
  'https://purposewaze.app.n8n.cloud/webhook/knowledge-ingest';

// ============================================================================
// KNOWLEDGE CHUNK OPERATIONS
// ============================================================================

/**
 * Get knowledge chunks for a specific agent with filtering
 * Returns { chunks, total } for pagination support
 */
export async function getKnowledgeChunks(
  agent: AgentType,
  category?: string,
  searchQuery?: string,
  limit?: number,
  offset?: number
): Promise<{ chunks: NormalizedKnowledgeChunk[]; total: number }> {
  try {
    const tableName = getTableNameForAgent(agent);
    const contentColumn = agent === 'nette' ? 'chunk_text' : 'content';

    // First get the count
    let countQuery = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    if (searchQuery) {
      countQuery = countQuery.ilike(contentColumn, `%${searchQuery}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error(`Error counting ${agent} knowledge chunks:`, countError);
      return { chunks: [], total: 0 };
    }

    // Then get the data
    let query = supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (searchQuery) {
      query = query.ilike(contentColumn, `%${searchQuery}%`);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${agent} knowledge chunks:`, error);
      return { chunks: [], total: 0 };
    }

    // Normalize the data to a consistent format
    const chunks = (data || []).map((chunk) => normalizeChunk(chunk, agent));
    return { chunks, total: count || 0 };
  } catch (error) {
    console.error(`Error in getKnowledgeChunks for ${agent}:`, error);
    return { chunks: [], total: 0 };
  }
}

/**
 * Get a single knowledge chunk by ID
 */
export async function getKnowledgeChunk(
  agent: AgentType,
  chunkId: string
): Promise<NormalizedKnowledgeChunk | null> {
  const tableName = getTableNameForAgent(agent);

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', chunkId)
    .single();

  if (error) {
    console.error(`Error fetching ${agent} knowledge chunk:`, error);
    return null;
  }

  return normalizeChunk(data, agent);
}

/**
 * Delete a knowledge chunk
 */
export async function deleteKnowledgeChunk(
  agent: AgentType,
  chunkId: string
): Promise<void> {
  const tableName = getTableNameForAgent(agent);

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', chunkId);

  if (error) {
    console.error(`Error deleting ${agent} knowledge chunk:`, error);
    throw new Error(`Failed to delete knowledge chunk: ${error.message}`);
  }
}

/**
 * Bulk delete knowledge chunks
 */
export async function bulkDeleteKnowledgeChunks(
  agent: AgentType,
  chunkIds: string[]
): Promise<void> {
  const tableName = getTableNameForAgent(agent);

  const { error } = await supabase
    .from(tableName)
    .delete()
    .in('id', chunkIds);

  if (error) {
    console.error(`Error bulk deleting ${agent} knowledge chunks:`, error);
    throw new Error(`Failed to delete knowledge chunks: ${error.message}`);
  }
}

// ============================================================================
// PROCESSING QUEUE OPERATIONS
// ============================================================================

/**
 * Submit a knowledge ingestion request to the processing queue
 */
export async function submitKnowledgeIngestion(
  request: KnowledgeIngestionRequest,
  userId?: string
): Promise<ProcessingQueueItem> {
  // Create queue entry
  const { data: queueItem, error: queueError } = await supabase
    .from('knowledge_processing_queue')
    .insert({
      agent_type: request.agent_type,
      source_type: request.source_type,
      source_url: request.source_url,
      source_title: request.source_title,
      category: request.category,
      status: 'pending',
      submitted_by: userId,
      metadata: request.metadata || {},
    })
    .select()
    .single();

  if (queueError) {
    console.error('Error creating queue entry:', queueError);
    throw new Error(`Failed to submit ingestion request: ${queueError.message}`);
  }

  // Trigger N8N webhook for processing (non-blocking)
  triggerN8NWebhook({
    action: 'process_knowledge',
    agent_type: request.agent_type,
    source_type: request.source_type,
    source_url: request.source_url,
    source_title: request.source_title,
    category: request.category,
    queue_id: queueItem.id,
    metadata: request.metadata,
  }).catch((err) => {
    console.error('Failed to trigger N8N webhook:', err);
    // Update queue status to failed
    updateQueueStatus(queueItem.id, 'failed', 'Failed to trigger processing webhook');
  });

  return queueItem as ProcessingQueueItem;
}

/**
 * Get processing queue items with filtering
 * Returns empty array if table doesn't exist (graceful degradation)
 */
export async function getProcessingQueue(
  agentFilter?: string,
  maxItems?: number
): Promise<ProcessingQueueItem[]> {
  try {
    let query = supabase
      .from('knowledge_processing_queue')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (agentFilter) {
      query = query.eq('agent_type', agentFilter);
    }

    if (maxItems) {
      query = query.limit(maxItems);
    }

    const { data, error } = await query;

    if (error) {
      // Check if it's a "table not found" error - return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('not found')) {
        console.warn('Processing queue table not found - returning empty array');
        return [];
      }
      console.error('Error fetching processing queue:', error);
      return [];
    }

    return (data || []) as ProcessingQueueItem[];
  } catch (error) {
    console.error('Error in getProcessingQueue:', error);
    return [];
  }
}

/**
 * Get queue statistics
 * Returns zeros if table doesn't exist (graceful degradation)
 */
export async function getQueueStats(agent?: AgentType): Promise<QueueStats> {
  try {
    let baseQuery = supabase.from('knowledge_processing_queue').select('status');

    if (agent) {
      baseQuery = baseQuery.eq('agent_type', agent);
    }

    const { data, error } = await baseQuery;

    if (error) {
      // Check if it's a "table not found" error - return zeros gracefully
      if (error.code === 'PGRST205' || error.message?.includes('not found')) {
        console.warn('Processing queue table not found - returning empty stats');
        return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
      }
      console.error('Error fetching queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }

    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data?.length || 0,
    };

    data?.forEach((item) => {
      const status = item.status as ProcessingStatus;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getQueueStats:', error);
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  }
}

/**
 * Update queue item status
 */
export async function updateQueueStatus(
  queueId: string,
  status: ProcessingStatus,
  errorMessage?: string,
  chunksCreated?: number
): Promise<ProcessingQueueItem> {
  const updates: Partial<ProcessingQueueItem> = {
    status,
    error_message: errorMessage,
  };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (chunksCreated !== undefined) {
    updates.chunks_created = chunksCreated;
  }

  const { data, error } = await supabase
    .from('knowledge_processing_queue')
    .update(updates)
    .eq('id', queueId)
    .select()
    .single();

  if (error) {
    console.error('Error updating queue status:', error);
    throw new Error(`Failed to update queue status: ${error.message}`);
  }

  return data as ProcessingQueueItem;
}

/**
 * Retry a failed queue item
 */
export async function retryQueueItem(queueId: string): Promise<ProcessingQueueItem> {
  // Get the original queue item
  const { data: item, error: fetchError } = await supabase
    .from('knowledge_processing_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (fetchError || !item) {
    throw new Error('Queue item not found');
  }

  // Reset status to pending
  const { data: updated, error: updateError } = await supabase
    .from('knowledge_processing_queue')
    .update({
      status: 'pending',
      error_message: null,
      started_at: null,
      completed_at: null,
      chunks_created: 0,
    })
    .eq('id', queueId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to retry queue item: ${updateError.message}`);
  }

  // Trigger N8N webhook again
  triggerN8NWebhook({
    action: 'process_knowledge',
    agent_type: item.agent_type,
    source_type: item.source_type,
    source_url: item.source_url,
    source_title: item.source_title,
    category: item.category,
    queue_id: queueId,
    metadata: item.metadata,
  }).catch((err) => {
    console.error('Failed to trigger N8N webhook on retry:', err);
    updateQueueStatus(queueId, 'failed', 'Failed to trigger processing webhook on retry');
  });

  return updated as ProcessingQueueItem;
}

/**
 * Delete a queue item
 */
export async function deleteQueueItem(queueId: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_processing_queue')
    .delete()
    .eq('id', queueId);

  if (error) {
    console.error('Error deleting queue item:', error);
    throw new Error(`Failed to delete queue item: ${error.message}`);
  }
}

// ============================================================================
// KNOWLEDGE STATISTICS
// ============================================================================

/**
 * Get knowledge statistics from the view
 */
export async function getKnowledgeStatistics(): Promise<KnowledgeStats[]> {
  const { data, error } = await supabase
    .from('knowledge_stats')
    .select('*');

  if (error) {
    console.error('Error fetching knowledge stats:', error);
    // Fallback to manual query if view doesn't exist
    return await getKnowledgeStatsFallback();
  }

  return (data || []) as KnowledgeStats[];
}

/**
 * Get knowledge summary per agent
 */
export async function getAgentKnowledgeSummary(agent: AgentType): Promise<AgentKnowledgeSummary> {
  const stats = await getKnowledgeStatistics();
  const agentStats = stats.filter((s) => s.agent_type === agent);

  const categoryCounts: Record<string, number> = {};
  let totalChunks = 0;
  let lastUpdated = '';

  agentStats.forEach((stat) => {
    categoryCounts[stat.category] = stat.chunk_count;
    totalChunks += stat.chunk_count;
    if (!lastUpdated || stat.last_updated > lastUpdated) {
      lastUpdated = stat.last_updated;
    }
  });

  return {
    agent,
    totalChunks,
    categoryCounts,
    lastUpdated: lastUpdated || new Date().toISOString(),
  };
}

/**
 * Get all agent summaries
 */
export async function getAllAgentSummaries(): Promise<AgentKnowledgeSummary[]> {
  const agents: AgentType[] = ['nette', 'mio', 'me'];
  const summaries = await Promise.all(agents.map(getAgentKnowledgeSummary));
  return summaries;
}

// ============================================================================
// DIRECT INGESTION (for file uploads and text input)
// ============================================================================

/**
 * Directly insert a knowledge chunk (for admin manual entry or file upload)
 */
export async function insertKnowledgeChunk(
  agent: AgentType,
  data: {
    content: string;
    category: string;
    source_type?: KnowledgeSourceType;
    source_url?: string;
    source_title?: string;
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<NormalizedKnowledgeChunk> {
  const tableName = getTableNameForAgent(agent);
  const contentColumn = agent === 'nette' ? 'chunk_text' : 'content';

  const insertData: Record<string, unknown> = {
    [contentColumn]: data.content,
    category: data.category,
    source_type: data.source_type || 'file_upload',
    source_url: data.source_url,
    source_title: data.source_title,
    metadata: data.metadata || {},
  };

  // Add agent-specific fields
  if (agent === 'nette') {
    insertData.uploaded_by = userId;
    insertData.upload_metadata = data.metadata || {};
  } else {
    insertData.created_by = userId;
  }

  const { data: chunk, error } = await supabase
    .from(tableName)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error(`Error inserting ${agent} knowledge chunk:`, error);
    throw new Error(`Failed to insert knowledge chunk: ${error.message}`);
  }

  return normalizeChunk(chunk, agent);
}

/**
 * Bulk insert knowledge chunks
 */
export async function bulkInsertKnowledgeChunks(
  agent: AgentType,
  chunks: Array<{
    content: string;
    category: string;
    source_type?: KnowledgeSourceType;
    source_url?: string;
    source_title?: string;
    chunk_index?: number;
    total_chunks?: number;
    metadata?: Record<string, unknown>;
  }>,
  userId?: string
): Promise<number> {
  const tableName = getTableNameForAgent(agent);
  const contentColumn = agent === 'nette' ? 'chunk_text' : 'content';

  const insertData = chunks.map((chunk) => {
    const data: Record<string, unknown> = {
      [contentColumn]: chunk.content,
      category: chunk.category,
      source_type: chunk.source_type || 'file_upload',
      source_url: chunk.source_url,
      source_title: chunk.source_title,
      chunk_index: chunk.chunk_index,
      total_chunks: chunk.total_chunks,
      metadata: chunk.metadata || {},
    };

    if (agent === 'nette') {
      data.uploaded_by = userId;
      data.upload_metadata = chunk.metadata || {};
    } else {
      data.created_by = userId;
    }

    return data;
  });

  const { data, error } = await supabase
    .from(tableName)
    .insert(insertData)
    .select();

  if (error) {
    console.error(`Error bulk inserting ${agent} knowledge chunks:`, error);
    throw new Error(`Failed to bulk insert knowledge chunks: ${error.message}`);
  }

  return data?.length || 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the table name for a specific agent
 */
function getTableNameForAgent(agent: AgentType): string {
  switch (agent) {
    case 'nette':
      return 'gh_training_chunks';
    case 'mio':
      return 'mio_knowledge_chunks';
    case 'me':
      return 'me_knowledge_chunks';
  }
}

/**
 * Normalize a chunk from any table to a consistent format
 */
function normalizeChunk(chunk: Record<string, unknown>, agent: AgentType): NormalizedKnowledgeChunk {
  return {
    id: chunk.id as string,
    agent_type: agent,
    content: (agent === 'nette' ? chunk.chunk_text : chunk.content) as string,
    category: chunk.category as string,
    source_url: chunk.source_url as string | undefined,
    source_type: chunk.source_type as KnowledgeSourceType | undefined,
    source_title: chunk.source_title as string | undefined,
    metadata: (agent === 'nette' ? chunk.upload_metadata : chunk.metadata) as Record<string, unknown> | undefined,
    chunk_index: chunk.chunk_index as number | undefined,
    total_chunks: chunk.total_chunks as number | undefined,
    created_at: chunk.created_at as string,
    updated_at: chunk.updated_at as string | undefined,
  };
}

/**
 * Trigger N8N webhook for knowledge processing
 */
async function triggerN8NWebhook(payload: N8NWebhookPayload): Promise<void> {
  const response = await fetch(N8N_KNOWLEDGE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.statusText}`);
  }
}

/**
 * Fallback function to get stats if the view doesn't exist
 */
async function getKnowledgeStatsFallback(): Promise<KnowledgeStats[]> {
  const stats: KnowledgeStats[] = [];
  const agents: AgentType[] = ['nette', 'mio', 'me'];

  for (const agent of agents) {
    const tableName = getTableNameForAgent(agent);

    try {
      const { data } = await supabase
        .from(tableName)
        .select('category, created_at');

      if (data) {
        const categoryCounts: Record<string, { count: number; lastUpdated: string }> = {};

        data.forEach((item) => {
          const cat = item.category || 'general';
          if (!categoryCounts[cat]) {
            categoryCounts[cat] = { count: 0, lastUpdated: '' };
          }
          categoryCounts[cat].count++;
          if (item.created_at > categoryCounts[cat].lastUpdated) {
            categoryCounts[cat].lastUpdated = item.created_at;
          }
        });

        Object.entries(categoryCounts).forEach(([category, { count, lastUpdated }]) => {
          stats.push({
            agent_type: agent,
            category,
            chunk_count: count,
            last_updated: lastUpdated,
          });
        });
      }
    } catch (err) {
      console.error(`Error fetching stats for ${agent}:`, err);
    }
  }

  return stats;
}

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

/**
 * Parse uploaded file content based on type
 * Note: Full parsing happens in N8N, this is for preview/validation
 */
export function getSupportedFileTypes(): string[] {
  return ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const supportedTypes = getSupportedFileTypes();
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!supportedTypes.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported: ${supportedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    };
  }

  return { valid: true };
}

/**
 * Upload file to Supabase storage for processing
 */
export async function uploadFileForProcessing(
  file: File,
  agent: AgentType
): Promise<{ path: string; publicUrl: string }> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `knowledge/${agent}/${timestamp}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(path, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}
