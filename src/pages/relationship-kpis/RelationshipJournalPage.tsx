/**
 * RIE Phase 6B: Relationship Journal Page
 * Private and shared journaling with entry types, mood tracking,
 * KPI tagging, and prompt support.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookHeart,
  Plus,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getMyJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
} from '@/services/relationshipExtendedService';
import type {
  RelationshipJournalEntry,
  JournalEntryType,
} from '@/types/relationship-extended';

// ─── Config ─────────────────────────────────────────────────────────────
const ENTRY_TYPES: {
  value: JournalEntryType;
  label: string;
  icon: string;
  prompt: string;
}[] = [
  {
    value: 'reflection',
    label: 'Reflection',
    icon: '🪞',
    prompt: 'What stood out to me about our relationship this week...',
  },
  {
    value: 'gratitude',
    label: 'Gratitude',
    icon: '🙏',
    prompt: 'Something I appreciate about my partner today...',
  },
  {
    value: 'goal',
    label: 'Goal',
    icon: '🎯',
    prompt: 'Something I want us to work toward together...',
  },
  {
    value: 'milestone',
    label: 'Milestone',
    icon: '🏆',
    prompt: 'A relationship win we should celebrate...',
  },
  {
    value: 'conflict_log',
    label: 'Conflict Log',
    icon: '📝',
    prompt: 'What happened, how I felt, and what I learned...',
  },
  {
    value: 'shared',
    label: 'Shared Note',
    icon: '💌',
    prompt: 'A message for my partner to read...',
  },
];

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: 'Low', color: 'text-red-400' },
  { value: 2, icon: Frown, label: 'Down', color: 'text-orange-400' },
  { value: 3, icon: Meh, label: 'Neutral', color: 'text-amber-400' },
  { value: 4, icon: Smile, label: 'Good', color: 'text-lime-400' },
  { value: 5, icon: Smile, label: 'Great', color: 'text-green-400' },
];

export default function RelationshipJournalPage() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<RelationshipJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New entry form state
  const [newType, setNewType] = useState<JournalEntryType>('reflection');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState<number | null>(null);
  const [newPrivate, setNewPrivate] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getMyJournalEntries(50);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const selectedTypeDef = ENTRY_TYPES.find((t) => t.value === newType);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setIsCreating(true);
    try {
      const entry = await createJournalEntry({
        entry_type: newType,
        title: newTitle.trim() || null,
        content: newContent.trim(),
        mood_rating: newMood,
        is_private: newPrivate,
        shared_with_partner: !newPrivate,
        prompt_used: selectedTypeDef?.prompt ?? null,
      });
      setEntries((prev) => [entry, ...prev]);
      setNewType('reflection');
      setNewTitle('');
      setNewContent('');
      setNewMood(null);
      setNewPrivate(true);
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to create journal entry:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const thisMonthEntries = entries.filter((e) => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const avgMood =
    entries.filter((e) => e.mood_rating != null).length > 0
      ? (
          entries
            .filter((e) => e.mood_rating != null)
            .reduce((sum, e) => sum + (e.mood_rating ?? 0), 0) /
          entries.filter((e) => e.mood_rating != null).length
        ).toFixed(1)
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <BookHeart className="h-6 w-6 text-violet-400" />
            <h1 className="text-xl font-semibold text-white">Journal</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-white/70"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <BookHeart className="h-6 w-6 text-violet-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                Relationship Journal
              </h1>
              <p className="text-xs text-white/40">
                Private and shared journaling to deepen connection.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-violet-500 hover:bg-violet-600 text-white"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Write
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-violet-400">
                {entries.length}
              </p>
              <p className="text-[10px] text-white/30">Total Entries</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {thisMonthEntries.length}
              </p>
              <p className="text-[10px] text-white/30">This Month</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {avgMood ?? '—'}
              </p>
              <p className="text-[10px] text-white/30">Avg Mood</p>
            </CardContent>
          </Card>
        </div>

        {/* New Entry Form */}
        {showNewForm && (
          <Card className="border-violet-500/20 bg-mi-navy-light shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">
                New Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Entry type */}
              <div>
                <p className="text-xs text-white/40 mb-1.5">Entry type:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ENTRY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
                        newType === t.value
                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                          : 'border-white/5 text-white/30 hover:bg-white/5'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt hint */}
              {selectedTypeDef && (
                <div className="flex items-start gap-2 p-2 rounded bg-violet-500/5 border border-violet-500/10">
                  <Lightbulb className="h-3.5 w-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-violet-400/70 italic">
                    {selectedTypeDef.prompt}
                  </p>
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (optional)..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
              />

              {/* Content */}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 resize-none"
              />

              {/* Mood */}
              <div>
                <p className="text-xs text-white/40 mb-1">Mood:</p>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((m) => {
                    const MoodIcon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() =>
                          setNewMood(newMood === m.value ? null : m.value)
                        }
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${
                          newMood === m.value
                            ? 'bg-violet-500/10 border border-violet-500/30'
                            : 'border border-transparent hover:bg-white/5'
                        }`}
                      >
                        <MoodIcon
                          className={`h-5 w-5 ${
                            newMood === m.value ? m.color : 'text-white/20'
                          }`}
                        />
                        <span className="text-[9px] text-white/30">
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy */}
              <button
                onClick={() => setNewPrivate(!newPrivate)}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                {newPrivate ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Private — only you can see this
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5 text-violet-400" />
                    Shared — your partner can read this
                  </>
                )}
              </button>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={handleCreate}
                  disabled={!newContent.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <BookHeart className="h-3 w-3 mr-1" />
                  )}
                  Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => {
              const typeDef = ENTRY_TYPES.find(
                (t) => t.value === entry.entry_type,
              );
              const moodDef = entry.mood_rating
                ? MOOD_OPTIONS.find((m) => m.value === entry.mood_rating)
                : null;
              const isExpanded = expandedId === entry.id;
              const isDeleting = deletingId === entry.id;

              return (
                <Card
                  key={entry.id}
                  className="border-white/5 bg-mi-navy-light shadow-lg"
                >
                  <CardContent className="p-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      <span className="text-lg mt-0.5">
                        {typeDef?.icon ?? '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">
                          {entry.title || typeDef?.label || 'Journal Entry'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-violet-500/20 text-violet-400"
                          >
                            {typeDef?.label ?? entry.entry_type}
                          </Badge>
                          {moodDef && (
                            <span className={`text-[10px] ${moodDef.color}`}>
                              {moodDef.label}
                            </span>
                          )}
                          <span className="text-[10px] text-white/20">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          {entry.is_private ? (
                            <Lock className="h-2.5 w-2.5 text-white/15" />
                          ) : (
                            <Unlock className="h-2.5 w-2.5 text-violet-400/40" />
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="text-[11px] text-white/30 mt-1 line-clamp-2">
                            {entry.content}
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/30" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>

                        {entry.related_kpis.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                            <span className="text-[10px] text-white/30">
                              Related:
                            </span>
                            {entry.related_kpis.map((kpi) => (
                              <Badge
                                key={kpi}
                                variant="secondary"
                                className="text-[9px] bg-white/5 text-white/30"
                              >
                                {kpi.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {entry.prompt_used && (
                          <p className="text-[10px] text-white/20 italic mt-2">
                            Prompt: &ldquo;{entry.prompt_used}&rdquo;
                          </p>
                        )}

                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2"
                            onClick={() => handleDelete(entry.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-0.5" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          !showNewForm && (
            <Card className="border-violet-500/20 bg-mi-navy-light shadow-lg">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <BookHeart className="h-7 w-7 text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Start Your Relationship Journal
                </h2>
                <p className="text-sm text-white/50 max-w-md mx-auto mb-4">
                  Write reflections, gratitude notes, goals, and shared messages.
                  Track your mood and watch your relationship grow.
                </p>
                <Button
                  className="bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Write First Entry
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
