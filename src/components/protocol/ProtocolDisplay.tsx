import React from 'react';
import { ProtocolCard } from './ProtocolCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProtocolDisplayProps {
  className?: string;
  userId?: string;
}

export function ProtocolDisplay({ className, userId }: ProtocolDisplayProps) {
  // Fetch available protocols
  const { data: protocols, isLoading, error } = useQuery({
    queryKey: ['protocols-with-simplified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mio_knowledge_chunks')
        .select('id, chunk_summary, simplified_text, glossary_terms')
        .not('simplified_text', 'is', null)
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load protocols. Please refresh the page to try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!protocols || protocols.length === 0) {
    return (
      <Alert className={className}>
        <AlertTitle>No Protocols Available</AlertTitle>
        <AlertDescription>
          There are no simplified protocols available at this time.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h2>Available Protocols</h2>
        <p className="text-muted-foreground">
          Browse through our collection of simplified protocols. Click on tooltips to understand technical terms.
        </p>
      </div>

      <div className="grid gap-6">
        {protocols.map((protocol) => (
          <ProtocolCard
            key={protocol.id}
            protocolId={protocol.id}
            userId={userId}
          />
        ))}
      </div>

      <div className="text-sm text-muted-foreground text-center pt-6 border-t">
        Showing {protocols.length} protocols with simplified versions
      </div>
    </div>
  );
}