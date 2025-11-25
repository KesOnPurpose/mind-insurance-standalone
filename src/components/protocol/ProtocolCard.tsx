import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from './LanguageToggle';
import { GlossaryTooltip } from './GlossaryTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  trackProtocolViewed,
  trackProtocolCompleted,
  trackProtocolAbandoned,
  trackTooltipInteraction,
} from '@/lib/analytics';
import { countTooltips } from '@/lib/glossary-parser';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProtocolData {
  id: string;
  chunk_text: string;
  simplified_text?: string;
  glossary_terms?: string[];
  chunk_summary?: string;
  reading_level_before?: number;
  reading_level_after?: number;
  language_variant?: string;
}

interface ProtocolCardProps {
  protocolId: string;
  userId?: string;
  className?: string;
}

export function ProtocolCard({ protocolId, userId, className }: ProtocolCardProps) {
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [variant, setVariant] = useState<'clinical' | 'simplified'>('clinical');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tooltipInteractionCount, setTooltipInteractionCount] = useState(0);

  const { toast } = useToast();
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedViewRef = useRef(false);

  // Fetch protocol data
  useEffect(() => {
    const fetchProtocol = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('mio_knowledge_chunks')
          .select('id, chunk_text, simplified_text, glossary_terms, chunk_summary, reading_level_before, reading_level_after, language_variant')
          .eq('id', protocolId)
          .single();

        if (error) throw error;

        setProtocol(data as ProtocolData);

        // Load user's saved variant preference if available
        if (userId && data.language_variant) {
          setVariant(data.language_variant as 'clinical' | 'simplified');
        }

        // Track view once data is loaded
        if (!hasTrackedViewRef.current && data) {
          const tooltipCount = data.simplified_text ? countTooltips(data.simplified_text) : 0;
          trackProtocolViewed(
            protocolId,
            variant,
            !!data.simplified_text,
            tooltipCount
          );
          hasTrackedViewRef.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch protocol:', err);
        setError('Failed to load protocol. Please try again.');
        toast({
          title: 'Error loading protocol',
          description: 'Please refresh the page to try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProtocol();
  }, [protocolId, userId, toast, variant]);

  // Track completion
  const handleComplete = () => {
    if (!isCompleted) {
      const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      trackProtocolCompleted(protocolId, variant, timeSpentSeconds, tooltipInteractionCount);
      setIsCompleted(true);
      toast({
        title: 'Protocol completed!',
        description: 'Great job following through with this protocol.',
      });
    }
  };

  // Track abandonment on unmount if not completed
  useEffect(() => {
    return () => {
      if (!isCompleted && hasTrackedViewRef.current) {
        const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        // Estimate completion based on time spent (rough approximation)
        const estimatedCompletion = Math.min(timeSpentSeconds / 60, 90); // Cap at 90%
        trackProtocolAbandoned(protocolId, variant, timeSpentSeconds, estimatedCompletion);
      }
    };
  }, [isCompleted, protocolId, variant]);

  // Handle tooltip interactions
  const handleTooltipInteraction = (term: string, action: 'hover' | 'click') => {
    if (action === 'click') {
      setTooltipInteractionCount(prev => prev + 1);
    }
    // Find definition from the simplified text (would need to parse in real implementation)
    trackTooltipInteraction(action, term, 'definition_placeholder', protocolId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mt-2" />
          <Skeleton className="h-4 w-4/6 mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !protocol) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'Protocol not found'}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayText = variant === 'simplified' && protocol.simplified_text
    ? protocol.simplified_text
    : protocol.chunk_text;

  const hasSimplifiedVersion = !!protocol.simplified_text;
  const tooltipCount = protocol.simplified_text ? countTooltips(protocol.simplified_text) : 0;

  // Calculate reading level display
  const currentReadingLevel = variant === 'simplified' && protocol.reading_level_after
    ? protocol.reading_level_after
    : protocol.reading_level_before;

  const readingLevelLabel = currentReadingLevel
    ? `Grade ${Math.round(currentReadingLevel)}`
    : null;

  return (
    <Card className={cn('relative', className, isCompleted && 'border-green-500/50')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {protocol.chunk_summary || 'Protocol'}
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            {readingLevelLabel && (
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                Reading level: {readingLevelLabel}
              </CardDescription>
            )}
          </div>
          {hasSimplifiedVersion && (
            <LanguageToggle
              currentVariant={variant}
              onVariantChange={setVariant}
              tooltipCount={tooltipCount}
              userId={userId}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {variant === 'simplified' && protocol.simplified_text ? (
            <GlossaryTooltip
              text={displayText}
              glossaryTerms={protocol.glossary_terms}
              onTooltipInteraction={handleTooltipInteraction}
            />
          ) : (
            <p className="whitespace-pre-wrap">{displayText}</p>
          )}
        </div>

        {protocol.glossary_terms && protocol.glossary_terms.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Related terms in this protocol:
            </p>
            <div className="flex flex-wrap gap-1">
              {protocol.glossary_terms.slice(0, 5).map((term, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {term}
                </Badge>
              ))}
              {protocol.glossary_terms.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{protocol.glossary_terms.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            {tooltipInteractionCount > 0 && (
              <span>{tooltipInteractionCount} terms explored</span>
            )}
          </div>
          {!isCompleted && (
            <Button
              size="sm"
              onClick={handleComplete}
              className="ml-auto"
            >
              Mark as Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}