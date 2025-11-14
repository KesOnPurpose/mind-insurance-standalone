import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onComplete: (audioUrl: string, duration: number) => void;
  minDuration?: number;
}

export function VoiceRecorder({ onComplete, minDuration = 30 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to record your identity statement.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    if (duration < minDuration) {
      toast({
        variant: 'destructive',
        title: 'Recording Too Short',
        description: `Please record at least ${minDuration} seconds.`,
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const timestamp = Date.now();
      const fileName = `${user.id}/identity_statements/${timestamp}.webm`;
      
      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);
      
      toast({
        title: 'Recording Saved! 🎤',
        description: 'Your identity statement has been captured.',
      });
      
      onComplete(publicUrl, duration);
      resetRecording();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to save recording. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {formatTime(duration)}
          </div>
          {minDuration && (
            <p className="text-sm text-muted-foreground">
              Minimum {minDuration} seconds required
            </p>
          )}
        </div>

        {/* Recording Controls */}
        {!audioBlob && (
          <div className="flex justify-center gap-2">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </Button>
            )}
          </div>
        )}

        {/* Playback Controls */}
        {audioBlob && !isUploading && (
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={togglePlayback}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play Recording
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={resetRecording}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
            
            <Button
              size="lg"
              onClick={uploadRecording}
              disabled={duration < minDuration}
              className="w-full gap-2"
            >
              <Upload className="w-5 h-5" />
              Save Recording
            </Button>
            
            {duration < minDuration && (
              <p className="text-sm text-destructive text-center">
                Need {minDuration - duration} more seconds
              </p>
            )}
          </div>
        )}

        {isUploading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
