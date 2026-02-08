/**
 * Phase 1C: DailyPulseCard Component
 * 15-second daily emotional check-in using emoji selectors.
 * Shows mood + connection rating, optional micro-moment text,
 * and a 7-day sparkline of recent pulses.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smile, Heart, Check, Pencil } from 'lucide-react';
import { useRelationshipDailyPulse } from '@/contexts/RelationshipDailyPulseContext';
import {
  MOOD_OPTIONS,
  CONNECTION_OPTIONS,
  type MoodOption,
} from '@/types/relationship-daily-pulse';

interface DailyPulseCardProps {
  className?: string;
}

function EmojiSelector({
  options,
  selected,
  onSelect,
  label,
}: {
  options: MoodOption[];
  selected: number | null;
  onSelect: (value: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <div className="flex gap-1.5 justify-center">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
              selected === opt.value
                ? 'border-rose-400 bg-rose-500/10 scale-110'
                : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:scale-105'
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span
              className={`text-[9px] ${
                selected === opt.value ? 'text-rose-300' : 'text-white/30'
              }`}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PulseSparkline({ pulses }: { pulses: { mood: number; connection: number }[] }) {
  if (pulses.length === 0) return null;

  const maxVal = 5;
  const width = 140;
  const height = 32;
  const padding = 2;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = pulses.map((p, i) => {
    const x = padding + (i / Math.max(pulses.length - 1, 1)) * usableW;
    const avg = (p.mood + p.connection) / 2;
    const y = padding + usableH - (avg / maxVal) * usableH;
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="rgb(251, 113, 133)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="2.5"
          fill="rgb(251, 113, 133)"
        />
      )}
    </svg>
  );
}

export function DailyPulseCard({ className = '' }: DailyPulseCardProps) {
  const {
    todaysPulse,
    hasSubmittedToday,
    recentPulses,
    weekSummary,
    submit,
  } = useRelationshipDailyPulse();

  const [mood, setMood] = useState<number | null>(todaysPulse?.mood_rating ?? null);
  const [connection, setConnection] = useState<number | null>(
    todaysPulse?.connection_rating ?? null
  );
  const [microMoment, setMicroMoment] = useState(todaysPulse?.micro_moment ?? '');
  const [showMoment, setShowMoment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (mood == null || connection == null) return;
    setIsSubmitting(true);
    try {
      await submit({
        mood_rating: mood,
        connection_rating: connection,
        micro_moment: microMoment.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to submit pulse:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [mood, connection, microMoment, submit]);

  const canSubmit = mood != null && connection != null;

  // Sparkline data from recent pulses (last 7)
  const sparklineData = recentPulses
    .slice(0, 7)
    .reverse()
    .map((p) => ({ mood: p.mood_rating, connection: p.connection_rating }));

  // Already submitted view
  if (hasSubmittedToday && !isEditing) {
    const moodOpt = MOOD_OPTIONS.find((o) => o.value === todaysPulse?.mood_rating);
    const connOpt = CONNECTION_OPTIONS.find(
      (o) => o.value === todaysPulse?.connection_rating
    );

    return (
      <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Smile className="h-4 w-4 text-rose-400" />
              Daily Pulse
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-400/30 text-emerald-300 text-[10px]"
              >
                <Check className="h-3 w-3 mr-0.5" />
                Done
              </Badge>
              <button
                onClick={() => setIsEditing(true)}
                className="text-white/20 hover:text-white/40 transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-2xl">{moodOpt?.emoji ?? '?'}</span>
                <p className="text-[9px] text-white/30 mt-0.5">{moodOpt?.label}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl">{connOpt?.emoji ?? '?'}</span>
                <p className="text-[9px] text-white/30 mt-0.5">{connOpt?.label}</p>
              </div>
              {todaysPulse?.micro_moment && (
                <p className="text-[10px] text-white/40 italic max-w-[140px] truncate">
                  &ldquo;{todaysPulse.micro_moment}&rdquo;
                </p>
              )}
            </div>
            <PulseSparkline pulses={sparklineData} />
          </div>
          {weekSummary && (
            <div className="flex gap-3 mt-3 pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/30">
                7-day avg: {MOOD_OPTIONS.find((o) => o.value === Math.round(weekSummary.avgMood ?? 0))?.emoji ?? '?'}{' '}
                mood &middot;{' '}
                {CONNECTION_OPTIONS.find((o) => o.value === Math.round(weekSummary.avgConnection ?? 0))?.emoji ?? '?'}{' '}
                connection &middot; {weekSummary.pulseCount} check-ins
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Input view
  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Smile className="h-4 w-4 text-rose-400" />
            Daily Pulse
          </CardTitle>
          <span className="text-[10px] text-white/20">~15 seconds</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmojiSelector
          options={MOOD_OPTIONS}
          selected={mood}
          onSelect={setMood}
          label="How are you feeling today?"
        />

        <EmojiSelector
          options={CONNECTION_OPTIONS}
          selected={connection}
          onSelect={setConnection}
          label="How connected to your partner?"
        />

        {/* Optional micro-moment */}
        {showMoment ? (
          <div>
            <p className="text-xs text-white/40 mb-1">
              One positive micro-moment today (optional):
            </p>
            <input
              type="text"
              value={microMoment}
              onChange={(e) => setMicroMoment(e.target.value)}
              placeholder="e.g., 'We laughed together at breakfast'"
              maxLength={200}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-rose-400/30"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowMoment(true)}
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            + Add a micro-moment (optional)
          </button>
        )}

        <div className="flex items-center justify-between pt-1">
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/30 hover:text-white/50"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600 text-white ml-auto"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : hasSubmittedToday
              ? 'Update Pulse'
              : 'Log Pulse'}
            <Heart className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
