import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSlotCard } from "@/components/TimeSlotCard";
import { AddTimeSlotDialog } from "@/components/AddTimeSlotDialog";
import { ModelWeek, DAYS_OF_WEEK, DayOfWeek, TimeSlot } from "@/types/modelWeek";
import { Plus, Save, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ModelWeekPage = () => {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState<DayOfWeek>("monday");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [modelWeek, setModelWeek] = useState<ModelWeek>({
    userId: "temp-user-id",
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    preferences: {
      maxTacticsPerDay: 3,
      preferredTimes: ["morning", "afternoon"],
      bufferTime: 15,
    },
  });

  const addTimeSlot = (day: DayOfWeek, slot: Omit<TimeSlot, "id">) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: `${day}-${Date.now()}`,
    };

    setModelWeek((prev) => ({
      ...prev,
      [day]: [...prev[day], newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));

    toast({
      title: "Time block added",
      description: `Added to ${day}`,
    });
  };

  const removeTimeSlot = (day: DayOfWeek, slotId: string) => {
    setModelWeek((prev) => ({
      ...prev,
      [day]: prev[day].filter((slot) => slot.id !== slotId),
    }));
  };

  const updatePreferences = (key: keyof ModelWeek["preferences"], value: any) => {
    setModelWeek((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const togglePreferredTime = (time: "morning" | "afternoon" | "evening") => {
    const current = modelWeek.preferences.preferredTimes;
    const updated = current.includes(time)
      ? current.filter((t) => t !== time)
      : [...current, time];
    updatePreferences("preferredTimes", updated);
  };

  const handleSave = () => {
    // TODO: Save to backend/database
    toast({
      title: "Model Week Saved",
      description: "Your weekly schedule has been saved successfully",
    });
    navigate("/dashboard");
  };

  const getTotalHoursPerWeek = () => {
    let total = 0;
    DAYS_OF_WEEK.forEach((day) => {
      modelWeek[day].forEach((slot) => {
        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        const [endHour, endMin] = slot.endTime.split(":").map(Number);
        const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
        total += duration;
      });
    });
    return (total / 60).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Build Your Model Week</h1>
            <p className="text-muted-foreground">
              Time-block your week to ensure consistent progress on your group home journey
            </p>
          </div>
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Model Week
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preferences Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Weekly Preferences</CardTitle>
              <CardDescription>Customize your weekly planning approach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Max Tactics Per Day</Label>
                <Slider
                  value={[modelWeek.preferences.maxTacticsPerDay]}
                  onValueChange={(value) => updatePreferences("maxTacticsPerDay", value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-primary">
                  {modelWeek.preferences.maxTacticsPerDay}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Working Times</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="morning"
                      checked={modelWeek.preferences.preferredTimes.includes("morning")}
                      onCheckedChange={() => togglePreferredTime("morning")}
                    />
                    <Label htmlFor="morning" className="font-normal cursor-pointer">
                      Morning (6am - 12pm)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="afternoon"
                      checked={modelWeek.preferences.preferredTimes.includes("afternoon")}
                      onCheckedChange={() => togglePreferredTime("afternoon")}
                    />
                    <Label htmlFor="afternoon" className="font-normal cursor-pointer">
                      Afternoon (12pm - 6pm)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evening"
                      checked={modelWeek.preferences.preferredTimes.includes("evening")}
                      onCheckedChange={() => togglePreferredTime("evening")}
                    />
                    <Label htmlFor="evening" className="font-normal cursor-pointer">
                      Evening (6pm - 12am)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buffer Time Between Tasks</Label>
                <Slider
                  value={[modelWeek.preferences.bufferTime]}
                  onValueChange={(value) => updatePreferences("bufferTime", value[0])}
                  min={0}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="text-center text-lg font-semibold text-primary">
                  {modelWeek.preferences.bufferTime} minutes
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours/Week:</span>
                  <span className="font-bold text-primary">{getTotalHoursPerWeek()}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Blocks:</span>
                  <span className="font-bold">
                    {DAYS_OF_WEEK.reduce((sum, day) => sum + modelWeek[day].length, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Add time blocks for each day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayOfWeek)}>
                <TabsList className="grid grid-cols-7 w-full">
                  {DAYS_OF_WEEK.map((day) => (
                    <TabsTrigger key={day} value={day} className="capitalize text-xs">
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {DAYS_OF_WEEK.map((day) => (
                  <TabsContent key={day} value={day} className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{day}</h3>
                      <Button onClick={() => setDialogOpen(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Time Block
                      </Button>
                    </div>

                    {modelWeek[day].length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No time blocks scheduled for {day}</p>
                        <p className="text-sm mt-2">Click "Add Time Block" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {modelWeek[day].map((slot) => (
                          <TimeSlotCard
                            key={slot.id}
                            slot={slot}
                            onRemove={() => removeTimeSlot(day, slot.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <AddTimeSlotDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAdd={(slot) => addTimeSlot(activeDay, slot)}
          day={activeDay}
        />
      </div>
    </div>
  );
};

export default ModelWeekPage;
