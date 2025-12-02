import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function MigrateKnowledgeCard() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [migratedCount, setMigratedCount] = useState<number>(0);
  const { toast } = useToast();

  const migrateNetteKnowledge = async () => {
    try {
      setIsMigrating(true);
      setMigrationStatus('idle');

      toast({
        title: "Migration Started",
        description: "Migrating Nette training knowledge to main knowledge base...",
      });

      const { data, error } = await supabase.functions.invoke('migrate-nette-knowledge', {
        body: { agent: 'nette' }
      });

      if (error) throw error;

      setMigratedCount(data?.migratedCount || 0);
      setMigrationStatus('success');

      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${data?.migratedCount || 0} knowledge chunks.`,
      });
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "Failed to migrate knowledge",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migrate Nette Knowledge
            </CardTitle>
            <CardDescription>
              Migrate 143 training chunks from gh_training_chunks to main knowledge base
            </CardDescription>
          </div>
          {migrationStatus === 'success' && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
          )}
          {migrationStatus === 'error' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Source Table</span>
            <span className="font-mono">gh_training_chunks</span>
          </div>
          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Target Table</span>
            <span className="font-mono">mio_knowledge_chunks</span>
          </div>
        </div>

        {migrationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Successfully migrated {migratedCount} knowledge chunks</span>
            </div>
          </div>
        )}

        <Button
          onClick={migrateNetteKnowledge}
          disabled={isMigrating}
          className="w-full"
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Start Migration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
