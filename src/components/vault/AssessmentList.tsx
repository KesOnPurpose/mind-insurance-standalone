import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Target,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import type { VaultAssessment } from '@/hooks/useVaultAssessments';

// ============================================================================
// ASSESSMENT LIST COMPONENT
// ============================================================================
// Displays assessment history in Recording Vault
// ============================================================================

interface AssessmentListProps {
  assessments: VaultAssessment[];
  isLoading: boolean;
}

// Pattern color mapping
const PATTERN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Past Prison': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Success Sabotage': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Compass Crisis': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'The Warrior': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'The Sage': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'The Builder': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  'The Connector': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};

// Pattern icons
const PATTERN_ICONS: Record<string, string> = {
  'Past Prison': '🔗',
  'Success Sabotage': '⚡',
  'Compass Crisis': '🧭',
  'The Warrior': '⚔️',
  'The Sage': '📚',
  'The Builder': '🏗️',
  'The Connector': '🤝',
};

// Assessment type labels
const TYPE_LABELS: Record<string, string> = {
  'identity_collision': 'Identity Collision',
  'avatar': 'Avatar (Deep)',
  'temperament': 'Temperament',
};

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-mi-cyan" />
        <span className="ml-2 text-gray-400">Loading assessments...</span>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card className="bg-mi-navy-light border-mi-cyan/20 p-8 text-center">
        <ClipboardCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Assessments Yet</h3>
        <p className="text-gray-400 mb-4">
          Complete your first assessment to see it here.
        </p>
        <Button
          onClick={() => navigate('/mind-insurance/assessment')}
          className="bg-mi-cyan hover:bg-mi-cyan/80 text-white"
        >
          Take Assessment
        </Button>
      </Card>
    );
  }

  const handleRetake = (type: string) => {
    if (type === 'identity_collision') {
      navigate('/mind-insurance/assessment');
    } else if (type === 'avatar') {
      navigate('/avatar-assessment');
    }
    // Temperament retake could be added later
  };

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => {
        const colors = PATTERN_COLORS[assessment.primary_result] || {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
        };
        const icon = PATTERN_ICONS[assessment.primary_result] || '📋';
        const isExpanded = expandedId === assessment.id;

        return (
          <Collapsible
            key={assessment.id}
            open={isExpanded}
            onOpenChange={(open) => setExpandedId(open ? assessment.id : null)}
          >
            <Card
              className={`bg-mi-navy-light border ${colors.border} overflow-hidden transition-colors hover:border-mi-cyan/40`}
            >
              {/* Main Card Content */}
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Icon and Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}
                      >
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {TYPE_LABELS[assessment.type] || assessment.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`${colors.bg} ${colors.text} border-0`}
                          >
                            {assessment.primary_result}
                          </Badge>
                          {assessment.confidence && (
                            <span className="text-gray-500 text-sm">
                              {assessment.confidence}% confidence
                            </span>
                          )}
                        </div>
                        {assessment.completed_at && (
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(assessment.completed_at), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Expand Toggle */}
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Expandable Content */}
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                  {/* Scores */}
                  {assessment.scores && Object.keys(assessment.scores).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Pattern Scores
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(assessment.scores).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-white/5 rounded-lg p-2 text-center"
                          >
                            <div className="text-xs text-gray-500 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-lg font-bold text-white">
                              {typeof value === 'number' ? value : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impact Area */}
                  {assessment.impact_area && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <span className="text-gray-400 text-sm">Impact Area: </span>
                      <span className="text-mi-gold font-medium capitalize">
                        {assessment.impact_area.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Secondary Results */}
                  {assessment.secondary_results?.temperament && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <span className="text-gray-400 text-sm">Temperament: </span>
                      <span className="text-mi-cyan font-medium">
                        {String(assessment.secondary_results.temperament)}
                      </span>
                    </div>
                  )}

                  {/* Retake Button */}
                  {assessment.can_retake && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetake(assessment.type)}
                      className="w-full border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retake Assessment
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default AssessmentList;
