// ============================================================================
// EXPORT BINDER DIALOG COMPONENT
// ============================================================================
// Modal dialog for exporting compliance binders with customizable options
// including format selection, content toggles, and styling preferences.
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Download,
  FileText,
  Printer,
  Palette,
  Type,
  BookOpen,
  FileCheck,
  StickyNote,
  Quote,
  List,
  Droplets,
  Loader2,
} from 'lucide-react';
import {
  exportBinderToPDF,
  downloadBinderHTML,
  printBinder,
  type PDFExportOptions,
} from '@/services/pdfExportService';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportBinderDialogProps {
  binderId: string;
  binderName: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'html';
type FontSize = 'small' | 'medium' | 'large';
type ColorScheme = 'color' | 'grayscale' | 'bw';

interface ExportSettings extends PDFExportOptions {
  format: ExportFormat;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SETTINGS: ExportSettings = {
  format: 'pdf',
  includeSections: true,
  includeDocuments: true,
  includeNotes: true,
  includeCitations: true,
  includeTableOfContents: true,
  includeModelDefinition: true,
  includeWatermark: false,
  watermarkText: '',
  footerText: '',
  fontSize: 'medium',
  colorScheme: 'color',
};

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '9pt body text' },
  { value: 'medium', label: 'Medium', description: '11pt body text' },
  { value: 'large', label: 'Large', description: '13pt body text' },
];

const COLOR_SCHEME_OPTIONS: { value: ColorScheme; label: string; description: string }[] = [
  { value: 'color', label: 'Full Color', description: 'Blue accent colors' },
  { value: 'grayscale', label: 'Grayscale', description: 'Gray tones only' },
  { value: 'bw', label: 'Black & White', description: 'Print-optimized' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExportBinderDialog({
  binderId,
  binderName,
  isOpen,
  onClose,
}: ExportBinderDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Update a setting
  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setExportError(null);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const { format, ...pdfOptions } = settings;

      if (format === 'pdf') {
        const result = await exportBinderToPDF(binderId, pdfOptions);
        // Download the PDF
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await downloadBinderHTML(binderId, pdfOptions);
      }

      onClose();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle print
  const handlePrint = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const { format, ...pdfOptions } = settings;
      await printBinder(binderId, pdfOptions);
      onClose();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Print failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setExportError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Binder
          </DialogTitle>
          <DialogDescription>
            Export "{binderName}" with customized formatting options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export Format
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={settings.format === 'pdf' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => updateSetting('format', 'pdf')}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                PDF Document
              </Button>
              <Button
                type="button"
                variant={settings.format === 'html' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => updateSetting('format', 'html')}
              >
                <FileText className="h-4 w-4 mr-2" />
                HTML File
              </Button>
            </div>
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Content Options
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeTableOfContents"
                    checked={settings.includeTableOfContents}
                    onCheckedChange={(checked) =>
                      updateSetting('includeTableOfContents', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeTableOfContents" className="text-sm cursor-pointer">
                    <List className="h-3.5 w-3.5 inline mr-1.5" />
                    Table of Contents
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeModelDefinition"
                    checked={settings.includeModelDefinition}
                    onCheckedChange={(checked) =>
                      updateSetting('includeModelDefinition', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeModelDefinition" className="text-sm cursor-pointer">
                    Model Definition
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeSections"
                    checked={settings.includeSections}
                    onCheckedChange={(checked) =>
                      updateSetting('includeSections', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeSections" className="text-sm cursor-pointer">
                    All Binder Sections
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeNotes"
                    checked={settings.includeNotes}
                    onCheckedChange={(checked) =>
                      updateSetting('includeNotes', Boolean(checked))
                    }
                    disabled={!settings.includeSections}
                  />
                  <Label
                    htmlFor="includeNotes"
                    className={`text-sm cursor-pointer ${
                      !settings.includeSections ? 'text-muted-foreground' : ''
                    }`}
                  >
                    <StickyNote className="h-3.5 w-3.5 inline mr-1.5" />
                    Include My Notes
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeCitations"
                    checked={settings.includeCitations}
                    onCheckedChange={(checked) =>
                      updateSetting('includeCitations', Boolean(checked))
                    }
                    disabled={!settings.includeSections}
                  />
                  <Label
                    htmlFor="includeCitations"
                    className={`text-sm cursor-pointer ${
                      !settings.includeSections ? 'text-muted-foreground' : ''
                    }`}
                  >
                    <Quote className="h-3.5 w-3.5 inline mr-1.5" />
                    Include Citations & Sources
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeDocuments"
                    checked={settings.includeDocuments}
                    onCheckedChange={(checked) =>
                      updateSetting('includeDocuments', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeDocuments" className="text-sm cursor-pointer">
                    Uploaded Documents List
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </Label>

            <div className="grid grid-cols-2 gap-4">
              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  Font Size
                </Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value: FontSize) => updateSetting('fontSize', value)}
                >
                  <SelectTrigger id="fontSize" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({option.description})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <Label htmlFor="colorScheme" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  Color Scheme
                </Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value: ColorScheme) => updateSetting('colorScheme', value)}
                >
                  <SelectTrigger id="colorScheme" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_SCHEME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Watermark Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeWatermark"
                checked={settings.includeWatermark}
                onCheckedChange={(checked) =>
                  updateSetting('includeWatermark', Boolean(checked))
                }
              />
              <Label htmlFor="includeWatermark" className="text-sm cursor-pointer">
                Add Watermark
              </Label>
            </div>
            {settings.includeWatermark && (
              <Input
                placeholder="Watermark text (e.g., CONFIDENTIAL)"
                value={settings.watermarkText || ''}
                onChange={(e) => updateSetting('watermarkText', e.target.value)}
                className="h-9"
              />
            )}
          </div>

          {/* Footer Option */}
          <div className="space-y-2">
            <Label htmlFor="footerText" className="text-sm">
              Custom Footer (optional)
            </Label>
            <Input
              id="footerText"
              placeholder="e.g., Property of ABC Group Homes LLC"
              value={settings.footerText || ''}
              onChange={(e) => updateSetting('footerText', e.target.value)}
              className="h-9"
            />
          </div>

          {/* Error Display */}
          {exportError && (
            <Card className="border-destructive">
              <CardContent className="py-3 text-sm text-destructive">
                {exportError}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isExporting}
            className="sm:mr-auto"
          >
            Reset to Defaults
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Print
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export {settings.format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportBinderDialog;
