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
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import type { VaultAssessment } from '@/hooks/useVaultAssessments';
import { ASSESSMENT_INFO, type AssessmentInvitation } from '@/hooks/useAssessmentInvitations';

// ============================================================================
// ASSESSMENT LIST COMPONENT
// ============================================================================
// Displays assessment history in Recording Vault
// ============================================================================

interface AssessmentListProps {
  assessments: VaultAssessment[];
  isLoading: boolean;
  pendingInvitations?: AssessmentInvitation[];
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
  // Mental Pillar competency colors
  'Mental Pillar': { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Baseline': { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Growth': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
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
  // Mental Pillar
  'Mental Pillar': '🧠',
  'Baseline': '🧠',
  'Growth': '📈',
};

// Pattern descriptions for Identity Collision assessments
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  'Past Prison': 'Your past experiences, upbringing, or environment are creating invisible barriers that hold you back from your potential. You carry guilt, limiting beliefs, or identity ceilings from your history.',
  'Success Sabotage': 'You pull back right when breakthrough is near. Your amygdala (your brain\'s threat-detection center) associates success with danger, causing you to unconsciously sabotage progress at critical moments.',
  'Compass Crisis': 'You lack clear direction or feel pulled in multiple directions. Without a defined path, you struggle with decision paralysis and constant comparison to others who seem more certain.',
};

// Rich, emotionally resonant summaries for Inner Wiring Discovery (behavioral science approach)
const INNER_WIRING_SUMMARIES: Record<string, string> = {
  'The Sage': `You process the world through deep reflection. Where others rush to act, you pause to understand. This isn't hesitation—it's wisdom in action. Your superpower is seeing patterns others miss, finding meaning in chaos, and offering insights that transform confusion into clarity. You thrive in solitude not because you avoid connection, but because quiet is where your greatest breakthroughs emerge. When you honor your need for contemplation, you become the calm center others orbit around.`,
  'The Warrior': `You're wired for action. Where others plan endlessly, you move. This isn't recklessness—it's courage. Your superpower is turning intention into momentum, breaking through barriers that stop others in their tracks. You process challenges through physical engagement—movement clears your mind, action reveals answers. When you channel this fire purposefully, you become unstoppable. The world needs your bias toward action; you show others that progress beats perfection.`,
  'The Builder': `You create order from chaos. Where others see overwhelming complexity, you see systems waiting to be built. This isn't rigidity—it's architecture. Your superpower is transforming ideas into sustainable structures that stand the test of time. You find deep satisfaction in process, in the step-by-step construction of something meaningful. When you trust your methodical nature, you build empires—brick by brick, day by day, until what once seemed impossible becomes inevitable.`,
  'The Connector': `You thrive in the space between people. Where others see networking, you see life-giving connection. This isn't dependency—it's wisdom. Your superpower is creating belonging, transforming strangers into community, and amplifying others' potential through genuine relationship. You process challenges through dialogue—talking helps you think, and shared struggles become manageable burdens. When you lean into your relational nature, you become the glue that holds movements together.`,
};

// Assessment type labels
const TYPE_LABELS: Record<string, string> = {
  'identity_collision': 'Identity Collision',
  'avatar': 'Inner Wiring Discovery',
  'inner_wiring': 'Inner Wiring Discovery',
  'temperament': 'Temperament',
  'mental_pillar': 'Mental Pillar Assessment',
};

