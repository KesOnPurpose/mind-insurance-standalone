/**
 * RKPI Page: ConnectionPrompts
 * Grid of connection prompt cards with filters: category, intimacy level, KPI.
 * Actions: copy to clipboard, "Use This Week" sets as active weekly prompt.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  Copy,
  Check,
  Loader2,
  Filter,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type {
  RelationshipConnectionPrompt,
  PromptCategory,
  IntimacyLevel,
  RelationshipKPIName,
} from '@/types/relationship-kpis';
import { getActivePrompts } from '@/services/relationshipConnectionPromptService';

const CATEGORIES: { value: PromptCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'physical', label: 'Physical' },
  { value: 'intellectual', label: 'Intellectual' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'fun', label: 'Fun' },
];

const INTIMACY_LEVELS: { value: IntimacyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'deep', label: 'Deep' },
];

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  emotional: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  physical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  intellectual: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  spiritual: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  fun: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const INTIMACY_BADGES: Record<IntimacyLevel, string> = {
  light: 'bg-sky-500/15 text-sky-300',
  medium: 'bg-orange-500/15 text-orange-300',
  deep: 'bg-rose-500/15 text-rose-300',
};

export default function ConnectionPrompts() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prompts, setPrompts] = useState<RelationshipConnectionPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'all'>('all');
  const [intimacyFilter, setIntimacyFilter] = useState<IntimacyLevel | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load prompts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getActivePrompts();
        if (!cancelled) setPrompts(data);
      } catch (err) {
        console.error('[RKPI] Failed to load prompts:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtered prompts
  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      if (categoryFilter !== 'all' && p.prompt_category !== categoryFilter) return false;
      if (intimacyFilter !== 'all' && p.intimacy_level !== intimacyFilter) return false;
      return true;
    });
  }, [prompts, categoryFilter, intimacyFilter]);

  const handleCopy = async (prompt: RelationshipConnectionPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopiedId(prompt.id);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/60 h-8 w-8"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Connection Prompts</h1>
            <p className="text-xs text-white/40">
              Conversation starters to deepen your bond
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          {/* Category filter */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  categoryFilter === cat.value
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Intimacy level filter */}
          <div className="flex gap-1 flex-wrap">
            {INTIMACY_LEVELS.map((level) => (
              <button
                key={level.value}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  intimacyFilter === level.value
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
                onClick={() => setIntimacyFilter(level.value)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">
              {prompts.length === 0
                ? 'No prompts available yet.'
                : 'No prompts match your filters.'}
            </p>
            {prompts.length > 0 && (
              <button
                className="text-xs text-rose-400 hover:text-rose-300 mt-2"
                onClick={() => {
                  setCategoryFilter('all');
                  setIntimacyFilter('all');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Prompt grid */}
        {!isLoading && filtered.length > 0 && (
          <>
            <p className="text-xs text-white/30 mb-3">
              {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isCopied={copiedId === prompt.id}
                  onCopy={() => handleCopy(prompt)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: PromptCard
// ---------------------------------------------------------------------------

interface PromptCardProps {
  prompt: RelationshipConnectionPrompt;
  isCopied: boolean;
  onCopy: () => void;
}

function PromptCard({ prompt, isCopied, onCopy }: PromptCardProps) {
  const catStyle = CATEGORY_COLORS[prompt.prompt_category] ?? '';
  const intimacyStyle = INTIMACY_BADGES[prompt.intimacy_level] ?? '';

  const kpiLabel = prompt.focus_kpi
    ? KPI_DEFINITIONS.find((k) => k.name === prompt.focus_kpi)?.label ?? null
    : null;

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4 flex flex-col">
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${catStyle}`}>
          {prompt.prompt_category}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${intimacyStyle}`}>
          {prompt.intimacy_level}
        </span>
        {kpiLabel && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
            {kpiLabel}
          </span>
        )}
      </div>

      {/* Prompt text */}
      <p className="text-sm text-white/70 leading-relaxed flex-1">
        {prompt.prompt_text}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end mt-3 pt-2 border-t border-white/5">
        <button
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          onClick={onCopy}
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
