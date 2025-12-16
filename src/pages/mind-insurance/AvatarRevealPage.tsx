/**
 * AvatarRevealPage
 * Mind Insurance - Your Identity Avatar
 *
 * Reveals the user's complete Identity Avatar composed of:
 * - Primary Identity Collision Pattern (Layer 1)
 * - Sub-Pattern Deep Dive (Layer 2)
 * - Internal Wiring / Temperament (Layer 3)
 *
 * This page provides a dramatic reveal of their unique psychological fingerprint
 * and explains how these layers combine to create their Identity Collision profile.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft,
  Brain,
  Layers,
  Zap,
  Lock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Clock,
  Target,
  Heart,
  Activity,
  Users,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarData } from '@/hooks/useAvatarData';
import { cn } from '@/lib/utils';

// ============================================================================
// PILLAR ICONS
// ============================================================================

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  spiritual: <Sparkles className="h-5 w-5 text-purple-400" />,
  mental: <Brain className="h-5 w-5 text-blue-400" />,
  physical: <Activity className="h-5 w-5 text-green-400" />,
  relational: <Users className="h-5 w-5 text-pink-400" />,
};

const PILLAR_COLORS: Record<string, string> = {
  spiritual: 'border-purple-500/30 bg-purple-500/5',
  mental: 'border-blue-500/30 bg-blue-500/5',
  physical: 'border-green-500/30 bg-green-500/5',
  relational: 'border-pink-500/30 bg-pink-500/5',
};

// ============================================================================
// PATTERN STYLING
// ============================================================================

const PATTERN_STYLES: Record<string, { gradient: string; icon: string; color: string }> = {
  past_prison: {
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    icon: '🔓',
    color: 'text-red-400',
  },
  success_sabotage: {
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    icon: '🎯',
    color: 'text-yellow-400',
  },
  compass_crisis: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    icon: '🧭',
    color: 'text-blue-400',
  },
};

const TEMPERAMENT_STYLES: Record<string, { icon: string; color: string }> = {
  warrior: { icon: '⚔️', color: 'text-red-400' },
  sage: { icon: '🦉', color: 'text-purple-400' },
  connector: { icon: '🤝', color: 'text-green-400' },
  builder: { icon: '🏗️', color: 'text-blue-400' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AvatarRevealPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { avatarData, isLoading } = useAvatarData();

  // Collapsible state
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFourPillars, setShowFourPillars] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const fullAvatar = avatarData.fullAvatar;

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mi-cyan" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-mi-navy flex flex-col items-center justify-center p-4">
        <p className="text-gray-400">Please sign in to view your avatar.</p>
        <Button onClick={() => navigate('/auth')} className="mt-4">
          Sign In
        </Button>
      </div>
    );
  }

  const patternStyle = avatarData.primaryPattern
    ? PATTERN_STYLES[avatarData.primaryPattern.name] || PATTERN_STYLES.past_prison
    : null;

  const temperamentStyle = avatarData.temperament
    ? TEMPERAMENT_STYLES[avatarData.temperament.primary] || TEMPERAMENT_STYLES.sage
    : null;

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mind-insurance/coverage')}
          className="mb-6 -ml-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Coverage
        </Button>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-4">🎭</div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Identity Avatar</h1>
          <p className="text-gray-400">
            The unique psychological fingerprint of your Identity Collision
          </p>
        </motion.div>

        {/* Completion Progress */}
        {!avatarData.isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-mi-navy-light border-mi-cyan/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-mi-cyan" />
                  Avatar Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-mi-cyan font-semibold">
                      {avatarData.completionPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={avatarData.completionPercentage}
                    className="h-2 bg-gray-700"
                  />
                  {avatarData.missingAssessments.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-2">Complete these to reveal your full avatar:</p>
                      <div className="flex flex-wrap gap-2">
                        {avatarData.missingAssessments.map((assessment) => (
                          <Badge
                            key={assessment}
                            variant="outline"
                            className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            {assessment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Avatar Reveal (when complete) */}
        {avatarData.isComplete && avatarData.avatarName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="mb-8"
          >
            <Card className={cn(
              'bg-gradient-to-br overflow-hidden',
              patternStyle?.gradient || 'from-mi-cyan to-mi-gold'
            )}>
              <div className="bg-mi-navy/80 backdrop-blur-sm p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="text-7xl mb-4"
                >
                  {patternStyle?.icon}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {avatarData.avatarName}
                </motion.h2>
                {/* Short description preview */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-gray-300 max-w-md mx-auto text-sm"
                >
                  {fullAvatar?.shortDescription || avatarData.avatarDescription}
                </motion.p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Rich Content Sections (only when avatar is complete with full data) */}
        {avatarData.isComplete && fullAvatar && (
          <div className="space-y-4 mb-8">
            {/* Full Description (Collapsible) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Collapsible open={showFullDescription} onOpenChange={setShowFullDescription}>
                <Card className="bg-mi-navy-light border-mi-cyan/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Target className="h-5 w-5 text-mi-cyan" />
                          Your Pattern Story
                        </CardTitle>
                        {showFullDescription ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                        {fullAvatar.fullDescription}
                      </p>
                      {fullAvatar.breakthroughPath && (
                        <div className="mt-4 p-3 rounded-lg bg-mi-cyan/10 border border-mi-cyan/20">
                          <p className="text-xs text-mi-cyan font-semibold uppercase mb-1">
                            Your Breakthrough Path
                          </p>
                          <p className="text-gray-300 text-sm">
                            {fullAvatar.breakthroughPath}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* Four-Pillar Attack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Collapsible open={showFourPillars} onOpenChange={setShowFourPillars}>
                <Card className="bg-mi-navy-light border-orange-500/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-400" />
                          How Identity Collision Attacks You
                          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                            4 Pillars
                          </Badge>
                        </CardTitle>
                        {showFourPillars ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {Object.entries(fullAvatar.fourPillarAttack).map(([pillar, attack]) => (
                        <div
                          key={pillar}
                          className={cn(
                            'p-3 rounded-lg border',
                            PILLAR_COLORS[pillar]
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {PILLAR_ICONS[pillar]}
                            <span className="text-sm font-semibold text-white capitalize">
                              {pillar}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm italic">
                            {attack}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* Cost if Unchecked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Collapsible open={showCosts} onOpenChange={setShowCosts}>
                <Card className="bg-mi-navy-light border-red-500/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          The Cost if Left Unchecked
                        </CardTitle>
                        {showCosts ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {fullAvatar.costIfUnchecked.map((cost, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                        >
                          <span className="text-red-400 font-bold text-lg">
                            {index + 1}.
                          </span>
                          <p className="text-gray-300 text-sm">{cost}</p>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* Neural Rewiring Protocol */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Collapsible open={showProtocol} onOpenChange={setShowProtocol}>
                <Card className="bg-mi-navy-light border-emerald-500/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Brain className="h-5 w-5 text-emerald-400" />
                          Neural Rewiring Protocol
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            {fullAvatar.neuralRewiringProtocol.practices.length} Practices
                          </Badge>
                        </CardTitle>
                        {showProtocol ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Time Investment */}
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">
                          Time Investment: {fullAvatar.premiumTime}
                        </span>
                      </div>

                      {/* Practices */}
                      {fullAvatar.neuralRewiringProtocol.practices.map((practice, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-white/5 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-semibold text-sm">
                              {practice.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {practice.duration} • {practice.frequency}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-xs whitespace-pre-line mb-2">
                            {practice.instructions}
                          </p>
                          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400">
                              <span className="font-semibold">Expected: </span>
                              {practice.expectedOutcome}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Emergency Protocol */}
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                        <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Emergency Protocol
                        </h4>
                        <p className="text-gray-400 text-xs mb-2">
                          <span className="font-semibold">Trigger: </span>
                          {fullAvatar.neuralRewiringProtocol.emergencyProtocol.trigger}
                        </p>
                        <ol className="space-y-1">
                          {fullAvatar.neuralRewiringProtocol.emergencyProtocol.steps.map((step, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-red-400 font-bold">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* ROI */}
                      <div className="p-3 rounded-lg bg-mi-gold/10 border border-mi-gold/20">
                        <p className="text-xs text-mi-gold">
                          <span className="font-semibold">ROI: </span>
                          {fullAvatar.roi}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* Transformation Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <Collapsible open={showTimeline} onOpenChange={setShowTimeline}>
                <Card className="bg-mi-navy-light border-mi-cyan/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-mi-cyan" />
                          Your Transformation Timeline
                        </CardTitle>
                        {showTimeline ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-mi-cyan via-mi-gold to-emerald-500" />

                        <div className="space-y-4">
                          {[
                            { key: 'week1', label: 'Week 1', color: 'mi-cyan' },
                            { key: 'week2', label: 'Week 2', color: 'mi-cyan' },
                            { key: 'day30', label: 'Day 30', color: 'mi-gold' },
                            { key: 'day90', label: 'Day 90', color: 'emerald-500' },
                          ].map((item, index) => (
                            <div key={item.key} className="flex items-start gap-4 pl-1">
                              <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center z-10',
                                `bg-${item.color}/20 border border-${item.color}`
                              )}>
                                <span className="text-xs font-bold text-white">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 pb-4">
                                <p className={`text-sm font-semibold text-${item.color}`}>
                                  {item.label}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {fullAvatar.transformationTimeline[item.key as keyof typeof fullAvatar.transformationTimeline]}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          </div>
        )}

        {/* Layer Cards */}
        <div className="space-y-4">
          {/* Layer 1: Primary Pattern */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cn(
              'bg-mi-navy-light overflow-hidden',
              avatarData.primaryPattern
                ? 'border-green-500/30'
                : 'border-gray-700 opacity-60'
            )}>
              {avatarData.primaryPattern && (
                <div className={cn('h-1 w-full bg-gradient-to-r', patternStyle?.gradient)} />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      avatarData.primaryPattern
                        ? 'bg-gradient-to-br ' + patternStyle?.gradient
                        : 'bg-gray-700'
                    )}>
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">
                        Primary Pattern
                      </CardTitle>
                      {avatarData.primaryPattern ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{patternStyle?.icon}</span>
                          <span className={cn('font-semibold', patternStyle?.color)}>
                            {avatarData.primaryPattern.displayName}
                          </span>
                          {avatarData.primaryPattern.confidence && (
                            <span className="text-xs text-gray-500">
                              ({avatarData.primaryPattern.confidence}% confidence)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not yet assessed</span>
                      )}
                    </div>
                  </div>
                  {avatarData.primaryPattern ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {!avatarData.primaryPattern && (
                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    onClick={() => navigate('/mind-insurance/assessment')}
                    className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-mi-navy"
                  >
                    Take Assessment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Layer 2: Sub-Pattern */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cn(
              'bg-mi-navy-light overflow-hidden',
              avatarData.subPattern
                ? 'border-green-500/30'
                : 'border-gray-700 opacity-60'
            )}>
              {avatarData.subPattern && (
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      avatarData.subPattern
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gray-700'
                    )}>
                      <Layers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">
                        Sub-Pattern
                      </CardTitle>
                      {avatarData.subPattern ? (
                        <div className="mt-1">
                          <span className="text-purple-400 font-semibold">
                            {avatarData.subPattern.primary}
                          </span>
                          {avatarData.subPattern.secondary && (
                            <span className="text-xs text-gray-500 ml-2">
                              + {avatarData.subPattern.secondary}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not yet assessed</span>
                      )}
                    </div>
                  </div>
                  {avatarData.subPattern ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {!avatarData.subPattern && (
                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    onClick={() => navigate('/mind-insurance/sub-pattern-assessment')}
                    disabled={!avatarData.primaryPattern}
                    className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-mi-navy disabled:opacity-50"
                  >
                    {avatarData.primaryPattern ? 'Take Assessment' : 'Complete Pattern First'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Layer 3: Internal Wiring */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className={cn(
              'bg-mi-navy-light overflow-hidden',
              avatarData.temperament
                ? 'border-green-500/30'
                : 'border-gray-700 opacity-60'
            )}>
              {avatarData.temperament && (
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      avatarData.temperament
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        : 'bg-gray-700'
                    )}>
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">
                        Internal Wiring
                      </CardTitle>
                      {avatarData.temperament ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{temperamentStyle?.icon}</span>
                          <span className={cn('font-semibold', temperamentStyle?.color)}>
                            {avatarData.temperament.displayName}
                          </span>
                          {avatarData.temperament.secondary && (
                            <span className="text-xs text-gray-500">
                              + {avatarData.temperament.secondary}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not yet assessed</span>
                      )}
                    </div>
                  </div>
                  {avatarData.temperament ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {!avatarData.temperament && (
                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    onClick={() => navigate('/mind-insurance/temperament-assessment')}
                    disabled={!avatarData.primaryPattern}
                    className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-mi-navy disabled:opacity-50"
                  >
                    {avatarData.primaryPattern ? 'Take Assessment' : 'Complete Pattern First'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </div>

        {/* CTA Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          {avatarData.isComplete ? (
            <Button
              size="lg"
              onClick={() => navigate('/mind-insurance/coverage')}
              className="bg-gradient-to-r from-mi-cyan to-mi-gold text-mi-navy font-semibold"
            >
              Continue Your Transformation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-gray-500">
              Complete all assessments to unlock your full Identity Avatar
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
