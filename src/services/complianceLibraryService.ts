// ============================================================================
// COMPLIANCE LIBRARY SERVICE
// ============================================================================
// Service layer for the State Compliance Library feature.
// Provides curated, browsable access to compliance regulations by state.
// Uses the gh_training_chunks table with actual schema columns.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  StateCode,
  LibraryCategory,
  LibraryItem,
  LibraryBookmark,
  LibraryFilters,
  LibraryStateOverview,
  LibraryCategoryType,
  LIBRARY_CATEGORIES,
} from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface LibrarySearchResult {
  items: LibraryItem[];
  total_count: number;
  has_more: boolean;
}

// Actual gh_training_chunks table columns
interface TrainingChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  source_file: string;
  topic_tags: string[] | null;
  related_tactics: string[] | null;
  ownership_model: string[] | null;
  applicable_populations: string[] | null;
  difficulty: string | null;
  document_id: number | null;
  created_at: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract state code from source_file name
 * Examples:
 * - "compliance/CA_Compliance_Binder.pdf" -> "CA" (new format)
 * - "CA_compliance.pdf" -> "CA"
 * - "california_regulations.pdf" -> "CA"
 */
function extractStateFromSourceFile(sourceFile: string): StateCode | null {
  if (!sourceFile) return null;

  const fileName = sourceFile.toUpperCase();

  // NEW FORMAT: "compliance/XX_Compliance_Binder.pdf"
  const complianceMatch = fileName.match(/COMPLIANCE\/([A-Z]{2})_/);
  if (complianceMatch && STATE_NAMES[complianceMatch[1] as StateCode]) {
    return complianceMatch[1] as StateCode;
  }

  // Try direct state code match at start (e.g., "CA_compliance.pdf")
  const stateCodeMatch = fileName.match(/^([A-Z]{2})[\s_-]/);
  if (stateCodeMatch && STATE_NAMES[stateCodeMatch[1] as StateCode]) {
    return stateCodeMatch[1] as StateCode;
  }

  // Try full state name match (all 50 states)
  const stateNames: Record<string, StateCode> = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
    'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
    'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
    'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
    'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
    'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI', 'WYOMING': 'WY',
  };

  for (const [name, code] of Object.entries(stateNames)) {
    if (fileName.includes(name)) {
      return code;
    }
  }

  return null;
}

/**
 * Category to topic_tags mapping for filtering
 * Each category maps to tags that should be included when filtering by that category
 */
const CATEGORY_TAG_MAPPING: Record<LibraryCategoryType, string[]> = {
  licensure: ['licensure', 'gray_areas', 'permitted_services', 'prohibited', 'penalties'],
  fha: ['fair_housing'],
  housing_categories: ['housing_models'],
  zoning: ['zoning'],
  occupancy: ['occupancy'],
  fire_safety: ['inspections', 'fire_safety'],
  business_license: ['documentation', 'insurance', 'business'],
  population: ['staff_roles', 'resident_rights'],
  ada: ['ada', 'accessibility'],
  general: ['general', 'definitions', 'summary'],
};

/**
 * Check if a chunk matches a category based on its topic_tags
 * Returns true if any of the chunk's tags are associated with the category
 */
function chunkMatchesCategory(tags: string[] | null, categoryType: LibraryCategoryType): boolean {
  if (!tags || tags.length === 0) {
    return categoryType === 'general';
  }

  const categoryTags = CATEGORY_TAG_MAPPING[categoryType] || [];
  return tags.some(tag => categoryTags.includes(tag));
}

/**
 * Get all categories that a chunk belongs to based on its topic_tags
 * A chunk can belong to MULTIPLE categories if it has multiple relevant tags
 */
function getChunkCategories(tags: string[] | null): LibraryCategoryType[] {
  if (!tags || tags.length === 0) return ['general'];

  const categories: LibraryCategoryType[] = [];

  for (const [category, categoryTags] of Object.entries(CATEGORY_TAG_MAPPING)) {
    if (tags.some(tag => categoryTags.includes(tag))) {
      categories.push(category as LibraryCategoryType);
    }
  }

  return categories.length > 0 ? categories : ['general'];
}

