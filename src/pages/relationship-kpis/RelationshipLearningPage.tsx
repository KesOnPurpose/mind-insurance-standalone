/**
 * RIE Phase 5: Learning Hub Page
 * Displays micro-learning modules by category with progress tracking,
 * difficulty levels, and content block viewer.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getModulesWithProgress,
  upsertLearningProgress,
  updateLearningProgress,
} from '@/services/relationshipExtendedService';
import type {
  LearningModuleWithProgress,
  LearningCategory,
  LearningDifficulty,
} from '@/types/relationship-extended';

// ─── Category config ────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  LearningCategory,
  { label: string; icon: string; color: string }
> = {
  communication: { label: 'Communication', icon: '💬', color: 'text-blue-400' },
  intimacy: { label: 'Intimacy', icon: '❤️', color: 'text-rose-400' },
  conflict: { label: 'Conflict', icon: '⚡', color: 'text-amber-400' },
  finance: { label: 'Finance', icon: '💰', color: 'text-green-400' },
  parenting: { label: 'Parenting', icon: '👶', color: 'text-purple-400' },
  self_care: { label: 'Self Care', icon: '🧘', color: 'text-teal-400' },
  trust: { label: 'Trust', icon: '🤝', color: 'text-indigo-400' },
  fun: { label: 'Fun', icon: '🎉', color: 'text-pink-400' },
};

const DIFFICULTY_CONFIG: Record<
  LearningDifficulty,
  { label: string; color: string }
> = {
  beginner: { label: 'Beginner', color: 'bg-green-500/20 text-green-400' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-500/20 text-amber-400' },
  advanced: { label: 'Advanced', color: 'bg-red-500/20 text-red-400' },
};

export default function RelationshipLearningPage() {
  const navigate = useNavigate();

  const [modules, setModules] = useState<LearningModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    try {
      const data = await getModulesWithProgress();
      setModules(data);
    } catch (err) {
      console.error('Failed to load learning modules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleStartModule = async (moduleId: string) => {
    setUpdatingId(moduleId);
    try {
      await upsertLearningProgress({
        module_id: moduleId,
        status: 'in_progress',
        progress_percent: 10,
      });
      await loadModules();
      setExpandedId(moduleId);
    } catch (err) {
      console.error('Failed to start module:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteModule = async (moduleId: string, progressId: string) => {
    setUpdatingId(moduleId);
    try {
      await updateLearningProgress(progressId, {
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      });
      await loadModules();
    } catch (err) {
      console.error('Failed to complete module:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute stats
  const totalModules = modules.length;
  const completedCount = modules.filter(
    (m) => m.progress?.status === 'completed',
  ).length;
  const inProgressCount = modules.filter(
    (m) => m.progress?.status === 'in_progress',
  ).length;

  // Get categories with counts
  const categoriesWithCounts = Object.entries(CATEGORY_CONFIG)
    .map(([key, config]) => ({
      value: key as LearningCategory,
      ...config,
      count: modules.filter((m) => m.category === key).length,
    }))
    .filter((c) => c.count > 0);

  const filteredModules = selectedCategory
    ? modules.filter((m) => m.category === selectedCategory)
    : modules;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-semibold text-white">Learning Hub</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
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
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Learning Hub</h1>
              <p className="text-xs text-white/40">
                Bite-sized modules to strengthen your relationship skills.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-indigo-400">
                {totalModules}
              </p>
              <p className="text-[10px] text-white/30">Total Modules</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {inProgressCount}
              </p>
              <p className="text-[10px] text-white/30">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-mi-navy-light">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {completedCount}
              </p>
              <p className="text-[10px] text-white/30">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        {categoriesWithCounts.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Browse by Category
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                }`}
              >
                All ({totalModules})
              </button>
              {categoriesWithCounts.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() =>
                    setSelectedCategory(
                      cat.value === selectedCategory ? null : cat.value,
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {cat.icon} {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Module List */}
        {filteredModules.length > 0 ? (
          <div className="space-y-2">
            {filteredModules.map((mod) => {
              const catConfig = CATEGORY_CONFIG[mod.category];
              const diffConfig = DIFFICULTY_CONFIG[mod.difficulty];
              const isExpanded = expandedId === mod.id;
              const isUpdating = updatingId === mod.id;
              const progress = mod.progress;
              const isCompleted = progress?.status === 'completed';
              const isInProgress = progress?.status === 'in_progress';

              return (
                <Card
                  key={mod.id}
                  className={`border-white/5 bg-mi-navy-light shadow-lg transition-colors ${
                    isCompleted ? 'border-green-500/20' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : mod.id)
                      }
                    >
                      <span className="text-lg mt-0.5">{catConfig.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80">
                          {mod.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] ${diffConfig.color}`}
                          >
                            {diffConfig.label}
                          </Badge>
                          <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {mod.estimated_minutes} min
                          </span>
                          {isCompleted && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-green-500/20 text-green-400"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                              Done
                            </Badge>
                          )}
                          {isInProgress && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-indigo-500/20 text-indigo-400"
                            >
                              {progress.progress_percent}%
                            </Badge>
                          )}
                        </div>
                        {/* Progress bar */}
                        {progress && (
                          <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted
                                  ? 'bg-green-400/60'
                                  : 'bg-indigo-400/60'
                              }`}
                              style={{
                                width: `${progress.progress_percent}%`,
                              }}
                            />
                          </div>
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
                        {mod.description && (
                          <p className="text-xs text-white/50 mb-3">
                            {mod.description}
                          </p>
                        )}

                        {/* Content blocks */}
                        {mod.content_blocks.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {mod.content_blocks
                              .sort((a, b) => a.order - b.order)
                              .map((block, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded bg-white/[0.03] border border-white/5"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] bg-white/5 text-white/40"
                                    >
                                      {block.type}
                                    </Badge>
                                    <span className="text-[11px] font-medium text-white/60">
                                      {block.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-white/40 leading-relaxed">
                                    {block.content.length > 200
                                      ? block.content.slice(0, 200) + '...'
                                      : block.content}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Target KPIs */}
                        {mod.target_kpis.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                            <BarChart3 className="h-3 w-3 text-white/30" />
                            <span className="text-[10px] text-white/30">
                              Targets:
                            </span>
                            {mod.target_kpis.map((kpi) => (
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

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!progress && (
                            <Button
                              size="sm"
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px]"
                              onClick={() => handleStartModule(mod.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              Start Module
                            </Button>
                          )}
                          {isInProgress && progress && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white text-[11px]"
                              onClick={() =>
                                handleCompleteModule(mod.id, progress.id)
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Mark Complete
                            </Button>
                          )}
                          {isCompleted && progress?.rating == null && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-white/30 mr-1">
                                Rate:
                              </span>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={async () => {
                                    setUpdatingId(mod.id);
                                    try {
                                      await updateLearningProgress(
                                        progress.id,
                                        { rating },
                                      );
                                      await loadModules();
                                    } finally {
                                      setUpdatingId(null);
                                    }
                                  }}
                                  className="text-white/20 hover:text-amber-400 transition-colors"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                </button>
                              ))}
                            </div>
                          )}
                          {isCompleted && progress?.rating != null && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: progress.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 text-amber-400 fill-amber-400"
                                  />
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-indigo-500/20 bg-mi-navy-light shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                No Modules Available
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                {selectedCategory
                  ? 'No modules found in this category. Try selecting a different one.'
                  : 'Learning modules are being prepared. Check back soon!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
