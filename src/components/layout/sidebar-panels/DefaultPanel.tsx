import { Rocket } from 'lucide-react';

/**
 * DefaultPanel - Fallback panel shown when no specific mode is detected
 */
export function DefaultPanel() {
  return (
    <div className="px-2 py-2">
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Welcome</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Navigate using the menu below to explore your group home journey.
        </p>
      </div>
    </div>
  );
}

export default DefaultPanel;
