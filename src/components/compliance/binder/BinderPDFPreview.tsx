// ============================================================================
// BINDER PDF PREVIEW COMPONENT
// ============================================================================
// Inline preview component that shows a miniature version of the PDF output.
// Used in the export modal to give users a sense of what they'll get.
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { generatePreview, type PDFExportOptions } from '@/services/pdfExportService';

// ============================================================================
// TYPES
// ============================================================================

export interface BinderPDFPreviewProps {
  binderId: string;
  options?: PDFExportOptions;
  className?: string;
  showControls?: boolean;
  onOpenExternal?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BinderPDFPreview({
  binderId,
  options = {},
  className = '',
  showControls = true,
  onOpenExternal,
}: BinderPDFPreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [zoom, setZoom] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Load preview
  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const html = await generatePreview(binderId, options);
      setPreviewHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate preview'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and when options change
  useEffect(() => {
    loadPreview();
  }, [binderId, JSON.stringify(options)]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  // Open in new window
  const handleOpenExternal = () => {
    if (previewHtml) {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    onOpenExternal?.();
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="outline" size="sm" onClick={loadPreview}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No preview
  if (!previewHtml) {
    return null;
  }

  return (
    <Card className={className}>
      {showControls && (
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Preview</CardTitle>
              <Badge variant="outline" className="text-xs">
                {zoom}%
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={loadPreview}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleOpenExternal}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 overflow-auto bg-muted/50">
        <div
          className="min-h-[300px] max-h-[500px] overflow-auto p-4 flex justify-center"
          style={{ backgroundColor: '#525659' }}
        >
          <div
            className="bg-white shadow-xl"
            style={{
              width: `${(8.5 * 96 * zoom) / 100}px`, // Letter size at 96 DPI
              minHeight: `${(11 * 96 * zoom) / 100}px`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              srcDoc={previewHtml}
              title="PDF Preview"
              className="w-full h-full border-0"
              style={{
                minHeight: `${(11 * 96 * zoom) / 100}px`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT PREVIEW (for modal usage)
// ============================================================================

export function BinderPDFPreviewCompact({
  binderId,
  options = {},
  className = '',
}: Omit<BinderPDFPreviewProps, 'showControls' | 'onOpenExternal'>) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load preview
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const html = await generatePreview(binderId, options);
        setPreviewHtml(html);
      } catch {
        // Silent fail for compact preview
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [binderId, JSON.stringify(options)]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Skeleton className="h-32 w-24 rounded" />
      </div>
    );
  }

  if (!previewHtml) {
    return null;
  }

  return (
    <div
      className={`bg-white shadow-md rounded overflow-hidden ${className}`}
      style={{ width: '120px', height: '160px' }}
    >
      <iframe
        srcDoc={previewHtml}
        title="PDF Preview Thumbnail"
        className="w-full h-full border-0"
        style={{
          transform: 'scale(0.15)',
          transformOrigin: 'top left',
          width: '816px',
          height: '1056px',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BinderPDFPreview;
