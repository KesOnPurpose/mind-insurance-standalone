// ResourcePreviewModal Component
// Unified preview modal for documents and knowledge chunks

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, X } from 'lucide-react';
import type { TacticDocument } from '@/types/documents';
import type { KnowledgeChunk } from '@/types/knowledge';
import { formatCategory, formatOwnershipModel, formatPopulation } from '@/types/documents';

interface ResourcePreviewModalProps {
  open: boolean;
  onClose: () => void;
  resource: {
    type: 'document' | 'knowledge';
    data: TacticDocument | KnowledgeChunk;
  } | null;
}

export const ResourcePreviewModal = ({
  open,
  onClose,
  resource,
}: ResourcePreviewModalProps) => {
  if (!resource) return null;

  const isDocument = resource.type === 'document';
  const data = resource.data;

  const handleDownload = () => {
    if (isDocument) {
      const doc = data as TacticDocument;
      window.open(doc.document_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            {isDocument
              ? (data as TacticDocument).document_name
              : (data as KnowledgeChunk).source_file}
          </DialogTitle>
          <DialogDescription>
            {isDocument ? 'Training Document' : 'Knowledge Base Article'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isDocument ? (
            <DocumentPreview document={data as TacticDocument} onDownload={handleDownload} />
          ) : (
            <KnowledgePreview chunk={data as KnowledgeChunk} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DocumentPreview = ({
  document,
  onDownload,
}: {
  document: TacticDocument;
  onDownload: () => void;
}) => {
  return (
    <>
      {document.description && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{document.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Category</h4>
          <Badge>{formatCategory(document.category)}</Badge>
        </div>

        {document.difficulty && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Difficulty</h4>
            <Badge variant="secondary">
              {document.difficulty.charAt(0).toUpperCase() + document.difficulty.slice(1)}
            </Badge>
          </div>
        )}
      </div>

      {document.applicable_states && document.applicable_states.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Applicable States</h4>
          <div className="flex flex-wrap gap-1.5">
            {document.applicable_states.map((state) => (
              <Badge key={state} variant="outline" className="text-xs">
                {state}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {document.ownership_model && document.ownership_model.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Ownership Models</h4>
          <div className="flex flex-wrap gap-1.5">
            {document.ownership_model.map((model) => (
              <Badge key={model} variant="outline" className="text-xs">
                {formatOwnershipModel(model)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {document.applicable_populations && document.applicable_populations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Applicable Populations</h4>
          <div className="flex flex-wrap gap-1.5">
            {document.applicable_populations.map((pop) => (
              <Badge key={pop} variant="outline" className="text-xs">
                {formatPopulation(pop)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={onDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={onDownload} className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </Button>
      </div>
    </>
  );
};

const KnowledgePreview = ({ chunk }: { chunk: KnowledgeChunk }) => {
  return (
    <>
      <div>
        <h4 className="text-sm font-semibold mb-2">Content</h4>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {chunk.chunk_text}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Priority</h4>
          <Badge
            variant={
              chunk.priority_level === 'HIGH'
                ? 'destructive'
                : chunk.priority_level === 'MEDIUM'
                ? 'default'
                : 'secondary'
            }
          >
            {chunk.priority_level}
          </Badge>
        </div>

        {chunk.category && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Category</h4>
            <Badge variant="secondary">{chunk.category}</Badge>
          </div>
        )}

        {chunk.week_number && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Week</h4>
            <Badge variant="outline">Week {chunk.week_number}</Badge>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Source</h4>
        <p className="text-sm text-muted-foreground">{chunk.source_file}</p>
      </div>
    </>
  );
};
