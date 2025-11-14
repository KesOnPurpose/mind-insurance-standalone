import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SimilarityBadgeProps {
  score: number;
}

const SimilarityBadge = ({ score }: SimilarityBadgeProps) => {
  const percentage = Math.round(score * 100);
  
  return (
    <Badge 
      variant="outline" 
      className="gap-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20"
    >
      <Sparkles className="w-3 h-3 text-purple-500" />
      <span className="text-xs">{percentage}% match</span>
    </Badge>
  );
};

export default SimilarityBadge;
