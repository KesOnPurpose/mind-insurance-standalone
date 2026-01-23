// ============================================================================
// COMPLIANCE BINDER SERVICE
// ============================================================================
// CRUD operations for the Digital Compliance Binder - the user's defensive
// documentation portfolio for showing officials.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceBinder,
  BinderItem,
  CreateBinderInput,
  UpdateBinderInput,
  AddBinderItemInput,
  UpdateBinderItemInput,
  BinderSectionType,
  StateCode,
} from '@/types/compliance';

// ============================================================================
// BINDER CRUD OPERATIONS
// ============================================================================

/**
 * Get all binders for the current user
 */
export async function getUserBinders(): Promise<ComplianceBinder[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('compliance_binders')
    .select(`
      *,
      binder_items(count),
      binder_documents(count)
    `)
    .eq('user_id', user.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Get binders error:', error);
    throw new Error('Failed to fetch binders');
  }

  // Map to include counts
  return (data || []).map((binder) => ({
    ...binder,
    item_count: binder.binder_items?.[0]?.count || 0,
    document_count: binder.binder_documents?.[0]?.count || 0,
  }));
}

/**
 * Get a single binder by ID with all items
 */
export async function getBinderById(binderId: string): Promise<{
  binder: ComplianceBinder;
  items: BinderItem[];
} | null> {
  const { data, error } = await supabase
    .from('compliance_binders')
    .select(`
      *,
      binder_items(*)
    `)
    .eq('id', binderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Get binder error:', error);
    throw new Error('Failed to fetch binder');
  }

  if (!data) return null;

  // Sort items by section type and sort_order
  const items = (data.binder_items || []).sort((a: BinderItem, b: BinderItem) => {
    if (a.section_type !== b.section_type) {
      return a.section_type.localeCompare(b.section_type);
    }
    return a.sort_order - b.sort_order;
  });

  return {
    binder: {
      ...data,
      binder_items: undefined,
      item_count: items.length,
    },
    items,
  };
}

/**
 * Get user's primary binder for a state (or first binder for that state)
 */
export async function getPrimaryBinderForState(
  stateCode: StateCode
): Promise<ComplianceBinder | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // First try to get primary binder
  const { data: primaryData } = await supabase
    .from('compliance_binders')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('state_code', stateCode)
    .eq('is_primary', true)
    .single();

  if (primaryData) return primaryData;

  // Fall back to any binder for this state
  const { data: anyData } = await supabase
    .from('compliance_binders')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('state_code', stateCode)
    .limit(1)
    .single();

  return anyData || null;
}

/**
 * Create a new compliance binder
 */
export async function createBinder(input: CreateBinderInput): Promise<ComplianceBinder> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // If this is set as primary, unset other primary binders for this state
  if (input.is_primary) {
    await supabase
      .from('compliance_binders')
      .update({ is_primary: false })
      .eq('user_id', user.user.id)
      .eq('state_code', input.state_code);
  }

  const { data, error } = await supabase
    .from('compliance_binders')
    .insert({
      user_id: user.user.id,
      name: input.name || `${input.state_code} Compliance Binder`,
      state_code: input.state_code,
      city: input.city,
      county: input.county,
      model_definition: input.model_definition,
      property_id: input.property_id,
      is_primary: input.is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Create binder error:', error);
    throw new Error('Failed to create binder');
  }

  return data;
}

/**
 * Update a compliance binder
 */
export async function updateBinder(
  binderId: string,
  input: UpdateBinderInput
): Promise<ComplianceBinder> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // If setting as primary, unset other primary binders for this state
  if (input.is_primary) {
    // First get the binder to know its state
    const { data: binder } = await supabase
      .from('compliance_binders')
      .select('state_code')
      .eq('id', binderId)
      .single();

    if (binder) {
      await supabase
        .from('compliance_binders')
        .update({ is_primary: false })
        .eq('user_id', user.user.id)
        .eq('state_code', binder.state_code)
        .neq('id', binderId);
    }
  }

  const { data, error } = await supabase
    .from('compliance_binders')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', binderId)
    .select()
    .single();

  if (error) {
    console.error('Update binder error:', error);
    throw new Error('Failed to update binder');
  }

  return data;
}

/**
 * Delete a compliance binder
 */
export async function deleteBinder(binderId: string): Promise<void> {
  const { error } = await supabase
    .from('compliance_binders')
    .delete()
    .eq('id', binderId);

  if (error) {
    console.error('Delete binder error:', error);
    throw new Error('Failed to delete binder');
  }
}

// ============================================================================
// BINDER ITEM CRUD OPERATIONS
// ============================================================================

/**
 * Get all items for a binder
 */
export async function getBinderItems(binderId: string): Promise<BinderItem[]> {
  const { data, error } = await supabase
    .from('binder_items')
    .select('*')
    .eq('binder_id', binderId)
    .order('section_type')
    .order('sort_order');

  if (error) {
    console.error('Get binder items error:', error);
    throw new Error('Failed to fetch binder items');
  }

  return data || [];
}

