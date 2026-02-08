/**
 * Binder Generator Admin Dashboard
 * Main component for generating compliance binders from cache data
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { CacheDataTable } from './CacheDataTable';
import { BinderPreview } from './BinderPreview';
import {
  generateBinderPreview,
  generateSingleBinder,
  batchGenerateBinders,
} from '@/services/binderGenerationService';
import type { BinderPreviewData, BatchGenerationResult } from '@/types/binderGeneration';

export function BinderGenerator() {
  // Debug: Log component mount to confirm new code is loaded
  useEffect(() => {
    console.log('[BinderGenerator] Component mounted - v2.0 (click handlers active)');
  }, []);

  // Selection state
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<BinderPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationResult, setGenerationResult] = useState<BatchGenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Handle preview request
  const handlePreview = async (recordId: string) => {
    console.log('[BinderGenerator] handlePreview called with recordId:', recordId);
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      console.log('[BinderGenerator] Calling generateBinderPreview...');
      const preview = await generateBinderPreview(recordId);
      console.log('[BinderGenerator] Preview result:', preview ? 'received' : 'null');
      if (!preview) {
        throw new Error('Preview generation returned null - check if cache record exists');
      }
      setPreviewData(preview);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('[BinderGenerator] Preview error:', err);
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle save from preview
  const handleSaveFromPreview = async () => {
    if (!previewData) return;

    setIsSaving(true);

    try {
      const result = await generateSingleBinder({
        cacheRecord: previewData.sourceRecord,
        dryRun: false,
        forceRegenerate: false,
      });

      if (result.success) {
        setIsPreviewOpen(false);
        setPreviewData(null);
        // Refresh the table by clearing selection
        setSelectedRecords([]);
        setGenerationResult({
          success: 1,
          failed: 0,
          skipped: 0,
          total: 1,
          details: [{
            countyName: previewData.sourceRecord.county_name,
            stateCode: previewData.sourceRecord.state_code,
            status: 'success',
            binderId: result.binder?.id,
            wordCount: result.wordCount,
          }],
          generatedAt: new Date().toISOString(),
          params: {},
        });
      } else {
        setPreviewError(result.error || 'Failed to save binder');
      }
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to save binder');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle batch generation
  const handleGenerate = async (recordIds: string[]) => {
    if (recordIds.length === 0) {
      setGenerationError('No records selected for generation');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      // For now, we'll process each record individually with progress updates
      // In a production app, this would use a proper queue system
      const result = await batchGenerateBinders({
        minConfidence: 60,
        dryRun: false,
        batchLimit: recordIds.length,
      });

      setGenerationResult(result);
      setSelectedRecords([]);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Batch generation failed');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };

  // Handle close preview
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewData(null);
    setPreviewError(null);
  };

  // Clear results
  const clearResults = () => {
    setGenerationResult(null);
    setGenerationError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Binder Generator</h1>
          <p className="text-muted-foreground">
            Transform county compliance cache data into narrative binders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearResults}
          disabled={!generationResult && !generationError}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Results
        </Button>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating binders...</span>
              </div>
              <Progress value={generationProgress} />
              <p className="text-sm text-muted-foreground">
                This may take a while depending on the number of records.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {generationResult && (
        <Alert variant={generationResult.failed > 0 ? 'destructive' : 'default'}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Generation Complete</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <p>
                <strong>{generationResult.success}</strong> binders generated successfully
              </p>
              {generationResult.failed > 0 && (
                <p className="text-red-600">
                  <strong>{generationResult.failed}</strong> failed
                </p>
              )}
              {generationResult.skipped > 0 && (
                <p>
                  <strong>{generationResult.skipped}</strong> skipped (low confidence or existing)
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Generation Error */}
      {generationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{generationError}</AlertDescription>
        </Alert>
      )}

      {/* Preview Error */}
      {previewError && !isPreviewOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview Failed</AlertTitle>
          <AlertDescription>{previewError}</AlertDescription>
        </Alert>
      )}

      {/* Loading Preview Indicator */}
      {isLoadingPreview && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating preview...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            County Compliance Cache
          </CardTitle>
          <CardDescription>
            Select counties to generate compliance binders from cached data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CacheDataTable
            onPreview={handlePreview}
            onGenerate={handleGenerate}
            selectedRecords={selectedRecords}
            onSelectionChange={setSelectedRecords}
          />
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>1. Configure API Key:</strong> Enter your Claude API key above to enable
            generation.
          </p>
          <p>
            <strong>2. Review Cache Data:</strong> The table shows all counties in the compliance
            cache. Green confidence scores indicate high-quality source data.
          </p>
          <p>
            <strong>3. Preview Before Saving:</strong> Click the eye icon to preview a generated
            binder before saving it to the database.
          </p>
          <p>
            <strong>4. Generate Binders:</strong> Select multiple counties using checkboxes and
            click &quot;Generate Binders&quot; for batch processing.
          </p>
          <p>
            <strong>Quality Thresholds:</strong> Only counties with confidence score ≥ 60 and
            sufficient data fields can be auto-generated.
          </p>
        </CardContent>
      </Card>

      {/* Binder Preview Dialog */}
      <BinderPreview
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        previewData={previewData}
        onSave={handleSaveFromPreview}
        isSaving={isSaving}
      />
    </div>
  );
}

export default BinderGenerator;
