// ============================================================================
// SEARCH RESULTS COMPONENT
// ============================================================================
// Displays compliance search results as cards with "Save to Binder" functionality,
// source citations, relevance scores, and expandable content.
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import type { ComplianceSearchResult } from '@/services/complianceSearchService';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResultsProps {
  results: ComplianceSearchResult[];
  isLoading: boolean;
  query: string;
  savedItemIds?: Set<string>;
  onSaveToBinder?: (result: ComplianceSearchResult) => void;
  onRemoveFromBinder?: (chunkId: string) => void;
  isSaving?: boolean;
  emptyMessage?: string;
  showRelevanceScore?: boolean;
  className?: string;
}

interface ResultCardProps {
  result: ComplianceSearchResult;
  isSaved: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  isSaving?: boolean;
  showRelevanceScore?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const words = query.trim().split(/\s+/);
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function formatRelevanceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Clean content by removing Tactic labels, orphaned list numbers, and formatting issues
 * Removes patterns like "**Tactic M002:**" or "Tactic M002:"
 * Also cleans up truncated list items that result in orphaned numbers like "... 4"
 */
function cleanContent(content: string): string {
  // Remove tactic labels with various formats
  let cleaned = content
    // Remove "**Tactic M###:**" or "**Tactic M###**:" patterns
    .replace(/\*\*Tactic\s+[A-Z]?\d+:?\*\*:?\s*/gi, '')
    // Remove "Tactic M###:" without asterisks
    .replace(/Tactic\s+[A-Z]?\d+:\s*/gi, '')
    // Remove standalone "None" at beginning of lines
    .replace(/^None\n/gm, '')
    .replace(/\nNone\n/g, '\n')
    // Remove orphaned list numbers at the end (e.g., "... 4" or ". 3")
    .replace(/[.\s]+\d+\s*$/g, '')
    // Remove trailing ellipsis followed by just a number (like "...4" or "... 4")
    .replace(/\.{2,}\s*\d+\s*$/g, '')
    // Clean up standalone numbers at end of content (orphaned from truncation)
    .replace(/\s+\d+\.?\s*$/g, '')
    // Fix double numbering: "1. 1." -> "1."
    .replace(/(\d+)\.\s+\1\./g, '$1.')
    // Fix patterns like "1. 1 " (number repeated without period)
    .replace(/(\d+)\.\s+\1\s/g, '$1. ')
    // Remove empty bullet points (lines with just "•" or "-" followed by whitespace/nothing)
    .replace(/^[•\-]\s*$/gm, '')
    .replace(/\n[•\-]\s*\n/g, '\n')
    // Clean up multiple consecutive newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Clean up any resulting double spaces
    .replace(/\s{2,}/g, ' ')
    // Remove trailing punctuation oddities (multiple periods, etc.)
    .replace(/[.\s]{2,}$/g, '.')
    // Trim leading/trailing whitespace
    .trim();

  return cleaned;
}

/**
 * Clean title by removing markdown formatting for plain text display
 * Strips **bold**, *italic*, and ## header markers
 */
function cleanTitle(title: string): string {
  return title
    // Remove markdown header markers (## or ###)
    .replace(/^#{1,6}\s+/g, '')
    // Remove bold markers (**text** -> text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markers (*text* -> text)
    .replace(/\*([^*]+)\*/g, '$1')
    // Clean up any double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parse inline markdown (bold, italic) within a text segment
 */
function parseInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentKey = 0;

  // Regex to match **bold** and *italic* patterns
  const boldItalicRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const segments = text.split(boldItalicRegex);

  segments.forEach((segment) => {
    if (!segment) return;

    if (segment.startsWith('**') && segment.endsWith('**')) {
      // Bold text
      const innerText = segment.slice(2, -2);
      parts.push(
        <strong key={`${keyPrefix}-${currentKey++}`} className="font-semibold text-foreground">
          {innerText}
        </strong>
      );
    } else if (segment.startsWith('*') && segment.endsWith('*') && !segment.startsWith('**')) {
      // Italic text
      const innerText = segment.slice(1, -1);
      parts.push(
        <em key={`${keyPrefix}-${currentKey++}`} className="italic">
          {innerText}
        </em>
      );
    } else if (segment) {
      parts.push(<span key={`${keyPrefix}-${currentKey++}`}>{segment}</span>);
    }
  });

  return parts;
}

/**
 * Parse basic markdown syntax and return formatted React nodes
 * Handles **bold**, *italic*, numbered lists, bullet lists, callouts, and line breaks
 * Styled for professional compliance document appearance
 */
function parseMarkdown(content: string): React.ReactNode {
  // First clean the content
  const cleanedContent = cleanContent(content);

  // Split into lines for processing
  const lines = cleanedContent.split('\n');
  const elements: React.ReactNode[] = [];
  let currentKey = 0;
  let currentList: { type: 'numbered' | 'bullet'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'numbered') {
        elements.push(
          <ol key={`list-${currentKey++}`} className="list-decimal pl-6 space-y-2 my-4 text-sm text-muted-foreground">
            {currentList.items}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${currentKey++}`} className="list-disc pl-6 space-y-2 my-4 text-sm text-muted-foreground">
            {currentList.items}
          </ul>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Skip empty lines but flush any current list
    if (!trimmedLine) {
      flushList();
      return;
    }

    // Check for special callouts (Lynette's tip, Note, Important, etc.)
    const calloutMatch = trimmedLine.match(/^(?:\*\*)?(Lynette'?s?\s+tip|Note|Important|Tip|Warning|Example)(?:\*\*)?:?\s*(.*)$/i);
    if (calloutMatch) {
      flushList();
      const calloutType = calloutMatch[1];
      const calloutContent = calloutMatch[2] || '';
      elements.push(
        <div key={`callout-${currentKey++}`} className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 my-4 rounded-r-md">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1 flex items-center gap-2">
            <span className="text-amber-600">💡</span> {calloutType}:
          </p>
          {calloutContent && (
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
              {parseInlineMarkdown(calloutContent, `callout-content-${lineIndex}`)}
            </p>
          )}
        </div>
      );
      return;
    }

    // Check for markdown headers (## Header or ### Subheader)
    const markdownHeaderMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (markdownHeaderMatch) {
      flushList();
      const headerLevel = markdownHeaderMatch[1].length;
      const headerText = markdownHeaderMatch[2].replace(/\*\*/g, '').trim();

      if (headerLevel <= 2) {
        // Main section headers - large and bold
        elements.push(
          <h3 key={`header-${currentKey++}`} className="text-lg font-bold text-foreground mt-6 mb-3 border-b border-border/50 pb-2">
            {headerText}
          </h3>
        );
      } else {
        // Sub-headers - medium bold
        elements.push(
          <h4 key={`header-${currentKey++}`} className="text-base font-semibold text-foreground mt-5 mb-2">
            {headerText}
          </h4>
        );
      }
      return;
    }

    // Check for numbered list items (1. item, 1) item, etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      const itemContent = numberedMatch[2];
      // Skip if item content is empty or just whitespace
      if (!itemContent.trim()) return;

      if (currentList?.type !== 'numbered') {
        flushList();
        currentList = { type: 'numbered', items: [] };
      }
      currentList.items.push(
        <li key={`item-${currentKey++}`} className="leading-relaxed">
          {parseInlineMarkdown(itemContent, `li-${lineIndex}`)}
        </li>
      );
      return;
    }

    // Check for bullet list items (- item, • item, * item at start of line)
    const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      const itemContent = bulletMatch[1];
      // Skip if item content is empty or just whitespace
      if (!itemContent.trim()) return;

      if (currentList?.type !== 'bullet') {
        flushList();
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(
        <li key={`item-${currentKey++}`} className="leading-relaxed">
          {parseInlineMarkdown(itemContent, `li-${lineIndex}`)}
        </li>
      );
      return;
    }

    // Check for section headers (lines ending with : that are short, often bold)
    const headerMatch = trimmedLine.match(/^(?:\*\*)?([^:*]+)(?:\*\*)?:$/);
    if (headerMatch && trimmedLine.length < 80) {
      flushList();
      const headerText = headerMatch[1].trim();
      elements.push(
        <h4 key={`header-${currentKey++}`} className="text-base font-semibold text-foreground mt-5 mb-2">
          {headerText}:
        </h4>
      );
      return;
    }

    // Check for bold-only lines (likely sub-headers without colon)
    const boldLineMatch = trimmedLine.match(/^\*\*([^*]+)\*\*$/);
    if (boldLineMatch) {
      flushList();
      elements.push(
        <h4 key={`header-${currentKey++}`} className="text-base font-semibold text-foreground mt-5 mb-2">
          {boldLineMatch[1]}
        </h4>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${currentKey++}`} className="text-sm text-muted-foreground leading-relaxed mb-3">
        {parseInlineMarkdown(trimmedLine, `p-${lineIndex}`)}
      </p>
    );
  });

