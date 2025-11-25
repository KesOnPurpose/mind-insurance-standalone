import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCanExportAnalytics, useAdmin } from '@/contexts/AdminContext';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TimeRange, DashboardKPIs } from '@/types/adminAnalytics';
import {
  convertKPIsToCSV,
  convertKPIsToJSON,
  triggerDownload,
  generateExportFilename,
  getMimeType,
} from '@/utils/exportUtils';
import { logDataExport } from '@/services/auditLogger';

// ============================================================================
// EXPORT BUTTONS COMPONENT
// ============================================================================
// Export controls for analytics data with permission checking
// Supports CSV and JSON export formats with audit logging
// Triggers browser downloads with properly formatted data
// ============================================================================

interface ExportButtonsProps {
  timeRange: TimeRange;
  kpiData?: DashboardKPIs;
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  timeRange,
  kpiData,
  className = ''
}) => {
  const canExport = useCanExportAnalytics();
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (!kpiData) {
      toast({
        title: 'No Data Available',
        description: 'Please wait for dashboard data to load before exporting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      // Convert data to CSV format
      const csvContent = convertKPIsToCSV(kpiData, timeRange, adminUser?.id);

      // Generate filename and trigger download
      const filename = generateExportFilename('csv', timeRange);
      const mimeType = getMimeType('csv');
      triggerDownload(csvContent, filename, mimeType);

      // Log export action (fire-and-forget)
      logDataExport(
        adminUser?.id,
        'csv',
        { timeRange, dataType: 'dashboard_kpis' },
        1 // Single row of KPI data
      ).catch(() => {}); // Silent fail for audit logging

      toast({
        title: 'Export Successful',
        description: `Dashboard KPIs exported to ${filename}`,
      });
    } catch (error) {
      console.error('[Export] CSV export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export CSV',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!kpiData) {
      toast({
        title: 'No Data Available',
        description: 'Please wait for dashboard data to load before exporting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      // Convert data to JSON format
      const jsonContent = convertKPIsToJSON(kpiData, timeRange, adminUser?.id);

      // Generate filename and trigger download
      const filename = generateExportFilename('json', timeRange);
      const mimeType = getMimeType('json');
      triggerDownload(jsonContent, filename, mimeType);

      // Log export action (fire-and-forget)
      logDataExport(
        adminUser?.id,
        'json',
        { timeRange, dataType: 'dashboard_kpis' },
        1 // Single row of KPI data
      ).catch(() => {}); // Silent fail for audit logging

      toast({
        title: 'Export Successful',
        description: `Dashboard KPIs exported to ${filename}`,
      });
    } catch (error) {
      console.error('[Export] JSON export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export JSON',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!canExport) {
    return (
      <TooltipProvider>
        <div className={`flex gap-2 ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="outline" disabled className="cursor-not-allowed">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You need export permissions to download analytics data</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="outline" disabled className="cursor-not-allowed">
                  <FileJson className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You need export permissions to download analytics data</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Button
        variant="outline"
        onClick={handleExportCSV}
        disabled={isExporting || !kpiData}
        className="w-full sm:w-auto"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export CSV
      </Button>

      <Button
        variant="outline"
        onClick={handleExportJSON}
        disabled={isExporting || !kpiData}
        className="w-full sm:w-auto"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileJson className="mr-2 h-4 w-4" />
        )}
        Export JSON
      </Button>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              onClick={handleExportCSV}
              disabled={isExporting || !kpiData}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Quick Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quick CSV export for the selected time range</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