/**
 * Get items by section type
 */
export async function getItemsBySection(
  binderId: string,
  sectionType: BinderSectionType
): Promise<BinderItem[]> {
  const { data, error } = await supabase
    .from('binder_items')
    .select('*')
    .eq('binder_id', binderId)
    .eq('section_type', sectionType)
    .order('sort_order');

  if (error) {
    console.error('Get items by section error:', error);
    throw new Error('Failed to fetch items');
  }

  return data || [];
}

/**
 * Add an item to a binder (save search result)
 */
export async function addBinderItem(input: AddBinderItemInput): Promise<BinderItem> {
  // Get the next sort order for this section
  const { data: existingItems } = await supabase
    .from('binder_items')
    .select('sort_order')
    .eq('binder_id', input.binder_id)
    .eq('section_type', input.section_type)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existingItems?.[0]?.sort_order ?? 0;

  const { data, error } = await supabase
    .from('binder_items')
    .insert({
      binder_id: input.binder_id,
      chunk_id: input.chunk_id,
      chunk_content: input.chunk_content,
      section_type: input.section_type,
      title: input.title,
      user_notes: input.user_notes,
      source_url: input.source_url,
      regulation_code: input.regulation_code,
      sort_order: nextSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Add binder item error:', error);
    throw new Error('Failed to add item to binder');
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.binder_id);

  return data;
}

/**
 * Update a binder item
 */
export async function updateBinderItem(
  itemId: string,
  input: UpdateBinderItemInput
): Promise<BinderItem> {
  const { data, error } = await supabase
    .from('binder_items')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Update binder item error:', error);
    throw new Error('Failed to update item');
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', data.binder_id);

  return data;
}

/**
 * Delete a binder item
 */
export async function deleteBinderItem(itemId: string): Promise<void> {
  // Get binder_id before deleting
  const { data: item } = await supabase
    .from('binder_items')
    .select('binder_id')
    .eq('id', itemId)
    .single();

  const { error } = await supabase
    .from('binder_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Delete binder item error:', error);
    throw new Error('Failed to delete item');
  }

  // Update binder's updated_at timestamp
  if (item?.binder_id) {
    await supabase
      .from('compliance_binders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', item.binder_id);
  }
}

/**
 * Toggle starred status for an item
 */
export async function toggleItemStarred(itemId: string): Promise<BinderItem> {
  // Get current starred status
  const { data: item, error: fetchError } = await supabase
    .from('binder_items')
    .select('is_starred')
    .eq('id', itemId)
    .single();

  if (fetchError) {
    throw new Error('Item not found');
  }

  const { data, error } = await supabase
    .from('binder_items')
    .update({ is_starred: !item.is_starred })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Toggle starred error:', error);
    throw new Error('Failed to toggle starred status');
  }

  return data;
}

/**
 * Reorder items within a section
 */
export async function reorderItems(
  binderId: string,
  sectionType: BinderSectionType,
  itemIds: string[]
): Promise<void> {
  // Update sort_order for each item
  const updates = itemIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('binder_items')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('binder_id', binderId)
      .eq('section_type', sectionType);

    if (error) {
      console.error('Reorder item error:', error);
      throw new Error('Failed to reorder items');
    }
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', binderId);
}

/**
 * Move item to a different section
 */
