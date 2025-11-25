import React, { useMemo, useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GlossaryTooltipProps {
  text: string; // Protocol text with {{term||definition}} markup
  glossaryTerms?: string[]; // Optional: terms array from database
  onTooltipInteraction?: (term: string, action: 'hover' | 'click') => void;
}

interface ParsedSegment {
  type: 'text' | 'tooltip';
  content: string;
  term?: string;
  definition?: string;
  key: string;
}

export function GlossaryTooltip({
  text,
  glossaryTerms,
  onTooltipInteraction
}: GlossaryTooltipProps) {
  const [openTooltips, setOpenTooltips] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parse text to extract tooltip markup
  const parsedSegments = useMemo(() => {
    const tooltipRegex = /\{\{([^|]+)\|\|([^}]+)\}\}/g;
    const segments: ParsedSegment[] = [];
    let lastIndex = 0;
    let match;
    let segmentIndex = 0;

    while ((match = tooltipRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          key: `text-${segmentIndex++}`,
        });
      }

      // Add the tooltip segment
      segments.push({
        type: 'tooltip',
        content: match[1].trim(),
        term: match[1].trim(),
        definition: match[2].trim(),
        key: `tooltip-${segmentIndex++}`,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex),
        key: `text-${segmentIndex++}`,
      });
    }

    return segments;
  }, [text]);

  const handleTooltipOpen = (term: string, isOpen: boolean) => {
    if (isMobile) {
      // On mobile, manage open state manually
      setOpenTooltips(prev => {
        const newSet = new Set(prev);
        if (isOpen) {
          newSet.add(term);
        } else {
          newSet.delete(term);
        }
        return newSet;
      });
    }

    if (isOpen && onTooltipInteraction) {
      onTooltipInteraction(term, isMobile ? 'click' : 'hover');
    }
  };

  const handleTooltipClick = (e: React.MouseEvent, term: string) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      handleTooltipOpen(term, !openTooltips.has(term));
    }
  };

  // Close all tooltips when clicking outside
  useEffect(() => {
    if (isMobile && openTooltips.size > 0) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-tooltip-trigger]') && !target.closest('[role="tooltip"]')) {
          setOpenTooltips(new Set());
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, openTooltips.size]);

  // Handle escape key to close tooltips
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenTooltips(new Set());
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (parsedSegments.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <span className="whitespace-pre-wrap">
        {parsedSegments.map((segment) => {
          if (segment.type === 'text') {
            return <span key={segment.key}>{segment.content}</span>;
          }

          const tooltipId = `tooltip-${segment.key}`;
          const isOpen = openTooltips.has(segment.term || '');

          return (
            <Tooltip
              key={segment.key}
              open={isMobile ? isOpen : undefined}
              onOpenChange={(open) => handleTooltipOpen(segment.term || '', open)}
            >
              <TooltipTrigger asChild>
                <span
                  data-tooltip-trigger
                  className={cn(
                    "underline decoration-dotted decoration-primary/50 cursor-help",
                    "transition-colors duration-200",
                    "hover:decoration-primary hover:text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
                    "inline-block min-h-[44px] sm:min-h-0", // Mobile-friendly tap target
                  )}
                  onClick={(e) => handleTooltipClick(e, segment.term || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTooltipOpen(segment.term || '', !isOpen);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Definition for ${segment.term}`}
                  aria-describedby={isOpen ? tooltipId : undefined}
                  aria-expanded={isOpen}
                >
                  {segment.content}
                </span>
              </TooltipTrigger>
              <TooltipContent
                id={tooltipId}
                className={cn(
                  "max-w-xs bg-popover text-popover-foreground",
                  "shadow-lg border",
                  "p-3",
                  isMobile && "touch-none", // Prevent scroll when tooltip is open on mobile
                )}
                sideOffset={5}
                side={isMobile ? "top" : "bottom"}
              >
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{segment.term}</p>
                  <p className="text-sm leading-relaxed">{segment.definition}</p>
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTooltipOpen(segment.term || '', false);
                      }}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Close tooltip"
                    >
                      Tap to close ✕
                    </button>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}