/**
 * SessionIntroCard — Warm invitation shown before KPI discovery chat begins.
 * Displays MIO brain avatar, KPI-specific heading, expected duration, and a Begin button.
 */

import { motion } from 'framer-motion';
import { Brain, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SessionIntroCardProps {
  kpiLabel: string;
  onBegin: () => void;
}

export function SessionIntroCard({ kpiLabel, onBegin }: SessionIntroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex items-center justify-center px-4 py-8"
    >
      <Card className="bg-gradient-to-br from-purple-500/10 to-rose-500/10 border-purple-500/20 max-w-sm w-full">
        <CardContent className="p-6 text-center space-y-4">
          {/* MIO avatar */}
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center">
            <Brain className="h-7 w-7 text-rose-400" />
          </div>

          {/* Heading */}
          <h3 className="text-white text-lg font-semibold leading-snug">
            Let's discover what{' '}
            <span className="text-rose-300">{kpiLabel.toLowerCase()}</span>{' '}
            means to you
          </h3>

          {/* Body */}
          <p className="text-gray-400 text-sm leading-relaxed">
            I'll listen for patterns and threads you might not see yet.
            At the end, I'll pull together insight cards that capture what I've heard.
          </p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              ~5 minutes
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              2–4 Insight Cards
            </span>
          </div>

          {/* Begin button */}
          <Button
            onClick={onBegin}
            className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 mt-2"
          >
            Begin Discovery
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
