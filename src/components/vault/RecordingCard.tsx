import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Play, Pause, MoreVertical, Trash2, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';
import { VaultRecording, formatDuration, getRecordingTypeColor, getRecordingTypeLabel } from '@/hooks/useVaultRecordings';
import { audioPlaybackService } from '@/services/audioPlaybackService';

interface RecordingCardProps {
  recording: VaultRecording;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export function RecordingCard({ recording, onDelete, isDeleting }: RecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Subscribe to playback changes
  useEffect(() => {
    const unsubscribePlayback = audioPlaybackService.onPlaybackChange((recordingId) => {
      setIsPlaying(audioPlaybackService.isPlaying(recording.id));
    });

    const unsubscribeTime = audioPlaybackService.onTimeUpdate((time) => {
      if (audioPlaybackService.isCurrent(recording.id)) {
        setCurrentTime(time);
      }
    });

    return () => {
      unsubscribePlayback();
      unsubscribeTime();
    };
  }, [recording.id]);

  const handleTogglePlay = () => {
    audioPlaybackService.toggle(recording.recording_url, recording.id);
  };

  const handleDelete = async () => {
    try {
      // Stop playback if this recording is playing
      if (audioPlaybackService.isCurrent(recording.id)) {
        audioPlaybackService.stop();
      }
      await onDelete(recording.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const formattedDate = new Date(recording.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const typeColor = getRecordingTypeColor(recording.recording_type);
  const typeLabel = getRecordingTypeLabel(recording.recording_type);

  // Calculate progress percentage
  const progress = recording.recording_duration > 0
    ? (currentTime / recording.recording_duration) * 100
    : 0;

  return (
    <>
      <Card className="p-4 hover:shadow-lg transition-shadow bg-mi-navy-light border border-mi-cyan/20 hover:border-mi-cyan/40">
        <div className="space-y-3">
          {/* Main row: Play button, info, actions */}
          <div className="flex items-start justify-between gap-3">
            {/* Left: Play button + info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="outline"
                size="icon"
                onClick={handleTogglePlay}
                className={`shrink-0 h-12 w-12 rounded-full bg-mi-navy border-mi-cyan/40 ${
                  isPlaying ? 'bg-mi-cyan/20 border-mi-cyan text-mi-cyan' : 'text-mi-cyan hover:text-white hover:border-mi-cyan hover:bg-mi-cyan/10'
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${typeColor} text-xs bg-mi-navy border-mi-cyan/30`}>
                    {typeLabel}
                  </Badge>
                  {recording.transcription_status === 'pending' && (
                    <Badge variant="secondary" className="text-xs bg-mi-gold/20 text-mi-gold border border-mi-gold/30">
                      Transcribing...
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Right: Duration + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(recording.recording_duration)}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-mi-navy">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-mi-navy-light border-mi-cyan/20">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress bar (shows when playing or paused on this recording) */}
          {audioPlaybackService.isCurrent(recording.id) && (
            <div className="w-full bg-mi-navy rounded-full h-1.5">
              <div
                className="bg-mi-cyan h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          )}

          {/* Transcription section */}
          {recording.transcription_text && (
            <Collapsible open={isTranscriptionOpen} onOpenChange={setIsTranscriptionOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-gray-400 hover:text-white hover:bg-mi-navy"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    View Transcription
                  </span>
                  {isTranscriptionOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-mi-navy rounded-lg border border-mi-cyan/10">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {recording.transcription_text}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RecordingCard;
