/**
 * FEAT-GH-TOUR: Tour Audio Service
 *
 * ElevenLabs Text-to-Speech integration for Nette's voice
 * during the onboarding tour. Handles audio generation,
 * playback, and caching.
 */

// ============================================
// Configuration
// ============================================

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_VOICE_ID = 'pNktXBsZvF26ac8ZNMTF';
const ELEVENLABS_API_KEY = '8053413d3db0a4d80b7432159b48cbd843f29ab8548d4942d62636952666fdd6';

// Voice settings for Nette (warm, encouraging expert)
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.3,
  use_speaker_boost: true,
};

// ============================================
// Types
// ============================================

export interface AudioProgressCallback {
  (progress: number): void;
}

export interface AudioStateCallback {
  (isPlaying: boolean): void;
}

export interface TourAudioService {
  generateAndPlay: (
    text: string,
    onProgress?: AudioProgressCallback,
    onStateChange?: AudioStateCallback
  ) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isPlaying: () => boolean;
  getCurrentProgress: () => number;
  preloadAudio: (text: string) => Promise<void>;
  clearCache: () => void;
}

// ============================================
// Audio Cache
// ============================================

const audioCache = new Map<string, ArrayBuffer>();

/**
 * Generate a cache key from text
 */
function getCacheKey(text: string): string {
  return text.slice(0, 100).toLowerCase().replace(/\s+/g, '-');
}

// ============================================
// Audio State
// ============================================

let currentAudio: HTMLAudioElement | null = null;
let currentProgress = 0;
let isCurrentlyPlaying = false;
let progressInterval: ReturnType<typeof setInterval> | null = null;

// ============================================
// API Functions
// ============================================

/**
 * Generate speech from text using ElevenLabs API
 */
async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const cacheKey = getCacheKey(text);

  // Check cache first
  const cached = audioCache.get(cacheKey);
  if (cached) {
    console.log('[TourAudio] Using cached audio for:', cacheKey);
    return cached;
  }

  console.log('[TourAudio] Generating speech for:', text.slice(0, 50) + '...');

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TourAudio] ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();

    // Cache the audio
    audioCache.set(cacheKey, audioData);
    console.log('[TourAudio] Audio generated and cached:', cacheKey);

    return audioData;
  } catch (error) {
    console.error('[TourAudio] Failed to generate speech:', error);
    throw error;
  }
}

/**
 * Create an audio element from ArrayBuffer
 */
function createAudioFromBuffer(buffer: ArrayBuffer): HTMLAudioElement {
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  // Clean up URL when audio is done
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(url);
  });

  return audio;
}

/**
 * Start progress tracking
 */
function startProgressTracking(
  audio: HTMLAudioElement,
  onProgress?: AudioProgressCallback
): void {
  if (progressInterval) {
    clearInterval(progressInterval);
  }

  progressInterval = setInterval(() => {
    if (audio.duration && audio.currentTime) {
      currentProgress = (audio.currentTime / audio.duration) * 100;
      onProgress?.(currentProgress);
    }
  }, 100);
}

/**
 * Stop progress tracking
 */
function stopProgressTracking(): void {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// ============================================
// Public API
// ============================================

/**
 * Generate and play audio from text
 */
export async function generateAndPlay(
  text: string,
  onProgress?: AudioProgressCallback,
  onStateChange?: AudioStateCallback
): Promise<void> {
  // Stop any currently playing audio
  stop();

  try {
    const audioBuffer = await generateSpeech(text);
    const audio = createAudioFromBuffer(audioBuffer);

    currentAudio = audio;
    currentProgress = 0;

    // Set up event listeners
    audio.addEventListener('play', () => {
      isCurrentlyPlaying = true;
      onStateChange?.(true);
    });

    audio.addEventListener('pause', () => {
      isCurrentlyPlaying = false;
      onStateChange?.(false);
    });

    audio.addEventListener('ended', () => {
      isCurrentlyPlaying = false;
      currentProgress = 100;
      onProgress?.(100);
      onStateChange?.(false);
      stopProgressTracking();
    });

    audio.addEventListener('error', (e) => {
      console.error('[TourAudio] Audio playback error:', e);
      isCurrentlyPlaying = false;
      onStateChange?.(false);
      stopProgressTracking();
    });

    // Start progress tracking
    startProgressTracking(audio, onProgress);

    // Play the audio
    await audio.play();
  } catch (error) {
    console.error('[TourAudio] Error in generateAndPlay:', error);
    isCurrentlyPlaying = false;
    onStateChange?.(false);
    throw error;
  }
}

/**
 * Pause current audio
 */
export function pause(): void {
  if (currentAudio && isCurrentlyPlaying) {
    currentAudio.pause();
    stopProgressTracking();
  }
}

/**
 * Resume current audio
 */
export function resume(): void {
  if (currentAudio && !isCurrentlyPlaying) {
    currentAudio.play().catch((error) => {
      console.error('[TourAudio] Error resuming audio:', error);
    });
  }
}

/**
 * Stop current audio completely
 */
export function stop(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  isCurrentlyPlaying = false;
  currentProgress = 0;
  stopProgressTracking();
}

/**
 * Check if audio is currently playing
 */
export function isPlaying(): boolean {
  return isCurrentlyPlaying;
}

/**
 * Get current playback progress (0-100)
 */
export function getCurrentProgress(): number {
  return currentProgress;
}

/**
 * Preload audio for a text (generates and caches without playing)
 */
export async function preloadAudio(text: string): Promise<void> {
  try {
    await generateSpeech(text);
    console.log('[TourAudio] Audio preloaded:', getCacheKey(text));
  } catch (error) {
    console.error('[TourAudio] Failed to preload audio:', error);
    // Don't throw - preloading failure shouldn't break the tour
  }
}

/**
 * Clear the audio cache
 */
export function clearCache(): void {
  audioCache.clear();
  console.log('[TourAudio] Cache cleared');
}

// ============================================
// Export service object for convenient access
// ============================================

export const tourAudioService: TourAudioService = {
  generateAndPlay,
  pause,
  resume,
  stop,
  isPlaying,
  getCurrentProgress,
  preloadAudio,
  clearCache,
};

export default tourAudioService;
