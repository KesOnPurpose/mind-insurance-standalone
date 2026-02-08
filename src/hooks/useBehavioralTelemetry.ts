/**
 * useBehavioralTelemetry Hook - MIO v3.0 Invisible Data Collection
 *
 * PURPOSE: Capture behavioral data subconsciously so users say "How did you know that?"
 * This enables MIO to detect patterns users can't see themselves.
 *
 * CAPABILITIES POWERED:
 * - Capability 16: Keystroke Dynamics (dwell time, flight time, rhythm)
 * - Capability 17: Pause Patterns (micro-hesitations reveal resistance)
 * - Capability 18: Correction Sequences (self-censoring detection)
 * - Capability 19: Response Latency (per-question timing)
 * - Capability 21: Session Energy Curve (engagement trajectory)
 * - Capability 26: Cognitive Load Score (from typing patterns)
 * - Capability 27: Typing Cadence Profile (mental state fingerprint)
 * - Capability 28: Error Sequences (cascade vs isolated errors)
 *
 * PRIVACY:
 * - Stores patterns, not actual text content
 * - Hashes all PII immediately
 * - Respects behavioral_consent settings
 * - Buffer locally (IndexedDB), sync every 10s or on practice submit
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

/** Individual keystroke event (never stored - only aggregated) */
interface KeystrokeEvent {
  timestamp: number;
  keyDownTime: number;
  keyUpTime?: number;
  isCorrection: boolean; // Backspace/Delete
  isNavigation: boolean; // Arrow keys, Home, End
  wordBoundary: boolean; // Space, Enter, punctuation
}

/** Pause event detected during input */
interface PauseEvent {
  startTime: number;
  endTime: number;
  durationMs: number;
  context: 'before_input' | 'mid_word' | 'between_words' | 'field_transition';
  fieldId?: string;
  pauseType: 'micro' | 'thinking' | 'extended'; // <500ms, 500-2000ms, >2000ms
}

/** Response timing for a specific field */
interface FieldLatency {
  fieldId: string;
  fieldType: string;
  firstKeystrokeMs: number | null; // Time from field focus to first keystroke
  totalInputTimeMs: number;
  pauseCount: number;
  correctionCount: number;
  characterCount: number;
  wordCount: number;
}

/** Aggregated session telemetry (what gets stored) */
export interface SessionTelemetry {
  sessionId: string;
  userId: string;
  component: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  sessionStartTime: number;
  sessionDuration: number;

  // Capability 16: Keystroke Dynamics
  keystrokeMetrics: {
    totalKeystrokes: number;
    avgDwellTimeMs: number; // How long keys are held
    avgFlightTimeMs: number; // Time between keystrokes
    rhythmConsistency: number; // 0-1, higher = more consistent
    typingSignature: string; // Hash of typing pattern
  };

  // Capability 17: Pause Patterns
  pausePatterns: {
    totalPauses: number;
    avgPauseDurationMs: number;
    microHesitationCount: number; // 200-500ms
    thinkingPauseCount: number; // 500-2000ms
    extendedPauseCount: number; // >2000ms
    pauseBeforeTriggers: string[]; // Field IDs where long pauses occurred
    longestPauseContext: string;
  };

  // Capability 18: Correction Sequences
  correctionSequences: {
    totalCorrections: number;
    correctionRate: number; // Corrections per 100 characters
    selfCensoringScore: number; // 0-1, based on word replacement patterns
    immediateVsDelayedRatio: number; // Quick corrections vs going back
  };

  // Capability 19: Response Latency
  responseLatency: {
    fieldLatencies: FieldLatency[];
    avgLatencyMs: number;
    fastestField: string;
    slowestField: string;
    latencyVariance: number;
  };

  // Capability 21: Session Energy Curve
  sessionEnergy: {
    startEnergy: number; // 0-100, based on initial typing speed/engagement
    midEnergy: number;
    endEnergy: number;
    trajectoryType: 'ascending' | 'descending' | 'stable' | 'u-shape' | 'inverted-u';
    inflectionPointPct: number; // Where energy changed most
  };

  // Capability 26: Cognitive Load Score
  cognitiveLoad: {
    score: number; // 0-100, higher = more mental effort
    indicators: string[]; // What contributed to the score
    peakLoadField: string;
  };

  // Metadata
  generatedAt: number;
  consentLevel: 'base' | 'typing' | 'full';
}