// Mental Pillar competency labels
const MENTAL_PILLAR_COMPETENCIES: Record<string, { label: string; icon: string; color: string }> = {
  'pattern_awareness': { label: 'Pattern Awareness', icon: '🔍', color: '#8b5cf6' },
  'identity_alignment': { label: 'Identity Alignment', icon: '🎯', color: '#06b6d4' },
  'belief_mastery': { label: 'Belief Mastery', icon: '💡', color: '#f59e0b' },
  'mental_resilience': { label: 'Mental Resilience', icon: '🛡️', color: '#10b981' },
};

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  isLoading,
  pendingInvitations = [],
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

  // Show empty state only if no assessments AND no pending invitations
  if (assessments.length === 0 && pendingInvitations.length === 0) {
    return (
      <Card className="bg-mi-navy-light border-mi-cyan/20 p-8 text-center">
        <ClipboardCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Assessments Yet</h3>
        <p className="text-gray-400 mb-4">
          Assessments will appear here when assigned by your coach or suggested by MIO.
        </p>
      </Card>
    );
  }

  const handleRetake = (type: string) => {
    if (type === 'identity_collision') {
      navigate('/mind-insurance/assessment');
    } else if (type === 'avatar') {
      navigate('/avatar-assessment');
    } else if (type === 'inner_wiring') {
      navigate('/mind-insurance/inner-wiring-discovery');
    } else if (type === 'mental_pillar') {
      navigate('/mind-insurance/mental-pillar-assessment');
    }
    // Temperament retake could be added later
  };

  return (
    <div className="space-y-4">
      {/* Pending Invitations - Show at top with call-to-action */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-mi-gold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Ready for You
          </h3>
          {pendingInvitations.map((invitation) => {
            const info = ASSESSMENT_INFO[invitation.assessment_type as keyof typeof ASSESSMENT_INFO];
            return (
              <Card
                key={invitation.id}
                className="bg-gradient-to-r from-mi-navy-light to-mi-cyan/10 border border-mi-cyan/40 p-4 hover:border-mi-cyan/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mi-cyan/20 flex items-center justify-center text-2xl shrink-0">
                    {info?.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {info?.name || invitation.assessment_type}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-1">
                      {invitation.reason || info?.description || 'Complete this assessment to unlock insights'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{info?.estimatedMinutes || 5} min
                      </span>
                      {invitation.invited_by === 'mio_chat' && (
                        <Badge variant="outline" className="text-xs border-mi-cyan/30 text-mi-cyan">
                          Suggested by MIO
                        </Badge>
                      )}
                      {(invitation.invited_by === 'admin' || invitation.invited_by === 'coach') && (
                        <Badge variant="outline" className="text-xs border-mi-gold/30 text-mi-gold">
                          Assigned by Coach
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => info?.path && navigate(info.path)}
                    className="bg-mi-cyan hover:bg-mi-cyan/90 text-white shrink-0"
                    size="sm"
                  >
                    Start
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Assessments */}
      {assessments.length > 0 && pendingInvitations.length > 0 && (
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mt-6">
          <ClipboardCheck className="w-4 h-4" />
          Completed Assessments
        </h3>
      )}

      {assessments.map((assessment) => {
        // For avatar type, use temperament for display; otherwise use primary_result
        const displayResult = (() => {
          if (assessment.type === 'avatar' && assessment.secondary_results?.temperament) {
            const rawTemp = String(assessment.secondary_results.temperament).toLowerCase();
            const tempMap: Record<string, string> = {
              'warrior': 'The Warrior',
              'sage': 'The Sage',
              'builder': 'The Builder',
              'connector': 'The Connector',
            };
            return tempMap[rawTemp] || assessment.primary_result;
          }
          return assessment.primary_result;
        })();

        const colors = PATTERN_COLORS[displayResult] || {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
        };
        const icon = PATTERN_ICONS[displayResult] || '📋';
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
                            {displayResult}
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
                  {/* Pattern Scores - Only show for identity_collision assessments */}
                  {assessment.type === 'identity_collision' && assessment.scores && Object.keys(assessment.scores).length > 0 && (
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

                  {/* Impact Area - Only for identity_collision */}
                  {assessment.type === 'identity_collision' && assessment.impact_area && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <span className="text-gray-400 text-sm">Impact Area: </span>
                      <span className="text-mi-gold font-medium capitalize">
                        {assessment.impact_area.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Inner Wiring Summary - For inner_wiring type OR avatar type with temperament */}
                  {(() => {
                    // For inner_wiring type, use primary_result directly
                    if (assessment.type === 'inner_wiring' && assessment.primary_result && INNER_WIRING_SUMMARIES[assessment.primary_result]) {
                      return (
                        <div className="bg-mi-cyan/10 border border-mi-cyan/20 rounded-lg p-4">
                          <span className="text-mi-cyan text-sm font-medium block mb-2">
                            Your Inner Wiring: {assessment.primary_result}
                          </span>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {INNER_WIRING_SUMMARIES[assessment.primary_result]}
                          </p>
                        </div>
                      );
                    }

                    // For avatar type, extract temperament from secondary_results and format it
                    if (assessment.type === 'avatar' && assessment.secondary_results?.temperament) {
                      const rawTemperament = String(assessment.secondary_results.temperament).toLowerCase();
                      const temperamentMap: Record<string, string> = {
                        'warrior': 'The Warrior',
                        'sage': 'The Sage',
                        'builder': 'The Builder',
                        'connector': 'The Connector',
                      };
                      const formattedTemperament = temperamentMap[rawTemperament] || rawTemperament;
                      const summary = INNER_WIRING_SUMMARIES[formattedTemperament];

                      if (summary) {
                        return (
                          <div className="bg-mi-cyan/10 border border-mi-cyan/20 rounded-lg p-4">
                            <span className="text-mi-cyan text-sm font-medium block mb-2">
                              Your Inner Wiring: {formattedTemperament}
                            </span>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {summary}
                            </p>
                          </div>
                        );
                      }
                    }

                    return null;
                  })()}

                  {/* Pattern Description - Only for identity_collision assessments */}
                  {assessment.type === 'identity_collision' &&
                   assessment.primary_result &&
                   PATTERN_DESCRIPTIONS[assessment.primary_result] && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <span className="text-gray-400 text-sm block mb-1">Pattern Summary</span>
                      <p className="text-gray-300 text-sm">
                        {PATTERN_DESCRIPTIONS[assessment.primary_result]}
                      </p>
                    </div>
                  )}

                  {/* Mental Pillar Competency Scores */}
                  {assessment.type === 'mental_pillar' && assessment.scores && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400 flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        Competency Scores
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(MENTAL_PILLAR_COMPETENCIES).map(([key, info]) => {
                          const score = assessment.scores?.[key];
                          const growth = assessment.secondary_results?.growth_deltas?.[key];
                          if (typeof score !== 'number') return null;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-1">
                                  {info.icon} {info.label}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{score}</span>
                                  {typeof growth === 'number' && growth !== 0 && (
                                    <span className={growth > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                      {growth > 0 ? '+' : ''}{growth}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${score}%`,
                                    backgroundColor: info.color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Overall score */}
                      {assessment.scores?.overall && (
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-violet-400 font-medium">Overall Score</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-white">{assessment.scores.overall}</span>
                              {assessment.secondary_results?.growth_deltas?.overall && (
                                <span className={Number(assessment.secondary_results.growth_deltas.overall) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {Number(assessment.secondary_results.growth_deltas.overall) > 0 ? '+' : ''}
                                  {assessment.secondary_results.growth_deltas.overall}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mental Pillar MIO Feedback */}
                  {assessment.type === 'mental_pillar' && assessment.secondary_results?.mio_feedback?.content && (
                    <div className="bg-mi-cyan/10 border border-mi-cyan/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-mi-cyan text-sm font-medium">🔮 MIO's Insight</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {assessment.secondary_results.mio_feedback.content}
                      </p>
                    </div>
                  )}

                  {/* Retake Button - MI design style */}
                  {assessment.can_retake && (
                    <Button
                      size="sm"
                      onClick={() => handleRetake(assessment.type)}
                      className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-white"
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
