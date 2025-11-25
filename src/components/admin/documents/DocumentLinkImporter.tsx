// DocumentLinkImporter Component
// Import document-tactic links from CSV with validation and preview

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CSVTemplateDownloader } from './CSVTemplateDownloader';
import {
  parseCSV,
  validateCSVData,
  readFileAsText,
  validateFile,
  type CSVImportRow,
  type ValidationError,
} from '@/utils/csvHelpers';

interface ImportPreviewData {
  valid: CSVImportRow[];
  errors: ValidationError[];
  duplicates: CSVImportRow[];
}

export const DocumentLinkImporter = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);
    setIsDialogOpen(true);

    try {
      // Read file content
      const fileContent = await readFileAsText(file);

      // Parse CSV
      const parsedData = parseCSV(fileContent);

      if (parsedData.length === 0) {
        toast.error('CSV file is empty or has no valid rows');
        setIsProcessing(false);
        setIsDialogOpen(false);
        return;
      }

      // Fetch existing documents
      const { data: documents, error: docError } = await supabase
        .from('gh_documents')
        .select('id');

      if (docError) throw docError;

      // Fetch existing tactics
      const { data: tactics, error: tacticError } = await supabase
        .from('gh_tactic_instructions')
        .select('tactic_id');

      if (tacticError) throw tacticError;

      // Fetch existing links to check for duplicates
      const { data: existingLinks, error: linksError } = await supabase
        .from('gh_document_tactic_links')
        .select('document_id, tactic_id');

      if (linksError) throw linksError;

      // Create Sets for validation
      const existingDocumentIds = new Set(documents?.map((d) => d.id) || []);
      const existingTacticIds = new Set(tactics?.map((t) => t.tactic_id) || []);
      const existingLinkKeys = new Set(
        existingLinks?.map((l) => `${l.document_id}-${l.tactic_id}`) || []
      );

      // Validate CSV data
      const validation = validateCSVData(
        parsedData,
        existingDocumentIds,
        existingTacticIds,
        existingLinkKeys
      );

      setPreviewData(validation);
    } catch (error) {
      console.error('Import processing error:', error);
      toast.error('Failed to process CSV file. Please check the format.');
      setIsDialogOpen(false);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.valid.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);

    try {
      // Prepare data for insertion
      const linksToInsert = previewData.valid.map((row) => ({
        document_id: parseInt(row.document_id, 10),
        tactic_id: row.tactic_id.trim(),
        link_type: row.link_type.trim(),
        display_order: 0,
      }));

      // Bulk insert
      const { data, error } = await supabase
        .from('gh_document_tactic_links')
        .insert(linksToInsert)
        .select();

      if (error) throw error;

      const importedCount = data?.length || 0;
      toast.success(`Successfully imported ${importedCount} link(s)`);

      // Close dialog and reset
      setIsDialogOpen(false);
      setPreviewData(null);

      // Trigger page refresh (parent component should handle this)
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import links. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setPreviewData(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import Links from CSV
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Document Links - Preview</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Review the data before importing. Only valid rows will be imported.</span>
              <CSVTemplateDownloader />
            </DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Processing CSV file...</span>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="font-semibold">
                    Valid: {previewData.valid.length}
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">
                    Errors: {previewData.errors.length}
                  </AlertDescription>
                </Alert>
                <Alert>
                  <X className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="font-semibold">
                    Duplicates: {previewData.duplicates.length}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Valid Rows */}
              {previewData.valid.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Valid Rows ({previewData.valid.length})</h3>
                  <div className="border rounded-md max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document ID</TableHead>
                          <TableHead>Tactic ID</TableHead>
                          <TableHead>Link Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.valid.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.document_id}</TableCell>
                            <TableCell>{row.tactic_id}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {row.link_type}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.valid.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {previewData.valid.length} valid rows
                    </p>
                  )}
                </div>
              )}

              {/* Errors */}
              {previewData.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-destructive">
                    Errors ({previewData.errors.length})
                  </h3>
                  <div className="border rounded-md max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.errors.slice(0, 10).map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell className="font-mono text-sm">{error.field}</TableCell>
                            <TableCell className="text-destructive text-sm">{error.message}</TableCell>
                            <TableCell className="font-mono text-xs">{error.value || '(empty)'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {previewData.errors.length} errors
                    </p>
                  )}
                </div>
              )}

              {/* Duplicates */}
              {previewData.duplicates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-orange-600">
                    Duplicates ({previewData.duplicates.length})
                  </h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      These links already exist in the database and will be skipped.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={handleCancel} variant="outline" disabled={isImporting}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                isProcessing ||
                isImporting ||
                !previewData ||
                previewData.valid.length === 0
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                `Import ${previewData?.valid.length || 0} Link(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
