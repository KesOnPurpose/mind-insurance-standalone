/**
 * TourInfoPanel Component
 * Practice Tour System
 *
 * Displays practice info content inline during the Practice Tour.
 * Shows the same content that would appear when clicking the "i" icon,
 * but embedded directly in the tour tooltip for seamless education.
 *
 * Features:
 * - Shows practice emoji, name, and quick definition
 * - Compact design to fit within tour tooltip
 * - Matches Mind Insurance dark theme
 */

import React from 'react';
import { PROTECT_INFO, type PROTECTLetter } from '@/components/mind-insurance/PROTECTInfoTooltip';
import { cn } from '@/lib/utils';

interface TourInfoPanelProps {
  practiceTypes: PROTECTLetter[];
  className?: string;
}

/**
 * TourInfoPanel - Shows practice info inline during tour
 * Displays emoji, name, and quick definition for each practice
 */
export function TourInfoPanel({ practiceTypes, className }: TourInfoPanelProps) {
  return (
    <div className={cn("space-y-2.5 mt-4", className)}>
      {practiceTypes.map(type => {
        const info = PROTECT_INFO[type];
        return (
          <div
            key={type}
            className="bg-white/5 rounded-lg p-3 border border-mi-cyan/20"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{info.emoji}</span>
              <span className="font-semibold text-white text-sm">
                {type === 'T2' ? 'T' : type}: {info.name}
              </span>
              <span className="text-[10px] font-medium bg-mi-gold/20 text-mi-gold px-1.5 py-0.5 rounded-full ml-auto">
                {info.points} pts
              </span>
            </div>
            <p className="text-xs text-mi-cyan leading-relaxed">
              {info.quickDef}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default TourInfoPanel;