/**
 * Map topic tags to PRIMARY library category type (for display purposes)
 * Returns the single most relevant category for a chunk
 */
function mapTagsToCategory(tags: string[] | null): LibraryCategoryType {
  if (!tags || tags.length === 0) return 'general';

  const tagString = tags.join(' ').toLowerCase();

  // Direct tag matches (new compliance PDF format) - priority order
  if (tags.includes('fair_housing')) return 'fha';
  if (tags.includes('zoning')) return 'zoning';
  if (tags.includes('housing_models')) return 'housing_categories';
  if (tags.includes('staff_roles')) return 'population';
  if (tags.includes('resident_rights')) return 'population';
  if (tags.includes('inspections')) return 'fire_safety';
  if (tags.includes('documentation') || tags.includes('insurance')) return 'business_license';
  if (tags.includes('licensure') || tags.includes('gray_areas') || tags.includes('permitted_services') || tags.includes('prohibited') || tags.includes('penalties')) return 'licensure';
  if (tags.includes('definitions') || tags.includes('summary')) return 'general';

  // Keyword-based matching (fallback for old data)
  if (tagString.includes('fair housing') || tagString.includes('fha')) return 'fha';
  if (tagString.includes('zoning') || tagString.includes('local') || tagString.includes('building')) return 'zoning';
  if (tagString.includes('housing') || tagString.includes('category') || tagString.includes('model')) return 'housing_categories';
  if (tagString.includes('occupancy') || tagString.includes('capacity')) return 'occupancy';
  if (tagString.includes('fire') || tagString.includes('safety') || tagString.includes('inspection')) return 'fire_safety';
  if (tagString.includes('business') || tagString.includes('documentation') || tagString.includes('insurance')) return 'business_license';
  if (tagString.includes('population') || tagString.includes('target') || tagString.includes('staff') || tagString.includes('resident')) return 'population';
  if (tagString.includes('ada') || tagString.includes('accessibility')) return 'ada';
  if (tagString.includes('license') || tagString.includes('licensure')) return 'licensure';

  return 'general';
}

/**
 * Transform a training chunk into a library item
 */
function transformChunkToLibraryItem(chunk: TrainingChunk): LibraryItem {
  const content = chunk.chunk_text || '';

  // Extract title from content (first line or first 100 chars)
  const lines = content.split('\n').filter(l => l.trim());
  const title = lines[0]?.substring(0, 150) || chunk.source_file || 'Untitled Regulation';

  // Create summary from content
  const summary = content.substring(0, 300).trim() + (content.length > 300 ? '...' : '');

  // Extract state from source_file
  const stateCode = extractStateFromSourceFile(chunk.source_file) || 'CA';

  // Map tags to category
  const categoryType = mapTagsToCategory(chunk.topic_tags);

  return {
    id: chunk.id,
    category_id: categoryType,
    state_code: stateCode,
    title: title,
    summary: summary,
    content: content,
    section_type: categoryType,
    source_url: null,
    regulation_code: null,
    effective_date: null,
    last_updated: null,
    is_featured: false,
    is_critical: chunk.topic_tags?.includes('critical') || false,
    tags: chunk.topic_tags || [],
    created_at: chunk.created_at || new Date().toISOString(),
    updated_at: chunk.created_at || new Date().toISOString(),
  };
}

// ============================================================================
// LIBRARY BROWSE FUNCTIONS
// ============================================================================

/**
 * Get all available states in the library with item counts
 * Uses actual gh_training_chunks columns: source_file, topic_tags
 */
