/**
 * Voice Recording Service
 * Handles audio recording using Web Audio API and Supabase storage
 */

import { supabase } from '@/integrations/supabase/client';
import type { VoiceRecording } from '@/types/practices';

/**
 * Interface for audio recording data
 */
export interface AudioRecordingData {
  blob: Blob;
  duration: number;
  mimeType: string;
}

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudioToStorage(
  userId: string,
  audioBlob: Blob,
  fileName?: string
): Promise<{ publicUrl: string; path: string }> {
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const fileExt = audioBlob.type.includes('webm') ? 'webm' : 'mp3';
    const finalFileName = fileName || `${userId}_${timestamp}.${fileExt}`;
    const storagePath = `voice-recordings/${userId}/${finalFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, audioBlob, {
        contentType: audioBlob.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading audio:', error);
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(storagePath);

    return {
      publicUrl,
      path: storagePath
    };
  } catch (error) {
    console.error('Failed to upload audio to storage:', error);
    throw error;
  }
}

/**
 * Save voice recording metadata to database
 */
export async function saveVoiceRecording(
  userId: string,
  recordingUrl: string,
  duration: number,
  practiceId?: string,
  recordingType: 'identity' | 'celebration' | 'other' = 'identity'
): Promise<VoiceRecording> {
  try {
    const recordingData = {
      user_id: userId,
      practice_id: practiceId,
      recording_url: recordingUrl,
      recording_duration: duration,
      recording_type: recordingType,
      transcription_text: null // Will be populated by N8n webhook processing
    };

    const { data, error } = await supabase
      .from('voice_recordings')
      .insert(recordingData)
      .select()
      .single();

    if (error) {
      console.error('Error saving voice recording:', error);
      throw new Error(`Failed to save voice recording: ${error.message}`);
    }

    return data as VoiceRecording;
  } catch (error) {
    console.error('Failed to save voice recording:', error);
    throw error;
  }
}

/**
 * Send audio to N8n webhook for transcription
 */
export async function sendAudioForTranscription(
  audioBlob: Blob,
  userId: string,
  recordingId: string
): Promise<void> {
  try {
    const N8N_WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/audioreceiver';

    // Create FormData for multipart upload
    const formData = new FormData();
    const fileName = `${Date.now()}.${audioBlob.type.includes('webm') ? 'webm' : 'mp3'}`;

    formData.append('audio', audioBlob, fileName);
    formData.append('user_id', userId);
    formData.append('recording_id', recordingId);

    // Send to N8n webhook (fire and forget - don't wait for response)
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData
    }).catch(error => {
      console.error('Error sending audio to N8n:', error);
      // Don't throw - this is non-blocking
    });
  } catch (error) {
    console.error('Failed to send audio for transcription:', error);
    // Don't throw - transcription is optional
  }
}

/**
 * Get user's voice recordings
 */
export async function getUserVoiceRecordings(
  userId: string,
  limit: number = 10
): Promise<VoiceRecording[]> {
  try {
    const { data, error } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching voice recordings:', error);
      throw error;
    }

    return (data as VoiceRecording[]) || [];
  } catch (error) {
    console.error('Failed to get user voice recordings:', error);
    throw error;
  }
}

/**
 * Delete a voice recording (both storage and database)
 */
export async function deleteVoiceRecording(
  recordingId: string,
  storagePath?: string
): Promise<void> {
  try {
    // Delete from database
    const { error: dbError } = await supabase
      .from('voice_recordings')
      .delete()
      .eq('id', recordingId);

    if (dbError) {
      console.error('Error deleting voice recording from database:', dbError);
      throw dbError;
    }

    // Delete from storage if path provided
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('voice-recordings')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting voice recording from storage:', storageError);
        // Don't throw - file might already be deleted
      }
    }
  } catch (error) {
    console.error('Failed to delete voice recording:', error);
    throw error;
  }
}

/**
 * Audio Recorder Class using Web Audio API
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private recordingPromise: Promise<AudioRecordingData> | null = null;
  private resolveRecording: ((data: AudioRecordingData) => void) | null = null;

  // Web Audio API for volume analysis
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private volumeCallback: ((volume: number) => void) | null = null;
  private animationFrameId: number | null = null;

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (!this.stream) {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }
    }

    if (!this.stream) {
      throw new Error('No audio stream available');
    }

    // Reset state
    this.audioChunks = [];
    this.startTime = Date.now();

    // Create MediaRecorder with preferred mime type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp3';

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    // Set up promise for recording completion
    this.recordingPromise = new Promise((resolve) => {
      this.resolveRecording = resolve;
    });

    // Handle data available event
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Handle stop event
    this.mediaRecorder.onstop = () => {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      if (this.resolveRecording) {
        this.resolveRecording({
          blob: audioBlob,
          duration,
          mimeType
        });
      }
    };

    // Start recording
    this.mediaRecorder.start(1000); // Collect data every second

    // Set up volume analysis
    this.setupAudioAnalysis();
  }

  /**
   * Set up Web Audio API for real-time volume analysis
   */
  private setupAudioAnalysis(): void {
    if (!this.stream) return;

    try {
      // Create audio context
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      // Connect source to analyser (don't connect to destination - we don't want playback)
      this.sourceNode.connect(this.analyserNode);

      // Start monitoring volume
      this.monitorVolume();
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  }

  /**
   * Monitor volume levels continuously
   */
  private monitorVolume(): void {
    if (!this.analyserNode) return;

    const dataArray = new Float32Array(this.analyserNode.fftSize);

    const analyzeFrame = () => {
      if (!this.analyserNode || !this.isRecording()) {
        return; // Stop if recording stopped
      }

      // Get time-domain audio data
      this.analyserNode.getFloatTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) volume
      let sumSquares = 0.0;
      for (const amplitude of dataArray) {
        sumSquares += amplitude * amplitude;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);

      // Normalize to 0-1 range (RMS typically 0-0.5, so we multiply by 2)
      const normalizedVolume = Math.min(rms * 2, 1);

      // Call volume callback if set
      if (this.volumeCallback) {
        this.volumeCallback(normalizedVolume);
      }

      // Continue monitoring
      this.animationFrameId = requestAnimationFrame(analyzeFrame);
    };

    analyzeFrame();
  }

  /**
   * Set callback for volume updates (called ~60 times per second)
   */
  setVolumeCallback(callback: (volume: number) => void): void {
    this.volumeCallback = callback;
  }

  /**
   * Stop recording and return the audio data
   */
  async stopRecording(): Promise<AudioRecordingData> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      throw new Error('No active recording');
    }

    this.mediaRecorder.stop();

    // Wait for recording to be processed
    if (!this.recordingPromise) {
      throw new Error('Recording promise not initialized');
    }

    return this.recordingPromise;
  }

  /**
   * Get current recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.startTime || !this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return 0;
    }
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' ?? false;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Stop animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Existing cleanup
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingPromise = null;
    this.resolveRecording = null;
    this.volumeCallback = null;
  }
}