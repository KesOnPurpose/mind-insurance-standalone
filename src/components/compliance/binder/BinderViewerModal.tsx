// ============================================================================
// BINDER VIEWER MODAL COMPONENT
// ============================================================================
// Full-screen modal for viewing the compiled compliance binder in-app.
// Allows users to preview their binder content without exporting.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ExternalLink,
  Download,
  Printer,
  X,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';
import {
  generatePreview,
  exportBinderToPDF,
  printBinder,
  type PDFExportOptions,
} from '@/services/pdfExportService';

// ============================================================================
// TYPES
// ============================================================================

export interface BinderViewerModalProps {
  binderId: string;
  binderName: string;
  isOpen: boolean;
  onClose: () => void;
  options?: PDFExportOptions;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BinderViewerModal({
  binderId,
  binderName,
  isOpen,
  onClose,
  options = {},
}: BinderViewerModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [zoom, setZoom] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Default options for viewing
  const viewerOptions: PDFExportOptions = {
    includeSections: true,
    includeDocuments: true,
    includeNotes: true,
    includeCitations: true,
    includeTableOfContents: true,
    includeModelDefinition: true,
    includeWatermark: false,
    fontSize: 'medium',
    colorScheme: 'color',
    ...options,
  };

  // Load preview
  const loadPreview = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    try {
      const html = await generatePreview(binderId, viewerOptions);
      setPreviewHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate preview'));
    } finally {
      setIsLoading(false);
    }
  }, [binderId, isOpen]);

  // Load on open
  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen, loadPreview]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      setPreviewHtml(null);
      setZoom(75);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 15, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 15, 30));
  };

  const handleZoomReset = () => {
    setZoom(75);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Open in new window
  const handleOpenExternal = () => {
    if (previewHtml) {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // Export as PDF
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportBinderToPDF(binderId, viewerOptions);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Print
  const handlePrint = async () => {
    setIsExporting(true);
    try {
      await printBinder(binderId, viewerOptions);
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomIn();
        }
      } else if (e.key === '-') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomOut();
        }
      } else if (e.key === '0') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? 'max-w-[100vw] h-[100vh] w-[100vw] m-0 rounded-none'
            : 'max-w-[90vw] max-h-[90vh] w-[1200px]'
        } flex flex-col p-0`}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {binderName}
              </DialogTitle>
              <Badge variant="outline" className="text-xs">
                Viewer
              </Badge>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-md px-2 py-1 bg-muted/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomOut}
                  disabled={zoom <= 30}
                  title="Zoom Out (Ctrl+-)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span
                  className="text-xs font-medium w-10 text-center cursor-pointer hover:text-primary"
                  onClick={handleZoomReset}
                  title="Reset Zoom (Ctrl+0)"
                >
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomIn}
                  disabled={zoom >= 150}
                  title="Zoom In (Ctrl++)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={loadPreview}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleOpenExternal}
                  disabled={!previewHtml}
                  title="Open in New Window"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrint}
                  disabled={isExporting || !previewHtml}
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleExport}
                  disabled={isExporting}
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div
          className="flex-1 overflow-auto"
          style={{ backgroundColor: '#525659' }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-3 text-white">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-sm">Generating preview...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-3 text-white">
                <FileText className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-300">{error.message}</p>
                <Button variant="secondary" size="sm" onClick={loadPreview}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Preview Content */}
          {previewHtml && !isLoading && !error && (
            <div className="p-6 flex justify-center">
              <div
                className="bg-white shadow-2xl rounded-sm transition-all duration-200"
                style={{
                  width: `${(8.5 * 96 * zoom) / 100}px`,
                  minHeight: `${(11 * 96 * zoom) / 100}px`,
                  transformOrigin: 'top center',
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Binder Preview"
                  className="w-full border-0"
                  style={{
                    minHeight: `${(11 * 96 * zoom) / 100}px`,
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Keyboard Shortcuts Hint */}
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">+/-</kbd>
              <span className="ml-1">Zoom</span>
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">0</kbd>
              <span className="ml-1">Reset</span>
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
          <div>
            Page size: Letter (8.5" × 11")
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BinderViewerModal;
