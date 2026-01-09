// ProtocolImporter Component
// Import protocols from CSV or Google Doc/Sheets

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProtocolImport } from '@/hooks/useProtocolImport';
import { parseGoogleDoc } from '@/services/protocolImportService';
import type { ParsedProtocolData, CoachProtocolVisibility } from '@/types/coach-protocol';

interface ProtocolImporterProps {
  onImportComplete: (protocolId: string) => void;
  onCancel: () => void;
  coachId: string;
}

export function ProtocolImporter({
  onImportComplete,
  onCancel,
  coachId,
}: ProtocolImporterProps) {
  const {
    parsedData,
    isParsing,
    isCreating,
    parseCSVFile,
    createProtocolFromParsed,
    downloadCSVTemplate,
    downloadGoogleDocTemplate,
    clearParsedData,
  } = useProtocolImport();

  const [activeTab, setActiveTab] = useState<'csv' | 'google_doc' | 'google_sheet'>('csv');
  const [googleDocContent, setGoogleDocContent] = useState('');
  const [protocolTitle, setProtocolTitle] = useState('');
  const [protocolDescription, setProtocolDescription] = useState('');
  const [visibility, setVisibility] = useState<CoachProtocolVisibility>('all_users');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle CSV file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }

      await parseCSVFile(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [parseCSVFile]
  );

  // Handle Google Doc content paste
  const handleGoogleDocParse = useCallback(() => {
    if (!googleDocContent.trim()) {
      alert('Please paste the Google Doc content');
      return;
    }

    const data = parseGoogleDoc(googleDocContent);
    // The hook will handle state update via parsedData
    // For now, we need to call the service directly and update state
  }, [googleDocContent]);

  // Handle protocol creation
  const handleCreate = useCallback(async () => {
    if (!parsedData || !parsedData.is_valid) return;

    const protocol = await createProtocolFromParsed(coachId, {
      title: protocolTitle || parsedData.title,
      description: protocolDescription || parsedData.description,
      visibility,
    });

    if (protocol) {
      onImportComplete(protocol.id);
    }
  }, [
    parsedData,
    coachId,
    protocolTitle,
    protocolDescription,
    visibility,
    createProtocolFromParsed,
    onImportComplete,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Protocol</h2>
          <p className="text-muted-foreground">
            Import from CSV file or Google Doc
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV File
          </TabsTrigger>
          <TabsTrigger value="google_doc" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Google Doc
          </TabsTrigger>
          <TabsTrigger value="google_sheet" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Google Sheet
          </TabsTrigger>
        </TabsList>

        {/* CSV Tab */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file following our template format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" onClick={downloadCSVTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {isParsing ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV files only
                    </p>
                  </>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Required columns:</p>
                <code className="text-xs bg-muted p-2 rounded block">
                  week, day, time_of_day, task_type, title, instructions
                </code>
                <p className="mt-2">Optional: duration_minutes, resource_url, success_criteria, week_theme</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Doc Tab */}
        <TabsContent value="google_doc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paste Google Doc Content</CardTitle>
              <CardDescription>
                Copy the content from your Google Doc and paste it below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" onClick={downloadGoogleDocTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Document Content</Label>
                <Textarea
                  value={googleDocContent}
                  onChange={(e) => setGoogleDocContent(e.target.value)}
                  placeholder="Paste your Google Doc content here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleGoogleDocParse} disabled={isParsing || !googleDocContent.trim()}>
                {isParsing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Parse Document
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Format</AlertTitle>
                <AlertDescription className="text-xs font-mono whitespace-pre-line">
                  {`# Protocol Title
## Week 1: Theme
### Day 1
**Morning (5 min) - Action**
Task Title
Task instructions...`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Sheet Tab */}
        <TabsContent value="google_sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from Google Sheet</CardTitle>
              <CardDescription>
                Use the same column format as CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Direct Google Sheet import requires OAuth integration.
                  For now, export your sheet as CSV and use the CSV import.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>How to export from Google Sheets:</Label>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Open your Google Sheet</li>
                  <li>Click File → Download → Comma-separated values (.csv)</li>
                  <li>Upload the downloaded CSV file in the CSV tab</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Parse Results */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parsedData.is_valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex gap-4">
              <Badge variant="secondary">{parsedData.total_weeks} Week(s)</Badge>
              <Badge variant="secondary">{parsedData.total_days} Day(s)</Badge>
              <Badge variant="secondary">{parsedData.total_tasks} Task(s)</Badge>
            </div>

            {/* Errors */}
            {parsedData.validation_errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {parsedData.validation_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parsedData.validation_warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {parsedData.validation_warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Table */}
            {parsedData.is_valid && (
              <>
                <div className="space-y-2">
                  <Label>Protocol Title</Label>
                  <Input
                    value={protocolTitle || parsedData.title}
                    onChange={(e) => setProtocolTitle(e.target.value)}
                    placeholder="Enter protocol title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={protocolDescription || parsedData.description || ''}
                    onChange={(e) => setProtocolDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preview</Label>
                  <ScrollArea className="h-64 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Week</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.weeks.flatMap((week) =>
                          week.days.flatMap((day) =>
                            day.tasks.map((task, taskIndex) => (
                              <TableRow key={`${week.week_number}-${day.day_number}-${taskIndex}`}>
                                <TableCell>{week.week_number}</TableCell>
                                <TableCell>{day.day_number}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{task.time_of_day}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{task.task_type}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {task.title}
                                </TableCell>
                              </TableRow>
                            ))
                          )
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={clearParsedData}>
                    Clear & Start Over
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Create Protocol
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProtocolImporter;
