/**
 * Binder Preview Component
 * Shows generated binder content before saving
 */

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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  BarChart3,
  Code2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { BinderPreviewData } from '@/types/binderGeneration';

interface BinderPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: BinderPreviewData | null;
  onSave: () => void;
  isSaving: boolean;
}

export function BinderPreview({
  isOpen,
  onClose,
  previewData,
  onSave,
  isSaving,
}: BinderPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');

  if (!previewData) return null;

  const { qualityValidation } = previewData;

  const getValidationIcon = () => {
    if (qualityValidation.isValid) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (qualityValidation.errors.length > 0) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview: {previewData.title}
          </DialogTitle>
          <DialogDescription>
            Review the generated binder content before saving
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="gap-2">
              <FileText className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              {getValidationIcon()}
              Validation
            </TabsTrigger>
            <TabsTrigger value="source" className="gap-2">
              <Code2 className="h-4 w-4" />
              Source Data
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1">
            <ScrollArea className="h-[50vh] border rounded-lg p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{previewData.content}</ReactMarkdown>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="flex-1">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-6 p-4">
                {/* Summary */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  {getValidationIcon()}
                  <div>
                    <h4 className="font-medium">
                      {qualityValidation.isValid
                        ? 'Binder passes all quality checks'
                        : 'Quality issues detected'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {qualityValidation.wordCount.toLocaleString()} words |{' '}
                      {previewData.sectionHeaders.length} sections
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Word Count</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {qualityValidation.minWordCountMet ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {qualityValidation.wordCount.toLocaleString()} / 2,000
                        minimum
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {qualityValidation.allSectionsPresent ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {qualityValidation.allSectionsPresent
                          ? 'All sections present'
                          : 'Missing sections'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <h4 className="font-medium">Quality Checklist</h4>
                  <div className="space-y-1">
                    {[
                      {
                        label: 'Minimum word count met (2,000+)',
                        passed: qualityValidation.minWordCountMet,
                      },
                      {
                        label: 'All main sections present',
                        passed: qualityValidation.allSectionsPresent,
                      },
                      {
                        label: 'All subsections present',
                        passed: qualityValidation.allSubsectionsPresent,
                      },
                      {
                        label: 'No placeholder text',
                        passed: !qualityValidation.hasPlaceholderText,
                      },
                      {
                        label: 'Contains legal citations',
                        passed: qualityValidation.hasLegalCitations,
                      },
                      {
                        label: 'Contains municipal code URL',
                        passed: qualityValidation.hasMunicipalCodeUrl,
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {item.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Errors */}
                {qualityValidation.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Errors</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {qualityValidation.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-600">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {qualityValidation.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-600">Warnings</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {qualityValidation.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-yellow-600">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Source Data Tab */}
          <TabsContent value="source" className="flex-1">
            <ScrollArea className="h-[50vh]">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-sm">
                      {previewData.sourceRecord.county_name} County,{' '}
                      {previewData.sourceRecord.state_code}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Confidence Score</h4>
                    <Badge
                      variant={
                        (previewData.sourceRecord.confidence_score || 0) >= 80
                          ? 'default'
                          : (previewData.sourceRecord.confidence_score || 0) >= 60
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {previewData.sourceRecord.confidence_score || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Interpretation Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {previewData.sourceRecord.interpretation_summary ||
                      'Not available'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Municipal Code URL</h4>
                  {previewData.sourceRecord.municipal_code_url ? (
                    <a
                      href={previewData.sourceRecord.municipal_code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {previewData.sourceRecord.municipal_code_url}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not available</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Data Source</h4>
                  <Badge variant="outline">
                    {previewData.sourceRecord.data_source}
                  </Badge>
                </div>

                {/* Key Fields */}
                <div className="space-y-2">
                  <h4 className="font-medium">Key Data Fields</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Max Occupancy:
                      </span>{' '}
                      {previewData.sourceRecord.occupancy_max_persons || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Unrelated Limit:
                      </span>{' '}
                      {previewData.sourceRecord.occupancy_unrelated_persons_limit ||
                        'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Residential Permitted:
                      </span>{' '}
                      {previewData.sourceRecord.residential_use_permitted === null
                        ? 'Unknown'
                        : previewData.sourceRecord.residential_use_permitted
                        ? 'Yes'
                        : 'No'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Special Permit:
                      </span>{' '}
                      {previewData.sourceRecord.requires_special_permit === null
                        ? 'Unknown'
                        : previewData.sourceRecord.requires_special_permit
                        ? 'Required'
                        : 'Not Required'}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !qualityValidation.isValid}
          >
            {isSaving ? 'Saving...' : 'Save Binder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BinderPreview;
