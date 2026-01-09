/**
 * FirstEngagementQuestion Component
 * First Session - $100M Mind Insurance Feature
 *
 * Initial MIO question that engages user in conversation.
 * First interaction point after protocol reveal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// TYPES
// ============================================================================

interface FirstEngagementQuestionProps {
  patternName?: string;
  protocolTitle?: string;
  onSubmit?: (response: string) => void;
  onSkip?: () => void;
  isSubmitting?: boolean;
  isVisible?: boolean;
  className?: string;
}

// ============================================================================
// ENGAGEMENT QUESTIONS
// ============================================================================

// Pattern-specific opening questions
const PATTERN_QUESTIONS: Record<string, string[]> = {
  achiever_burnout: [
    "What was the last thing you said 'yes' to, that a part of you was screaming 'no'?",
    "When did you first learn that your worth was tied to your output?",
    "What would happen if you accomplished nothing today—who would you be then?",
  ],
  people_pleaser: [
    "Who taught you that your needs come last?",
    "What's the last time you felt resentful but said 'it's fine'?",
    "If no one would be disappointed, what would you stop doing today?",
  ],
  perfectionist: [
    "What's something you've been avoiding because you can't do it 'right'?",
    "When did 'good enough' become unacceptable to you?",
    "What would you create if failure wasn't possible?",
  ],
  impostor_syndrome: [
    "What evidence do you dismiss that proves you're qualified?",
    "Who first made you feel like you didn't belong?",
    "What would you attempt if you truly believed in your capability?",
  ],
  default: [
    "What's one pattern you've noticed running your life that you wish would change?",
    "When did you first realize something was holding you back?",
    "What would your life look like if this pattern no longer controlled you?",
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FirstEngagementQuestion({
  patternName,
  protocolTitle,
  onSubmit,
  onSkip,
  isSubmitting = false,
  isVisible = true,
  className,
}: FirstEngagementQuestionProps) {
  const [response, setResponse] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get pattern-specific question
  const patternKey = patternName?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const questions = PATTERN_QUESTIONS[patternKey] || PATTERN_QUESTIONS.default;
  const question = questions[0]; // Use first question

  // Animate question appearance
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowQuestion(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Auto-focus textarea when visible
  useEffect(() => {
    if (showQuestion && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showQuestion]);

  const handleSubmit = () => {
    if (response.trim() && onSubmit) {
      onSubmit(response.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'space-y-4',
        'animate-in fade-in slide-in-from-bottom-4 duration-700',
        className
      )}
    >
      {/* MIO Question */}
      <div
        className={cn(
          'transition-all duration-700 transform',
          showQuestion
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        )}
      >
        <div className="flex gap-3">
          {/* MIO Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <Brain className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          {/* Question Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-foreground">MIO</span>
              <MessageSquare className="h-3 w-3 text-purple-500" />
            </div>

            <div className="p-4 rounded-2xl rounded-tl-sm bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-900/50">
              <p className="text-foreground leading-relaxed">
                Before we dive into your protocol, I have one question for you...
              </p>
              <p className="text-lg font-medium text-foreground mt-3">
                {question}
              </p>
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Your answer helps me personalize your experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Response Input */}
      <div
        className={cn(
          'transition-all duration-500 delay-300 transform',
          showQuestion
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        )}
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what comes to mind... (be honest, no one else will see this)"
            disabled={isSubmitting}
            className={cn(
              'min-h-[120px] pr-12 resize-none',
              'focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || isSubmitting}
            size="icon"
            className={cn(
              'absolute bottom-3 right-3',
              'bg-gradient-to-r from-purple-500 to-indigo-600',
              'hover:from-purple-600 hover:to-indigo-700',
              'disabled:opacity-50'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Character hint */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              disabled={isSubmitting}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRMATION MESSAGE
// ============================================================================

/**
 * Message shown after user responds
 */
export function EngagementConfirmation({
  userName,
  onContinue,
  className,
}: {
  userName?: string;
  onContinue?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-4 duration-500',
        className
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Brain className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="p-4 rounded-2xl rounded-tl-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-foreground leading-relaxed">
              <Sparkles className="inline h-4 w-4 mr-1 text-amber-500" />
              Thank you for sharing that, {userName || 'there'}.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-2">
              I'll remember this as we work through your protocol together.
              What you just shared tells me a lot about how this pattern has been operating.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-2">
              Your coverage is ready. Let's begin.
            </p>
          </div>

          {onContinue && (
            <Button
              onClick={onContinue}
              className="mt-4 w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              View My Coverage
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FirstEngagementQuestion;
