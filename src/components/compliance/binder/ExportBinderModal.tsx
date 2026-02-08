// ============================================================================
// EXPORT BINDER MODAL COMPONENT
// ============================================================================
// Modal component for configuring and exporting compliance binder as PDF.
// Provides options for customizing the export format and content.
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Printer,
  Eye,
  FileText,
  Settings,
  Palette,
  Type,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  exportBinderToPDF,
  printBinder,
  downloadBinderHTML,
  generatePreview,
  type PDFExportOptions,
} from '@/services/pdfExportService';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportBinderModalProps {
  binderId: string;
  binderName: string;
  isOpen: boolean;
  onClose: () => void;
  onExportComplete?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExportBinderModal({
  binderId,
  binderName,
  isOpen,
  onClose,
  onExportComplete,
}: ExportBinderModalProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Export options state
  const [options, setOptions] = useState<PDFExportOptions>({
    includeSections: true,
    includeDocuments: true,
    includeNotes: true,
    includeCitations: true,
    includeTableOfContents: true,
    includeModelDefinition: true,
    includeWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    headerText: '',
    footerText: `Generated from ${binderName}`,
    fontSize: 'medium',
    colorScheme: 'color',
  });

  // Update a single option
  const updateOption = <K extends keyof PDFExportOptions>(
    key: K,
    value: PDFExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // Handle export as PDF
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportBinderToPDF(binderId, options);
      // Download the actual PDF file
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename; // Now downloads as actual PDF
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onExportComplete?.();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle print
  const handlePrint = async () => {
    setIsExporting(true);
    try {
      await printBinder(binderId, options);
      onExportComplete?.();
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const html = await generatePreview(binderId, options);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Open preview in new window
  const openPreviewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Clean up preview URL when closing
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export Compliance Binder
          </DialogTitle>
          <DialogDescription>
            Customize your PDF export settings and download a professional
            document to share with officials.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs sm:text-sm">
              <Palette className="h-4 w-4 mr-1.5" />
              Style
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px] mt-4 pr-4">
            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-0">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Include in Export</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="modelDef">Model Definition</Label>
                    <p className="text-xs text-muted-foreground">
                      Your one-sentence housing model description
                    </p>
                  </div>
                  <Switch
                    id="modelDef"
                    checked={options.includeModelDefinition}
                    onCheckedChange={(v) =>
                      updateOption('includeModelDefinition', v)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sections">Compliance Sections</Label>
                    <p className="text-xs text-muted-foreground">
                      State licensure, FHA, local ordinances
                    </p>
                  </div>
                  <Switch
                    id="sections"
                    checked={options.includeSections}
                    onCheckedChange={(v) => updateOption('includeSections', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notes">My Notes & Interpretations</Label>
                    <p className="text-xs text-muted-foreground">
                      Personal notes attached to each item
                    </p>
                  </div>
                  <Switch
                    id="notes"
                    checked={options.includeNotes}
                    onCheckedChange={(v) => updateOption('includeNotes', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="citations">Source Citations</Label>
                    <p className="text-xs text-muted-foreground">
                      Regulation codes and source URLs
                    </p>
                  </div>
                  <Switch
                    id="citations"
                    checked={options.includeCitations}
                    onCheckedChange={(v) => updateOption('includeCitations', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="documents">Uploaded Documents</Label>
                    <p className="text-xs text-muted-foreground">
                      List of attached documents
                    </p>
                  </div>
                  <Switch
                    id="documents"
                    checked={options.includeDocuments}
                    onCheckedChange={(v) => updateOption('includeDocuments', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="toc">Table of Contents</Label>
                    <p className="text-xs text-muted-foreground">
                      Navigation page at the beginning
                    </p>
                  </div>
                  <Switch
                    id="toc"
                    checked={options.includeTableOfContents}
                    onCheckedChange={(v) =>
                      updateOption('includeTableOfContents', v)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select
                    value={options.fontSize}
                    onValueChange={(v) =>
                      updateOption('fontSize', v as 'small' | 'medium' | 'large')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">
                        <div className="flex items-center">
                          <Type className="h-3 w-3 mr-2" />
                          Small
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center">
                          <Type className="h-4 w-4 mr-2" />
                          Medium (Recommended)
                        </div>
                      </SelectItem>
                      <SelectItem value="large">
                        <div className="flex items-center">
                          <Type className="h-5 w-5 mr-2" />
                          Large
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <Select
                    value={options.colorScheme}
                    onValueChange={(v) =>
                      updateOption(
                        'colorScheme',
                        v as 'color' | 'grayscale' | 'bw'
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 mr-2" />
                          Full Color
                        </div>
                      </SelectItem>
                      <SelectItem value="grayscale">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 mr-2" />
                          Grayscale
                        </div>
                      </SelectItem>
                      <SelectItem value="bw">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-black mr-2" />
                          Black & White
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Grayscale or B&W saves printer ink
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="watermark">Include Watermark</Label>
                    <p className="text-xs text-muted-foreground">
                      Diagonal watermark across pages
                    </p>
                  </div>
                  <Switch
                    id="watermark"
                    checked={options.includeWatermark}
                    onCheckedChange={(v) => updateOption('includeWatermark', v)}
                  />
                </div>

                {options.includeWatermark && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="watermarkText">Watermark Text</Label>
                    <Input
                      id="watermarkText"
                      value={options.watermarkText || ''}
                      onChange={(e) =>
                        updateOption('watermarkText', e.target.value)
                      }
                      placeholder="e.g., CONFIDENTIAL, DRAFT"
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={options.footerText || ''}
                    onChange={(e) => updateOption('footerText', e.target.value)}
                    placeholder="Text to appear at the bottom of each page"
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears at the bottom of every page
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Preview Section */}
        {previewUrl && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Preview Ready
              </Badge>
              <span className="text-sm text-muted-foreground">
                Open to review before exporting
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={openPreviewWindow}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open Preview
            </Button>
          </div>
        )}

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isPreviewing || isExporting}
          >
            {isPreviewing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-1.5" />
            )}
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-1.5" />
            )}
            Print
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ExportBinderModal;
