/**
 * RIE Phase 4: Safe Space Page
 * Structured conflict resolution tools, guided conversations,
 * emotional check-in prompts, and session history.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Plus,
  Loader2,
  MessageCircle,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSafeSpaceSessions,
  createSafeSpaceSession,
  updateSafeSpaceSession,
} from '@/services/relationshipExtendedService';
import type {
  RelationshipSafeSpaceSession,
  SafeSpaceCategory,
  SafeSpaceStatus,
} from '@/types/relationship-extended';

// ─── Category config ────────────────────────────────────────────────────
const CATEGORIES: {
  value: SafeSpaceCategory;
  label: string;
  icon: string;
  description: string;
  prompts: string[];
}[] = [
  {
    value: 'conflict_resolution',
    label: 'Conflict Resolution',
    icon: '⚔️',
    description: 'Work through disagreements constructively',
    prompts: [
      'I feel ___ when ___ happens because ___.',
      'What I need from you is ___.',
      'I understand your perspective is ___.',
      'One thing I appreciate about how you handled this is ___.',
      'Going forward, can we agree to ___?',
    ],
  },
  {
    value: 'emotional_check_in',
    label: 'Emotional Check-In',
    icon: '💭',
    description: 'Share how you are feeling right now',
    prompts: [
      'Right now I am feeling ___.',
      'Something that has been weighing on me is ___.',
      'I feel closest to you when ___.',
      'Something I have not said out loud is ___.',
      'The support I need most is ___.',
    ],
  },
  {
    value: 'future_planning',
    label: 'Future Planning',
    icon: '🗺️',
    description: 'Align on goals and shared vision',
    prompts: [
      'In 5 years, I hope we ___.',
      'A dream I have not shared with you is ___.',
      'Financially, I think we should ___.',
      'Regarding our living situation, I would like ___.',
      'Something I want us to prioritize together is ___.',
    ],
  },
  {
    value: 'boundary_setting',
    label: 'Boundary Setting',
    icon: '🛡️',
    description: 'Establish and respect healthy limits',
    prompts: [
      'A boundary I need to set is ___.',
      'When my boundary is crossed I feel ___.',
      'I respect your boundary about ___ and will ___.',
      'A boundary we should set together is ___.',
      'I need space around ___ and here is why ___.',
    ],
  },
  {
    value: 'appreciation',
    label: 'Appreciation',
    icon: '🌟',
    description: 'Express gratitude and admiration',
    prompts: [
      'Something I admire about you is ___.',
      'You made my day when you ___.',
      'I am grateful you ___ because ___.',
      'One way you have grown that inspires me is ___.',
      'Thank you for always ___.',
    ],
  },
  {
    value: 'general',
    label: 'Open Conversation',
    icon: '💬',
    description: 'Free-form guided dialogue',
    prompts: [
      'Something I have been thinking about is ___.',
      'I want to talk about ___ because ___.',
      'How do you feel about ___?',
      'What would make this week better for us?',
      'Is there anything you need from me right now?',
    ],
  },
];

const STATUS_CONFIG: Record<
  SafeSpaceStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400', icon: MessageCircle },
  paused: { label: 'Paused', color: 'bg-amber-500/20 text-amber-400', icon: Pause },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle2 },
  abandoned: { label: 'Abandoned', color: 'bg-red-500/20 text-red-400', icon: XCircle },
};

export default function RelationshipSafeSpacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<RelationshipSafeSpaceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState<SafeSpaceCategory>('general');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // For now use a placeholder partnership ID (would come from context in production)
  const partnershipId = user?.id ?? '';

  const loadSessions = useCallback(async () => {
    if (!partnershipId) return;
    try {
      const data = await getSafeSpaceSessions(partnershipId);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load safe space sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [partnershipId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCreate = async () => {
    if (!newTopic.trim()) return;
    setIsCreating(true);
    try {
      const session = await createSafeSpaceSession({
        partnership_id: partnershipId,
        topic: newTopic.trim(),
        category: newCategory,
      });
      setSessions((prev) => [session, ...prev]);
      setNewTopic('');
      setNewCategory('general');
      setShowNewForm(false);
      setExpandedId(session.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: SafeSpaceStatus) => {
    setUpdatingId(id);
    try {
      const updated = await updateSafeSpaceSession(id, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Failed to update session:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const pastSessions = sessions.filter((s) => s.status !== 'active');

  const selectedCatDef = CATEGORIES.find((c) => c.value === newCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl font-semibold text-white">Safe Space</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-white/70"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Safe Space</h1>
              <p className="text-xs text-white/40">
                Structured tools for difficult conversations and connection.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Session
          </Button>
        </div>

        {/* New Session Form */}
        {showNewForm && (
          <Card className="border-emerald-500/20 bg-mi-navy-light shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80">
                Start a New Safe Space Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category picker */}
              <div>
                <p className="text-xs text-white/40 mb-2">Choose a category:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setNewCategory(cat.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        newCategory === cat.value
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <p className="text-[11px] font-medium text-white/70 mt-1">
                        {cat.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic input */}
              <div>
                <p className="text-xs text-white/40 mb-1">
                  What do you want to talk about?
                </p>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., How we split household chores..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              {/* Starter prompts preview */}
              {selectedCatDef && (
                <div>
                  <p className="text-xs text-white/30 mb-1">Conversation starters:</p>
                  <div className="space-y-1">
                    {selectedCatDef.prompts.slice(0, 3).map((prompt, i) => (
                      <p key={i} className="text-[11px] text-white/40 italic">
                        &ldquo;{prompt}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={handleCreate}
                  disabled={!newTopic.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <MessageCircle className="h-3 w-3 mr-1" />
                  )}
                  Start Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Active Sessions
            </p>
            <div className="space-y-2">
              {activeSessions.map((session) => {
                const catDef = CATEGORIES.find((c) => c.value === session.category);
                const isExpanded = expandedId === session.id;
                const isUpdating = updatingId === session.id;

                return (
                  <Card
                    key={session.id}
                    className="border-emerald-500/20 bg-mi-navy-light shadow-lg"
                  >
                    <CardContent className="p-3">
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : session.id)
                        }
                      >
                        <span className="text-lg mt-0.5">
                          {catDef?.icon ?? '💬'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">
                            {session.topic}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-emerald-500/20 text-emerald-400"
                            >
                              {catDef?.label ?? session.category}
                            </Badge>
                            <span className="text-[10px] text-white/30">
                              {new Date(session.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-white/30" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/30" />
                        )}
                      </div>

                      {isExpanded && catDef && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-xs text-white/40 mb-2">
                            Guided Prompts:
                          </p>
                          <div className="space-y-2 mb-3">
                            {catDef.prompts.map((prompt, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-white/[0.03] border border-white/5"
                              >
                                <p className="text-xs text-white/60 italic">
                                  {prompt}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-amber-400 hover:bg-amber-500/10 text-[11px]"
                              onClick={() =>
                                handleUpdateStatus(session.id, 'paused')
                              }
                              disabled={isUpdating}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px]"
                              onClick={() =>
                                handleUpdateStatus(session.id, 'completed')
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Complete
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Cards (when no active sessions or as reference) */}
        {activeSessions.length === 0 && !showNewForm && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Conversation Categories
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <Card
                  key={cat.value}
                  className="border-white/5 bg-mi-navy-light hover:border-emerald-500/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setNewCategory(cat.value);
                    setShowNewForm(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white/80">
                          {cat.label}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {cat.description}
                        </p>
                        <p className="text-[10px] text-emerald-400/50 mt-1">
                          {cat.prompts.length} guided prompts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
              Session History
            </p>
            <div className="space-y-2">
              {pastSessions.map((session) => {
                const catDef = CATEGORIES.find(
                  (c) => c.value === session.category,
                );
                const statusDef = STATUS_CONFIG[session.status];
                const StatusIcon = statusDef.icon;

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <span className="text-lg">{catDef?.icon ?? '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/60 truncate">
                        {session.topic}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] ${statusDef.color}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                          {statusDef.label}
                        </Badge>
                        <span className="text-[10px] text-white/20">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {session.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() =>
                          handleUpdateStatus(session.id, 'active')
                        }
                        disabled={updatingId === session.id}
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !showNewForm && (
          <Card className="border-emerald-500/20 bg-mi-navy-light shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Your Safe Space
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-4">
                Start a guided conversation session to navigate difficult topics,
                resolve conflicts, or simply check in with each other.
              </p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start First Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
