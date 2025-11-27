import { useMemo } from 'react';
import { FileText, TrendingUp, Clock, Calendar, Filter, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, Link } from 'react-router-dom';
import { useJourneyContext } from '@/hooks/useJourneyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Document categories
const DOCUMENT_CATEGORIES = [
  'financial',
  'legal',
  'marketing',
  'operations',
  'compliance',
  'revenue'
] as const;

type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

interface ResourcesPanelProps {
  onCategorySelect?: (category: DocumentCategory | 'all') => void;
  onDocumentSelect?: (documentId: number) => void;
}

/**
 * ResourcesPanel - Sidebar for resources page context
 *
 * Shows:
 * - Sidebar search
 * - Current week context
 * - Category quick filters with counts
 * - Popular documents
 * - Recent activity
 */
export function ResourcesPanel({ onCategorySelect, onDocumentSelect }: ResourcesPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWeek, isLoading: journeyLoading } = useJourneyContext();

  // Current category from URL
  const selectedCategory = searchParams.get('category') || 'all';
  const activeTacticId = searchParams.get('tactic');

  // Fetch documents for counts and popular list
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents-sidebar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gh_documents')
        .select('id, document_name, category, download_count')
        .order('download_count', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = journeyLoading || docsLoading;

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    if (!documents) return {};
    return documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [documents]);

  // Get popular documents (top 3 by download count)
  const popularDocs = useMemo(() => {
    if (!documents) return [];
    return documents.slice(0, 3);
  }, [documents]);

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (category === 'all') {
        newParams.delete('category');
      } else {
        newParams.set('category', category);
      }
      return newParams;
    });
    onCategorySelect?.(category as DocumentCategory | 'all');
  };

  if (isLoading) {
    return (
      <div className="px-2 py-2 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Current Week Context Card */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Week {currentWeek} Resources</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Documents for your current phase
        </p>
        <Link to={`/resources?week=${currentWeek}`}>
          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs">
            View Week {currentWeek} Docs
          </Button>
        </Link>
      </div>

      {/* Tactic Context (when coming from roadmap) */}
      {activeTacticId && (
        <div className="rounded-lg border border-secondary/50 bg-secondary/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Tactic Resources</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing related documents
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            onClick={() => {
              setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.delete('tactic');
                return newParams;
              });
            }}
          >
            Clear Tactic Filter
          </Button>
        </div>
      )}

      {/* Category Quick Filters */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Categories</span>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
              selectedCategory === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="h-3 w-3" />
              All Resources
            </span>
            <Badge variant="outline" className="h-5">{documents?.length || 0}</Badge>
          </button>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm capitalize transition-colors ${
                selectedCategory === cat ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
              }`}
            >
              <span>{cat}</span>
              <Badge variant="outline" className="h-5">{categoryCounts[cat] || 0}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Documents */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Popular</span>
        </div>
        <div className="space-y-2">
          {popularDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onDocumentSelect?.(doc.id)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              <p className="text-xs font-medium line-clamp-1">{doc.document_name}</p>
              <p className="text-xs text-muted-foreground">{doc.download_count || 0} downloads</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Recently Viewed</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your recent documents will appear here
        </p>
      </div>
    </div>
  );
}

export default ResourcesPanel;
