import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PopulateKnowledgeBasePage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const { toast } = useToast();

  const populateKnowledgeBase = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('[Populate] Calling edge function...');

      const { data, error } = await supabase.functions.invoke('populate-knowledge-base', {
        body: {}
      });

      if (error) {
        console.error('[Populate] Error response:', error);
        throw error;
      }

      console.log('[Populate] Success:', data);
      
      setResult(data);
      
      toast({
        title: "Knowledge Base Populated! 🎉",
        description: `Successfully created ${data.total_chunks} knowledge chunks (Nette: ${data.nette_chunks}, ME: ${data.me_chunks})`,
      });

    } catch (error) {
      console.error('[Populate] Error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to populate knowledge base',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateNetteKnowledge = async () => {
    setMigrationLoading(true);
    setMigrationResult(null);

    try {
      console.log('[Migration] Calling edge function...');

      const { data, error } = await supabase.functions.invoke('migrate-nette-knowledge', {
        body: {}
      });

      if (error) {
        console.error('[Migration] Error response:', error);
        throw error;
      }

      console.log('[Migration] Success:', data);
      
      setMigrationResult(data);
      
      toast({
        title: "Migration Complete! 🎉",
        description: `Successfully migrated ${data.stats.migrated_chunks} chunks to nette_knowledge_chunks`,
      });

    } catch (error) {
      console.error('[Migration] Error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to migrate knowledge',
        variant: "destructive",
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Populate Knowledge Base</h1>
          <p className="text-muted-foreground">
            This will process all embedded markdown content and generate embeddings for the RAG system.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Option 1: Migrate Existing Data</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Migrate 143 chunks from gh_training_chunks to nette_knowledge_chunks with schema transformation
              </p>
              <Button
                onClick={migrateNetteKnowledge}
                disabled={migrationLoading || migrationResult?.success}
                size="lg"
                className="w-full"
                variant="default"
              >
                {migrationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Migrating... This may take 1-2 minutes
                  </>
                ) : migrationResult?.success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Migration Complete
                  </>
                ) : (
                  "Migrate Nette Knowledge"
                )}
              </Button>

              {migrationResult && (
                <Card className={`p-4 mt-4 ${migrationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {migrationResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>Source chunks: {migrationResult.stats?.source_chunks}</p>
                          <p>Migrated: {migrationResult.stats?.migrated_chunks}</p>
                          <p>Failed: {migrationResult.stats?.failed_chunks || 0}</p>
                          <p>Total in destination: {migrationResult.stats?.total_in_destination}</p>
                        </div>
                        {migrationResult.stats?.errors && (
                          <div className="text-sm text-red-600 mt-2">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside">
                              {migrationResult.stats.errors.map((err: string, i: number) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="border-t pt-4 mt-6">
              <h2 className="text-xl font-semibold mb-2">Option 2: Populate from Files</h2>
              <p className="text-sm text-muted-foreground mb-4">Process markdown files and generate embeddings</p>
              <div className="mb-4">
                <h3 className="font-medium mb-2">Files to Process:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>GROUP-HOME-TACTICS-LIBRARY.md (Nette)</li>
                  <li>Goup_home_Newbies_training_7_22_25.md (Nette)</li>
                  <li>Group_Home_Webinar_recording_8_13_25.md (Nette)</li>
                  <li>Group_Home_for_newbies_Q_A_5_20_25.md (Nette)</li>
                  <li>Group_home_for_Newbies_Q_A_7_4_25.md (Nette)</li>
                  <li>Group_home_webinar_recording_9_11_25.md (ME)</li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  onClick={populateKnowledgeBase}
                  disabled={loading || result?.success}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing... This may take 5-10 minutes
                    </>
                  ) : result?.success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Knowledge Base Populated Successfully
                    </>
                  ) : (
                    "Start Population"
                  )}
                </Button>
              </div>

              {result && (
                <Card className={`p-4 mt-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {result.success ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-green-900">Success!</p>
                          <div className="text-sm text-green-800">
                            <p>Total Chunks: {result.total_chunks}</p>
                            <p>Nette Chunks: {result.nette_chunks}</p>
                            <p>ME Chunks: {result.me_chunks}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-red-900">Error</p>
                          <p className="text-sm text-red-800">{result.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                <p><strong>Note:</strong> This process:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Processes ~650+ pages of content</li>
                  <li>Generates 1,500-2,000 knowledge chunks</li>
                  <li>Creates embeddings using OpenAI (costs ~$0.50-1.00)</li>
                  <li>Takes approximately 5-10 minutes to complete</li>
                  <li>Should only be run once to populate the database</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PopulateKnowledgeBasePage;
