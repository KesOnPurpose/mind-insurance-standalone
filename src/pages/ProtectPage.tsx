import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const protectSteps = [
  {
    id: "pattern",
    letter: "P",
    title: "Pattern Check",
    description: "Identify if you're in a negative pattern",
    question: "Are you experiencing any negative patterns today?",
  },
  {
    id: "reinforce",
    letter: "R",
    title: "Reinforce Identity",
    description: "State who you're becoming",
    question: "Who are you becoming? Write your identity statement.",
  },
  {
    id: "outcome",
    letter: "O",
    title: "Outcome Visualization",
    description: "See your success",
    question: "Visualize your successful outcome. What does it look like?",
  },
  {
    id: "trigger",
    letter: "T",
    title: "Trigger Reset",
    description: "Count pattern interruptions",
    question: "How many times did you catch and reset a negative trigger today?",
  },
  {
    id: "energy",
    letter: "E",
    title: "Energy Audit",
    description: "Rate your energy levels",
    question: "Rate your energy: Morning, Afternoon, Evening (1-10)",
  },
  {
    id: "celebrate",
    letter: "C",
    title: "Celebrate Wins",
    description: "List today's victories",
    question: "What wins can you celebrate today, big or small?",
  },
  {
    id: "tomorrow",
    letter: "T",
    title: "Tomorrow Setup",
    description: "Plan tomorrow's focus",
    question: "What are your top 1-3 priorities for tomorrow?",
  },
];

const ProtectPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { toast } = useToast();

  const progress = (completedSteps.length / protectSteps.length) * 100;
  const currentStepData = protectSteps[currentStep];

  const handleNext = () => {
    if (!completedSteps.includes(currentStepData.id)) {
      setCompletedSteps([...completedSteps, currentStepData.id]);
    }

    if (currentStep < protectSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Practice complete
      toast({
        title: "PROTECT Practice Complete! 🎉",
        description: "You've earned your mental insurance for today.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isComplete = completedSteps.length === protectSteps.length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">PROTECT Practice</h1>
          <p className="text-white/80">Your daily 10-minute mental insurance policy</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Practice Progress</span>
              <span className="text-sm font-medium">{completedSteps.length}/{protectSteps.length}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </Card>

          {/* Steps Navigation */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between gap-2">
              {protectSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-primary/10 border-2 border-primary'
                      : completedSteps.includes(step.id)
                      ? 'bg-success/10'
                      : 'bg-muted'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    completedSteps.includes(step.id)
                      ? 'bg-success text-white'
                      : index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.letter
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Current Step */}
          {!isComplete ? (
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-bold text-xl">
                    {currentStepData.letter}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                    <p className="text-muted-foreground">{currentStepData.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-lg font-medium mb-4">
                  {currentStepData.question}
                </label>
                <textarea
                  className="w-full min-h-[200px] p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Write your response here..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-hero hover:opacity-90 transition-opacity"
                >
                  {currentStep === protectSteps.length - 1 ? 'Complete Practice' : 'Next Step'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-success flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Practice Complete!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                You've earned your mental insurance for today. Keep building that streak! 🔥
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/dashboard">
                  <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
                    Back to Dashboard
                  </Button>
                </Link>
                <Button variant="outline">
                  View Insights
                </Button>
              </div>
            </Card>
          )}

          {/* MIO Message */}
          <Card className="p-6 mt-6 bg-gradient-breakthrough">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="font-semibold mb-2 text-white">MIO's Tip</div>
                <p className="text-sm text-white/90">
                  The key is honesty with yourself. I'm analyzing patterns to help you breakthrough, not judge you. The more authentic your responses, the better I can support you.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProtectPage;
