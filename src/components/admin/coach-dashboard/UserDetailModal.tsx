import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Send,
  ExternalLink,
  Loader2,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { useUserDetail, useSendNudge } from '@/hooks/useCoachDashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBookCall: (userId: string) => void;
}

export const UserDetailModal = ({
  userId,
  isOpen,
  onClose,
  onBookCall,
}: UserDetailModalProps) => {
  const { toast } = useToast();
  const { data: user, isLoading } = useUserDetail(userId);
  const sendNudgeMutation = useSendNudge();

  const handleSendNudge = async (method: 'sms' | 'email') => {
    if (!user) return;

    try {
      await sendNudgeMutation.mutateAsync({
        userId: user.user_id,
        method,
        message: `Hey ${user.full_name?.split(' ')[0] || 'there'}! Checking in on your group home journey. What can I help you with today?`
      });
      toast({
        title: 'Nudge sent',
        description: `${method.toUpperCase()} sent to ${user.full_name || user.email}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to send nudge',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !user ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {user.full_name || 'Unknown User'}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </DialogDescription>
                  </div>
                </div>
                <Badge
                  variant={user.is_stuck ? 'destructive' : 'secondary'}
                  className="mt-1"
                >
                  {user.is_stuck ? (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Stuck {user.days_since_last_progress}d
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  )}
                </Badge>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm font-medium">{formatDate(user.joined_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Current Position */}
                <div className="p-4 border rounded-lg">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Current Position
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phase</span>
                      <span className="font-medium">Phase {user.current_phase}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Tactic</span>
                      <span className="font-medium">{user.current_tactic_name || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Progress</span>
                      <span className="font-medium">{formatRelative(user.last_progress_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSendNudge('sms')}
                    disabled={!user.phone || sendNudgeMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendNudge('email')}
                    disabled={!user.email || sendNudgeMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBookCall(user.user_id)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Call
                  </Button>
                  {user.ghl_contact_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(
                        `https://app.gohighlevel.com/contacts/detail/${user.ghl_contact_id}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in GHL
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 mt-4">
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{user.total_tactics_completed}</p>
                    <p className="text-xs text-muted-foreground">Tactics Done</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{user.current_phase}/4</p>
                    <p className="text-xs text-muted-foreground">Current Phase</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{user.overall_progress}%</p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </div>

                {/* Phase Progress */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    Phase Progress
                  </h4>
                  {user.phase_progress?.map((phase) => (
                    <div key={phase.phase_number} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Phase {phase.phase_number}: {phase.phase_name}</span>
                        <span className={cn(
                          "font-medium",
                          phase.completed ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {phase.completed_tactics}/{phase.total_tactics}
                        </span>
                      </div>
                      <Progress
                        value={(phase.completed_tactics / phase.total_tactics) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                {/* Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    Recent Activity
                  </h4>
                  {user.recent_activity && user.recent_activity.length > 0 ? (
                    <div className="space-y-2">
                      {user.recent_activity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 border-l-2 border-l-primary/30 pl-4"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>

                {/* Nudge History */}
                {user.nudge_history && user.nudge_history.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Send className="w-4 h-4 text-muted-foreground" />
                        Nudge History
                      </h4>
                      <div className="space-y-2">
                        {user.nudge_history.map((nudge, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                          >
                            <span>{nudge.method.toUpperCase()}: {nudge.message.slice(0, 50)}...</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelative(nudge.sent_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
