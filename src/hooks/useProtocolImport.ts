// useProtocolImport Hook
// Handles CSV and Google Doc/Sheet imports for coach protocols

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  parseCSV,
  parseGoogleDoc,
  parseGoogleSheet,
  generateCSVTemplate,
  generateGoogleDocTemplate,
  flattenParsedTasks,
  extractGoogleId,
  validateParsedData,
} from '@/services/protocolImportService';
import {
  createProtocol,
  createTasksFromParsed,
} from '@/services/coachProtocolV2Service';
import type {
  ParsedProtocolData,
  CoachProtocolV2,
  CreateCoachProtocolForm,
} from '@/types/coach-protocol';

interface UseProtocolImportReturn {
  // State
  parsedData: ParsedProtocolData | null;
  isLoading: boolean;
  isParsing: boolean;
  isCreating: boolean;
  error: Error | null;

  // Actions
  parseCSVFile: (file: File) => Promise<ParsedProtocolData | null>;
  parseGoogleDocUrl: (url: string) => Promise<ParsedProtocolData | null>;
  parseGoogleSheetUrl: (url: string, rows: string[][]) => Promise<ParsedProtocolData | null>;
  createProtocolFromParsed: (
    coachId: string,
    form: Partial<CreateCoachProtocolForm>
  ) => Promise<CoachProtocolV2 | null>;
  downloadCSVTemplate: () => void;
  downloadGoogleDocTemplate: () => void;
  clearParsedData: () => void;
}

export function useProtocolImport(): UseProtocolImportReturn {
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ParsedProtocolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Parse a CSV file
   */
  const parseCSVFile = useCallback(
    async (file: File): Promise<ParsedProtocolData | null> => {
      try {
        setIsParsing(true);
        setError(null);

        const content = await file.text();
        const data = parseCSV(content);

        if (!data.is_valid) {
          toast({
            title: 'Validation Errors',
            description: data.validation_errors.join('. '),
            variant: 'destructive',
          });
          setParsedData(data);
          return data;
        }

        if (data.validation_warnings.length > 0) {
          toast({
            title: 'Import Warnings',
            description: `${data.validation_warnings.length} warning(s). Check the preview for details.`,
            variant: 'default',
          });
        }

        toast({
          title: 'CSV Parsed Successfully',
          description: `Found ${data.total_weeks} week(s), ${data.total_days} day(s), ${data.total_tasks} task(s)`,
        });

        setParsedData(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse CSV');
        setError(error);
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsParsing(false);
      }
    },
    [toast]
  );

  /**
   * Parse a Google Doc URL
   * Note: Actual Google API integration requires OAuth - this is a simplified version
   * that expects the content to be pasted or fetched separately
   */
  const parseGoogleDocUrl = useCallback(
    async (url: string): Promise<ParsedProtocolData | null> => {
      try {
        setIsParsing(true);
        setError(null);

        const googleId = extractGoogleId(url);
        if (!googleId || googleId.type !== 'doc') {
          throw new Error('Invalid Google Doc URL');
        }

        // In a full implementation, we would use Google Docs API here
        // For now, this expects the content to be provided separately
        toast({
          title: 'Google Doc Detected',
          description: 'Please paste the document content to continue.',
          variant: 'default',
        });

        return null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse Google Doc');
        setError(error);
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsParsing(false);
      }
    },
    [toast]
  );

  /**
   * Parse Google Doc content directly
   */
  const parseGoogleDocContent = useCallback(
    (content: string): ParsedProtocolData | null => {
      try {
        setIsParsing(true);
        setError(null);

        const data = parseGoogleDoc(content);

        if (!data.is_valid) {
          toast({
            title: 'Validation Errors',
            description: data.validation_errors.join('. '),
            variant: 'destructive',
          });
          setParsedData(data);
          return data;
        }

        toast({
          title: 'Document Parsed Successfully',
          description: `Found ${data.total_weeks} week(s), ${data.total_days} day(s), ${data.total_tasks} task(s)`,
        });

        setParsedData(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse document');
        setError(error);
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsParsing(false);
      }
    },
    [toast]
  );

  /**
   * Parse Google Sheet data
   */
  const parseGoogleSheetUrl = useCallback(
    async (url: string, rows: string[][]): Promise<ParsedProtocolData | null> => {
      try {
        setIsParsing(true);
        setError(null);

        const googleId = extractGoogleId(url);
        if (googleId && googleId.type !== 'sheet') {
          throw new Error('Invalid Google Sheet URL');
        }

        const data = parseGoogleSheet(rows);

        if (!data.is_valid) {
          toast({
            title: 'Validation Errors',
            description: data.validation_errors.join('. '),
            variant: 'destructive',
          });
          setParsedData(data);
          return data;
        }

        toast({
          title: 'Sheet Parsed Successfully',
          description: `Found ${data.total_weeks} week(s), ${data.total_days} day(s), ${data.total_tasks} task(s)`,
        });

        setParsedData(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse sheet');
        setError(error);
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsParsing(false);
      }
    },
    [toast]
  );

  /**
   * Create protocol from parsed data
   */
  const createProtocolFromParsed = useCallback(
    async (
      coachId: string,
      form: Partial<CreateCoachProtocolForm>
    ): Promise<CoachProtocolV2 | null> => {
      if (!parsedData || !parsedData.is_valid) {
        toast({
          title: 'Invalid Data',
          description: 'Please fix validation errors before creating protocol.',
          variant: 'destructive',
        });
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);

        // Create the protocol
        const protocol = await createProtocol(coachId, {
          title: form.title || parsedData.title || 'Imported Protocol',
          description: form.description || parsedData.description,
          total_weeks: parsedData.total_weeks,
          visibility: form.visibility || 'all_users',
          visibility_config: form.visibility_config,
          schedule_type: form.schedule_type || 'immediate',
          start_date: form.start_date,
          theme_color: form.theme_color || '#fac832',
          icon: form.icon || 'book',
          tasks: [], // Tasks will be created separately
        });

        // Create tasks
        const tasks = flattenParsedTasks(parsedData);
        await createTasksFromParsed(protocol.id, tasks);

        toast({
          title: 'Protocol Created',
          description: `Successfully created "${protocol.title}" with ${tasks.length} tasks.`,
        });

        // Clear parsed data
        setParsedData(null);

        return protocol;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create protocol');
        setError(error);
        toast({
          title: 'Create Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [parsedData, toast]
  );

  /**
   * Download CSV template
   */
  const downloadCSVTemplate = useCallback(() => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coach-protocol-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Fill in the template and upload it to create your protocol.',
    });
  }, [toast]);

  /**
   * Download Google Doc template
   */
  const downloadGoogleDocTemplate = useCallback(() => {
    const template = generateGoogleDocTemplate();
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coach-protocol-template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Copy this format into a Google Doc for protocol creation.',
    });
  }, [toast]);

  /**
   * Clear parsed data
   */
  const clearParsedData = useCallback(() => {
    setParsedData(null);
    setError(null);
  }, []);

  return {
    parsedData,
    isLoading,
    isParsing,
    isCreating,
    error,
    parseCSVFile,
    parseGoogleDocUrl,
    parseGoogleSheetUrl,
    createProtocolFromParsed,
    downloadCSVTemplate,
    downloadGoogleDocTemplate,
    clearParsedData,
  };
}
