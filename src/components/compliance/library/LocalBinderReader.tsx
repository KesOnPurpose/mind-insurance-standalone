// ============================================================================
// LOCAL BINDER READER COMPONENT
// ============================================================================
// Modal/reader component for viewing the full content of a local compliance
// binder (city or county). Similar to FullBinderReader but for local binders.
// ============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Building2,
  MapPinned,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Loader2,
  X,
  List,
  Hash,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { LocalBinder, StateCode, BinderSectionHeader } from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';
import { getLocalBinderById } from '@/services/localBinderService';

// ============================================================================
// TYPES
// ============================================================================

export interface LocalBinderReaderProps {
  /** The local binder to display (can be partial - will fetch full content) */
  binder?: LocalBinder | null;
  /** Binder ID to load (alternative to passing full binder) */
  binderId?: string;
  /** Whether the reader is open */
  isOpen: boolean;
  /** Callback when the reader is closed */
  onClose: () => void;
  /** Callback to navigate back to state view */
  onBackToState?: () => void;
  /** Display mode - dialog (centered) or sheet (side panel) */
  displayMode?: 'dialog' | 'sheet';
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
  level: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse markdown content into sections based on h2 headers
 */
function parseContentIntoSections(content: string): ParsedSection[] {
  if (!content) return [];

  const sections: ParsedSection[] = [];
  const lines = content.split('\n');
  let currentSection: ParsedSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for h2 headers (## Title)
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      // Strip ** markdown bold syntax from title for clean display
      const title = h2Match[1].trim().replace(/\*\*/g, '');
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title,
        content: '',
        level: 2,
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else {
      // Content before first h2 - create intro section
      if (!currentSection && line.trim()) {
        currentSection = {
          id: 'introduction',
          title: 'Introduction',
          content: '',
          level: 2,
        };
        currentContent.push(line);
      }
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
        <X className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium mb-2">Error Loading Binder</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

interface TableOfContentsProps {
  sections: ParsedSection[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
}

function TableOfContents({ sections, activeSection, onSectionClick }: TableOfContentsProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <List className="h-3 w-3" />
        Contents
      </div>
      <nav className="space-y-0.5">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted ${
              activeSection === section.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <span className="line-clamp-1">{section.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LocalBinderReader({
  binder: initialBinder,
  binderId,
  isOpen,
  onClose,
  onBackToState,
  displayMode = 'sheet',
}: LocalBinderReaderProps) {
  // State
  const [binder, setBinder] = useState<LocalBinder | null>(initialBinder || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showTOC, setShowTOC] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch full binder content if needed
  useEffect(() => {
    const fetchBinder = async () => {
      // Use initialBinder if it has content
      if (initialBinder?.content) {
        setBinder(initialBinder);
        return;
      }

      // Otherwise fetch by ID
      const idToFetch = binderId || initialBinder?.id;
      if (!idToFetch) {
        setError('No binder ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fullBinder = await getLocalBinderById(idToFetch);
        if (fullBinder) {
          setBinder(fullBinder);
        } else {
          setError('Binder not found');
        }
      } catch (err) {
        console.error('[LocalBinderReader] Error fetching binder:', err);
        setError(err instanceof Error ? err.message : 'Failed to load binder');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchBinder();
    }
  }, [isOpen, initialBinder, binderId]);

  // Parse content into sections
  const parsedSections = useMemo(() => {
    if (!binder?.content) return [];
    return parseContentIntoSections(binder.content);
  }, [binder?.content]);

  // Open first section by default
  useEffect(() => {
    if (parsedSections.length > 0 && openSections.length === 0) {
      setOpenSections([parsedSections[0].id]);
      setActiveSection(parsedSections[0].id);
    }
  }, [parsedSections, openSections.length]);

  // Handle section click from TOC
  const handleSectionClick = useCallback((sectionId: string) => {
    // Open the section if not already open
    setOpenSections((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
    setActiveSection(sectionId);

    // Scroll to section
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Re-trigger the effect by toggling a state
    setBinder(null);
  }, []);

  // Derived values
  const isCity = binder?.location_type === 'city';
  const stateName = binder?.state_code ? STATE_NAMES[binder.state_code] || binder.state_code : '';
  const locationLabel = isCity ? 'City' : 'County';
  const LocationIcon = isCity ? Building2 : MapPinned;

  // Content to render
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <ErrorState error={error} onRetry={handleRetry} />;
    }

    if (!binder) {
      return <ErrorState error="No binder data available" />;
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${
              isCity
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
            }`}
          >
            <LocationIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold truncate">{binder.location_name}</h2>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isCity
                    ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300'
                    : 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300'
                }`}
              >
                {locationLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stateName} Compliance Binder
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {binder.word_count?.toLocaleString() || 0} words
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {parsedSections.length} sections
              </span>
            </div>
          </div>
        </div>

        {/* Mobile TOC Toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTOC(!showTOC)}
            className="text-xs"
          >
            <List className="h-4 w-4 mr-1" />
            {showTOC ? 'Hide' : 'Show'} Contents
          </Button>
          {activeSection && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {parsedSections.find((s) => s.id === activeSection)?.title}
            </span>
          )}
        </div>

        {/* Mobile TOC Drawer */}
        {showTOC && (
          <div className="border-b p-4 bg-muted/20 lg:hidden">
            <TableOfContents
              sections={parsedSections}
              activeSection={activeSection}
              onSectionClick={(id) => {
                handleSectionClick(id);
                setShowTOC(false);
              }}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop TOC Sidebar */}
          <div className="hidden lg:block w-64 border-r bg-muted/10 overflow-y-auto p-4">
            <TableOfContents
              sections={parsedSections}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div ref={contentRef} className="p-4 space-y-2">
              <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
              >
                {parsedSections.map((section) => (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    id={`section-${section.id}`}
                    className="border rounded-lg mb-2 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline [&[data-state=open]]:bg-muted/30">
                      <div className="flex items-center gap-2 text-left">
                        <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none pt-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {section.content}
                        </ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {parsedSections.length === 0 && binder.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {binder.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          {onBackToState && (
            <Button variant="ghost" size="sm" onClick={onBackToState}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to {stateName}
            </Button>
          )}
          {!onBackToState && <div />}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  };

  // Render as Dialog or Sheet based on displayMode
  if (displayMode === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {binder?.location_name || 'Local'} Compliance Binder
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>
            {binder?.location_name || 'Local'} Compliance Binder
          </SheetTitle>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LocalBinderReader;
