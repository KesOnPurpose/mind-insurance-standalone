// KnowledgeChunkCard Component
// Display knowledge chunk with preview

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import type { KnowledgeChunk } from '@/types/knowledge';
import { formatPriorityLevel } from '@/types/knowledge';

interface KnowledgeChunkCardProps {
  chunk: KnowledgeChunk;
  onClick: () => void;
}

export const KnowledgeChunkCard = ({ chunk, onClick }: KnowledgeChunkCardProps) => {
  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const stripMarkdown = (text: string): string => {
    return text
      // Remove markdown headers (##, ###, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers (**, *, __, _)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove bullet points (-, *)
      .replace(/^[\s-]*[\*\-]\s+/gm, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getPreviewText = (text: string): string => {
    const cleanText = stripMarkdown(text);
    if (cleanText.length <= 200) return cleanText;
    return cleanText.substring(0, 200) + '...';
  };

  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 truncate">
              {chunk.source_file}
            </h4>
            
            <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
              {getPreviewText(chunk.chunk_text)}
            </p>
            
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={getPriorityBadgeVariant(chunk.priority_level)} className="text-xs">
                {formatPriorityLevel(chunk.priority_level)}
              </Badge>
              
              {chunk.category && (
                <Badge variant="secondary" className="text-xs">
                  {chunk.category}
                </Badge>
              )}
              
              {chunk.week_number && (
                <Badge variant="outline" className="text-xs">
                  Week {chunk.week_number}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
