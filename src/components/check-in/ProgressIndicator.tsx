/**
 * RKPI Check-In: ProgressIndicator
 * Shows current step, total steps, and progress bar.
 * 13 steps: Intro + 10 KPIs + Action Planning + AI Insights.
 */

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-rose-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
