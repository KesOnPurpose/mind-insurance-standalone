/**
 * RKPI Check-In: KPISlider
 * Reusable slider input (1-10) with labels and score display.
 */

import { Slider } from '@/components/ui/slider';
import { getScoreStyle } from '@/utils/relationshipKpis';

interface KPISliderProps {
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

export function KPISlider({
  value,
  onChange,
  minLabel = 'Needs work',
  maxLabel = 'Thriving',
}: KPISliderProps) {
  const style = getScoreStyle(value);

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="text-center">
        <span className={`text-4xl font-bold ${style.text}`}>
          {value}
        </span>
        <span className="text-white/30 text-lg">/10</span>
        <p className={`text-sm mt-1 ${style.text}`}>{style.label}</p>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={1}
          max={10}
          step={1}
          className="[&_[role=slider]]:bg-rose-500 [&_[role=slider]]:border-rose-400 [&_.bg-primary]:bg-rose-500"
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-white/40 px-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
