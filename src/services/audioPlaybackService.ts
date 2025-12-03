/**
 * Centralized audio playback service for the Recording Vault
 * Ensures only one recording plays at a time across all components
 */

type PlaybackCallback = (recordingId: string | null) => void;
type TimeUpdateCallback = (currentTime: number, duration: number) => void;

class AudioPlaybackService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentRecordingId: string | null = null;
  private playbackCallbacks: Set<PlaybackCallback> = new Set();
  private timeUpdateCallbacks: Set<TimeUpdateCallback> = new Set();
  private endedCallbacks: Set<() => void> = new Set();

  /**
   * Play a recording. Stops any currently playing audio first.
   */
  play(url: string, recordingId: string): void {
    // Stop current playback if different recording
    if (this.currentRecordingId !== recordingId) {
      this.stop();
    }

    // Create new audio element if needed
    if (!this.currentAudio || this.currentRecordingId !== recordingId) {
      this.currentAudio = new Audio(url);
      this.currentRecordingId = recordingId;

      // Set up event listeners
      this.currentAudio.addEventListener('ended', () => {
        this.handleEnded();
      });

      this.currentAudio.addEventListener('timeupdate', () => {
        this.handleTimeUpdate();
      });

      this.currentAudio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        this.stop();
      });
    }

    // Play the audio
    this.currentAudio.play().catch((error) => {
      console.error('Error playing audio:', error);
    });

    // Notify subscribers
    this.notifyPlaybackChange();
  }

  /**
   * Pause the currently playing audio
   */
  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.notifyPlaybackChange();
    }
  }

  /**
   * Toggle play/pause for a specific recording
   */
  toggle(url: string, recordingId: string): void {
    if (this.currentRecordingId === recordingId && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch(console.error);
      } else {
        this.currentAudio.pause();
      }
      this.notifyPlaybackChange();
    } else {
      this.play(url, recordingId);
    }
  }

  /**
   * Stop playback and reset state
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentRecordingId = null;
    this.notifyPlaybackChange();
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime(): number {
    return this.currentAudio?.currentTime || 0;
  }

  /**
   * Get total duration in seconds
   */
  getDuration(): number {
    return this.currentAudio?.duration || 0;
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    if (this.currentAudio) {
      this.currentAudio.currentTime = Math.max(0, Math.min(time, this.getDuration()));
    }
  }

  /**
   * Check if a specific recording is currently playing
   */
  isPlaying(recordingId: string): boolean {
    return (
      this.currentRecordingId === recordingId &&
      this.currentAudio !== null &&
      !this.currentAudio.paused
    );
  }

  /**
   * Check if a specific recording is the current one (playing or paused)
   */
  isCurrent(recordingId: string): boolean {
    return this.currentRecordingId === recordingId;
  }

  /**
   * Get the currently playing recording ID
   */
  getCurrentRecordingId(): string | null {
    return this.currentRecordingId;
  }

  /**
   * Subscribe to playback state changes
   */
  onPlaybackChange(callback: PlaybackCallback): () => void {
    this.playbackCallbacks.add(callback);
    return () => this.playbackCallbacks.delete(callback);
  }

  /**
   * Subscribe to time updates
   */
  onTimeUpdate(callback: TimeUpdateCallback): () => void {
    this.timeUpdateCallbacks.add(callback);
    return () => this.timeUpdateCallbacks.delete(callback);
  }

  /**
   * Subscribe to playback ended events
   */
  onEnded(callback: () => void): () => void {
    this.endedCallbacks.add(callback);
    return () => this.endedCallbacks.delete(callback);
  }

  private notifyPlaybackChange(): void {
    this.playbackCallbacks.forEach((callback) => {
      callback(this.currentRecordingId);
    });
  }

  private handleTimeUpdate(): void {
    if (this.currentAudio) {
      this.timeUpdateCallbacks.forEach((callback) => {
        callback(this.currentAudio!.currentTime, this.currentAudio!.duration);
      });
    }
  }

  private handleEnded(): void {
    this.endedCallbacks.forEach((callback) => callback());
    this.currentRecordingId = null;
    this.notifyPlaybackChange();
  }
}

// Export singleton instance
export const audioPlaybackService = new AudioPlaybackService();
export default audioPlaybackService;
