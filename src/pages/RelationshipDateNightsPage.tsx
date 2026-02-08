/**
 * RIE Phase 6A: Date Night Generator Page
 * Create, plan, and track date nights with category/budget filters,
 * status management, and enjoyment ratings.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getMyDateNights,
  createDateNight,
  updateDateNight,
} from '@/services/relationshipExtendedService';
import type {
  RelationshipDateNight,
  DateNightCategory,
  DateNightBudget,
  DateNightStatus,
} from '@/types/relationship-extended';

// ─── Config ─────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  DateNightCategory,
  { label: string; icon: string }
> = {
  romantic: { label: 'Romantic', icon: '🌹' },
  adventure: { label: 'Adventure', icon: '🏔️' },
  relaxation: { label: 'Relaxation', icon: '🧖' },
  creative: { label: 'Creative', icon: '🎨' },
  intellectual: { label: 'Intellectual', icon: '📚' },
  spiritual: { label: 'Spiritual', icon: '🕊️' },
  physical: { label: 'Physical', icon: '🏃' },
  social: { label: 'Social', icon: '🎭' },
};

const BUDGET_CONFIG: Record<DateNightBudget, { label: string; icon: string }> = {
  free: { label: 'Free', icon: '🆓' },
  low: { label: '$1-25', icon: '💵' },
  medium: { label: '$25-75', icon: '💳' },
  high: { label: '$75+', icon: '💎' },
};

const STATUS_CONFIG: Record<
  DateNightStatus,
  { label: string; color: string }
> = {
  suggested: { label: 'Suggested', color: 'bg-blue-500/20 text-blue-400' },
  planned: { label: 'Planned', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  skipped: { label: 'Skipped', color: 'bg-white/10 text-white/30' },
};

export default function RelationshipDateNightsPage() {
  const navigate = useNavigate();

  const [dateNights, setDateNights] = useState<RelationshipDateNight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<DateNightCategory>('romantic');
  const [newBudget, setNewBudget] = useState<DateNightBudget>('free');
  const [newDate, setNewDate] = useState('');

  const loadDateNights = useCallback(async () => {
    try {
      const data = await getMyDateNights(50);
      setDateNights(data);
    } catch (err) {
      console.error('Failed to load date nights:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDateNights();
  }, [loadDateNights]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const dn = await createDateNight({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        category: newCategory,
        budget_range: newBudget,
        scheduled_for: newDate || null,
      });
      setDateNights((prev) => [dn, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setNewCategory('romantic');
      setNewBudget('free');
      setNewDate('');
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to create date night:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: DateNightStatus) => {
    setUpdatingId(id);
    try {
      const updated = await updateDateNight(id, { status });
      setDateNights((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      console.error('Failed to update date night:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    setUpdatingId(id);
    try {
      const updated = await updateDateNight(id, {
        enjoyment_rating: rating,
        status: 'completed',
      });
      setDateNights((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      console.error('Failed to rate date night:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const upcoming = dateNights.filter(
    (d) => d.status === 'suggested' || d.status === 'planned',
  );
  const completed = dateNights.filter(
    (d) => d.status === 'completed' || d.status === 'skipped',
  );

  const avgRating =
    dateNights.filter((d) => d.enjoyment_rating != null).length > 0
      ? (
          dateNights
            .filter((d) => d.enjoyment_rating != null)
            .reduce((sum, d) => sum + (d.enjoyment_rating ?? 0), 0) /
          dateNights.filter((d) => d.enjoyment_rating != null).length
        ).toFixed(1)
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-pink-400" />
            <h1 className="text-xl font-semibold text-white">Date Nights</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
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
            <Heart className="h-6 w-6 text-pink-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Date Night Generator</h1>
              <p className="text-xs text-white/40">
                Plan intentional time together tailored to your relationship.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-pink-500 hover:bg-pink-600 text-white"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-pink-400">{dateNights.length}</p>
              <p className="text-[10px] text-white/30">Total</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {completed.filter((d) => d.status === 'completed').length}
              </p>
              <p className="text-[10px] text-white/30">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {avgRating ?? '—'}
              </p>
              <p className="text-[10px] text-white/30">Avg Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* New Date Night Form */}
        {showNewForm && (
          <Card className="border-pink-500/20 bg-mi-navy-light shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">
                Plan a Date Night
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Date night idea..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/40"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details (optional)..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 resize-none"
              />

              {/* Category */}
              <div>
                <p className="text-xs text-white/40 mb-1">Category:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(CATEGORY_CONFIG) as [
                      DateNightCategory,
                      { label: string; icon: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewCategory(key)}
                      className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
                        newCategory === key
                          ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                          : 'border-white/5 text-white/30 hover:bg-white/5'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <p className="text-xs text-white/40 mb-1">Budget:</p>
                <div className="flex gap-2">
                  {(
                    Object.entries(BUDGET_CONFIG) as [
                      DateNightBudget,
                      { label: string; icon: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewBudget(key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${
                        newBudget === key
                          ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                          : 'border-white/5 text-white/30 hover:bg-white/5'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-white/40 mb-1">Schedule (optional):</p>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500/40"
                />
              </div>

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
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Heart className="h-3 w-3 mr-1" />
                  )}
                  Save Date Night
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Upcoming
            </p>
            <div className="space-y-2">
              {upcoming.map((dn) => {
                const catCfg = CATEGORY_CONFIG[dn.category];
                const budgetCfg = BUDGET_CONFIG[dn.budget_range];
                const statusCfg = STATUS_CONFIG[dn.status];
                const isExpanded = expandedId === dn.id;
                const isUpdating = updatingId === dn.id;

                return (
                  <Card
                    key={dn.id}
                    className="border-pink-500/10 bg-mi-navy-light shadow-lg"
                  >
                    <CardContent className="p-3">
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : dn.id)
                        }
                      >
                        <span className="text-lg mt-0.5">{catCfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80">
                            {dn.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] ${statusCfg.color}`}
                            >
                              {statusCfg.label}
                            </Badge>
                            <span className="text-[10px] text-white/30">
                              {budgetCfg.icon} {budgetCfg.label}
                            </span>
                            {dn.scheduled_for && (
                              <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(dn.scheduled_for).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-white/30" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/30" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          {dn.description && (
                            <p className="text-xs text-white/50 mb-3">
                              {dn.description}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {dn.status === 'suggested' && (
                              <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px]"
                                onClick={() =>
                                  handleUpdateStatus(dn.id, 'planned')
                                }
                                disabled={isUpdating}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Plan It
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white text-[11px]"
                              onClick={() =>
                                handleUpdateStatus(dn.id, 'completed')
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/30 hover:text-white/50 text-[11px]"
                              onClick={() =>
                                handleUpdateStatus(dn.id, 'skipped')
                              }
                              disabled={isUpdating}
                            >
                              <SkipForward className="h-3 w-3 mr-1" />
                              Skip
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Past Date Nights
            </p>
            <div className="space-y-2">
              {completed.map((dn) => {
                const catCfg = CATEGORY_CONFIG[dn.category];
                const isUpdating = updatingId === dn.id;

                return (
                  <div
                    key={dn.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <span className="text-lg">{catCfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/60 truncate">
                        {dn.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] ${STATUS_CONFIG[dn.status].color}`}
                        >
                          {STATUS_CONFIG[dn.status].label}
                        </Badge>
                        {dn.enjoyment_rating != null && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: dn.enjoyment_rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="h-2.5 w-2.5 text-amber-400 fill-amber-400"
                                />
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {dn.status === 'completed' && dn.enjoyment_rating == null && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRate(dn.id, r)}
                            disabled={isUpdating}
                            className="text-white/20 hover:text-amber-400 transition-colors"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {dateNights.length === 0 && !showNewForm && (
          <Card className="border-pink-500/20 bg-mi-navy-light shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-7 w-7 text-pink-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Plan Your First Date Night
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-4">
                Create intentional time together. Pick a category, set a budget,
                and build memories that strengthen your bond.
              </p>
              <Button
                className="bg-pink-500 hover:bg-pink-600 text-white"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Date Night
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
