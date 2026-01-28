// ============================================================================
// VOICE VISUALIZATION TYPES
// TypeScript interfaces for the Nette Voice Interface
// Grouphomes4newbies - "Gateway to Expert Guidance"
// ============================================================================

// Voice call states
export type VoiceCallState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'ended'
  | 'error';

// Waveform configuration
export interface WaveformConfig {
  segments: number;           // Points around circle (48)
  baseRadiusPercent: number;  // % of container (0.85)
  minAmplitude: number;       // px at volume 0 (2)
  maxAmplitude: number;       // px at volume 1 (12)
  primaryFrequency: number;   // Wave frequency (3)
  phaseSpeed: number;         // Animation speed (0.02)
  volumeLerpFactor: number;   // Smoothing factor (0.15)
}

// Device performance tiers
export type DeviceCapability = 'low' | 'medium' | 'high';

// Quantized volume for CSS performance (0-10)
export type VolumeLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Component props
export interface VoiceVisualizationProps {
  isActive: boolean;
  state: VoiceCallState;
  volume: number;             // 0-1 continuous
  children: React.ReactNode;  // Button in center
  className?: string;
}

export interface WaveformCanvasProps {
  isActive: boolean;
  volume: number;
  config?: Partial<WaveformConfig>;
  className?: string;
}

export interface GlowRingsProps {
  isActive: boolean;
  state: VoiceCallState;
  volumeLevel: VolumeLevel;
  className?: string;
}

// Call card topic types
export type CallTopic =
  | 'licensing'
  | 'property'
  | 'revenue'
  | 'staff'
  | 'regulations'
  | 'general'
  | 'business'
  | 'growth'
  | 'wins'
  | 'milestones';
