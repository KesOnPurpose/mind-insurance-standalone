import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PopulateResult {
  success: boolean;
  message: string;
  filesProcessed?: string[];
  chunksCreated?: number;
  error?: string;
}

export function PopulateKnowledgeCard() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<PopulateResult | null>(null);
  const { toast } = useToast();

  const populateKnowledgeBase = async () => {
    try {
      setIsPopulating(true);
      setPopulateResult(null);

      toast({
        title: "Population Started",
        description: "Processing markdown files and generating embeddings...",
      });

      const { data, error } = await supabase.functions.invoke('populate-knowledge-base', {
        body: { agent: 'nette' }
      });

      if (error) throw error;

      const result = data as PopulateResult;
      setPopulateResult(result);

      if (result.success) {
        toast({
          title: "Population Complete",
          description: `Processed ${result.filesProcessed?.length || 0} files, created ${result.chunksCreated || 0} chunks.`,
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Population error:', error);
      setPopulateResult({
        success: false,
        message: 'Failed to populate knowledge base',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: "Population Failed",
        description: error instanceof Error ? error.message : "Failed to populate knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Populate Knowledge Base
            </CardTitle>
            <CardDescription>
              Process markdown files from knowledge base directory and generate embeddings
            </CardDescription>
          </div>
          {populateResult && (
            <Badge variant={populateResult.success ? "default" : "destructive"} className="flex items-center gap-1">
              {populateResult.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Failed
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Source Files</span>
          </div>
          <div className="pl-6 space-y-1 text-sm font-mono">
            <div>• IDENTITY_COLLISION_PROTOCOL.md</div>
            <div>• MIND_INSURANCE_CORE.md</div>
            <div>• MIND_INSURANCE_PRACTICE_PROTOCOL.md</div>
            <div>• MIND_INSURANCE_REPORTING.md</div>
            <div>• MIO_FORENSIC_FRAMEWORK.md</div>
            <div>• MIO_SYSTEM_PROMPT.md</div>
          </div>
        </div>

        {populateResult && (
          <div className={`border rounded-lg p-3 text-sm ${
            populateResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2">
              {populateResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <p className="font-medium">{populateResult.message}</p>
                {populateResult.filesProcessed && populateResult.filesProcessed.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Processed Files:</p>
                    {populateResult.filesProcessed.map((file, idx) => (
                      <div key={idx} className="text-xs pl-2">• {file}</div>
                    ))}
                  </div>
                )}
                {populateResult.chunksCreated !== undefined && (
                  <p className="text-xs">Chunks created: {populateResult.chunksCreated}</p>
                )}
                {populateResult.error && (
                  <p className="text-xs font-semibold">Error: {populateResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={populateKnowledgeBase}
          disabled={isPopulating}
          className="w-full"
        >
          {isPopulating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Files...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Start Population
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