export async function getLibraryStates(): Promise<LibraryStateOverview[]> {
  const { data, error } = await supabase
    .from('gh_training_chunks')
    .select('id, source_file, topic_tags, created_at')
    .like('source_file', 'compliance/%');

  if (error) {
    console.error('Error fetching library states:', error);
    // Return empty array instead of throwing - graceful degradation
    return [];
  }

  // Group by state extracted from source_file
  const stateMap = new Map<string, {
    items: number;
    categories: Map<string, number>;
    critical: number;
    lastUpdated: string;
  }>();

  (data || []).forEach((chunk: { id: string; source_file: string; topic_tags: string[] | null; created_at: string | null }) => {
    const stateCode = extractStateFromSourceFile(chunk.source_file) || 'unknown';

    if (!stateMap.has(stateCode)) {
      stateMap.set(stateCode, {
        items: 0,
        categories: new Map(),
        critical: 0,
        lastUpdated: chunk.created_at || new Date().toISOString(),
      });
    }

    const state = stateMap.get(stateCode)!;
    state.items++;

    // Count each chunk in ALL categories it belongs to (not just one)
    const chunkCategories = getChunkCategories(chunk.topic_tags);
    chunkCategories.forEach(categoryType => {
      state.categories.set(categoryType, (state.categories.get(categoryType) || 0) + 1);
    });

    if (chunk.topic_tags?.includes('critical')) {
      state.critical++;
    }

    if (chunk.created_at && chunk.created_at > state.lastUpdated) {
      state.lastUpdated = chunk.created_at;
    }
  });

  // Transform to array
  const states: LibraryStateOverview[] = [];
  stateMap.forEach((value, stateCode) => {
    if (stateCode !== 'unknown' && stateCode.length === 2 && STATE_NAMES[stateCode as StateCode]) {
      states.push({
        state_code: stateCode as StateCode,
        state_name: STATE_NAMES[stateCode as StateCode] || stateCode,
        total_items: value.items,
        categories: Array.from(value.categories.entries()).map(([type, count]) => ({
          category_type: type as LibraryCategoryType,
          count,
        })),
        critical_items: value.critical,
        last_updated: value.lastUpdated,
      });
    }
  });

  // Sort by state name
  return states.sort((a, b) => a.state_name.localeCompare(b.state_name));
}

/**
 * Get library items for a specific state
 * Filters by source_file containing state code pattern
 */
export async function getLibraryItemsByState(
  stateCode: StateCode,
  filters?: Partial<LibraryFilters>,
  limit = 50,
  offset = 0
): Promise<LibrarySearchResult> {
  // Get compliance chunks and filter client-side by state extracted from source_file
  // This is necessary because state isn't stored in a dedicated column
  let query = supabase
    .from('gh_training_chunks')
    .select('id, chunk_text, chunk_index, source_file, topic_tags, related_tactics, ownership_model, applicable_populations, difficulty, document_id, created_at', { count: 'exact' })
    .like('source_file', 'compliance/%');

  // Apply search query if provided
  if (filters?.search_query) {
    query = query.ilike('chunk_text', `%${filters.search_query}%`);
  }

  // Get more results than needed for client-side filtering
  query = query.limit(500);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching library items:', error);
    return { items: [], total_count: 0, has_more: false };
  }

  // Filter by state extracted from source_file
  let filteredChunks = (data || []).filter((chunk: TrainingChunk) => {
    const extractedState = extractStateFromSourceFile(chunk.source_file);
    return extractedState === stateCode;
  });

  // Apply category filter if provided - use tag-based matching
  if (filters?.category_type) {
    filteredChunks = filteredChunks.filter((chunk: TrainingChunk) => {
      return chunkMatchesCategory(chunk.topic_tags, filters.category_type!);
    });
  }

  // Apply pagination
  const totalCount = filteredChunks.length;
  const paginatedChunks = filteredChunks.slice(offset, offset + limit);
  const items = paginatedChunks.map((chunk: TrainingChunk) => transformChunkToLibraryItem(chunk));

  return {
    items,
    total_count: totalCount,
    has_more: totalCount > offset + limit,
  };
}

/**
 * Get library items by category across all states
 */
