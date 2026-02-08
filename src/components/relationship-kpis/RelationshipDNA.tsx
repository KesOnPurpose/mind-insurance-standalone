/**
 * RelationshipDNA — Synthesized "user manual" profile from all discovery sessions
 * Unlocks after 5+ completed KPI sessions.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dna, Loader2, Heart, Zap, Eye, Lock, Sun, CloudRain, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { generateRelationshipDNA } from '@/services/partnerDiscoveryService';
import type { RelationshipDNAProfile } from '@/types/partner-discovery';

const DNA_SECTIONS: {
  key: keyof RelationshipDNAProfile;
  label: string;
  icon: typeof Heart;
  color: string;
}[] = [
  { key: 'coreNeed', label: 'Core Need', icon: Heart, color: 'text-rose-400' },
  { key: 'howYouGiveLove', label: 'How You Give Love', icon: Sparkles, color: 'text-mi-cyan' },
  { key: 'howYouNeedLove', label: 'How You Need Love', icon: Heart, color: 'text-purple-400' },
  { key: 'superpower', label: 'Your Superpower', icon: Zap, color: 'text-mi-gold' },
  { key: 'blindSpot', label: 'Your Blind Spot', icon: Eye, color: 'text-amber-400' },
  { key: 'lightsYouUp', label: 'What Lights You Up', icon: Sun, color: 'text-emerald-400' },
  { key: 'shutsYouDown', label: 'What Shuts You Down', icon: CloudRain, color: 'text-red-400' },
  { key: 'partnerProbablyDoesntKnow', label: "The Thing They Probably Don't Know", icon: Lock, color: 'text-indigo-400' },
];

export function RelationshipDNA() {
  const [dna, setDna] = useState<RelationshipDNAProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await generateRelationshipDNA();
        setDna(result);
      } catch (err) {
        console.error('[RelationshipDNA] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!dna) {
    return (
      <div className="text-center py-16">
        <Dna className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">
          Relationship DNA Locked
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Complete at least 5 KPI discovery sessions to unlock your
          Relationship DNA profile. This will be your living user manual
          that grows as you explore more.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/30 to-rose-500/30 border border-purple-500/20 mb-3"
        >
          <Dna className="h-8 w-8 text-purple-400" />
        </motion.div>
        <h2 className="text-white text-xl font-semibold">
          Your Relationship DNA
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Based on {dna.sessionCount} discovery sessions
        </p>
      </div>

      {/* DNA Sections */}
      {DNA_SECTIONS.map((section, i) => {
        const Icon = section.icon;
        const value = dna[section.key];
        if (typeof value !== 'string') return null;

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <Card className="bg-white/[0.03] border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className={`h-4 w-4 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${section.color}`}>
                      {section.label}
                    </p>
                    <p className="text-white text-sm leading-relaxed">
                      {value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
