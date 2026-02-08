/**
 * RIE Phase 2A: Marriage Seasons Page
 * Full page for browsing 90 seasons across 10 categories,
 * managing active seasons, and viewing season history.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SEASON_CATEGORIES, type SeasonCategory } from '@/types/relationship-seasons';
import {
  SeasonCategoryGrid,
  SeasonList,
  ActiveSeasonsManager,
  SeasonHistory,
  SeasonOnboardingWizard,
} from '@/components/relationship/seasons';

export default function RelationshipSeasonsPage() {
  const navigate = useNavigate();
  const {
    catalog,
    activeSeasons,
    isLoading,
    getCatalogByCategory,
    seasonsOnboarded,
    setSeasonsOnboarded,
    refresh,
  } = useRelationshipSeason();

  const handleOnboardingComplete = useCallback(async () => {
    setSeasonsOnboarded(true);
    await refresh();
  }, [setSeasonsOnboarded, refresh]);

  const handleOnboardingSkip = useCallback(() => {
    setSeasonsOnboarded(true);
  }, [setSeasonsOnboarded]);
  const [selectedCategory, setSelectedCategory] = useState<SeasonCategory | null>(null);

  // Build season count per category
  const seasonCounts = SEASON_CATEGORIES.reduce((acc, cat) => {
    acc[cat.category] = catalog.filter((s) => s.category === cat.category).length;
    return acc;
  }, {} as Record<SeasonCategory, number>);

  const filteredSeasons = selectedCategory ? getCatalogByCategory(selectedCategory) : [];
  const selectedCatDef = selectedCategory
    ? SEASON_CATEGORIES.find((c) => c.category === selectedCategory)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Marriage Seasons</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding wizard on first visit
  if (!seasonsOnboarded) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <SeasonOnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
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
            <Calendar className="h-6 w-6 text-rose-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Marriage Seasons</h1>
              <p className="text-xs text-white/40">
                Identify your current life season and understand its impact on your relationship.
              </p>
            </div>
          </div>
        </div>

        {/* Active Seasons Manager */}
        {activeSeasons.length > 0 && <ActiveSeasonsManager />}

        {/* Category Grid */}
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
            Browse by Category
          </p>
          <SeasonCategoryGrid
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) =>
              setSelectedCategory(cat === selectedCategory ? null : cat)
            }
            seasonCounts={seasonCounts}
          />
        </div>

        {/* Season List (when category selected) */}
        {selectedCategory && selectedCatDef && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{selectedCatDef.icon}</span>
              <div>
                <p className="text-sm font-medium text-white/80">
                  {selectedCatDef.label}
                </p>
                <p className="text-xs text-white/40">{selectedCatDef.description}</p>
              </div>
            </div>
            <SeasonList seasons={filteredSeasons} />
          </div>
        )}

        {/* No category selected hint */}
        {!selectedCategory && (
          <div className="text-center py-8">
            <p className="text-sm text-white/30">
              Select a category above to browse available seasons.
            </p>
            <p className="text-xs text-white/20 mt-1">
              {catalog.length} seasons across {SEASON_CATEGORIES.length} categories
            </p>
          </div>
        )}

        {/* Season History */}
        <SeasonHistory />
      </div>
    </div>
  );
}
