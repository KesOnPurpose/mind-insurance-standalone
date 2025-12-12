// ============================================================================
// ADMIN KNOWLEDGE BASE PAGE
// ============================================================================
// Unified Admin UI for managing knowledge bases for all three AI agents:
// - Nette (Group Home Expert)
// - MIO (Mind Insurance Oracle)
// - ME (Money Evolution)
//
// Features:
// - Agent selection (Nette, MIO, ME)
// - Category-based organization
// - Multi-source ingestion (Google Drive, Docs, Notion, File Upload)
// - Processing queue monitoring
// - Knowledge chunk viewing and management
// ============================================================================

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  AgentType,
  KnowledgeSourceType,
  KnowledgeIngestionRequest,
  AGENT_CONFIGS,
  getCategoriesForAgent,
} from '@/types/knowledgeManagement';
import { submitKnowledgeIngestion, submitBulkKnowledgeIngestion } from '@/services/knowledgeIngestionService';
import {
  AgentSelector,
  CategorySelector,
  KnowledgeSourceInput,
  ProcessingQueue,
  KnowledgeChunkTable,
  QueueWidget,
  BulkUrlInput,
  parseBulkUrls,
} from '@/components/admin/knowledge';
import { MigrateKnowledgeCard } from '@/components/admin/knowledge/MigrateKnowledgeCard';
import { PopulateKnowledgeCard } from '@/components/admin/knowledge/PopulateKnowledgeCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Database,
  Upload,
  Clock,
  Loader2,
  CheckCircle2,
  BookOpen,
  Settings,
  Layers,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminKnowledgeBase() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();

  // State
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('nette');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'add' | 'queue' | 'setup'>('browse');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkUrlInput, setBulkUrlInput] = useState('');

  // Form state for adding new knowledge
  const [sourceInput, setSourceInput] = useState<{
    sourceType: KnowledgeSourceType;
    sourceUrl?: string;
    sourceTitle?: string;
    content?: string;
    file?: File;
  }>({
    sourceType: 'google_drive',
  });

  const agentConfig = AGENT_CONFIGS[selectedAgent];
  const categories = getCategoriesForAgent(selectedAgent);

  const handleAgentChange = useCallback((agent: AgentType) => {
    setSelectedAgent(agent);
    setSelectedCategory(null); // Reset category when agent changes
  }, []);

  const handleSubmitKnowledge = async () => {
    // Validate category
    if (!selectedCategory) {
      toast({
        title: 'Category Required',
        description: 'Please select a category for this knowledge.',
        variant: 'destructive',
      });
      return;
    }

    // Handle bulk mode submission
    if (isBulkMode) {
      const parsedUrls = parseBulkUrls(bulkUrlInput);
      const validUrls = parsedUrls.filter((p) => p.isValid && p.sourceType);

      if (validUrls.length === 0) {
        toast({
          title: 'No Valid URLs',
          description: 'Please enter at least one valid Google Docs, Drive, or Notion URL.',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const items = validUrls.map((parsed) => ({
          source_type: parsed.sourceType!,
          source_url: parsed.url,
          category: selectedCategory,
        }));

        await submitBulkKnowledgeIngestion(selectedAgent, items, adminUser?.user_id);

        toast({
          title: 'Bulk Submission Complete',
          description: `${validUrls.length} document${validUrls.length !== 1 ? 's' : ''} added to the processing queue.`,
        });

        // Reset form
        setBulkUrlInput('');
        setIsAddDialogOpen(false);
        setActiveTab('queue'); // Switch to queue to show progress
      } catch (error) {
        console.error('Failed to submit bulk knowledge:', error);
        toast({
          title: 'Bulk Submission Failed',
          description: 'Failed to submit documents. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Single document submission (original logic)
    if (sourceInput.sourceType !== 'file_upload' && !sourceInput.sourceUrl) {
      toast({
        title: 'Source URL Required',
        description: 'Please provide a source URL.',
        variant: 'destructive',
      });
      return;
    }

    if (sourceInput.sourceType === 'file_upload' && !sourceInput.file && !sourceInput.content) {
      toast({
        title: 'Content Required',
        description: 'Please upload a file or paste content.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const request: KnowledgeIngestionRequest = {
        agent_type: selectedAgent,
        source_type: sourceInput.sourceType,
        source_url: sourceInput.sourceUrl,
        source_title: sourceInput.sourceTitle,
        category: selectedCategory,
        content: sourceInput.content,
        file: sourceInput.file,
      };

      // Pass user_id (auth.uid), not admin_users.id
      await submitKnowledgeIngestion(request, adminUser?.user_id);

      toast({
        title: 'Knowledge Submitted',
        description: 'Your knowledge has been added to the processing queue.',
      });

      // Reset form
      setSourceInput({ sourceType: 'google_drive' });
      setIsAddDialogOpen(false);
      setActiveTab('queue'); // Switch to queue to show progress
    } catch (error) {
      console.error('Failed to submit knowledge:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit knowledge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!adminUser) {
    return null; // AdminRoute guard handles this
  }

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="Knowledge Base Manager"
      headerSubtitle="Manage AI knowledge for Nette, MIO, and ME agents"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-4">
          <QueueWidget />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Add New Knowledge</DialogTitle>
                    <DialogDescription>
                      Add knowledge content for {agentConfig.name} from various sources
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="dialog-bulk-mode" className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Bulk
                    </label>
                    <Switch
                      id="dialog-bulk-mode"
                      checked={isBulkMode}
                      onCheckedChange={setIsBulkMode}
                    />
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <CategorySelector
                    agent={selectedAgent}
                    value={selectedCategory || ''}
                    onChange={setSelectedCategory}
                  />
                </div>

                {/* Source Input - Toggle between single and bulk */}
                {isBulkMode ? (
                  <BulkUrlInput
                    value={bulkUrlInput}
                    onChange={setBulkUrlInput}
                    disabled={isSubmitting}
                  />
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source</label>
                    <KnowledgeSourceInput
                      value={sourceInput}
                      onChange={setSourceInput}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitKnowledge}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : isBulkMode ? (
                    <>
                      <Layers className="h-4 w-4 mr-2" />
                      Submit {parseBulkUrls(bulkUrlInput).filter(p => p.isValid).length || ''} Documents
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Knowledge
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Agent Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Select Agent</CardTitle>
            <CardDescription>
              Choose which AI agent's knowledge base to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentSelector
              value={selectedAgent}
              onChange={handleAgentChange}
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="gap-2">
              <Database className="h-4 w-4" />
              Browse Knowledge
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2">
              <Upload className="h-4 w-4" />
              Add Content
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="h-4 w-4" />
              Processing Queue
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings className="h-4 w-4" />
              Setup & Migration
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Filter by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </Button>
                  {Object.entries(categories).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(key)}
                      className={selectedCategory === key ? '' : config.color}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Chunks Table */}
            <KnowledgeChunkTable
              agentType={selectedAgent}
              category={selectedCategory || undefined}
            />
          </TabsContent>

          {/* Add Content Tab */}
          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add Knowledge Content</CardTitle>
                    <CardDescription>
                      Import knowledge from Google Drive, Google Docs, Notion, or upload files directly.
                      Content will be processed and chunked for the {agentConfig.name} agent.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="bulk-mode" className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Bulk Mode
                    </label>
                    <Switch
                      id="bulk-mode"
                      checked={isBulkMode}
                      onCheckedChange={setIsBulkMode}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <CategorySelector
                    agent={selectedAgent}
                    value={selectedCategory || ''}
                    onChange={setSelectedCategory}
                  />
                </div>

                {/* Source Input - Toggle between single and bulk */}
                {isBulkMode ? (
                  <BulkUrlInput
                    value={bulkUrlInput}
                    onChange={setBulkUrlInput}
                    disabled={isSubmitting}
                  />
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source</label>
                    <KnowledgeSourceInput
                      value={sourceInput}
                      onChange={setSourceInput}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitKnowledge}
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : isBulkMode ? (
                      <>
                        <Layers className="h-4 w-4 mr-2" />
                        Submit {parseBulkUrls(bulkUrlInput).filter(p => p.isValid).length || ''} Documents
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit to Queue
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {isBulkMode ? (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Bulk Mode:</strong> Paste multiple URLs, one per line. All documents will share the same category.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Supported:</strong> Google Docs, Google Drive files/folders, and Notion pages.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Auto-detection:</strong> Source type is automatically detected from the URL pattern.
                        </span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Google Drive:</strong> Share link to folders or files. The system will process all supported documents.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Google Docs:</strong> Paste the share link to any Google Doc. Content will be extracted and chunked automatically.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>Notion:</strong> Share link to Notion pages or databases. Nested content will be crawled.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>
                          <strong>File Upload:</strong> Supports PDF, DOCX, TXT, MD, and CSV files up to 10MB.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <ProcessingQueue
              agentFilter={selectedAgent}
              showStats={true}
            />
          </TabsContent>

          {/* Setup & Migration Tab */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <MigrateKnowledgeCard />
              <PopulateKnowledgeCard />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Setup Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Migrate Nette Knowledge</h4>
                    <p>
                      One-time migration of 143 training knowledge chunks from the legacy gh_training_chunks table
                      to the unified mio_knowledge_chunks table. This operation is idempotent and safe to run multiple times.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Populate Knowledge Base</h4>
                    <p>
                      Process markdown files from the knowledge base directory and generate OpenAI embeddings.
                      This operation reads 6 core Mind Insurance protocol files and creates searchable knowledge chunks
                      with vector embeddings for semantic search.
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">
                    <strong>Note:</strong> Both operations invoke Supabase Edge Functions that may incur OpenAI API costs.
                    Only run these operations when needed.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
