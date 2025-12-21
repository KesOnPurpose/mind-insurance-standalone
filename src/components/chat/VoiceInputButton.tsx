/**
 * Voice Input Button Component
 *
 * Adds speech-to-text capability to chat inputs using the Web Speech API.
 *
 * Features:
 * - Real-time speech recognition (Chrome/Edge)
 * - Visual feedback during recording
 * - Auto-stops after silence
 * - Fallback message for unsupported browsers
 *
 * Cost: $0 - Uses browser's built-in Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onTranscriptUpdate?: (text: string) => void; // Real-time updates
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'mi'; // Mind Insurance styling
}

export function VoiceInputButton({
  onTranscript,
  onTranscriptUpdate,
  disabled = false,
  className,
  variant = 'default'
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.log('[Voice] Web Speech API not supported in this browser');
    }
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Get real-time results
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
      finalTranscriptRef.current = '';
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update final transcript
      if (final) {
        finalTranscriptRef.current += final;
      }

      // Show real-time feedback
      const fullTranscript = finalTranscriptRef.current + interim;
      setInterimTranscript(fullTranscript);

      // Call update callback for real-time display
      if (onTranscriptUpdate && fullTranscript) {
        onTranscriptUpdate(fullTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Voice] Recognition error:', event.error);

      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please enable in browser settings.');
          break;
        case 'no-speech':
          // This is common, just stop gracefully
          break;
        case 'network':
          setError('Network error. Speech recognition requires internet.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);

      // Send final transcript if we have one
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        onTranscript(finalText);
      }

      setInterimTranscript('');
    };

    return recognition;
  }, [onTranscript, onTranscriptUpdate]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      // Stop listening
      recognitionRef.current.stop();
    } else {
      // Start listening
      setError(null);
      const recognition = initRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (err) {
          console.error('[Voice] Failed to start recognition:', err);
          setError('Failed to start voice recognition');
        }
      }
    }
  }, [isListening, initRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Not supported - show tooltip explaining why
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              className={cn(
                "opacity-50 cursor-not-allowed",
                className
              )}
            >
              <MicOff className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input requires Chrome or Edge browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setError(null)}
              className={cn(
                "text-red-500 hover:text-red-600",
                className
              )}
            >
              <AlertCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const isMI = variant === 'mi';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            disabled={disabled}
            className={cn(
              "relative transition-all duration-200",
              isListening && [
                "text-red-500",
                isMI ? "bg-red-500/20 hover:bg-red-500/30" : "bg-red-100 hover:bg-red-200"
              ],
              !isListening && [
                isMI ? "text-gray-400 hover:text-[#05c3dd] hover:bg-[#05c3dd]/10" : "text-muted-foreground hover:text-foreground"
              ],
              className
            )}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                {/* Recording indicator ring */}
                <span className="absolute inset-0 rounded-md animate-ping bg-red-500/20" />
              </>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Stop recording' : 'Voice input'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default VoiceInputButton;
