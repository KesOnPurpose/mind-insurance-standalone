// ============================================================================
// KNOWLEDGE CHUNK TABLE COMPONENT
// ============================================================================
// Displays and manages knowledge chunks with search, filter, and pagination
// Supports viewing, editing, and deleting chunks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  NormalizedKnowledgeChunk,
  AgentType,
  AGENT_CONFIGS,
  getCategoriesForAgent,
} from '@/types/knowledgeManagement';
import {
  getKnowledgeChunks,
  deleteKnowledgeChunk,
} from '@/services/knowledgeIngestionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Trash2,
  Eye,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeChunkTableProps {
  agentType: AgentType;
  category?: string;
  onRefresh?: () => void;
}

export function KnowledgeChunkTable({
  agentType,
  category,
  onRefresh,
}: KnowledgeChunkTableProps) {
  const [chunks, setChunks] = useState<NormalizedKnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedChunk, setSelectedChunk] = useState<NormalizedKnowledgeChunk | null>(null);
  const [deleteChunk, setDeleteChunk] = useState<NormalizedKnowledgeChunk | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  const agentConfig = AGENT_CONFIGS[agentType];
  const categories = getCategoriesForAgent(agentType);

  const loadChunks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getKnowledgeChunks(
        agentType,
        category,
        searchQuery || undefined,
        pageSize,
        (page - 1) * pageSize
      );
      setChunks(result?.chunks || []);
      setTotalCount(result?.total || 0);
    } catch (error) {
      console.error('Failed to load chunks:', error);
      // Ensure chunks is always an array even on error
      setChunks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [agentType, category, searchQuery, page]);

  useEffect(() => {
    loadChunks();
  }, [loadChunks]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [agentType, category, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadChunks();
  };

  const handleDelete = async () => {
    if (!deleteChunk) return;

    setDeleting(true);
    try {
      await deleteKnowledgeChunk(agentType, deleteChunk.id);
      await loadChunks();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete chunk:', error);
    } finally {
      setDeleting(false);
      setDeleteChunk(null);
    }
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Knowledge Chunks
            </CardTitle>
            <CardDescription>
              {totalCount} chunks in {agentConfig.name} knowledge base
              {category && ` - ${categories[category]?.label || category}`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </form>
            <Button
              variant="outline"
              size="icon"
              onClick={loadChunks}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading && chunks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chunks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">No knowledge chunks found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search query
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Content</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chunks.map((chunk) => (
                    <TableRow key={chunk.id}>
                      <TableCell>
                        <div className="max-w-[400px]">
                          <p className="text-sm line-clamp-2">
                            {truncateContent(chunk.content)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={categories[chunk.category]?.color}
                        >
                          {categories[chunk.category]?.label || chunk.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {chunk.source_url ? (
                            <a
                              href={chunk.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {chunk.source_title || 'View Source'}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {chunk.source_title || 'Direct Input'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(chunk.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedChunk(chunk)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Content
                            </DropdownMenuItem>
                            {chunk.source_url && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={chunk.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Source
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteChunk(chunk)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* View Chunk Dialog */}
      <Dialog open={!!selectedChunk} onOpenChange={() => setSelectedChunk(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Knowledge Chunk</DialogTitle>
            <DialogDescription>
              {selectedChunk && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${agentConfig.color}10`,
                      borderColor: agentConfig.color,
                      color: agentConfig.color,
                    }}
                  >
                    {agentConfig.name}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={categories[selectedChunk.category]?.color}
                  >
                    {categories[selectedChunk.category]?.label || selectedChunk.category}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedChunk && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Content</h4>
                <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {selectedChunk.content}
                </div>
              </div>

              {selectedChunk.source_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Source</h4>
                  <a
                    href={selectedChunk.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedChunk.source_title || selectedChunk.source_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created {formatTime(selectedChunk.created_at)}</span>
                {selectedChunk.chunk_index !== undefined && (
                  <span>
                    Chunk {selectedChunk.chunk_index + 1}
                    {selectedChunk.total_chunks && ` of ${selectedChunk.total_chunks}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteChunk} onOpenChange={() => setDeleteChunk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Knowledge Chunk
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this knowledge chunk? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteChunk && (
            <div className="p-4 bg-muted rounded-lg text-sm line-clamp-3">
              {truncateContent(deleteChunk.content, 200)}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteChunk(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Compact Chunk List for sidebar/summary views
interface CompactChunkListProps {
  agentType: AgentType;
  category?: string;
  maxItems?: number;
}

export function CompactChunkList({
  agentType,
  category,
  maxItems = 5,
}: CompactChunkListProps) {
  const [chunks, setChunks] = useState<NormalizedKnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = getCategoriesForAgent(agentType);

  useEffect(() => {
    const loadChunks = async () => {
      setLoading(true);
      try {
        const result = await getKnowledgeChunks(agentType, category, undefined, maxItems);
        setChunks(result?.chunks || []);
      } catch (error) {
        console.error('Failed to load chunks:', error);
        setChunks([]);
      } finally {
        setLoading(false);
      }
    };

    loadChunks();
  }, [agentType, category, maxItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No chunks found
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {chunks.map((chunk) => (
        <div
          key={chunk.id}
          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <p className="text-sm line-clamp-2 mb-2">{chunk.content}</p>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', categories[chunk.category]?.color)}
            >
              {categories[chunk.category]?.label || chunk.category}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
