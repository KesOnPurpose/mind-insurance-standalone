import { useAuth } from '@/contexts/AuthContext';
import { useModelWeek } from '@/hooks/useModelWeek';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, CheckSquare, TrendingUp, Save, ChevronDown, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAYS_OF_WEEK } from '@/types/modelWeek';
import { ActivityLegend } from '@/components/model-week/ActivityLegend';

/**
 * ModelWeekPanel - Enhanced sidebar for Model Week page
 *
 * 5 Sections:
 * 1. Weekly Preferences
 * 2. Week Summary Stats
 * 3. View Controls (future)
 * 4. Quick Actions
 * 5. Tips/Help (collapsed by default)
 */
export function ModelWeekPanel() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const { modelWeek, saveModelWeek, isSaving } = useModelWeek(userId);

  if (!modelWeek) {
    return (
      <div className="px-2 py-2 space-y-3">
        <div className="text-center py-4">
          <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const getTotalHours = () => {
    let total = 0;
    DAYS_OF_WEEK.forEach((day) => {
      modelWeek[day].forEach((slot) => {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
        total += duration;
      });
    });
    return (total / 60).toFixed(1);
  };

  const getTotalBlocks = () => {
    return DAYS_OF_WEEK.reduce((sum, day) => sum + modelWeek[day].length, 0);
  };

  const getAssignedTactics = () => {
    let count = 0;
    DAYS_OF_WEEK.forEach((day) => {
      count += modelWeek[day].filter(slot => slot.tacticName).length;
    });
    return count;
  };

  const getUtilization = () => {
    const totalHours = parseFloat(getTotalHours());
    const maxHours = 7 * 8; // 8 hours per day, 7 days
    return Math.round((totalHours / maxHours) * 100);
  };

  const updatePreferences = (key: keyof typeof modelWeek.preferences, value: any) => {
    const updated = {
      ...modelWeek,
      preferences: {
        ...modelWeek.preferences,
        [key]: value,
      },
    };
    saveModelWeek(updated);
  };

  const togglePreferredTime = (time: 'morning' | 'afternoon' | 'evening') => {
    const current = modelWeek.preferences.preferredTimes;
    const updated = current.includes(time)
      ? current.filter((t) => t !== time)
      : [...current, time];
    updatePreferences('preferredTimes', updated);
  };

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Section 1: Weekly Preferences */}
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Weekly Preferences</CardTitle>
          <CardDescription className="text-xs">Customize your planning</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Max Tactics Per Day</Label>
            <Slider
              value={[modelWeek.preferences.maxTacticsPerDay]}
              onValueChange={(value) => updatePreferences('maxTacticsPerDay', value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-bold text-primary">
              {modelWeek.preferences.maxTacticsPerDay}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Preferred Times</Label>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="morning"
                  checked={modelWeek.preferences.preferredTimes.includes('morning')}
                  onCheckedChange={() => togglePreferredTime('morning')}
                />
                <Label htmlFor="morning" className="text-xs font-normal cursor-pointer">
                  Morning (6am-12pm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="afternoon"
                  checked={modelWeek.preferences.preferredTimes.includes('afternoon')}
                  onCheckedChange={() => togglePreferredTime('afternoon')}
                />
                <Label htmlFor="afternoon" className="text-xs font-normal cursor-pointer">
                  Afternoon (12pm-6pm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evening"
                  checked={modelWeek.preferences.preferredTimes.includes('evening')}
                  onCheckedChange={() => togglePreferredTime('evening')}
                />
                <Label htmlFor="evening" className="text-xs font-normal cursor-pointer">
                  Evening (6pm-12am)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Buffer Time</Label>
            <Slider
              value={[modelWeek.preferences.bufferTime]}
              onValueChange={(value) => updatePreferences('bufferTime', value[0])}
              min={0}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="text-center text-sm font-semibold text-primary">
              {modelWeek.preferences.bufferTime} min
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Week Summary Stats */}
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">This Week's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Hours</span>
              </div>
              <div className="text-lg font-bold text-primary">{getTotalHours()}h</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Time Blocks</span>
              </div>
              <div className="text-lg font-bold">{getTotalBlocks()}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tactics</span>
              </div>
              <div className="text-lg font-bold">{getAssignedTactics()}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Utilization</span>
              </div>
              <div className="text-lg font-bold">{getUtilization()}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: View Controls - Future enhancement */}
      {/*
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">Day</Button>
            <Button variant="default" size="sm" className="flex-1">Week</Button>
            <Button variant="outline" size="sm" className="flex-1">Month</Button>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2">Jump to Today</Button>
        </CardContent>
      </Card>
      */}

      {/* Section 4: Quick Actions */}
      <div className="space-y-2">
        <Button
          className="w-full"
          size="sm"
          onClick={() => saveModelWeek(modelWeek)}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-2" />
              Save Model Week
            </>
          )}
        </Button>
      </div>

      {/* Section 5: Activity Legend */}
      <ActivityLegend />

      {/* Section 6: Tips/Help */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium border rounded-lg hover:bg-muted/50 transition-colors">
          <span>Quick Tips</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [data-state=open]>:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Card className="border-dashed">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Click empty slots to add blocks</p>
                <p>• Drag events to move them</p>
                <p>• Resize edges to adjust duration</p>
                <p>• Click events to edit details</p>
                <p>• Choose activity types for color coding</p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default ModelWeekPanel;
