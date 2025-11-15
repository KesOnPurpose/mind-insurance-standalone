import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Import markdown files as raw text
import tacticsLibrary from "@/../../user-uploads/GROUP-HOME-TACTICS-LIBRARY.md?raw";
import newbiesTraining from "@/../../user-uploads/Goup_home_Newbies_training_7_22_25.md?raw";
import webinar813 from "@/../../user-uploads/Group_Home_Webinar_recording_8_13_25.md?raw";
import qa520 from "@/../../user-uploads/Group_Home_for_newbies_Q_A_5_20_25.md?raw";
import qa74 from "@/../../user-uploads/Group_home_for_Newbies_Q_A_7_4_25.md?raw";
import webinar911 from "@/../../user-uploads/Group_home_webinar_recording_9_11_25.md?raw";

const PopulateKnowledgeBasePage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const populateKnowledgeBase = async () => {
    setLoading(true);
    setResult(null);

    try {
      const files = [
        { name: "GROUP-HOME-TACTICS-LIBRARY.md", content: tacticsLibrary, agent: "nette" },
        { name: "Goup_home_Newbies_training_7_22_25.md", content: newbiesTraining, agent: "nette" },
        { name: "Group_Home_Webinar_recording_8_13_25.md", content: webinar813, agent: "nette" },
        { name: "Group_Home_for_newbies_Q_A_5_20_25.md", content: qa520, agent: "nette" },
        { name: "Group_home_for_Newbies_Q_A_7_4_25.md", content: qa74, agent: "nette" },
        { name: "Group_home_webinar_recording_9_11_25.md", content: webinar911, agent: "me" },
      ];

      console.log('[Populate] Calling edge function with', files.length, 'files');

      const response = await fetch(
        'https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/populate-knowledge-base',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Populate] Error response:', errorText);
        throw new Error(`Failed to populate knowledge base: ${response.status}`);
      }

      const data = await response.json();
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Populate Knowledge Base</h1>
          <p className="text-muted-foreground">
            This will process all markdown files and generate embeddings for the RAG system.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Files to Process:</h2>
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
              <Card className={`p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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
        </Card>
      </div>
    </div>
  );
};

export default PopulateKnowledgeBasePage;
