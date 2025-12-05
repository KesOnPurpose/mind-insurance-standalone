/**
 * TodayProtocolTask Component
 * Phase 27: Daily protocol task display for MindInsuranceHub
 *
 * Features:
 * - Persistent button showing current day's task
 * - Modal with full instructions on first open
 * - "Mark Complete" functionality
 * - Progress indicator (Day X of 7)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Target,
  X,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { TodayProtocolTask as TodayProtocolTaskType } from '@/types/protocol';
import { completeProtocolDay } from '@/services/mioInsightProtocolService';
import { toast } from 'sonner';

interface TodayProtocolTaskProps {
  task: TodayProtocolTaskType;
  onComplete?: () => void;
  showOnMount?: boolean; // For modal on first open of day
}

export function TodayProtocolTask({
  task,
  onComplete,
  showOnMount = false,
}: TodayProtocolTaskProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(showOnMount);
  const [isCompleting, setIsCompleting] = useState(false);

  const progressPercent = (task.days_completed / 7) * 100;

  const handleComplete = async () => {
    setIsCompleting(true);

    const result = await completeProtocolDay({
      protocol_id: task.protocol_id,
      day_number: task.day_number,
    });

    setIsCompleting(false);

    if (result.success) {
      toast.success(`Day ${task.day_number} complete!`, {
        description:
          result.protocol_completed
            ? '🎉 Protocol completed! Amazing work!'
            : `${7 - task.day_number} days to go`,
      });
      setIsModalOpen(false);
      onComplete?.();
    } else {
      toast.error('Failed to complete task', {
        description: result.error,
      });
    }
  };

  const handleViewProtocol = () => {
    navigate(`/mind-insurance/protocol/${task.protocol_id}`);
  };

  return (
    <>
      {/* Compact Card Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`p-4 cursor-pointer transition-all hover:border-cyan-500/50 ${
            task.is_completed
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30'
          }`}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  task.is_completed
                    ? 'bg-emerald-500/20'
                    : 'bg-cyan-500/20'
                }`}
              >
                {task.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Today's Protocol
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      task.is_completed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    Day {task.day_number}/7
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 truncate">
                  {task.task.task_title}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1" />
          </div>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Day {task.day_number} of 7
              </Badge>
            </div>
            <DialogTitle className="text-xl text-white mt-2">
              {task.task.task_title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Theme */}
            <div>
              <p className="text-sm text-cyan-400 font-medium mb-1">
                Today's Theme
              </p>
              <p className="text-slate-300">{task.task.theme}</p>
            </div>

            {/* Instructions */}
            <div>
              <p className="text-sm text-cyan-400 font-medium mb-2">
                What to Do
              </p>
              <Card className="bg-slate-800/50 border-slate-700/50 p-4">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {task.task.task_instructions}
                </p>
              </Card>
            </div>

            {/* Duration */}
            {task.task.duration_minutes && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Estimated: {task.task.duration_minutes} minutes
                </span>
              </div>
            )}

            {/* Success Criteria */}
            {task.task.success_criteria.length > 0 && (
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Success Criteria
                </p>
                <ul className="space-y-2">
                  {task.task.success_criteria.map((criterion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insight Context */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-1">From This Week's Insight:</p>
              <p className="text-sm text-slate-400 italic">
                "{task.insight_summary}"
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {task.is_completed ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleViewProtocol}
                >
                  View Full Protocol
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Mark Complete
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleViewProtocol}
                >
                  View All Days
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Protocol Task Modal (for first-open-of-day popup)
// ============================================================================

interface ProtocolTaskModalProps {
  task: TodayProtocolTaskType;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProtocolTaskModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: ProtocolTaskModalProps) {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);

    const result = await completeProtocolDay({
      protocol_id: task.protocol_id,
      day_number: task.day_number,
    });

    setIsCompleting(false);

    if (result.success) {
      toast.success(`Day ${task.day_number} complete!`, {
        description:
          result.protocol_completed
            ? '🎉 Protocol completed! Amazing work!'
            : `${7 - task.day_number} days to go`,
      });
      onClose();
      onComplete?.();
    } else {
      toast.error('Failed to complete task', {
        description: result.error,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Today's Protocol Task
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <h2 className="text-xl font-bold text-white">
                {task.task.task_title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Day {task.day_number} of 7 • {task.protocol_title}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Theme */}
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-1">
                  Today's Focus
                </p>
                <p className="text-slate-300">{task.task.theme}</p>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-2">
                  Instructions
                </p>
                <Card className="bg-slate-800/50 border-slate-700/50 p-4">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {task.task.task_instructions}
                  </p>
                </Card>
              </div>

              {/* Duration & Criteria */}
              <div className="flex flex-wrap gap-4">
                {task.task.duration_minutes && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    ~{task.task.duration_minutes} min
                  </div>
                )}
                {task.task.success_criteria.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Target className="w-4 h-4" />
                    {task.task.success_criteria.length} criteria
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                onClick={handleComplete}
                disabled={isCompleting || task.is_completed}
              >
                {task.is_completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : isCompleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TodayProtocolTask;
