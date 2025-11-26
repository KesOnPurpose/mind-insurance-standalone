import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JourneyPhase } from '@/types/tactic';

interface RoadmapHeaderProps {
  assessment: any;
  selectedWeek: number;
  recommendedWeeks: number;
  currentPhase?: {
    phase: JourneyPhase;
    name: string;
    description: string;
    weeks: number[];
    icon: string;
  };
  onShowJourneyMap: () => void;
}

export const RoadmapHeader = ({
  assessment,
  selectedWeek,
  recommendedWeeks,
  currentPhase,
  onShowJourneyMap
}: RoadmapHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            {/* Dashboard Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mb-3 text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <h1 className="text-3xl font-bold mb-2">Your Personalized Roadmap 🗺️</h1>
            <p className="text-primary-foreground/80 mb-4">
              {assessment?.readiness_level?.replace(/_/g, ' ').toUpperCase() || 'CUSTOM'} Path •
              Week {selectedWeek} of {recommendedWeeks}
            </p>

            {currentPhase && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-3xl">{currentPhase.icon}</span>
                <div>
                  <h2 className="font-semibold">{currentPhase.name}</h2>
                  <p className="text-sm text-primary-foreground/70">
                    {currentPhase.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="secondary"
              onClick={onShowJourneyMap}
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              View Journey Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};