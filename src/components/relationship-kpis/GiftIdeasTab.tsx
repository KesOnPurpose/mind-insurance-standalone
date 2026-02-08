/**
 * GiftIdeasTab — Quick-add, categories, purchased toggle
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Plus, Check, Trash2, ShoppingBag, Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePartnerInterests } from '@/hooks/usePartnerInterests';
import { useAuth } from '@/contexts/AuthContext';
import { getActivePartnership } from '@/services/relationshipPartnershipService';
import { useEffect } from 'react';
import type { InterestCategory } from '@/types/partner-discovery';

const CATEGORY_OPTIONS: { value: InterestCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'gift_idea', label: 'Gift Ideas', icon: '🎁' },
  { value: 'hobby', label: 'Hobbies', icon: '🎨' },
  { value: 'food', label: 'Food & Drink', icon: '🍕' },
  { value: 'experience', label: 'Experiences', icon: '🎪' },
  { value: 'general', label: 'General', icon: '💡' },
];

export function GiftIdeasTab() {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerLoaded, setPartnerLoaded] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState<InterestCategory>('gift_idea');

  // Load items without filtering by about_user_id so solo-saved items show
  const {
    filteredItems,
    isLoading,
    filterCategory,
    setFilterCategory,
    addItem,
    togglePurchased,
    removeItem,
  } = usePartnerInterests(partnerId ?? undefined);

  // Load partner ID
  useEffect(() => {
    async function loadPartner() {
      try {
        const partnership = await getActivePartnership();
        if (partnership && user) {
          const pid = partnership.user_id === user.id
            ? partnership.partner_id
            : partnership.user_id;
          setPartnerId(pid);
        }
      } catch {
        // No partner paired
      } finally {
        setPartnerLoaded(true);
      }
    }
    loadPartner();
  }, [user]);

  const handleAdd = async () => {
    if (!newItemText.trim() || !partnerId) return;
    try {
      await addItem({
        about_user_id: partnerId,
        item_text: newItemText.trim(),
        item_category: newCategory,
      });
      setNewItemText('');
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show empty state only when loaded and truly no items
  if (partnerLoaded && !partnerId && filteredItems.length === 0) {
    return (
      <div className="text-center py-16">
        <Gift className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">
          Pair with your partner first
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Connect with your partner to start tracking gift ideas
          and interests about them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick-add input — only when paired */}
      {partnerId && (
        <Card className="bg-white/[0.03] border-white/10">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a gift idea or interest..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
              />
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as InterestCategory)}
              >
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mi-navy border-white/10">
                  {CATEGORY_OPTIONS.filter((c) => c.value !== 'all').map((cat) => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="text-gray-300 focus:bg-white/10 focus:text-white"
                    >
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={handleAdd}
                disabled={!newItemText.trim()}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-0 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value as InterestCategory | 'all')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
              filterCategory === cat.value
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/5 text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No items yet. Start adding!</p>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`bg-white/[0.03] border-white/10 transition-all ${
                item.is_purchased ? 'opacity-60' : ''
              }`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <button
                    onClick={() => togglePurchased(item.id)}
                    className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      item.is_purchased
                        ? 'bg-emerald-500/30 border-emerald-500/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {item.is_purchased && <Check className="h-3 w-3 text-emerald-400" />}
                  </button>
                  <span className={`flex-1 text-sm ${
                    item.is_purchased ? 'line-through text-gray-500' : 'text-white'
                  }`}>
                    {item.item_text}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white/5 text-gray-500 border-0 text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {item.item_category.replace('_', ' ')}
                  </Badge>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
