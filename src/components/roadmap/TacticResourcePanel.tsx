// TacticResourcePanel Component
// Container with tabs for documents and knowledge chunks

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, BookOpen, Library } from 'lucide-react';
import { useTacticDocuments } from '@/hooks/useTacticDocuments';
import { useTacticKnowledge } from '@/hooks/useTacticKnowledge';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { KnowledgeChunkCard } from '@/components/documents/KnowledgeChunkCard';
import { ResourcePreviewModal } from '@/components/documents/ResourcePreviewModal';
import type { TacticDocument } from '@/types/documents';
import type { KnowledgeChunk } from '@/types/knowledge';

interface TacticResourcePanelProps {
  tacticId: string;
}

export const TacticResourcePanel = ({ tacticId }: TacticResourcePanelProps) => {
  const { documents, isLoading: documentsLoading } = useTacticDocuments(tacticId);
  const { knowledge, isLoading: knowledgeLoading } = useTacticKnowledge(tacticId);
  
  const [previewResource, setPreviewResource] = useState<{
    type: 'document' | 'knowledge';
    data: TacticDocument | KnowledgeChunk;
  } | null>(null);

  const isLoading = documentsLoading || knowledgeLoading;

  // Group documents by link type
  const requiredDocs = documents.filter((d) => d.link_type === 'required');
  const recommendedDocs = documents.filter((d) => d.link_type === 'recommended');
  const supplementalDocs = documents.filter((d) => d.link_type === 'supplemental');

  // Group knowledge by priority
  const highPriority = knowledge.filter((k) => k.priority_level === 'HIGH');
  const mediumPriority = knowledge.filter((k) => k.priority_level === 'MEDIUM');
  const lowPriority = knowledge.filter((k) => k.priority_level === 'LOW');

  const totalResources = documents.length + knowledge.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalResources === 0) {
    return (
      <Alert>
        <AlertDescription>
          No training materials available for this tactic yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge ({knowledge.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Library className="h-3.5 w-3.5" />
            All ({totalResources})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 mt-4">
          {requiredDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-destructive">Required Documents</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {requiredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onClick={() => setPreviewResource({ type: 'document', data: doc })}
                  />
                ))}
              </div>
            </div>
          )}

          {recommendedDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Recommended Documents</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onClick={() => setPreviewResource({ type: 'document', data: doc })}
                  />
                ))}
              </div>
            </div>
          )}

          {supplementalDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Supplemental Documents</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {supplementalDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onClick={() => setPreviewResource({ type: 'document', data: doc })}
                  />
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && (
            <Alert>
              <AlertDescription>No documents linked to this tactic yet.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4 mt-4">
          {highPriority.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-destructive">High Priority</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {highPriority.map((chunk) => (
                  <KnowledgeChunkCard
                    key={chunk.id}
                    chunk={chunk}
                    onClick={() => setPreviewResource({ type: 'knowledge', data: chunk })}
                  />
                ))}
              </div>
            </div>
          )}

          {mediumPriority.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Medium Priority</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mediumPriority.map((chunk) => (
                  <KnowledgeChunkCard
                    key={chunk.id}
                    chunk={chunk}
                    onClick={() => setPreviewResource({ type: 'knowledge', data: chunk })}
                  />
                ))}
              </div>
            </div>
          )}

          {lowPriority.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Low Priority</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lowPriority.map((chunk) => (
                  <KnowledgeChunkCard
                    key={chunk.id}
                    chunk={chunk}
                    onClick={() => setPreviewResource({ type: 'knowledge', data: chunk })}
                  />
                ))}
              </div>
            </div>
          )}

          {knowledge.length === 0 && (
            <Alert>
              <AlertDescription>No knowledge articles available for this tactic yet.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6 mt-4">
          {documents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Training Documents ({documents.length})
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onClick={() => setPreviewResource({ type: 'document', data: doc })}
                  />
                ))}
              </div>
            </div>
          )}

          {knowledge.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Knowledge Articles ({knowledge.length})
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {knowledge.map((chunk) => (
                  <KnowledgeChunkCard
                    key={chunk.id}
                    chunk={chunk}
                    onClick={() => setPreviewResource({ type: 'knowledge', data: chunk })}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ResourcePreviewModal
        open={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
      />
    </>
  );
};
