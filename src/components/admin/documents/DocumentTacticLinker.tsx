// DocumentTacticLinker Component
// Modal for linking documents to tactics

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Plus, Sparkles } from 'lucide-react';
import { useDocumentTacticLinks } from '@/hooks/useDocumentTacticLinks';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { fetchAllTactics } from '@/services/documentService';
import {
  TACTIC_LINK_TYPES,
  type GHDocument,
  type GHDocumentTacticLink,
  type TacticLinkType,
  getConfidenceColorClass,
} from '@/types/documents';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DocumentTacticLinkerProps {
  document: GHDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onLinksUpdated: () => void;
}

export const DocumentTacticLinker = ({
  document,
  isOpen,
  onClose,
  onLinksUpdated,
}: DocumentTacticLinkerProps) => {
  const [tactics, setTactics] = useState<{ tactic_id: string; tactic_name: string }[]>([]);
  const [existingLinks, setExistingLinks] = useState<GHDocumentTacticLink[]>([]);
  const [tacticSearch, setTacticSearch] = useState('');
  const [selectedTacticId, setSelectedTacticId] = useState('');
  const [linkType, setLinkType] = useState<TacticLinkType>('recommended');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isLoadingTactics, setIsLoadingTactics] = useState(true);

  const { createLink, deleteLink, fetchLinks, isLoading } = useDocumentTacticLinks();

  // AI Suggestions
  const existingTacticIds = existingLinks.map((link) => link.tactic_id);
  const {
    suggestions: aiSuggestions,
    isLoading: isLoadingSuggestions,
    refetch: refetchSuggestions,
  } = useAISuggestions(document?.id || null, existingTacticIds, isOpen);

  useEffect(() => {
    if (isOpen && document) {
      loadData();
    }
  }, [isOpen, document]);

  const loadData = async () => {
    if (!document) return;

    setIsLoadingTactics(true);
    try {
      const [tacticsData, linksData] = await Promise.all([
        fetchAllTactics(),
        fetchLinks(document.id),
      ]);
      setTactics(tacticsData);
      setExistingLinks(linksData);
    } catch (error) {
      console.error('Error loading tactic linker data:', error);
    } finally {
      setIsLoadingTactics(false);
    }
  };

  const filteredTactics = tactics.filter(
    (tactic) =>
      tactic.tactic_name.toLowerCase().includes(tacticSearch.toLowerCase()) &&
      !existingLinks.some((link) => link.tactic_id === tactic.tactic_id)
  );

  const handleAddLink = async () => {
    if (!document || !selectedTacticId) return;

    const success = await createLink(
      document.id,
      selectedTacticId,
      linkType,
      displayOrder
    );

    if (success) {
      setSelectedTacticId('');
      setTacticSearch('');
      setDisplayOrder(displayOrder + 1);
      await loadData();
      onLinksUpdated();
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    const success = await deleteLink(linkId);
    if (success) {
      await loadData();
      onLinksUpdated();
    }
  };

  const handleQuickLinkFromAI = async (
    tacticId: string,
    tacticName: string,
    suggestedLinkType: TacticLinkType
  ) => {
    if (!document) return;

    const success = await createLink(
      document.id,
      tacticId,
      suggestedLinkType,
      displayOrder
    );

    if (success) {
      toast.success(`Linked "${tacticName}" successfully!`);
      setDisplayOrder(displayOrder + 1);
      await loadData();
      await refetchSuggestions();
      onLinksUpdated();
    }
  };

  const selectedTactic = tactics.find((t) => t.tactic_id === selectedTacticId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Document to Tactics</DialogTitle>
          <DialogDescription>
            Connect "{document?.document_name}" to relevant tactics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Link */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Search Tactics</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a tactic..."
                    value={tacticSearch}
                    onChange={(e) => setTacticSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {tacticSearch && filteredTactics.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredTactics.slice(0, 10).map((tactic) => (
                      <button
                        key={tactic.tactic_id}
                        type="button"
                        onClick={() => {
                          setSelectedTacticId(tactic.tactic_id);
                          setTacticSearch('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm border-b last:border-b-0"
                      >
                        {tactic.tactic_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTactic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-md">
                    <span className="text-sm font-medium">{selectedTactic.tactic_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTacticId('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Link Type</Label>
                      <Select
                        value={linkType}
                        onValueChange={(value) => setLinkType(value as TacticLinkType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TACTIC_LINK_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddLink} disabled={isLoading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggested Tactics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <h4 className="text-sm font-semibold">AI Suggested Tactics</h4>
              {!isLoadingSuggestions && aiSuggestions.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {aiSuggestions.length} suggestions
                </Badge>
              )}
            </div>

            {isLoadingSuggestions ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : aiSuggestions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No AI suggestions available for this document
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggestions are based on document category, keywords, and tactic relevance
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((suggestion) => (
                  <Card key={suggestion.tacticId} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">
                              {suggestion.tacticName}
                            </p>
                            <Badge
                              className={`flex-shrink-0 text-xs ${getConfidenceColorClass(
                                suggestion.confidence
                              )}`}
                            >
                              {suggestion.confidence}% match
                            </Badge>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.tacticId}
                            </Badge>
                            <Badge
                              variant={
                                suggestion.suggestedLinkType === 'required'
                                  ? 'destructive'
                                  : suggestion.suggestedLinkType === 'recommended'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {suggestion.suggestedLinkType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {suggestion.matchReasons}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleQuickLinkFromAI(
                              suggestion.tacticId,
                              suggestion.tacticName,
                              suggestion.suggestedLinkType
                            )
                          }
                          disabled={isLoading}
                          className="flex-shrink-0"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Existing Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Existing Links ({existingLinks.length})</h4>
            {isLoadingTactics ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : existingLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tactics linked yet
              </p>
            ) : (
              <div className="space-y-2">
                {existingLinks
                  .sort((a, b) => (a.display_order || 999) - (b.display_order || 999))
                  .map((link) => {
                    const tactic = tactics.find((t) => t.tactic_id === link.tactic_id);
                    return (
                      <Card key={link.id}>
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="outline" className="flex-shrink-0">
                              #{link.display_order || '?'}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tactic?.tactic_name || link.tactic_id}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant={
                                    link.link_type === 'required'
                                      ? 'destructive'
                                      : link.link_type === 'recommended'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {link.link_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLink(link.id)}
                            disabled={isLoading}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