export async function getLibraryItemsByCategory(
  categoryType: LibraryCategoryType,
  stateCode?: StateCode,
  limit = 50,
  offset = 0
): Promise<LibrarySearchResult> {
  // Get compliance chunks and filter client-side by category
  const query = supabase
    .from('gh_training_chunks')
    .select('id, chunk_text, chunk_index, source_file, topic_tags, related_tactics, ownership_model, applicable_populations, difficulty, document_id, created_at')
    .like('source_file', 'compliance/%')
    .limit(500);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching library items by category:', error);
    return { items: [], total_count: 0, has_more: false };
  }

  // Filter by category - chunk must have a tag that matches this category
  let filteredChunks = (data || []).filter((chunk: TrainingChunk) => {
    return chunkMatchesCategory(chunk.topic_tags, categoryType);
  });

  // Filter by state if provided
  if (stateCode) {
    filteredChunks = filteredChunks.filter((chunk: TrainingChunk) => {
      const extractedState = extractStateFromSourceFile(chunk.source_file);
      return extractedState === stateCode;
    });
  }

  // Apply pagination
  const totalCount = filteredChunks.length;
  const paginatedChunks = filteredChunks.slice(offset, offset + limit);
  const items = paginatedChunks.map((chunk: TrainingChunk) => transformChunkToLibraryItem(chunk));

  return {
    items,
    total_count: totalCount,
    has_more: totalCount > offset + limit,
  };
}

/**
 * Get a single library item by ID
 */
export async function getLibraryItem(itemId: string): Promise<LibraryItem | null> {
  const { data, error } = await supabase
    .from('gh_training_chunks')
    .select('id, chunk_text, chunk_index, source_file, topic_tags, related_tactics, ownership_model, applicable_populations, difficulty, document_id, created_at')
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching library item:', error);
    return null;
  }

  return data ? transformChunkToLibraryItem(data as TrainingChunk) : null;
}

/**
 * Search the library using keyword search on chunk_text
 */
export async function searchLibrary(
  query: string,
  filters?: Partial<LibraryFilters>,
  limit = 20
): Promise<LibrarySearchResult> {
  // Use ilike search on chunk_text - only search compliance data
  let searchQuery = supabase
    .from('gh_training_chunks')
    .select('id, chunk_text, chunk_index, source_file, topic_tags, related_tactics, ownership_model, applicable_populations, difficulty, document_id, created_at', { count: 'exact' })
    .like('source_file', 'compliance/%')
    .ilike('chunk_text', `%${query}%`)
    .limit(200); // Get more for client-side filtering

  const { data, error, count } = await searchQuery;

  if (error) {
    console.error('Error searching library:', error);
    return { items: [], total_count: 0, has_more: false };
  }

  let filteredChunks = data || [];

  // Apply state filter if provided
  if (filters?.state_code) {
    filteredChunks = filteredChunks.filter((chunk: TrainingChunk) => {
      const extractedState = extractStateFromSourceFile(chunk.source_file);
      return extractedState === filters.state_code;
    });
  }

  // Apply category filter if provided - use tag-based matching
  if (filters?.category_type) {
    filteredChunks = filteredChunks.filter((chunk: TrainingChunk) => {
      return chunkMatchesCategory(chunk.topic_tags, filters.category_type!);
    });
  }

  // Apply limit
  const totalCount = filteredChunks.length;
  const limitedChunks = filteredChunks.slice(0, limit);
  const items = limitedChunks.map((chunk: TrainingChunk) => transformChunkToLibraryItem(chunk));

  return {
    items,
    total_count: totalCount,
    has_more: totalCount > limit,
  };
}

/**
 * Get featured/highlighted items for a state
 */
export async function getFeaturedItems(
  stateCode: StateCode,
  limit = 10
): Promise<LibraryItem[]> {
  // Get compliance chunks and filter by state extracted from source_file
  const { data, error } = await supabase
    .from('gh_training_chunks')
    .select('id, chunk_text, chunk_index, source_file, topic_tags, related_tactics, ownership_model, applicable_populations, difficulty, document_id, created_at')
    .like('source_file', 'compliance/%')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching featured items:', error);
    return [];
  }

  // Filter by state extracted from source_file
  const filteredChunks = (data || []).filter((chunk: TrainingChunk) => {
    const extractedState = extractStateFromSourceFile(chunk.source_file);
    return extractedState === stateCode;
  }).slice(0, limit);

  return filteredChunks.map((chunk: TrainingChunk) => transformChunkToLibraryItem(chunk));
}

