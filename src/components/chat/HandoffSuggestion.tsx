import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { COACHES, CoachType } from "@/types/coach";
import SimilarityBadge from "./SimilarityBadge";

interface HandoffSuggestionProps {
  suggestedAgent: CoachType;
  reason: string;
  confidence?: number;
  method?: string;
  onAccept: () => void;
  onDismiss: () => void;
}

const HandoffSuggestion = ({
  suggestedAgent,
  reason,
  confidence,
  method,
  onAccept,
  onDismiss,
}: HandoffSuggestionProps) => {
  const coach = COACHES[suggestedAgent];

  return (
    <Card className="p-4 mb-4 border-2 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
          style={{ background: coach.gradient }}
        >
          {coach.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-sm">Handoff Suggested</h4>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs font-medium" style={{ color: coach.color }}>
              {coach.name}
            </span>
            {confidence && method === 'semantic_similarity' && (
              <SimilarityBadge score={confidence} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{reason}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAccept}
              className="gap-2"
              style={{ 
                background: coach.gradient,
                color: 'white'
              }}
            >
              Connect with {coach.name}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HandoffSuggestion;
