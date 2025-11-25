import React from 'react';

interface VoiceActivityIndicatorProps {
  isRecording: boolean;
  volume?: number; // 0-1 range representing voice volume
  children: React.ReactNode;
}

export const VoiceActivityIndicator = ({
  isRecording,
  volume = 0,
  children
}: VoiceActivityIndicatorProps) => {
  // Scale volume to create dynamic ring sizes
  // Base size + volume-based expansion
  const outerScale = 1 + (volume * 0.5); // 1.0 to 1.5x
  const middleScale = 1 + (volume * 0.3); // 1.0 to 1.3x

  // Opacity also responds to volume
  const outerOpacity = 0.15 + (volume * 0.15); // 0.15 to 0.30
  const middleOpacity = 0.25 + (volume * 0.15); // 0.25 to 0.40

  return (
    <div className="relative inline-flex items-center justify-center">
      {isRecording && (
        <>
          {/* Outer ring - scales with volume */}
          <span
            className="absolute h-40 w-40 rounded-full bg-primary transition-all duration-75 ease-out motion-reduce:opacity-40"
            style={{
              opacity: outerOpacity,
              transform: `scale(${outerScale})`,
            }}
            aria-hidden="true"
          />

          {/* Middle ring - scales with volume */}
          <span
            className="absolute h-36 w-36 rounded-full bg-primary transition-all duration-75 ease-out motion-reduce:opacity-40"
            style={{
              opacity: middleOpacity,
              transform: `scale(${middleScale})`,
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Button content - always rendered on top */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
