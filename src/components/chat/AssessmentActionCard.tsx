// ============================================================================
// GROUPHOME STANDALONE: ORPHANED FILE
// This component imports from useAssessmentInvitations which was deleted during MI removal.
// The component is not currently used anywhere in the codebase.
// This is an MIO-specific feature - if assessment cards are needed for GH, rebuild with GH patterns.
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, X, Sparkles } from 'lucide-react';
// GROUPHOME STANDALONE: Broken import - hook was deleted
// import { ASSESSMENT_INFO, type AssessmentType } from '@/hooks/useAssessmentInvitations';

// GROUPHOME STANDALONE: Placeholder types to prevent TypeScript errors
type AssessmentType = string;
const ASSESSMENT_INFO: Record<string, { name: string; icon: string; description: string; path: string; estimatedMinutes: number }> = {};

// ============================================================================
// ASSESSMENT ACTION CARD COMPONENT (ORPHANED - NOT IN USE)
// ============================================================================
// Displays assessment suggestions from MIO in chat interface
// Renders as a special message card with action buttons
// ============================================================================

interface AssessmentActionCardProps {
  assessmentType: AssessmentType;
  reason?: string;
  buttonText?: string;
  onDismiss?: () => void;
  className?: string;
}

export const AssessmentActionCard: React.FC<AssessmentActionCardProps> = ({
  assessmentType,
  reason,
  buttonText,
  onDismiss,
  className = '',
}) => {
  const navigate = useNavigate();
  const info = ASSESSMENT_INFO[assessmentType];

  if (!info) {
    console.error(`[AssessmentActionCard] Unknown assessment type: ${assessmentType}`);
    return null;
  }

  const handleTakeAssessment = () => {
    navigate(info.path);
  };

  return (
    <Card className={`bg-gradient-to-r from-mi-navy-light via-mi-cyan/10 to-mi-gold/10 border border-mi-cyan/40 p-4 mt-3 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mi-cyan/30 to-mi-gold/30 flex items-center justify-center text-2xl shrink-0">
          {info.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mi-gold" />
                {info.name}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {reason || info.description}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                aria-label="Dismiss suggestion"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Meta + Actions */}
          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              ~{info.estimatedMinutes} min
            </span>

            <div className="flex items-center gap-2">
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Maybe Later
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleTakeAssessment}
                className="bg-mi-cyan hover:bg-mi-cyan/90 text-white"
              >
                {buttonText || 'Take Assessment'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AssessmentActionCard;
