// DocumentCard Component
// Display individual document with metadata

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, File } from 'lucide-react';
import type { TacticDocument } from '@/types/documents';
import { formatCategory } from '@/types/documents';

interface DocumentCardProps {
  document: TacticDocument;
  onClick: () => void;
}

export const DocumentCard = ({ document, onClick }: DocumentCardProps) => {
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5 text-muted-foreground" />;
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (fileType.includes('image')) {
      return <File className="h-5 w-5 text-purple-600" />;
    }
    
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getLinkTypeBadgeVariant = (linkType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (linkType) {
      case 'required':
        return 'destructive';
      case 'recommended':
        return 'default';
      case 'supplemental':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLinkTypeLabel = (linkType: string): string => {
    return linkType.charAt(0).toUpperCase() + linkType.slice(1);
  };

  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getFileIcon(document.file_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 truncate">
              {document.document_name}
            </h4>
            
            {document.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {document.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={getLinkTypeBadgeVariant(document.link_type)} className="text-xs">
                {getLinkTypeLabel(document.link_type)}
              </Badge>
              
              {document.category && (
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(document.category)}
                </Badge>
              )}
              
              {document.file_type && (
                <Badge variant="outline" className="text-xs">
                  {document.file_type.split('/').pop()?.toUpperCase() || 'FILE'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
