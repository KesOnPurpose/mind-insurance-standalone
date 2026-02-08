// ============================================================================
// FEAT-GH-018: Nudge Button Component
// ============================================================================
// Button to send manual nudge to a learner (future: integrates with notifications)
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bell, Send, Loader2 } from 'lucide-react';
import { useSendLearnerNudge } from '@/hooks/useAdminPrograms';

// ============================================================================
// Types
// ============================================================================

interface NudgeButtonProps {
  userId: string;
  userName?: string | null;
  lessonId?: string;
  lessonTitle?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  onNudgeSent?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const NudgeButton = ({
  userId,
  userName,
  lessonId,
  lessonTitle,
  variant = 'outline',
  size = 'sm',
  onNudgeSent,
}: NudgeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { sendNudge, isSending } = useSendLearnerNudge();

  const handleSendNudge = async () => {
    const success = await sendNudge(userId, lessonId, message);
    if (success) {
      setIsOpen(false);
      setMessage('');
      onNudgeSent?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {size === 'icon' ? (
          <Button variant={variant} size="icon" title="Send nudge">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Send nudge</span>
          </Button>
        ) : (
          <Button variant={variant} size={size} className="gap-2">
            <Bell className="h-4 w-4" />
            Nudge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Nudge</DialogTitle>
          <DialogDescription>
            Send a notification to encourage {userName || 'this learner'} to continue their progress.
            {lessonTitle && (
              <span className="block mt-1 text-foreground font-medium">
                Currently on: {lessonTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personalized message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default encouragement message.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendNudge} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Nudge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NudgeButton;
