// ============================================================================
// FULL BINDER READER COMPONENT
// ============================================================================
// Main reader component for viewing complete state compliance binders.
// Provides a full-document reading experience with TOC navigation.
// This is the "$100M feature" - a clean, scrollable binder for each state.
// ============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Copy,
  Check,
  Printer,
  FileText,
  MapPin,
  Hash,
  ArrowUp,
  BookmarkPlus,
  Plus,
  Loader2,
} from 'lucide-react';
import type { StateBinder, BinderSectionHeader, StateCode } from '@/types/compliance';
import {
  getPrimaryBinderForState,
  createBinder,
  addBinderItem,
} from '@/services/complianceBinderService';
import {
  prepareAutoPopulatedItemsEnhanced,
  getSectionTypeLabel,
} from '@/utils/binderSectionParser';

// ============================================================================
// TYPES
// ============================================================================

export interface FullBinderReaderProps {
  binder: StateBinder | null;
  isLoading?: boolean;
  error?: Error | null;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWordCount(count: number | null): string {
  if (!count) return 'N/A';
  return count.toLocaleString() + ' words';
}

function estimateReadingTime(wordCount: number | null): string {
  if (!wordCount) return 'N/A';
  const minutes = Math.ceil(wordCount / 200); // Average reading speed
  return `${minutes} min read`;
}

/**
 * Parse markdown content into sections based on h2 headers
 * Each section includes the h2 title and all content until the next h2
 */
interface ParsedSection {
  id: string;
  title: string;
  content: string;
}

function parseContentIntoSections(content: string): ParsedSection[] {
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let introContent: string[] = [];

  for (const line of lines) {
    // Check if this is an h2 header
    const h2Match = line.match(/^## (.+)$/);

    if (h2Match) {
      // Save the previous section
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: currentSection.content.trim(),
        });
      }

      // Start a new section
      const title = h2Match[1].trim();
      currentSection = {
        id: generateSectionId(title, 2),
        title,
        content: line + '\n',
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    } else {
      // Content before first h2 (introduction)
      introContent.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: currentSection.content.trim(),
    });
  }

  // If there's intro content, add it as the first section
  if (introContent.length > 0 && introContent.some(l => l.trim())) {
    sections.unshift({
      id: 'section-h2-introduction',
      title: 'Introduction',
      content: introContent.join('\n').trim(),
    });
  }

  return sections;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BinderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Generate consistent section ID from title
 * Used by both TOC and ReactMarkdown to ensure IDs match
 */
function generateSectionId(title: string, level: number): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `section-h${level}-${slug}`;
}

