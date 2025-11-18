import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  name: string;
  description: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface OnboardingProgressStepperProps {
  currentStep: string; // 'auth', 'assessment', 'welcome', 'first_tactic'
  className?: string;
}

const steps = [
  {
    id: 'auth',
    name: 'Sign In',
    description: 'Create your account',
  },
  {
    id: 'assessment',
    name: 'Assessment',
    description: 'Tell us about your goals',
  },
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Get oriented',
  },
  {
    id: 'first_tactic',
    name: 'Start',
    description: 'Begin your journey',
  },
];

export const OnboardingProgressStepper = ({ currentStep, className }: OnboardingProgressStepperProps) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const getStepStatus = (index: number): 'complete' | 'current' | 'upcoming' => {
    if (index < currentStepIndex) return 'complete';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const stepsWithStatus: Step[] = steps.map((step, index) => ({
    ...step,
    status: getStepStatus(index),
  }));

  return (
    <nav
      aria-label="Onboarding progress"
      className={cn("py-4 px-2", className)}
    >
      <ol role="list" className="flex items-center justify-between max-w-3xl mx-auto">
        {stepsWithStatus.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              "relative flex-1",
              stepIdx !== stepsWithStatus.length - 1 ? "pr-4 sm:pr-8" : ""
            )}
          >
            {/* Connector line */}
            {stepIdx !== stepsWithStatus.length - 1 && (
              <div
                className="absolute top-5 left-0 right-0 -translate-x-1/2 translate-y-px hidden sm:block"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-0.5 w-full",
                    step.status === 'complete' ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              </div>
            )}

            <div className="group relative flex flex-col items-center">
              {/* Step circle */}
              <span className="flex items-center">
                <span
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    step.status === 'complete' &&
                      "border-purple-600 bg-purple-600 group-hover:bg-purple-700",
                    step.status === 'current' &&
                      "border-purple-600 bg-white dark:bg-gray-950 ring-4 ring-purple-100 dark:ring-purple-900/50",
                    step.status === 'upcoming' &&
                      "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 group-hover:border-gray-400"
                  )}
                >
                  {step.status === 'complete' ? (
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        step.status === 'current'
                          ? "bg-purple-600"
                          : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400"
                      )}
                    />
                  )}
                </span>
              </span>

              {/* Step label */}
              <span className="mt-2 text-center">
                <span
                  className={cn(
                    "block text-xs sm:text-sm font-medium transition-colors",
                    step.status === 'complete' && "text-purple-600",
                    step.status === 'current' && "text-purple-600 font-semibold",
                    step.status === 'upcoming' && "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {step.name}
                </span>
                <span
                  className={cn(
                    "hidden sm:block text-xs transition-colors mt-0.5",
                    step.status === 'complete' && "text-gray-500 dark:text-gray-400",
                    step.status === 'current' && "text-gray-600 dark:text-gray-300",
                    step.status === 'upcoming' && "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.description}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile-friendly progress bar */}
      <div className="mt-4 sm:hidden">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
};
