import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

export interface TooltipContentData {
  title: string;
  formula?: string;
  explanation: string;
  example?: string;
}

interface CalculatorTooltipProps {
  content: TooltipContentData;
  className?: string;
}

/**
 * CalculatorTooltip - Responsive info tooltip for calculator metrics
 *
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on tap
 */
export function CalculatorTooltip({ content, className = '' }: CalculatorTooltipProps) {
  const isMobile = useIsMobile();

  const tooltipBody = (
    <div className="space-y-2 max-w-xs">
      <p className="font-semibold text-foreground">{content.title}</p>
      {content.formula && (
        <div className="bg-muted/50 rounded px-2 py-1">
          <code className="text-xs font-mono text-primary">{content.formula}</code>
        </div>
      )}
      <p className="text-sm text-muted-foreground">{content.explanation}</p>
      {content.example && (
        <p className="text-xs text-muted-foreground italic">
          Example: {content.example}
        </p>
      )}
    </div>
  );

  // Mobile: Use Popover (tap to open)
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors ${className}`}
            aria-label={`Info about ${content.title}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-72">
          {tooltipBody}
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop: Use Tooltip (hover)
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors ${className}`}
            aria-label={`Info about ${content.title}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-72 p-3">
          {tooltipBody}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CalculatorTooltip;
