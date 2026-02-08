/**
 * usePartnerInterests — Gift tracker CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PartnerInterestItem,
  PartnerInterestItemInsert,
  PartnerInterestItemUpdate,
  InterestCategory,
} from '@/types/partner-discovery';
import {
  getInterestItems,
  addInterestItem,
  updateInterestItem,
  deleteInterestItem,
} from '@/services/partnerDiscoveryService';

export function usePartnerInterests(aboutUserId?: string) {
  const [items, setItems] = useState<PartnerInterestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterCategory, setFilterCategory] = useState<InterestCategory | 'all'>('all');

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getInterestItems(aboutUserId);
      setItems(data);
    } catch (err) {
      console.error('[usePartnerInterests] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [aboutUserId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(async (item: PartnerInterestItemInsert) => {
    const created = await addInterestItem(item);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const editItem = useCallback(async (itemId: string, update: PartnerInterestItemUpdate) => {
    const updated = await updateInterestItem(itemId, update);
    setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
    return updated;
  }, []);

  const togglePurchased = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    return editItem(itemId, { is_purchased: !item.is_purchased });
  }, [items, editItem]);

  const removeItem = useCallback(async (itemId: string) => {
    await deleteInterestItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const filteredItems = filterCategory === 'all'
    ? items
    : items.filter((i) => i.item_category === filterCategory);

  return {
    items,
    filteredItems,
    isLoading,
    error,
    filterCategory,
    setFilterCategory,
    addItem,
    editItem,
    togglePurchased,
    removeItem,
    reload: loadItems,
  };
}
