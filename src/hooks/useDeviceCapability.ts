// ============================================================================
// DEVICE CAPABILITY HOOK
// Detects device performance tier for adaptive visualization
// Adjusts animation complexity based on hardware capabilities
// ============================================================================

import { useState, useEffect } from 'react';
import type { DeviceCapability } from '@/types/voice-visualization';

interface DeviceCapabilityResult {
  capability: DeviceCapability;
  reducedMotion: boolean;
  isMobile: boolean;
  recommendedSegments: number;
  recommendedBlur: number;
}

export const useDeviceCapability = (): DeviceCapabilityResult => {
  const [result, setResult] = useState<DeviceCapabilityResult>({
    capability: 'medium',
    reducedMotion: false,
    isMobile: false,
    recommendedSegments: 48,
    recommendedBlur: 40
  });

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Determine device capability tier
    let capability: DeviceCapability = 'medium';
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;

    if (cores >= 8 && memory >= 8) {
      capability = 'high';
    } else if (cores <= 2 || memory <= 2 || isMobile) {
      capability = 'low';
    }

    // Reduced motion always forces low capability
    if (reducedMotion) {
      capability = 'low';
    }

    // Calculate recommended settings based on capability
    const recommendedSegments = capability === 'high' ? 64 : capability === 'medium' ? 48 : 24;
    const recommendedBlur = capability === 'high' ? 40 : capability === 'medium' ? 30 : 20;

    setResult({
      capability,
      reducedMotion,
      isMobile,
      recommendedSegments,
      recommendedBlur
    });

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResult(prev => ({
        ...prev,
        reducedMotion: e.matches,
        capability: e.matches ? 'low' : prev.capability
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return result;
};
