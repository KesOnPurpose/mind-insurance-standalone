import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimeSlot } from "@/types/modelWeek";

interface AddTimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (slot: Omit<TimeSlot, "id">) => void;
  day: string;
}

export const AddTimeSlotDialog = ({ open, onOpenChange, onAdd, day }: AddTimeSlotDialogProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [tacticName, setTacticName] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    onAdd({
      startTime,
      endTime,
      tacticName: tacticName || undefined,
      notes: notes || undefined,
    });
    // Reset form
    setStartTime("09:00");
    setEndTime("10:00");
    setTacticName("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Block - {day}</DialogTitle>
          <DialogDescription>
            Create a time block for focused work on your group home tactics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tactic-name">Tactic/Activity (Optional)</Label>
            <Input
              id="tactic-name"
              placeholder="e.g., Research zoning requirements"
              value={tacticName}
              onChange={(e) => setTacticName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific goals or reminders for this time block"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Time Block</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