  // Flush any remaining list
  flushList();

  return <div className="space-y-2">{elements}</div>;
}

function getSectionTypeColor(sectionType?: string): string {
  const colors: Record<string, string> = {
    licensure: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    fha: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    local: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    definitions: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    staffing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    physical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    operations: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    populations: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return colors[sectionType || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

// ============================================================================
// RESULT CARD COMPONENT
// ============================================================================

function ResultCard({
  result,
  isSaved,
  onSave,
  onRemove,
  isSaving,
  showRelevanceScore = false, // Hidden by default - users find percentages confusing
}: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Clean content first, then truncate for preview
  const cleanedContentForPreview = cleanContent(result.content);
  const previewLength = 300;
  const shouldTruncate = cleanedContentForPreview.length > previewLength;
  const previewContent = shouldTruncate
    ? cleanedContentForPreview.substring(0, previewLength) + '...'
    : cleanedContentForPreview;

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title with state badge */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {result.state_code && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {result.state_code}
                </Badge>
              )}
              {result.section_type && (
                <Badge className={getSectionTypeColor(result.section_type)}>
                  {result.section_type.charAt(0).toUpperCase() + result.section_type.slice(1)}
                </Badge>
              )}
              {showRelevanceScore && result.similarity_score && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-help"
                      >
                        <Sparkles className="h-3 w-3" />
                        {formatRelevanceScore(result.similarity_score)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Relevance score based on semantic similarity</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Title and source citation */}
            {(result.title || result.regulation_code) && (
              <CardTitle className="text-base font-medium line-clamp-2">
                <FileText className="h-4 w-4 inline-block mr-1.5 text-muted-foreground" />
                {cleanTitle(result.title || result.regulation_code || '')}
              </CardTitle>
            )}
          </div>

          {/* Save to Binder Button */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSaved ? 'default' : 'outline'}
                    size="sm"
                    onClick={isSaved ? onRemove : onSave}
                    disabled={isSaving}
                    className="shrink-0"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 mr-1.5" />
                        Saved
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSaved
                    ? 'Remove from your Compliance Binder'
                    : 'Save to your Compliance Binder'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Preview content with markdown parsing */}
          <div className="text-sm text-muted-foreground leading-relaxed">
            {isExpanded ? parseMarkdown(result.content) : parseMarkdown(previewContent)}
          </div>

          {/* Expand/Collapse button */}
          {shouldTruncate && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs h-7 px-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Read more
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}

          <CollapsibleContent className="mt-0" />
        </Collapsible>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-7 px-2"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>

          {result.source_url && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs h-7 px-2"
            >
              <a
                href={result.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Source
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ResultSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SearchResults({
  results,
  isLoading,
  query,
  savedItemIds = new Set(),
  onSaveToBinder,
  onRemoveFromBinder,
  isSaving = false,
  emptyMessage = 'No results found. Try adjusting your search query or filters.',
  showRelevanceScore = false, // Hidden by default - users find percentages confusing
  className = '',
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <ResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state (only show if there was a query)
  if (results.length === 0 && query.trim()) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // No query state
  if (!query.trim()) {
    return null;
  }

  // Results
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 inline-block mr-1.5 text-green-600" />
          Found <span className="font-medium text-foreground">{results.length}</span>{' '}
          {results.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {/* Result cards */}
      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            isSaved={savedItemIds.has(result.id)}
            onSave={() => onSaveToBinder?.(result)}
            onRemove={() => onRemoveFromBinder?.(result.id)}
            isSaving={isSaving}
            showRelevanceScore={showRelevanceScore}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SearchResults;
