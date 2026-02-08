/**
 * Phase 2A: ActiveSeasonsManager
 * Shows all active seasons with options to adjust intensity,
 * add notes, or end a season.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus, Pencil } from 'lucide-react';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SEASON_CATEGORIES } from '@/types/relationship-seasons';
import { SeasonKPIImpactChart } from './SeasonKPIImpactChart';

export function ActiveSeasonsManager() {
  const { activeSeasons, closeSeason, editSeason } = useRelationshipSeason();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  if (activeSeasons.length === 0) {
    return (
      <Card className="border-white/5 bg-mi-navy-light">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-white/40">
            No active seasons. Browse the catalog below to add one.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleClose = async (userSeasonId: string) => {
    setClosingId(userSeasonId);
    try {
      await closeSeason(userSeasonId);
    } catch (err) {
      console.error('Failed to close season:', err);
    } finally {
      setClosingId(null);
    }
  };

  const handleIntensityChange = async (userSeasonId: string, current: number, delta: number) => {
    const next = Math.max(1, Math.min(5, current + delta));
    if (next === current) return;
    try {
      await editSeason(userSeasonId, { intensity: next });
    } catch (err) {
      console.error('Failed to update intensity:', err);
    }
  };

  const handleSaveNotes = async (userSeasonId: string) => {
    try {
      await editSeason(userSeasonId, { notes: editNotes.trim() || null });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/80">
          Your Active Seasons ({activeSeasons.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSeasons.map((us) => {
          const catDef = SEASON_CATEGORIES.find((c) => c.category === us.season.category);
          const isClosing = closingId === us.id;
          const isEditing = editingId === us.id;
          const daysActive = Math.max(
            1,
            Math.floor(
              (Date.now() - new Date(us.started_at).getTime()) / (1000 * 60 * 60 * 24)
            )
          );

          return (
            <div
              key={us.id}
              className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-2"
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <span className="text-xl">{catDef?.icon ?? '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {us.season.season_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30">{daysActive}d active</span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-[10px] text-white/30">{catDef?.label}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => handleClose(us.id)}
                  disabled={isClosing}
                  title="End this season"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Intensity control */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 w-16">Intensity</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleIntensityChange(us.id, us.intensity, -1)}
                    className="h-5 w-5 rounded flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-4 rounded-sm transition-colors ${
                          level <= us.intensity
                            ? level <= 2
                              ? 'bg-emerald-400'
                              : level <= 3
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleIntensityChange(us.id, us.intensity, 1)}
                    className="h-5 w-5 rounded flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this season..."
                    maxLength={500}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-rose-400/30"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={() => handleSaveNotes(us.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-white/30"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditNotes(us.notes ?? '');
                    setEditingId(us.id);
                  }}
                  className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  {us.notes ? us.notes : 'Add notes...'}
                </button>
              )}

              {/* Compact KPI impacts */}
              <SeasonKPIImpactChart impacts={us.season.predicted_kpi_impacts} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
