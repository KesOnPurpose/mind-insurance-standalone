/**
 * RKPI Trends: DateRangePicker
 * Segmented button row: 4 Weeks | 3 Months | 6 Months | All Time
 */

import type { TrendTimeframe } from '@/types/relationship-kpis';

interface DateRangePickerProps {
  value: TrendTimeframe;
  onChange: (tf: TrendTimeframe) => void;
}

const OPTIONS: { value: TrendTimeframe; label: string }[] = [
  { value: '4_weeks', label: '4 Weeks' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: 'all_time', label: 'All Time' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-colors ${
            value === opt.value
              ? 'bg-rose-500/20 text-rose-300 font-medium'
              : 'text-white/40 hover:text-white/60'
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