function TableOfContents({
  headers,
  activeSection,
  onSectionClick,
}: {
  headers: BinderSectionHeader[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
}) {
  if (headers.length === 0) return null;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1">
          {headers.map((header) => {
            // Generate consistent ID from title (matches ReactMarkdown rendering)
            const sectionId = generateSectionId(header.title, header.level);
            return (
              <button
                key={header.id}
                onClick={() => onSectionClick(sectionId)}
                className={`w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors flex items-center gap-1 ${
                  header.level === 3 ? 'pl-5' : ''
                } ${
                  activeSection === sectionId
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ChevronRight className={`h-3 w-3 flex-shrink-0 ${
                  activeSection === sectionId ? 'text-primary' : 'text-muted-foreground/50'
                }`} />
                <span className="truncate">{header.title}</span>
              </button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}

function NoBinder({ stateName }: { stateName?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Binder Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {stateName
            ? `The compliance binder for ${stateName} is not yet available. Check back soon.`
            : 'Select a state to view its compliance binder.'
          }
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FullBinderReader({
  binder,
  isLoading = false,
  error = null,
  onSectionClick,
  className = '',
}: FullBinderReaderProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSavingFull, setIsSavingFull] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse binder content into sections
  const parsedSections = useMemo(() => {
    if (!binder) return [];
    return parseContentIntoSections(binder.content);
  }, [binder]);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setShowScrollTop(contentRef.current.scrollTop > 500);
      }
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('scroll', handleScroll);
      return () => contentEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Check if binder is already saved when component mounts or binder changes
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!binder) {
        setIsAlreadySaved(false);
        return;
      }

      try {
        const stateCode = binder.state_code as StateCode;
        const existingBinder = await getPrimaryBinderForState(stateCode);
        setIsAlreadySaved(!!existingBinder);
      } catch (error) {
        // User might not be authenticated, that's ok
        setIsAlreadySaved(false);
      }
    };

    checkIfSaved();
  }, [binder]);

  // Handle section click - scroll to section and open accordion
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);

    // Determine if this is an h2 or h3 section
    const isH3Section = sectionId.startsWith('section-h3-');

    if (isH3Section) {
      // For h3 sections, we need to find and open the parent h2 accordion
      // h3 sections are rendered INSIDE h2 accordion content
      // Find which h2 section contains this h3 by checking binder.section_headers
      const h3Header = binder?.section_headers.find(
        h => h.level === 3 && generateSectionId(h.title, h.level) === sectionId
      );

      if (h3Header && binder?.section_headers) {
        // Find the preceding h2 section (the parent)
        const h3Index = binder.section_headers.findIndex(h => h === h3Header);
        let parentH2Id: string | null = null;

        // Walk backwards from h3 to find its parent h2
        for (let i = h3Index - 1; i >= 0; i--) {
          const header = binder.section_headers[i];
          if (header.level === 2) {
            parentH2Id = generateSectionId(header.title, 2);
            break;
          }
        }

        // Open the parent h2 accordion if found
        if (parentH2Id && !openSections.includes(parentH2Id)) {
          setOpenSections((prev) => [...prev, parentH2Id!]);
        }
      }
    } else {
      // For h2 sections, open directly
      if (!openSections.includes(sectionId)) {
        setOpenSections((prev) => [...prev, sectionId]);
      }
    }

    // Find the element and scroll to it after a small delay to allow accordion to open
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element && contentRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150); // Slightly longer delay to ensure accordion animation completes

    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  // Handle copy content
  const handleCopyContent = async () => {
    if (!binder) return;

    try {
      await navigator.clipboard.writeText(binder.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle print - creates a clean print view of just the binder content
  const handlePrint = () => {
    // Create a new window with just the binder content for clean printing
    const printWindow = window.open('', '_blank');
    if (!printWindow || !binder) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${binder.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
          }
          .header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .header .meta {
            font-size: 0.875rem;
            color: #666;
          }
          .header .badge {
            display: inline-block;
            background: #f0f0f0;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            margin-right: 0.5rem;
          }
          h2 {
            font-size: 1.25rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 0.25rem;
          }
          h3 {
            font-size: 1.1rem;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: #444;
          }
          p {
            margin-bottom: 0.75rem;
          }
          ul, ol {
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
          }
          li {
            margin-bottom: 0.25rem;
          }
          strong {
            font-weight: 600;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 0.75in;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <span class="badge">${binder.state_code}</span>
            <span class="badge">${binder.word_count?.toLocaleString() || 'N/A'} words</span>
          </div>
          <h1>${binder.title}</h1>
          <p class="meta">${binder.state_name} Unlicensed Housing Compliance Binder</p>
          <p class="meta">Last Updated: ${binder.last_updated ? new Date(binder.last_updated).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div class="content">
          ${binder.content
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^([^<])/gm, '<p>$1')
            .replace(/([^>])$/gm, '$1</p>')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Close after print dialog (optional - some users may want to keep it)
      // printWindow.close();
    };
  };

  // Handle scroll to top
  const handleScrollTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Get or create user's binder for this state
  const getOrCreateUserBinder = useCallback(async () => {
    if (!binder) return null;

    const stateCode = binder.state_code as StateCode;

    // Check if user already has a binder for this state
    let userBinder = await getPrimaryBinderForState(stateCode);

    if (!userBinder) {
      // Create a new binder for this state
      userBinder = await createBinder({
        state_code: stateCode,
        title: `My ${binder.state_name} Compliance Binder`,
      });
    }

    return userBinder;
  }, [binder]);

  // Handle save full binder with auto-population
  const handleSaveFullBinder = useCallback(async () => {
    if (!binder) return;

    setIsSavingFull(true);
    try {
      const userBinder = await getOrCreateUserBinder();
      if (!userBinder) {
        throw new Error('Could not create binder');
      }

      // Phase 1 & 2: Auto-populate sections with enhanced extraction
      const autoPopulatedItems = prepareAutoPopulatedItemsEnhanced(
        binder.content,
        binder.state_name
      );

      // Save the full binder content as a single item
      // Using 'general' section_type since 'full_binder' is not in the DB constraint
      await addBinderItem({
        binder_id: userBinder.id,
        title: binder.title,
        chunk_content: binder.content,
        section_type: 'general',
        source_url: `State Compliance Binder: ${binder.state_code}`,
      });

      // Auto-populate individual sections for easy categorization
      let successCount = 0;
      for (const item of autoPopulatedItems) {
        try {
          // Format key points as user notes
          let userNotes = '';
          if (item.keyPoints && item.keyPoints.length > 0) {
            const highPriority = item.keyPoints.filter(p => p.importance === 'high');
            const mediumPriority = item.keyPoints.filter(p => p.importance === 'medium');

            if (highPriority.length > 0) {
              userNotes += '**Key Requirements:**\n';
              userNotes += highPriority.map(p => `• ${p.text}`).join('\n');
              userNotes += '\n\n';
            }

            if (mediumPriority.length > 0) {
              userNotes += '**Important Notes:**\n';
              userNotes += mediumPriority.map(p => `• ${p.text}`).join('\n');
            }
          }

          if (item.summary) {
            userNotes = `**Summary:** ${item.summary}\n\n` + userNotes;
          }

          await addBinderItem({
            binder_id: userBinder.id,
            title: item.title,
            chunk_content: item.content,
            section_type: item.sectionType,
            source_url: `State Compliance Binder: ${binder.state_code}`,
            user_notes: userNotes.trim() || undefined,
          });
          successCount++;
        } catch (sectionError) {
          // Log but don't fail the whole operation for individual section failures
          console.warn(`Failed to save section "${item.title}":`, sectionError);
        }
      }

      const sectionMessage = successCount > 0
        ? ` Plus ${successCount} sections auto-organized for you.`
        : '';

      // Mark as saved so button updates
      setIsAlreadySaved(true);

      toast({
        title: 'Binder Saved!',
        description: `Full ${binder.state_name} binder added to your personal collection.${sectionMessage}`,
      });
    } catch (error) {
      console.error('Failed to save binder:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save the binder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFull(false);
    }
  }, [binder, getOrCreateUserBinder, toast]);

  // Extract section content from markdown
  const extractSectionContent = useCallback((title: string, level: number): string => {
    if (!binder) return '';

    const lines = binder.content.split('\n');
    const headerPrefix = '#'.repeat(level);
    let capturing = false;
    let capturedLines: string[] = [];

    for (const line of lines) {
      // Check if this is our target header
      if (line.startsWith(`${headerPrefix} `) && line.includes(title)) {
        capturing = true;
        capturedLines.push(line);
        continue;
      }

      // Check if we hit another header of same or higher level (stop capturing)
      if (capturing) {
        const h2Match = line.match(/^## /);
        const h3Match = line.match(/^### /);

        if (level === 2 && h2Match) {
          break; // Stop at next h2
        }
        if (level === 3 && (h2Match || h3Match)) {
          break; // Stop at next h2 or h3
        }

        capturedLines.push(line);
      }
    }

    return capturedLines.join('\n').trim();
  }, [binder]);

  // Handle save section
  const handleSaveSection = useCallback(async (title: string, level: number) => {
    if (!binder) return;

    const sectionId = generateSectionId(title, level);
    setSavingSectionId(sectionId);

    try {
      const userBinder = await getOrCreateUserBinder();
      if (!userBinder) {
        throw new Error('Could not create binder');
      }

      // Extract the section content
      const sectionContent = extractSectionContent(title, level);

      if (!sectionContent) {
        throw new Error('Could not extract section content');
      }

      // Save the section as a binder item
      // Using 'general' for all saved sections since 'section'/'subsection' not in DB constraint
      await addBinderItem({
        binder_id: userBinder.id,
        title: title,
        chunk_content: sectionContent,
        section_type: 'general',
        source_url: `State Compliance Binder: ${binder.state_code}`,
      });

      toast({
        title: 'Section Saved!',
        description: `"${title}" added to your personal binder.`,
      });
    } catch (error) {
      console.error('Failed to save section:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save the section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingSectionId(null);
    }
  }, [binder, getOrCreateUserBinder, extractSectionContent, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <BinderSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-medium">Error loading binder</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // No binder state
  if (!binder) {
    return <NoBinder />;
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6 ${className}`}>
      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {binder.state_code}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {formatWordCount(binder.word_count)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {estimateReadingTime(binder.word_count)}
                  </Badge>
                </div>
                <CardTitle className="text-xl md:text-2xl leading-tight">
                  {binder.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {binder.state_name} Unlicensed Housing Compliance Binder
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isAlreadySaved ? "outline" : "default"}
                        size="sm"
                        onClick={handleSaveFullBinder}
                        disabled={isSavingFull || isAlreadySaved}
                        className={isAlreadySaved
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                          : "bg-primary hover:bg-primary/90"
                        }
                      >
                        {isSavingFull ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isAlreadySaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                        <span className="sr-only sm:not-sr-only sm:ml-2">
                          {isSavingFull ? 'Saving...' : isAlreadySaved ? 'Added to Binder' : 'Add to My Binder'}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isAlreadySaved ? 'This binder is in your collection' : 'Save full binder to your personal collection'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="outline" size="sm" onClick={handleCopyContent}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only sm:not-sr-only sm:ml-2">
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Print</span>
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              {binder.effective_date && (
                <span>Effective: {formatDate(binder.effective_date)}</span>
              )}
              <span>Updated: {formatDate(binder.last_updated)}</span>
            </div>
          </CardHeader>
        </Card>

        {/* Binder Content - Collapsible Accordion Sections */}
        <Card className="overflow-hidden">
          <ScrollArea ref={contentRef} className="h-[calc(100vh-320px)] min-h-[400px]">
            <CardContent className="p-4 md:p-6">
              <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
                className="w-full"
              >
                {parsedSections.map((section, index) => {
                  const isSaving = savingSectionId === section.id;
                  // Remove the h2 header from content since it's in the trigger
                  const contentWithoutH2 = section.content.replace(/^## .+\n?/, '');

                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      id={section.id}
                      className="border rounded-lg mb-3 px-4 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-left font-semibold text-base">
                              {section.title}
                            </span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveSection(section.title, 2);
                                  }}
                                  disabled={isSaving}
                                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground print:hidden"
                                  aria-label={`Save "${section.title}" section to binder`}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Add this section to your binder</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-p:leading-relaxed prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-strong:text-foreground print:prose-sm">
                          <ReactMarkdown
                            components={{
                              // h3 subsections within accordion
                              h3: ({ children, ...props }) => {
                                const text = String(children);
                                const id = generateSectionId(text, 3);
                                const isSavingH3 = savingSectionId === id;
                                return (
                                  <div className="group flex items-start gap-2" id={id}>
                                    <h3 {...props} className="flex-1">
                                      {children}
                                    </h3>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => handleSaveSection(text, 3)}
                                            disabled={isSavingH3}
                                            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground print:hidden flex-shrink-0"
                                            aria-label={`Save "${text}" section to binder`}
                                          >
                                            {isSavingH3 ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Plus className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p>Add this section to your binder</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                );
                              },
                            }}
                          >
                            {contentWithoutH2}
                          </ReactMarkdown>
                        </article>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Expand/Collapse All buttons */}
              {parsedSections.length > 0 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenSections(parsedSections.map(s => s.id))}
                    disabled={openSections.length === parsedSections.length}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenSections([])}
                    disabled={openSections.length === 0}
                  >
                    Collapse All
                  </Button>
                </div>
              )}
            </CardContent>
          </ScrollArea>

          {/* Scroll to top button */}
          {showScrollTop && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 shadow-lg print:hidden"
              onClick={handleScrollTop}
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Top
            </Button>
          )}
        </Card>
      </div>

      {/* Sidebar - Table of Contents (desktop only) */}
      <aside className="hidden lg:block">
        <TableOfContents
          headers={binder.section_headers}
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
        />
      </aside>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FullBinderReader;
