import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';
import { ACTIVITY_TYPES, getTextColor } from '@/config/activityTypes';

interface ActivityLegendProps {
  compact?: boolean;
}

export function ActivityLegend({ compact = false }: ActivityLegendProps) {
  // Filter out 'custom' from the legend since it's user-defined
  const legendActivities = ACTIVITY_TYPES.filter((a) => a.type !== 'custom');

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {legendActivities.map((activity) => (
          <div
            key={activity.type}
            className="flex items-center gap-1.5 text-xs"
          >
            <div
              className="w-3 h-3 rounded-sm border flex-shrink-0"
              style={{
                backgroundColor: activity.color,
                borderColor: activity.borderColor,
              }}
            />
            <span className="truncate">{activity.emoji} {activity.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Activity Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {legendActivities.map((activity) => {
            const textColor = getTextColor(activity.color);

            return (
              <div
                key={activity.type}
                className="flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-muted/50"
              >
                <div
                  className="w-6 h-6 rounded-md border flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    backgroundColor: activity.color,
                    borderColor: activity.borderColor,
                    color: textColor,
                  }}
                >
                  {activity.emoji}
                </div>
                <span className="text-xs truncate">{activity.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityLegend;
