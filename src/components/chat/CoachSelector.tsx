import { Card } from "@/components/ui/card";
import { COACHES, CoachType } from "@/types/coach";
import { Check } from "lucide-react";

interface CoachSelectorProps {
  selectedCoach: CoachType;
  onSelectCoach: (coach: CoachType) => void;
}

const CoachSelector = ({ selectedCoach, onSelectCoach }: CoachSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Object.values(COACHES).map((coach) => {
        const isSelected = selectedCoach === coach.id;
        
        return (
          <Card
            key={coach.id}
            onClick={() => onSelectCoach(coach.id)}
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              isSelected ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: isSelected ? coach.color : undefined,
              background: isSelected ? `${coach.gradient}15` : undefined,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: coach.gradient }}
              >
                {coach.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{coach.name}</h3>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: coach.color }} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{coach.title}</p>
                <p className="text-sm text-foreground/80 leading-snug">{coach.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CoachSelector;
