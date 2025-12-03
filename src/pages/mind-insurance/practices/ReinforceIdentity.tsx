/**
 * Reinforce Identity Practice Component
 * PROTECT Methodology - "R" Practice
 * Records user's I AM statement with voice recording
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Mic, MicOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  createPractice,
  updatePractice,
  getTodayPractices,
  isWithinTimeWindow
} from '@/services/practiceService';
// Voice recording service temporarily disabled - needs to be created
// import {
//   AudioRecorder,
//   uploadAudioToStorage,
//   saveVoiceRecording,
//   sendAudioForTranscription
// } from '@/services/voiceRecordingService';
import { PRACTICE_TYPES, POINTS_CONFIG, AUDIO_DURATIONS, TIME_WINDOWS } from '@/constants/protect';
import type { DailyPractice } from '@/types/practices';
import { useToast } from '@/hooks/use-toast';
import { VoiceActivityIndicator } from '@/components/voice/VoiceActivityIndicator';

export default function ReinforceIdentity() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [identityStatement, setIdentityStatement] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [userTimezone, setUserTimezone] = useState('America/New_York');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingPractice, setExistingPractice] = useState<DailyPractice | null>(null);

  // Refs
  // Voice recording temporarily disabled - service needs to be created
  const audioRecorderRef = useRef<any | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingDataRef = useRef<{ blob: Blob; duration: number } | null>(null);

  // Initialize audio recorder on mount
  useEffect(() => {
    // audioRecorderRef.current = new AudioRecorder();

    // Load existing practice if any
    loadExistingPractice();

    return () => {
      // Cleanup on unmount
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Load user timezone on mount
  useEffect(() => {
    loadUserTimezone();
  }, []);

  /**
   * Load user's timezone from profile
   */
  async function loadUserTimezone() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      if (profile?.timezone) {
        setUserTimezone(profile.timezone);
      }
    } catch (error) {
      console.error('Error loading user timezone:', error);
    }
  }

  /**
   * Load existing practice for today if it exists
   */
  async function loadExistingPractice() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const practices = await getTodayPractices(user.id);
      const existing = practices.find(p => p.practice_type === PRACTICE_TYPES.REINFORCE_IDENTITY);

      if (existing) {
        setExistingPractice(existing);
        if (existing.data?.identity_statement) {
          setIdentityStatement(existing.data.identity_statement);
        }
        if (existing.data?.recording_id) {
          setHasRecording(true);
          setCurrentRecordingId(existing.data.recording_id);
        }
      }
    } catch (error) {
      console.error('Error loading existing practice:', error);
    }
  }

  /**
   * Check if practice is within time window
   */
  function checkTimeWindow(): boolean {
    const isInWindow = isWithinTimeWindow(PRACTICE_TYPES.REINFORCE_IDENTITY, userTimezone);

    if (!isInWindow) {
      const window = TIME_WINDOWS.CHAMPIONSHIP_SETUP;
      setError(
        `This practice can only be completed during ${window.label}. ` +
        `You can prepare your statement now, but submission is only available during the designated time window.`
      );
      return false;
    }

    return true;
  }

  /**
   * Start recording audio
   */
  async function startRecording() {
    try {
      setError('');

      if (!audioRecorderRef.current) {
        setError('Audio recorder not initialized');
        return;
      }

      // Request permission and start recording
      const hasPermission = await audioRecorderRef.current.requestPermission();
      if (!hasPermission) {
        setError('Microphone permission is required to record your statement');
        return;
      }

      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
      setHasRecording(false);
      setRecordingDuration(0);

      // Set up volume monitoring callback
      audioRecorderRef.current.setVolumeCallback((volume) => {
        setCurrentVolume(volume);
      });

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Auto-stop after max duration
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, AUDIO_DURATIONS.IDENTITY_RECORDING_MAX * 1000);

    } catch (err: any) {
      setError(`Failed to start recording: ${err.message}`);
      console.error('Recording error:', err);
    }
  }

  /**
   * Stop recording audio
   */
  async function stopRecording() {
    if (!audioRecorderRef.current || !isRecording) return;

    try {
      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Stop recording
      const recordingData = await audioRecorderRef.current.stopRecording();
      setIsRecording(false);

      // Check minimum duration
      if (recordingDuration < AUDIO_DURATIONS.IDENTITY_RECORDING) {
        setError(
          `Recording must be at least ${AUDIO_DURATIONS.IDENTITY_RECORDING} seconds. ` +
          `You recorded ${recordingDuration} seconds. Please try again.`
        );
        setHasRecording(false);
        setRecordingDuration(0);
        recordingDataRef.current = null;
        return;
      }

      // Save recording data for submission
      recordingDataRef.current = {
        blob: recordingData.blob,
        duration: recordingData.duration
      };
      setHasRecording(true);
      setError('');

      toast({
        title: 'Recording complete',
        description: `Your ${recordingData.duration}s recording is ready to submit.`,
      });

    } catch (err: any) {
      setError(`Failed to stop recording: ${err.message}`);
      console.error('Stop recording error:', err);
    }
  }

  /**
   * Handle practice completion
   */
  async function handleComplete() {
    // Validate inputs
    if (!identityStatement.trim()) {
      setError('Please write your I AM statement');
      return;
    }

    if (!hasRecording || !recordingDataRef.current) {
      setError('Please record your statement');
      return;
    }

    // Check time window
    if (!checkTimeWindow()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Voice recording temporarily disabled - service needs to be created
      // Upload would happen here
      // const { publicUrl, path } = await uploadAudioToStorage(user.id, recordingDataRef.current.blob);
      // const voiceRecording = await saveVoiceRecording(user.id, publicUrl, recordingDataRef.current.duration, existingPractice?.id, 'identity');
      // sendAudioForTranscription(recordingDataRef.current.blob, user.id, voiceRecording.id);

      // Prepare practice data
      const practiceData = {
        identity_statement: identityStatement.trim(),
        recording_id: undefined, // Would be voiceRecording.id
        recording_duration: recordingDataRef.current?.duration || 0,
      };

      // Get today's date in user's timezone
      const practiceDate = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone
      });

      // Create or update practice
      if (existingPractice) {
        await updatePractice(existingPractice.id, {
          data: practiceData,
          completed: true,
          completed_at: new Date().toISOString()
        });
      } else {
        await createPractice({
          user_id: user.id,
          practice_date: practiceDate,
          practice_type: PRACTICE_TYPES.REINFORCE_IDENTITY,
          data: practiceData,
          completed: true,
          completed_at: new Date().toISOString()
        });
      }

      // Calculate points earned
      const pointsEarned = POINTS_CONFIG[PRACTICE_TYPES.REINFORCE_IDENTITY];

      toast({
        title: 'Practice completed!',
        description: `You earned ${pointsEarned} points`,
      });

      // Navigate back to hub
      navigate('/mind-insurance');

    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your practice');
      console.error('Practice completion error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate if we can complete the practice
  const canComplete = identityStatement.trim() && hasRecording && !loading;
  const recordingProgress = (recordingDuration / AUDIO_DURATIONS.IDENTITY_RECORDING) * 100;

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-4xl py-8 px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mind-insurance')}
            className="shrink-0 text-gray-400 hover:text-white hover:bg-mi-navy-light"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Reinforce Identity
            </h1>
            <p className="text-mi-cyan">
              {POINTS_CONFIG[PRACTICE_TYPES.REINFORCE_IDENTITY]} points
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Identity Statement Card */}
          <Card className="bg-mi-navy-light border-mi-cyan/20">
            <CardHeader>
              <CardTitle className="text-white">Write your I AM statement for today</CardTitle>
              <CardDescription className="text-gray-400">
                Make it personal, powerful, and slightly uncomfortable.
                This statement should stretch your current identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="I am someone who..."
                value={identityStatement}
                onChange={(e) => setIdentityStatement(e.target.value)}
                className="mi-textarea min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-2 text-right">
                {identityStatement.length}/500 characters
              </div>
            </CardContent>
          </Card>

          {/* Voice Recording Card */}
          <Card className="bg-mi-navy-light border-mi-cyan/20">
            <CardHeader>
              <CardTitle className="text-white">Now speak it with conviction</CardTitle>
              <CardDescription className="text-gray-400">
                Record yourself saying your I AM statement.
                Minimum {AUDIO_DURATIONS.IDENTITY_RECORDING} seconds for full points.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording Button */}
              <div className="flex flex-col items-center space-y-4">
                <VoiceActivityIndicator isRecording={isRecording} volume={currentVolume}>
                  <Button
                    size="lg"
                    variant={isRecording ? 'destructive' : 'default'}
                    className="w-32 h-32 rounded-full"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                  >
                    {isRecording ? (
                      <MicOff className="h-12 w-12" />
                    ) : (
                      <Mic className="h-12 w-12" />
                    )}
                  </Button>
                </VoiceActivityIndicator>

                {/* Recording Status */}
                {isRecording && (
                  <div className="w-full space-y-2">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-white">{recordingDuration}s</span>
                      <p className="text-sm text-gray-400">
                        {recordingDuration < AUDIO_DURATIONS.IDENTITY_RECORDING
                          ? `${AUDIO_DURATIONS.IDENTITY_RECORDING - recordingDuration}s until minimum`
                          : 'Minimum reached - tap stop when ready'}
                      </p>
                    </div>
                    <Progress value={Math.min(recordingProgress, 100)} className="h-2 bg-mi-navy [&>div]:bg-mi-cyan" />
                  </div>
                )}

                {/* Recording Complete */}
                {hasRecording && !isRecording && (
                  <Alert className="bg-mi-cyan/20 border-mi-cyan">
                    <Check className="h-4 w-4 text-mi-cyan" />
                    <AlertDescription className="text-mi-cyan">
                      Recording complete and ready to submit
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Instructions */}
              {!isRecording && !hasRecording && (
                <div className="bg-mi-navy rounded-lg p-4 space-y-2 border border-mi-cyan/10">
                  <p className="text-sm font-medium text-white">Tips for a powerful recording:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Stand up straight and take a deep breath</li>
                    <li>• Speak clearly and with conviction</li>
                    <li>• Really feel the words as you say them</li>
                    <li>• Minimum {AUDIO_DURATIONS.IDENTITY_RECORDING} seconds for full points</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full mi-btn-primary"
            onClick={handleComplete}
            disabled={!canComplete}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Practice...
              </>
            ) : (
              'Complete Practice'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}