export async function moveItemToSection(
  itemId: string,
  newSectionType: BinderSectionType
): Promise<BinderItem> {
  // Get item's binder_id
  const { data: item, error: fetchError } = await supabase
    .from('binder_items')
    .select('binder_id')
    .eq('id', itemId)
    .single();

  if (fetchError) {
    throw new Error('Item not found');
  }

  // Get next sort order in new section
  const { data: existingItems } = await supabase
    .from('binder_items')
    .select('sort_order')
    .eq('binder_id', item.binder_id)
    .eq('section_type', newSectionType)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (existingItems?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('binder_items')
    .update({
      section_type: newSectionType,
      sort_order: nextSortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Move item error:', error);
    throw new Error('Failed to move item');
  }

  return data;
}

// ============================================================================
// BINDER STATISTICS
// ============================================================================

/**
 * Get statistics for a binder
 */
export async function getBinderStats(binderId: string): Promise<{
  total_items: number;
  items_by_section: Record<BinderSectionType, number>;
  starred_items: number;
  last_updated: string;
}> {
  const { data, error } = await supabase
    .from('binder_items')
    .select('section_type, is_starred')
    .eq('binder_id', binderId);

  if (error) {
    console.error('Get binder stats error:', error);
    throw new Error('Failed to fetch binder stats');
  }

  const items = data || [];
  const itemsBySection: Record<string, number> = {};
  let starredCount = 0;

  items.forEach((item) => {
    itemsBySection[item.section_type] = (itemsBySection[item.section_type] || 0) + 1;
    if (item.is_starred) starredCount++;
  });

  // Get binder's updated_at
  const { data: binder } = await supabase
    .from('compliance_binders')
    .select('updated_at')
    .eq('id', binderId)
    .single();

  return {
    total_items: items.length,
    items_by_section: itemsBySection as Record<BinderSectionType, number>,
    starred_items: starredCount,
    last_updated: binder?.updated_at || new Date().toISOString(),
  };
}

// ============================================================================
// SEARCH BINDER ITEMS
// ============================================================================

/**
 * Search items within a binder by query string
 */
export async function searchBinderItems(
  binderId: string,
  query: string
): Promise<BinderItem[]> {
  if (!query.trim()) {
    return getBinderItems(binderId);
  }

  const { data, error } = await supabase
    .from('binder_items')
    .select('*')
    .eq('binder_id', binderId)
    .or(`title.ilike.%${query}%,chunk_content.ilike.%${query}%,user_notes.ilike.%${query}%,regulation_code.ilike.%${query}%`)
    .order('section_type')
    .order('sort_order');

  if (error) {
    console.error('Search binder items error:', error);
    throw new Error('Failed to search binder items');
  }

  return data || [];
}

// ============================================================================
// DUPLICATE BINDER
// ============================================================================

/**
 * Duplicate a binder with all its items
 */
export async function duplicateBinder(
  binderId: string,
  newName?: string
): Promise<ComplianceBinder> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Get the original binder with items
  const original = await getBinderById(binderId);
  if (!original) {
    throw new Error('Binder not found');
  }

  // Create the new binder
  const { data: newBinder, error: binderError } = await supabase
    .from('compliance_binders')
    .insert({
      user_id: user.user.id,
      name: newName || `${original.binder.name} (Copy)`,
      state_code: original.binder.state_code,
      city: original.binder.city,
      county: original.binder.county,
      model_definition: original.binder.model_definition,
      property_id: original.binder.property_id,
      is_primary: false, // Copies are never primary
    })
    .select()
    .single();

  if (binderError) {
    console.error('Duplicate binder error:', binderError);
    throw new Error('Failed to duplicate binder');
  }

  // Copy all items to the new binder
  if (original.items && original.items.length > 0) {
    const itemsToInsert = original.items.map((item) => ({
      binder_id: newBinder.id,
      chunk_id: item.chunk_id,
      chunk_content: item.chunk_content,
      section_type: item.section_type,
      title: item.title,
      user_notes: item.user_notes,
      source_url: item.source_url,
      regulation_code: item.regulation_code,
      sort_order: item.sort_order,
      is_starred: item.is_starred,
    }));

    const { error: itemsError } = await supabase
      .from('binder_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Duplicate binder items error:', itemsError);
      // Don't throw - binder was created, just items failed
    }
  }

  return newBinder;
}

// ============================================================================
// ALIASES (for backward compatibility with hooks)
// ============================================================================

/**
 * Alias for getBinderById - used by pdfExportService
 */
export const getBinderWithItems = getBinderById;

/**
 * Alias for addBinderItem - used by useComplianceBinder hook
 */
export const addItemToBinder = addBinderItem;

/**
 * Alias for deleteBinderItem - used by useComplianceBinder hook
 */
export const removeItemFromBinder = deleteBinderItem;

/**
 * Alias for reorderItems - used by useComplianceBinder hook
 */
export const reorderBinderItems = (binderId: string, itemIds: string[]) => {
  // Note: The original reorderItems requires sectionType, but the hook
  // doesn't provide it. We need to handle this differently.
  // For now, we'll update items individually without section filtering.
  return Promise.all(
    itemIds.map((id, index) =>
      supabase
        .from('binder_items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('binder_id', binderId)
    )
  ).then(() => {
    // Update binder's updated_at timestamp
    return supabase
      .from('compliance_binders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', binderId);
  }).then(() => undefined);
};

/**
 * Alias for toggleItemStarred - used by useComplianceBinder hook
 */
export const toggleItemStar = toggleItemStarred;

// ============================================================================
// TYPE ALIASES (for backward compatibility with hooks)
// ============================================================================

export type AddItemInput = AddBinderItemInput;
export type UpdateItemInput = UpdateBinderItemInput;

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Binder operations
  getUserBinders,
  getBinderById,
  getBinderWithItems,
  getPrimaryBinderForState,
  createBinder,
  updateBinder,
  deleteBinder,
  duplicateBinder,
  // Item operations
  getBinderItems,
  getItemsBySection,
  addBinderItem,
  addItemToBinder,
  updateBinderItem,
  deleteBinderItem,
  removeItemFromBinder,
  toggleItemStarred,
  toggleItemStar,
  reorderItems,
  reorderBinderItems,
  moveItemToSection,
  searchBinderItems,
  // Statistics
  getBinderStats,
};
