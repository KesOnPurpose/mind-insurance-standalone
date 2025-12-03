import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  Download,
  ExternalLink,
  ArrowUpDown,
  Calendar,
  X,
  ArrowLeft,
} from 'lucide-react';
import type { GHDocument, DocumentCategory } from '@/types/documents';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Category display configuration
const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string }> = {
  financial: { label: 'Financial', color: 'bg-green-100 text-green-800' },
  legal: { label: 'Legal', color: 'bg-blue-100 text-blue-800' },
  marketing: { label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
  operations: { label: 'Operations', color: 'bg-orange-100 text-orange-800' },
  compliance: { label: 'Compliance', color: 'bg-red-100 text-red-800' },
  revenue: { label: 'Revenue', color: 'bg-yellow-100 text-yellow-800' },
};

export default function ResourcesDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<'all' | DocumentCategory>(
    (searchParams.get('category') as DocumentCategory) || 'all'
  );
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  // Read week param from URL
  const selectedWeek = searchParams.get('week');

  // Sync URL params with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    // Preserve week param if it exists
    if (selectedWeek) params.set('week', selectedWeek);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchQuery, selectedWeek, setSearchParams]);

  // Fetch all documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gh_documents')
        .select('*')
        .order('document_name', { ascending: true });

      if (error) throw error;
      return data as GHDocument[];
    },
  });

  // Fetch link counts for each document
  const { data: linkCounts } = useQuery({
    queryKey: ['document-link-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gh_document_tactic_links')
        .select('document_id');

      if (error) throw error;

      // Count links per document
      const counts: Record<number, number> = {};
      data.forEach(link => {
        counts[link.document_id] = (counts[link.document_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch document IDs linked to tactics in the selected week
  const { data: weekDocumentIds, isLoading: isLoadingWeekDocs } = useQuery({
    queryKey: ['documents-by-week', selectedWeek],
    queryFn: async () => {
      if (!selectedWeek) return null;

      const { data, error } = await supabase
        .from('gh_document_tactic_links')
        .select(`
          document_id,
          gh_tactic_instructions!inner (
            week_assignment
          )
        `)
        .eq('gh_tactic_instructions.week_assignment', parseInt(selectedWeek));

      if (error) throw error;
      // Return unique document IDs
      return [...new Set(data.map(d => d.document_id))];
    },
    enabled: !!selectedWeek,
  });

  // Handler to clear week filter
  const clearWeekFilter = () => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('week');
      return newParams;
    });
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    let filtered = documents;

    // Filter by week (via tactic links)
    if (selectedWeek && weekDocumentIds) {
      filtered = filtered.filter(doc => weekDocumentIds.includes(doc.id));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.document_name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Sort documents
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.document_name.localeCompare(b.document_name);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return (b.download_count || 0) - (a.download_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, selectedCategory, sortBy, selectedWeek, weekDocumentIds]);

  // Group documents by category for category view
  const documentsByCategory = useMemo(() => {
    const grouped: Partial<Record<DocumentCategory, GHDocument[]>> = {};
    filteredDocuments.forEach(doc => {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category]!.push(doc);
    });
    return grouped;
  }, [filteredDocuments]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents?.length || 0 };
    documents?.forEach(doc => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const handleDownload = async (document: GHDocument) => {
    // Track download activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('gh_user_document_activity').insert({
        user_id: user.id,
        document_id: document.id,
        activity_type: 'download',
      });
    }

    // Trigger download
    window.open(document.document_url, '_blank');
  };

  const handleViewDocument = (document: GHDocument) => {
    // Open document in new tab
    window.open(document.document_url, '_blank');
  };

  const formatFileSize = (sizeKb: number | null) => {
    if (!sizeKb) return 'Unknown size';
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Back Button Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link to="/resources">
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Group Home Documents
          </h1>
          <p className="text-muted-foreground">
            Browse and download training materials, templates, and guides for your group home business
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {documents?.length || 0} Documents
            </span>
            <span>•</span>
            <span>{Object.keys(documentsByCategory).length} Categories</span>
          </div>

          {/* Active Week Filter Indicator */}
          {selectedWeek && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filtered by:</span>
              <Badge variant="secondary" className="flex items-center gap-1.5 pr-1">
                <Calendar className="w-3 h-3" />
                Week {selectedWeek}
                <button
                  onClick={clearWeekFilter}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  aria-label="Clear week filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
              {isLoadingWeekDocs && (
                <span className="text-xs text-muted-foreground">Loading...</span>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('name')}
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  A-Z
                </Button>
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                >
                  Recent
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                >
                  Popular
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">
              All ({categoryCounts.all})
            </TabsTrigger>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <TabsTrigger key={key} value={key}>
                {config.label} ({categoryCounts[key] || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((document) => (
                  <Card key={document.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                          {document.document_name}
                        </CardTitle>
                        <Badge className={CATEGORY_CONFIG[document.category].color}>
                          {CATEGORY_CONFIG[document.category].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {document.description && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {document.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <span>{document.file_type?.toUpperCase() || 'PDF'}</span>
                        <span>•</span>
                        <span>{formatFileSize(document.file_size_kb)}</span>
                        {linkCounts && linkCounts[document.id] > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              {linkCounts[document.id]} tactic{linkCounts[document.id] !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