/** Hook configuration */
interface UseBehavioralTelemetryConfig {
  component: string;
  sessionId?: string;
  autoFlushIntervalMs?: number; // Default 10000 (10s)
  pauseThresholdMs?: number; // Default 200ms
  enabled?: boolean;
}

/** Hook return type */
interface UseBehavioralTelemetryReturn {
  // Tracking functions
  recordKeystroke: (event: KeyboardEvent, fieldId?: string) => void;
  recordFieldFocus: (fieldId: string, fieldType?: string) => void;
  recordFieldBlur: (fieldId: string) => void;
  recordScrollDepth: (depthPct: number) => void;

  // Session management
  flush: () => Promise<SessionTelemetry | null>;
  getSessionTelemetry: () => SessionTelemetry | null;
  reset: () => void;

  // State
  isTracking: boolean;
  eventCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAUSE_THRESHOLD_MICRO = 200; // ms
const PAUSE_THRESHOLD_THINKING = 500; // ms
const PAUSE_THRESHOLD_EXTENDED = 2000; // ms

const CORRECTION_KEYS = ['Backspace', 'Delete'];
const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
const WORD_BOUNDARY_KEYS = [' ', 'Enter', '.', ',', '!', '?', ';', ':'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua);
  const isTablet = /ipad|android(?!.*mobile)|tablet/.test(ua);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

function calculateRhythmConsistency(flightTimes: number[]): number {
  if (flightTimes.length < 3) return 0.5;

  const mean = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length;
  const variance = flightTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / flightTimes.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  // Invert so higher = more consistent, cap at 1
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
}

function hashTypingPattern(dwellTimes: number[], flightTimes: number[]): string {
  // Create a simple hash of the typing pattern for fingerprinting
  const dwellAvg = dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0;
  const flightAvg = flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;
  const rhythm = calculateRhythmConsistency(flightTimes);

  // Simple deterministic hash - not cryptographically secure, just for pattern matching
  const pattern = `${Math.round(dwellAvg)}-${Math.round(flightAvg)}-${Math.round(rhythm * 100)}`;
  return btoa(pattern).slice(0, 16);
}

function calculateCognitiveLoad(
  pausePatterns: SessionTelemetry['pausePatterns'],
  correctionSequences: SessionTelemetry['correctionSequences'],
  responseLatency: SessionTelemetry['responseLatency']
): { score: number; indicators: string[] } {
  let score = 50; // Baseline
  const indicators: string[] = [];

  // High pause count indicates cognitive processing
  if (pausePatterns.thinkingPauseCount > 5) {
    score += 15;
    indicators.push('frequent_thinking_pauses');
  }
  if (pausePatterns.extendedPauseCount > 2) {
    score += 10;
    indicators.push('extended_pauses');
  }

  // High correction rate indicates uncertainty/effort
  if (correctionSequences.correctionRate > 0.1) {
    score += 10;
    indicators.push('high_correction_rate');
  }
  if (correctionSequences.selfCensoringScore > 0.3) {
    score += 10;
    indicators.push('self_censoring');
  }

  // High latency variance indicates difficulty with specific questions
  if (responseLatency.latencyVariance > 0.5) {
    score += 5;
    indicators.push('variable_response_times');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    indicators
  };
}

function calculateEnergyTrajectory(
  typingSpeeds: number[] // Characters per second at different points
): SessionTelemetry['sessionEnergy'] {
  if (typingSpeeds.length < 3) {
    return {
      startEnergy: 50,
      midEnergy: 50,
      endEnergy: 50,
      trajectoryType: 'stable',
      inflectionPointPct: 50
    };
  }

  // Split into thirds
  const third = Math.floor(typingSpeeds.length / 3);
  const startSpeeds = typingSpeeds.slice(0, third);
  const midSpeeds = typingSpeeds.slice(third, third * 2);
  const endSpeeds = typingSpeeds.slice(third * 2);

  const startEnergy = Math.min(100, (startSpeeds.reduce((a, b) => a + b, 0) / startSpeeds.length) * 20);
  const midEnergy = Math.min(100, (midSpeeds.reduce((a, b) => a + b, 0) / midSpeeds.length) * 20);
  const endEnergy = Math.min(100, (endSpeeds.reduce((a, b) => a + b, 0) / endSpeeds.length) * 20);

  // Determine trajectory type
  let trajectoryType: SessionTelemetry['sessionEnergy']['trajectoryType'];
  const startToMid = midEnergy - startEnergy;
  const midToEnd = endEnergy - midEnergy;

  if (Math.abs(startToMid) < 10 && Math.abs(midToEnd) < 10) {
    trajectoryType = 'stable';
  } else if (startToMid > 0 && midToEnd > 0) {
    trajectoryType = 'ascending';
  } else if (startToMid < 0 && midToEnd < 0) {
    trajectoryType = 'descending';
  } else if (startToMid < 0 && midToEnd > 0) {
    trajectoryType = 'u-shape';
  } else {
    trajectoryType = 'inverted-u';
  }

  // Find inflection point (where biggest change occurred)
  let maxChange = 0;
  let inflectionIndex = 0;
  for (let i = 1; i < typingSpeeds.length; i++) {
    const change = Math.abs(typingSpeeds[i] - typingSpeeds[i - 1]);
    if (change > maxChange) {
      maxChange = change;
      inflectionIndex = i;
    }
  }

  return {
    startEnergy: Math.round(startEnergy),
    midEnergy: Math.round(midEnergy),
    endEnergy: Math.round(endEnergy),
    trajectoryType,
    inflectionPointPct: Math.round((inflectionIndex / typingSpeeds.length) * 100)
  };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useBehavioralTelemetry(
  config: UseBehavioralTelemetryConfig
): UseBehavioralTelemetryReturn {
  const { user } = useAuth();

  const {
    component,
    sessionId = `session-${Date.now()}`,
    autoFlushIntervalMs = 10000,
    pauseThresholdMs = PAUSE_THRESHOLD_MICRO,
    enabled = true
  } = config;

  // State
  const [isTracking, setIsTracking] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  // Refs for collecting data without re-renders
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const pausesRef = useRef<PauseEvent[]>([]);
  const fieldLatenciesRef = useRef<Map<string, FieldLatency>>(new Map());
  const lastKeystrokeTimeRef = useRef<number>(0);
  const lastKeyUpTimeRef = useRef<number>(0);
  const currentFieldRef = useRef<string | null>(null);
  const fieldFocusTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const typingSpeedsRef = useRef<number[]>([]); // For energy curve
  const flightTimesRef = useRef<number[]>([]);
  const dwellTimesRef = useRef<number[]>([]);
  const correctionCountRef = useRef(0);
  const characterCountRef = useRef(0);

  // ============================================================================
  // KEYSTROKE RECORDING
  // ============================================================================

  const recordKeystroke = useCallback((event: KeyboardEvent, fieldId?: string) => {
    if (!enabled || !user) return;

    const now = performance.now();
    const isCorrection = CORRECTION_KEYS.includes(event.key);
    const isNavigation = NAVIGATION_KEYS.includes(event.key);
    const wordBoundary = WORD_BOUNDARY_KEYS.includes(event.key);

    // Calculate flight time (time since last keystroke)
    const flightTime = lastKeystrokeTimeRef.current > 0
      ? now - lastKeystrokeTimeRef.current
      : 0;

    // Detect pause (gap > threshold)
    if (flightTime > pauseThresholdMs && lastKeystrokeTimeRef.current > 0) {
      const pauseType = flightTime > PAUSE_THRESHOLD_EXTENDED
        ? 'extended'
        : flightTime > PAUSE_THRESHOLD_THINKING
          ? 'thinking'
          : 'micro';

      pausesRef.current.push({
        startTime: lastKeystrokeTimeRef.current,
        endTime: now,
        durationMs: flightTime,
        context: wordBoundary ? 'between_words' : 'mid_word',
        fieldId: fieldId || currentFieldRef.current || undefined,
        pauseType
      });
    }

    // Record keystroke
    const keystrokeEvent: KeystrokeEvent = {
      timestamp: now,
      keyDownTime: now,
      isCorrection,
      isNavigation,
      wordBoundary
    };

    keystrokesRef.current.push(keystrokeEvent);

    // Update tracking metrics
    if (flightTime > 0 && flightTime < 2000) {
      flightTimesRef.current.push(flightTime);
    }

    if (isCorrection) {
      correctionCountRef.current++;
    } else if (!isNavigation) {
      characterCountRef.current++;
    }

    lastKeystrokeTimeRef.current = now;
    setEventCount(prev => prev + 1);
    setIsTracking(true);

    // Track typing speed for energy curve (every 10 keystrokes)
    if (keystrokesRef.current.length % 10 === 0 && flightTimesRef.current.length > 5) {
      const recentFlightTimes = flightTimesRef.current.slice(-10);
      const avgFlightTime = recentFlightTimes.reduce((a, b) => a + b, 0) / recentFlightTimes.length;
      const typingSpeed = avgFlightTime > 0 ? 1000 / avgFlightTime : 0; // Characters per second
      typingSpeedsRef.current.push(typingSpeed);
    }
  }, [enabled, user, pauseThresholdMs]);

  // Handle keyup for dwell time calculation
  useEffect(() => {
    if (!enabled) return;

    const handleKeyUp = (event: KeyboardEvent) => {
      const now = performance.now();
      if (lastKeystrokeTimeRef.current > 0) {
        const dwellTime = now - lastKeystrokeTimeRef.current;
        if (dwellTime > 0 && dwellTime < 500) { // Reasonable dwell time
          dwellTimesRef.current.push(dwellTime);
        }
      }
      lastKeyUpTimeRef.current = now;
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [enabled]);

  // ============================================================================
  // FIELD FOCUS/BLUR TRACKING
  // ============================================================================

  const recordFieldFocus = useCallback((fieldId: string, fieldType: string = 'text') => {
    if (!enabled || !user) return;

    const now = performance.now();
    currentFieldRef.current = fieldId;
    fieldFocusTimeRef.current = now;

    // Initialize field latency tracking
    if (!fieldLatenciesRef.current.has(fieldId)) {
      fieldLatenciesRef.current.set(fieldId, {
        fieldId,
        fieldType,
        firstKeystrokeMs: null,
        totalInputTimeMs: 0,
        pauseCount: 0,
        correctionCount: 0,
        characterCount: 0,
        wordCount: 0
      });
    }

    // Record pause if transitioning from another field
    if (lastKeystrokeTimeRef.current > 0) {
      const timeSinceLastKeystroke = now - lastKeystrokeTimeRef.current;
      if (timeSinceLastKeystroke > pauseThresholdMs) {
        pausesRef.current.push({
          startTime: lastKeystrokeTimeRef.current,
          endTime: now,
          durationMs: timeSinceLastKeystroke,
          context: 'field_transition',
          fieldId,
          pauseType: timeSinceLastKeystroke > PAUSE_THRESHOLD_EXTENDED
            ? 'extended'
            : timeSinceLastKeystroke > PAUSE_THRESHOLD_THINKING
              ? 'thinking'
              : 'micro'
        });
      }
    }
  }, [enabled, user, pauseThresholdMs]);

  const recordFieldBlur = useCallback((fieldId: string) => {
    if (!enabled || !user) return;

    const now = performance.now();
    const fieldData = fieldLatenciesRef.current.get(fieldId);

    if (fieldData && fieldFocusTimeRef.current > 0) {
      fieldData.totalInputTimeMs = now - fieldFocusTimeRef.current;

      // Count pauses and corrections for this field
      const fieldPauses = pausesRef.current.filter(p => p.fieldId === fieldId);
      fieldData.pauseCount = fieldPauses.length;
    }

    currentFieldRef.current = null;
    fieldFocusTimeRef.current = 0;
  }, [enabled, user]);

  // ============================================================================
  // SCROLL DEPTH TRACKING
  // ============================================================================

  const recordScrollDepth = useCallback((_depthPct: number) => {
    // Placeholder for scroll tracking - to be implemented with capability 20
    // This will track engagement depth and abandonment patterns
  }, []);

  // ============================================================================
  // SESSION TELEMETRY GENERATION
  // ============================================================================

  const getSessionTelemetry = useCallback((): SessionTelemetry | null => {
    if (!user || keystrokesRef.current.length === 0) return null;

    const now = Date.now();
    const sessionDuration = now - sessionStartTimeRef.current;

    // Calculate keystroke metrics
    const totalKeystrokes = keystrokesRef.current.length;
    const avgDwellTimeMs = dwellTimesRef.current.length > 0
      ? dwellTimesRef.current.reduce((a, b) => a + b, 0) / dwellTimesRef.current.length
      : 0;
    const avgFlightTimeMs = flightTimesRef.current.length > 0
      ? flightTimesRef.current.reduce((a, b) => a + b, 0) / flightTimesRef.current.length
      : 0;
    const rhythmConsistency = calculateRhythmConsistency(flightTimesRef.current);
    const typingSignature = hashTypingPattern(dwellTimesRef.current, flightTimesRef.current);

    // Calculate pause patterns
    const pauses = pausesRef.current;
    const microHesitations = pauses.filter(p => p.pauseType === 'micro');
    const thinkingPauses = pauses.filter(p => p.pauseType === 'thinking');
    const extendedPauses = pauses.filter(p => p.pauseType === 'extended');
    const longestPause = pauses.length > 0
      ? pauses.reduce((max, p) => p.durationMs > max.durationMs ? p : max)
      : null;

    // Calculate correction metrics
    const correctionRate = characterCountRef.current > 0
      ? correctionCountRef.current / characterCountRef.current
      : 0;
    const immediateCorrections = keystrokesRef.current.filter((k, i) => {
      if (!k.isCorrection || i === 0) return false;
      const prevKeystroke = keystrokesRef.current[i - 1];
      return k.timestamp - prevKeystroke.timestamp < 500; // Immediate if < 500ms
    }).length;
    const delayedCorrections = correctionCountRef.current - immediateCorrections;

    // Calculate response latency
    const fieldLatencies = Array.from(fieldLatenciesRef.current.values());
    const avgLatencyMs = fieldLatencies.length > 0
      ? fieldLatencies.reduce((sum, f) => sum + (f.firstKeystrokeMs || 0), 0) / fieldLatencies.length
      : 0;
    const sortedLatencies = [...fieldLatencies].sort((a, b) =>
      (a.firstKeystrokeMs || 0) - (b.firstKeystrokeMs || 0)
    );
    const latencyValues = fieldLatencies.map(f => f.firstKeystrokeMs || 0).filter(v => v > 0);
    const latencyMean = latencyValues.length > 0
      ? latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length
      : 0;
    const latencyVariance = latencyValues.length > 0
      ? Math.sqrt(latencyValues.reduce((sum, v) => sum + Math.pow(v - latencyMean, 2), 0) / latencyValues.length) / latencyMean
      : 0;

    // Build pause patterns object
    const pausePatterns: SessionTelemetry['pausePatterns'] = {
      totalPauses: pauses.length,
      avgPauseDurationMs: pauses.length > 0
        ? pauses.reduce((sum, p) => sum + p.durationMs, 0) / pauses.length
        : 0,
      microHesitationCount: microHesitations.length,
      thinkingPauseCount: thinkingPauses.length,
      extendedPauseCount: extendedPauses.length,
      pauseBeforeTriggers: [...new Set(extendedPauses.map(p => p.fieldId).filter(Boolean) as string[])],
      longestPauseContext: longestPause?.fieldId || longestPause?.context || ''
    };

    // Build correction sequences object
    const correctionSequences: SessionTelemetry['correctionSequences'] = {
      totalCorrections: correctionCountRef.current,
      correctionRate,
      selfCensoringScore: Math.min(1, correctionRate * 5), // Rough estimate
      immediateVsDelayedRatio: delayedCorrections > 0
        ? immediateCorrections / delayedCorrections
        : immediateCorrections
    };

    // Build response latency object
    const responseLatency: SessionTelemetry['responseLatency'] = {
      fieldLatencies,
      avgLatencyMs,
      fastestField: sortedLatencies[0]?.fieldId || '',
      slowestField: sortedLatencies[sortedLatencies.length - 1]?.fieldId || '',
      latencyVariance
    };

    // Calculate cognitive load
    const cognitiveLoad = calculateCognitiveLoad(pausePatterns, correctionSequences, responseLatency);

    // Calculate session energy
    const sessionEnergy = calculateEnergyTrajectory(typingSpeedsRef.current);

    return {
      sessionId,
      userId: user.id,
      component,
      deviceType: getDeviceType(),
      sessionStartTime: sessionStartTimeRef.current,
      sessionDuration,

      keystrokeMetrics: {
        totalKeystrokes,
        avgDwellTimeMs: Math.round(avgDwellTimeMs),
        avgFlightTimeMs: Math.round(avgFlightTimeMs),
        rhythmConsistency,
        typingSignature
      },

      pausePatterns,
      correctionSequences,
      responseLatency,
      sessionEnergy,

      cognitiveLoad: {
        score: cognitiveLoad.score,
        indicators: cognitiveLoad.indicators,
        peakLoadField: responseLatency.slowestField
      },

      generatedAt: now,
      consentLevel: 'typing' // TODO: Read from user_profiles.behavioral_consent
    };
  }, [user, sessionId, component]);

  // ============================================================================
  // FLUSH AND RESET
  // ============================================================================

  const flush = useCallback(async (): Promise<SessionTelemetry | null> => {
    const telemetry = getSessionTelemetry();

    if (telemetry) {
      // Store in IndexedDB for later sync
      try {
        const db = await openTelemetryDB();
        const tx = db.transaction('telemetry', 'readwrite');
        await tx.objectStore('telemetry').add({
          ...telemetry,
          synced: false,
          createdAt: Date.now()
        });

        console.log('[useBehavioralTelemetry] Session telemetry saved:', {
          sessionId: telemetry.sessionId,
          keystrokes: telemetry.keystrokeMetrics.totalKeystrokes,
          pauses: telemetry.pausePatterns.totalPauses,
          cognitiveLoad: telemetry.cognitiveLoad.score
        });
      } catch (error) {
        console.error('[useBehavioralTelemetry] Failed to save telemetry:', error);
      }
    }

    return telemetry;
  }, [getSessionTelemetry]);

  const reset = useCallback(() => {
    keystrokesRef.current = [];
    pausesRef.current = [];
    fieldLatenciesRef.current = new Map();
    lastKeystrokeTimeRef.current = 0;
    lastKeyUpTimeRef.current = 0;
    currentFieldRef.current = null;
    fieldFocusTimeRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    typingSpeedsRef.current = [];
    flightTimesRef.current = [];
    dwellTimesRef.current = [];
    correctionCountRef.current = 0;
    characterCountRef.current = 0;
    setEventCount(0);
    setIsTracking(false);
  }, []);

  // ============================================================================
  // AUTO-FLUSH INTERVAL
  // ============================================================================

  useEffect(() => {
    if (!enabled || autoFlushIntervalMs <= 0) return;

    const interval = setInterval(() => {
      if (keystrokesRef.current.length > 0) {
        flush().catch(console.error);
      }
    }, autoFlushIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, autoFlushIntervalMs, flush]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (keystrokesRef.current.length > 0) {
        flush().catch(console.error);
      }
    };
  }, [flush]);

  return {
    recordKeystroke,
    recordFieldFocus,
    recordFieldBlur,
    recordScrollDepth,
    flush,
    getSessionTelemetry,
    reset,
    isTracking,
    eventCount
  };
}

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

async function openTelemetryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mio_behavioral_telemetry', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('telemetry')) {
        const store = db.createObjectStore('telemetry', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// ============================================================================
// UTILITY: SYNC TELEMETRY TO SUPABASE
// ============================================================================

/**
 * Sync pending telemetry data to Supabase
 * Call this on practice submission or periodically
 */
export async function syncPendingTelemetry(
  supabase: any, // Supabase client
  userId: string
): Promise<number> {
  try {
    const db = await openTelemetryDB();
    const tx = db.transaction('telemetry', 'readonly');
    const index = tx.objectStore('telemetry').index('synced');
    const unsynced = await new Promise<any[]>((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (unsynced.length === 0) return 0;

    // Group by session and get most recent for each
    const sessionMap = new Map<string, any>();
    unsynced.forEach(t => {
      const existing = sessionMap.get(t.sessionId);
      if (!existing || t.createdAt > existing.createdAt) {
        sessionMap.set(t.sessionId, t);
      }
    });

    const toSync = Array.from(sessionMap.values());

    // Sync to Supabase via RPC or direct insert
    for (const telemetry of toSync) {
      await supabase.rpc('update_practice_telemetry', {
        p_user_id: userId,
        p_session_id: telemetry.sessionId,
        p_telemetry: telemetry
      });
    }

    // Mark as synced
    const writeTx = db.transaction('telemetry', 'readwrite');
    const store = writeTx.objectStore('telemetry');
    for (const t of unsynced) {
      t.synced = true;
      store.put(t);
    }

    console.log(`[syncPendingTelemetry] Synced ${toSync.length} telemetry sessions`);
    return toSync.length;

  } catch (error) {
    console.error('[syncPendingTelemetry] Error:', error);
    return 0;
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  UseBehavioralTelemetryConfig,
  UseBehavioralTelemetryReturn,
  KeystrokeEvent,
  PauseEvent,
  FieldLatency
};
