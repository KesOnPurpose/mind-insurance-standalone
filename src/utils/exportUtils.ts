// ============================================================================
// EXPORT UTILITY FUNCTIONS
// ============================================================================
// Utility functions for exporting analytics data to CSV and JSON formats
// Includes proper typing, error handling, and browser download triggering
// ============================================================================

import type { DashboardKPIs, TimeRange } from '@/types/adminAnalytics';

/**
 * Export metadata included with all exports
 */
interface ExportMetadata {
  exportedAt: string;
  exportedBy?: string;
  timeRange: TimeRange;
  dataType: 'dashboard_kpis';
}

/**
 * Combined export data structure
 */
interface ExportData {
  metadata: ExportMetadata;
  data: DashboardKPIs;
}

/**
 * Convert DashboardKPIs to CSV format
 * Returns a CSV string with headers and data row
 *
 * @param kpis - Dashboard KPI data to export
 * @param timeRange - Time range used for the data
 * @param adminUserId - Optional admin user ID for audit trail
 * @returns CSV string ready for download
 */
export function convertKPIsToCSV(
  kpis: DashboardKPIs,
  timeRange: TimeRange,
  adminUserId?: string
): string {
  try {
    // Create export metadata
    const exportDate = new Date().toISOString();

    // CSV Headers (two rows: metadata + data headers)
    const metadataHeaders = [
      'Export Metadata',
      'Exported At',
      'Time Range',
      'Admin User ID',
      'Data Type'
    ];

    const metadataValues = [
      '',
      exportDate,
      timeRange,
      adminUserId || 'N/A',
      'Dashboard KPIs'
    ];

    const dataHeaders = [
      'System Health Score',
      'Cache Efficiency (%)',
      'AI Quality Score',
      'Routing Accuracy (%)',
      'Daily Active Users',
      'Total Conversations Today',
      'Avg Response Time (ms)',
      'Error Rate (%)'
    ];

    const dataValues = [
      kpis.system_health_score.toFixed(2),
      kpis.cache_efficiency.toFixed(2),
      kpis.ai_quality_score.toFixed(4),
      kpis.routing_accuracy.toFixed(2),
      kpis.daily_active_users.toString(),
      kpis.total_conversations_today.toString(),
      kpis.avg_response_time_ms.toFixed(0),
      kpis.error_rate.toFixed(2)
    ];

    // Combine into CSV format with proper escaping
    const csv = [
      metadataHeaders.map(escapeCSVField).join(','),
      metadataValues.map(escapeCSVField).join(','),
      '', // Empty row separator
      dataHeaders.map(escapeCSVField).join(','),
      dataValues.map(escapeCSVField).join(',')
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('[Export Utils] Error converting to CSV:', error);
    throw new Error('Failed to convert data to CSV format');
  }
}

/**
 * Escape CSV field values (handle commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Convert DashboardKPIs to JSON format with metadata
 * Returns a formatted JSON string
 *
 * @param kpis - Dashboard KPI data to export
 * @param timeRange - Time range used for the data
 * @param adminUserId - Optional admin user ID for audit trail
 * @returns JSON string ready for download
 */
export function convertKPIsToJSON(
  kpis: DashboardKPIs,
  timeRange: TimeRange,
  adminUserId?: string
): string {
  try {
    const exportData: ExportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: adminUserId,
        timeRange,
        dataType: 'dashboard_kpis'
      },
      data: kpis
    };

    // Pretty print JSON with 2-space indentation
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('[Export Utils] Error converting to JSON:', error);
    throw new Error('Failed to convert data to JSON format');
  }
}

/**
 * Trigger browser download of data
 * Creates a blob and downloads it with the specified filename
 *
 * @param content - File content as string
 * @param filename - Desired filename with extension
 * @param mimeType - MIME type for the file
 */
export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  try {
    // Create blob with proper MIME type
    const blob = new Blob([content], { type: mimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Export Utils] Error triggering download:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Generate filename for export based on format and timestamp
 *
 * @param format - Export format ('csv' or 'json')
 * @param timeRange - Time range used for the data
 * @returns Filename string
 */
export function generateExportFilename(
  format: 'csv' | 'json',
  timeRange: TimeRange
): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `mind-insurance-analytics_${timeRange}_${timestamp}.${format}`;
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: 'csv' | 'json'): string {
  return format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
}
