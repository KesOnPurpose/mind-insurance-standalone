import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { TimeSlot } from "@/types/modelWeek";

interface TimeSlotCardProps {
  slot: TimeSlot;
  onRemove: () => void;
}

export const TimeSlotCard = ({ slot, onRemove }: TimeSlotCardProps) => {
  return (
    <Card className="p-3 bg-secondary/50 border-primary/20 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold mb-1">
            <Clock className="h-3 w-3 text-primary" />
            <span>
              {slot.startTime} - {slot.endTime}
            </span>
          </div>
          {slot.tacticName && (
            <p className="text-xs text-muted-foreground truncate">{slot.tacticName}</p>
          )}
          {slot.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slot.notes}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};