// ============================================================================
// BOOKMARK FUNCTIONS
// ============================================================================
// Note: The library_bookmarks table may not exist yet.
// These functions handle that gracefully and log warnings.
// ============================================================================

/**
 * Get user's library bookmarks
 * Returns empty array if table doesn't exist (graceful degradation)
 */
export async function getUserBookmarks(): Promise<LibraryBookmark[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('library_bookmarks')
    .select(`
      id,
      user_id,
      library_item_id,
      notes,
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // Table doesn't exist or permission denied - return empty array
    if (error.code === '42P01' || error.code === 'PGRST204' || error.message.includes('does not exist')) {
      console.warn('[ComplianceLibrary] library_bookmarks table not found - bookmarks feature unavailable');
      return [];
    }
    console.error('Error fetching bookmarks:', error);
    return [];
  }

  // Fetch the actual items for each bookmark
  const bookmarks: LibraryBookmark[] = [];
  for (const bookmark of data || []) {
    const item = await getLibraryItem(bookmark.library_item_id);
    bookmarks.push({
      ...bookmark,
      item: item || undefined,
    });
  }

  return bookmarks;
}

/**
 * Add a bookmark
 * Throws error if table doesn't exist (user should see feedback)
 */
export async function addBookmark(
  libraryItemId: string,
  notes?: string
): Promise<LibraryBookmark> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('library_bookmarks')
    .insert({
      user_id: user.id,
      library_item_id: libraryItemId,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      throw new Error('Bookmarks feature is not yet available. Please contact support.');
    }
    console.error('Error adding bookmark:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(bookmarkId: string): Promise<void> {
  const { error } = await supabase
    .from('library_bookmarks')
    .delete()
    .eq('id', bookmarkId);

  if (error) {
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('[ComplianceLibrary] library_bookmarks table not found');
      return;
    }
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Check if an item is bookmarked
 * Returns false if table doesn't exist (graceful degradation)
 */
export async function isItemBookmarked(libraryItemId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('library_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('library_item_id', libraryItemId)
    .maybeSingle();

  if (error) {
    // Table doesn't exist - silently return false
    return false;
  }

  return !!data;
}

// ============================================================================
// SAVE TO BINDER FUNCTION
// ============================================================================

/**
 * Save a library item to the user's binder
 */
export async function saveLibraryItemToBinder(
  libraryItemId: string,
  binderId: string,
  userNotes?: string
): Promise<void> {
  const item = await getLibraryItem(libraryItemId);
  if (!item) throw new Error('Library item not found');

  const { error } = await supabase
    .from('binder_items')
    .insert({
      binder_id: binderId,
      chunk_id: libraryItemId,
      chunk_content: item.content,
      section_type: item.section_type,
      title: item.title,
      user_notes: userNotes || null,
      source_url: item.source_url,
      regulation_code: item.regulation_code,
      sort_order: 0,
      is_starred: false,
    });

  if (error) {
    console.error('Error saving to binder:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/**
 * Get library statistics
 */
export async function getLibraryStats(): Promise<{
  total_items: number;
  states_covered: number;
  categories_count: Record<LibraryCategoryType, number>;
}> {
  const states = await getLibraryStates();

  const categoriesCount: Record<LibraryCategoryType, number> = {
    licensure: 0,
    housing_categories: 0,
    zoning: 0,
    occupancy: 0,
    fha: 0,
    fire_safety: 0,
    business_license: 0,
    population: 0,
    ada: 0,
    general: 0,
  };

  let totalItems = 0;
  states.forEach(state => {
    totalItems += state.total_items;
    state.categories.forEach(cat => {
      categoriesCount[cat.category_type] = (categoriesCount[cat.category_type] || 0) + cat.count;
    });
  });

  return {
    total_items: totalItems,
    states_covered: states.length,
    categories_count: categoriesCount,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getLibraryStates,
  getLibraryItemsByState,
  getLibraryItemsByCategory,
  getLibraryItem,
  searchLibrary,
  getFeaturedItems,
  getUserBookmarks,
  addBookmark,
  removeBookmark,
  isItemBookmarked,
  saveLibraryItemToBinder,
  getLibraryStats,
};
