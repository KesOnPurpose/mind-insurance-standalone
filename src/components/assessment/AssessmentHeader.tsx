import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssessmentHeaderProps {
  currentStep: number;
  categories: Array<{
    name: string;
    description: string;
  }>;
}

export const AssessmentHeader = ({ currentStep, categories }: AssessmentHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <h1 className="text-4xl font-bold mb-2">Group Home Readiness Assessment</h1>
      <p className="text-muted-foreground">
        Help us understand where you are so we can create your personalized roadmap
      </p>

      {/* Progress indicator */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`flex-1 text-center ${
                index === currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              <div className="text-sm">{category.name}</div>
            </div>
          ))}
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / categories.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};