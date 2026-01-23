// ============================================================================
// PORTFOLIO REPORT SERVICE
// ============================================================================
// PDF and Excel report generation for property portfolios
// ============================================================================

import type { Property, PortfolioSummary, PropertyHealthScore, PropertyRoom, PropertyFinancial } from '@/types/property';
import type { ReportOptions } from '@/components/property/PortfolioReportModal';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReportData {
  generatedAt: Date;
  reportType: ReportOptions['reportType'];
  period: string;
  periodLabel: string;
  properties: Property[];
  summary: PortfolioSummary;
  healthScores?: PropertyHealthScore[];
  rooms?: Record<string, PropertyRoom[]>;
  financials?: Record<string, PropertyFinancial[]>;
  includeSections: ReportOptions['includeSections'];
}

export interface ReportGenerationResult {
  success: boolean;
  data?: Blob;
  filename?: string;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPeriodLabel(reportType: string, period: string): string {
  if (reportType === 'monthly') {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (reportType === 'quarterly') {
    return period.replace('-', ' ');
  } else if (reportType === 'annual') {
    return period;
  }
  return period;
}

function generateFilename(reportType: string, period: string, format: 'pdf' | 'excel'): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  return `portfolio-report-${reportType}-${period}-${timestamp}.${extension}`;
}

// ============================================================================
// PDF GENERATION (HTML-BASED)
// ============================================================================

function generatePDFContent(data: ReportData): string {
  const { properties, summary, healthScores, includeSections, periodLabel, generatedAt } = data;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Portfolio Report - ${periodLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .stat-subtitle { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .property-list { margin-top: 16px; }
    .property-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; }
    .property-name { font-weight: 600; }
    .property-location { font-size: 14px; color: #6b7280; }
    .property-stats { display: flex; gap: 16px; margin-top: 8px; font-size: 14px; }
    .profit-positive { color: #059669; }
    .profit-negative { color: #dc2626; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table th, .table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { padding: 20px; } .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Property Portfolio Report</h1>
    <p>${periodLabel} • Generated ${formatDate(generatedAt)}</p>
  </div>
`;

  // Executive Summary
  if (includeSections.summary) {
    html += `
  <div class="section">
    <h2 class="section-title">Executive Summary</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Properties</div>
        <div class="stat-value">${summary.total_properties}</div>
        <div class="stat-subtitle">${summary.active_properties} active</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Beds</div>
        <div class="stat-value">${summary.total_beds}</div>
        <div class="stat-subtitle">${summary.occupied_beds} occupied, ${summary.vacant_beds} vacant</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Revenue</div>
        <div class="stat-value">${formatCurrency(summary.total_monthly_revenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Profit</div>
        <div class="stat-value ${summary.total_monthly_profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(summary.total_monthly_profit)}</div>
        <div class="stat-subtitle">${formatPercent(summary.average_profit_margin)} margin</div>
      </div>
    </div>
  </div>
`;
  }

  // Financial Analysis
  if (includeSections.financials) {
    html += `
  <div class="section">
    <h2 class="section-title">Financial Analysis</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Revenue</th>
          <th>% of Total</th>
          <th>Profit</th>
        </tr>
      </thead>
      <tbody>
`;
    summary.revenue_by_property.forEach(item => {
      const property = properties.find(p => p.id === item.property_id);
      const profit = property?.current_monthly_profit || 0;
      html += `
        <tr>
          <td>${item.property_nickname}</td>
          <td>${formatCurrency(item.monthly_revenue)}</td>
          <td>${formatPercent(item.revenue_percent)}</td>
          <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(profit)}</td>
        </tr>
`;
    });
    html += `
      </tbody>
    </table>
  </div>
`;
  }

  // Occupancy Metrics
  if (includeSections.occupancy) {
    html += `
  <div class="section">
    <h2 class="section-title">Occupancy Metrics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Average Occupancy</div>
        <div class="stat-value">${formatPercent(summary.average_occupancy_percent)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Break-Even</div>
        <div class="stat-value">${formatPercent(summary.average_break_even_percent)}</div>
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Beds</th>
          <th>Occupied</th>
          <th>Occupancy %</th>
        </tr>
      </thead>
      <tbody>
`;
    properties.forEach(property => {
      html += `
        <tr>
          <td>${property.nickname}</td>
          <td>${property.configured_beds || 0}</td>
          <td>${property.current_occupied_beds || 0}</td>
          <td>${formatPercent(property.current_occupancy_percent || 0)}</td>
        </tr>
`;
    });
    html += `
      </tbody>
    </table>
  </div>
`;
  }

  // Compliance Status
  if (includeSections.compliance && healthScores && healthScores.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-title">Compliance Status</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Health Score</th>
          <th>Risk Level</th>
          <th>Recommendations</th>
        </tr>
      </thead>
      <tbody>
`;
    healthScores.forEach(score => {
      const property = properties.find(p => p.id === score.property_id);
      html += `
        <tr>
          <td>${property?.nickname || 'Unknown'}</td>
          <td>${score.overall_score}/100</td>
          <td>${score.risk_level.toUpperCase()}</td>
          <td>${score.recommendations[0] || '-'}</td>
        </tr>
`;
    });
    html += `
      </tbody>
    </table>
  </div>
`;
  }

  // Diversification Analysis
  if (includeSections.diversification) {
    const stateCount = new Set(properties.map(p => p.state_code)).size;
    const avgPropertyRevenue = summary.total_monthly_revenue / summary.total_properties;
    const maxPropertyRevenue = Math.max(...properties.map(p => (p.current_monthly_revenue || 0)));
    const concentrationRisk = summary.total_monthly_revenue > 0 ? (maxPropertyRevenue / summary.total_monthly_revenue) * 100 : 0;

    html += `
  <div class="section">
    <h2 class="section-title">Risk & Diversification</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Geographic Spread</div>
        <div class="stat-value">${stateCount} States</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revenue Concentration</div>
        <div class="stat-value">${formatPercent(concentrationRisk)}</div>
        <div class="stat-subtitle">Largest property share</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Revenue/Property</div>
        <div class="stat-value">${formatCurrency(avgPropertyRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Portfolio Health</div>
        <div class="stat-value">${concentrationRisk < 40 ? 'Diversified' : concentrationRisk < 60 ? 'Moderate' : 'Concentrated'}</div>
      </div>
    </div>
  </div>
`;
  }

  // Property List Detail
  html += `
  <div class="section">
    <h2 class="section-title">Property Details</h2>
    <div class="property-list">
`;
  properties.forEach(property => {
    const health = healthScores?.find(h => h.property_id === property.id);
    html += `
      <div class="property-item">
        <div class="property-name">${property.nickname}</div>
        <div class="property-location">${property.address_line1 ? `${property.address_line1}, ` : ''}${property.city}, ${property.state_code} ${property.zip_code || ''}</div>
        <div class="property-stats">
          <span><strong>${property.configured_beds || 0}</strong> beds</span>
          <span><strong>${formatPercent(property.current_occupancy_percent || 0)}</strong> occupancy</span>
          <span class="${(property.current_monthly_profit || 0) >= 0 ? 'profit-positive' : 'profit-negative'}"><strong>${formatCurrency(property.current_monthly_profit || 0)}</strong>/mo profit</span>
          ${health ? `<span><strong>${health.overall_score}/100</strong> health</span>` : ''}
        </div>
      </div>
`;
  });
  html += `
    </div>
  </div>
`;

  // Footer
  html += `
  <div class="footer">
    <p>This report was generated by Mind Insurance Property Portfolio Management System.</p>
    <p>Report generated: ${formatDate(generatedAt)} at ${generatedAt.toLocaleTimeString()}</p>
  </div>
</body>
</html>
`;

  return html;
}

// ============================================================================
// EXCEL GENERATION (CSV-BASED)
// ============================================================================

function generateExcelContent(data: ReportData): string {
  const { properties, summary, healthScores, periodLabel, generatedAt } = data;

  let csv = '';

  // Header
  csv += `Property Portfolio Report\n`;
  csv += `Period,${periodLabel}\n`;
  csv += `Generated,${formatDate(generatedAt)}\n`;
  csv += `\n`;

  // Summary Section
  csv += `PORTFOLIO SUMMARY\n`;
  csv += `Total Properties,${summary.total_properties}\n`;
  csv += `Active Properties,${summary.active_properties}\n`;
  csv += `Total Beds,${summary.total_beds}\n`;
  csv += `Occupied Beds,${summary.occupied_beds}\n`;
  csv += `Vacant Beds,${summary.vacant_beds}\n`;
  csv += `Average Occupancy,${formatPercent(summary.average_occupancy_percent)}\n`;
  csv += `Total Monthly Revenue,${summary.total_monthly_revenue}\n`;
  csv += `Total Monthly Profit,${summary.total_monthly_profit}\n`;
  csv += `Average Profit Margin,${formatPercent(summary.average_profit_margin)}\n`;
  csv += `Average Break-Even,${formatPercent(summary.average_break_even_percent)}\n`;
  csv += `\n`;

  // Property Details
  csv += `PROPERTY DETAILS\n`;
  csv += `Property Name,Address,City,State,Zip,Type,Ownership Model,Beds,Occupied,Occupancy %,Revenue,Profit,Health Score,Risk Level\n`;

  properties.forEach(property => {
    const health = healthScores?.find(h => h.property_id === property.id);
    csv += `"${property.nickname}",`;
    csv += `"${property.address_line1 || ''}",`;
    csv += `"${property.city}",`;
    csv += `${property.state_code},`;
    csv += `"${property.zip_code || ''}",`;
    csv += `"${property.property_type || ''}",`;
    csv += `"${property.ownership_model || ''}",`;
    csv += `${property.configured_beds || 0},`;
    csv += `${property.current_occupied_beds || 0},`;
    csv += `${(property.current_occupancy_percent || 0).toFixed(1)},`;
    csv += `${property.current_monthly_revenue || 0},`;
    csv += `${property.current_monthly_profit || 0},`;
    csv += `${health?.overall_score || ''},`;
    csv += `${health?.risk_level || ''}\n`;
  });

  csv += `\n`;

  // Revenue Distribution
  csv += `REVENUE DISTRIBUTION\n`;
  csv += `Property,Monthly Revenue,% of Total\n`;
  summary.revenue_by_property.forEach(item => {
    csv += `"${item.property_nickname}",${item.monthly_revenue},${item.revenue_percent.toFixed(1)}\n`;
  });

  return csv;
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate a PDF report for the portfolio
 */
export async function generatePDFReport(data: ReportData): Promise<ReportGenerationResult> {
  try {
    const html = generatePDFContent(data);
    const blob = new Blob([html], { type: 'text/html' });
    const filename = generateFilename(data.reportType, data.period, 'pdf');

    // Note: For actual PDF generation, you would use a library like html2pdf.js or jsPDF
    // This implementation opens the HTML for print-to-PDF
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    return {
      success: true,
      data: blob,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF report',
    };
  }
}

/**
 * Generate an Excel (CSV) report for the portfolio
 */
export async function generateExcelReport(data: ReportData): Promise<ReportGenerationResult> {
  try {
    const csv = generateExcelContent(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = generateFilename(data.reportType, data.period, 'excel');

    // Trigger download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      data: blob,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate Excel report',
    };
  }
}

/**
 * Generate a report based on the specified format
 */
export async function generateReport(
  options: ReportOptions,
  properties: Property[],
  summary: PortfolioSummary,
  healthScores?: PropertyHealthScore[],
  rooms?: Record<string, PropertyRoom[]>,
  financials?: Record<string, PropertyFinancial[]>
): Promise<ReportGenerationResult> {
  // Filter properties if specific ones are selected
  const reportProperties = options.selectedPropertyIds.length > 0
    ? properties.filter(p => options.selectedPropertyIds.includes(p.id))
    : properties;

  // Recalculate summary if filtered
  const reportSummary = options.selectedPropertyIds.length > 0
    ? calculateFilteredSummary(reportProperties)
    : summary;

  const reportData: ReportData = {
    generatedAt: new Date(),
    reportType: options.reportType,
    period: options.period,
    periodLabel: getPeriodLabel(options.reportType, options.period),
    properties: reportProperties,
    summary: reportSummary,
    healthScores: healthScores?.filter(h =>
      options.selectedPropertyIds.length === 0 ||
      options.selectedPropertyIds.includes(h.property_id)
    ),
    rooms,
    financials,
    includeSections: options.includeSections,
  };

  if (options.format === 'pdf') {
    return generatePDFReport(reportData);
  } else {
    return generateExcelReport(reportData);
  }
}

/**
 * Calculate summary for filtered properties
 */
function calculateFilteredSummary(properties: Property[]): PortfolioSummary {
  const totalBeds = properties.reduce((sum, p) => sum + (p.configured_beds || 0), 0);
  const occupiedBeds = properties.reduce((sum, p) => sum + (p.current_occupied_beds || 0), 0);
  const totalRevenue = properties.reduce((sum, p) => sum + (p.current_monthly_revenue || 0), 0);
  const totalProfit = properties.reduce((sum, p) => sum + (p.current_monthly_profit || 0), 0);
  const totalExpenses = totalRevenue - totalProfit;

  return {
    total_properties: properties.length,
    active_properties: properties.filter(p => p.is_active).length,
    total_beds: totalBeds,
    occupied_beds: occupiedBeds,
    vacant_beds: totalBeds - occupiedBeds,
    average_occupancy_percent: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
    total_monthly_revenue: totalRevenue,
    total_monthly_expenses: totalExpenses,
    total_monthly_profit: totalProfit,
    average_profit_margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    average_break_even_percent: properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.break_even_occupancy_percent || 0), 0) / properties.length
      : 0,
    revenue_by_property: properties.map(p => ({
      property_id: p.id,
      property_nickname: p.nickname,
      monthly_revenue: p.current_monthly_revenue || 0,
      revenue_percent: totalRevenue > 0 ? ((p.current_monthly_revenue || 0) / totalRevenue) * 100 : 0,
    })),
  };
}

export default {
  generatePDFReport,
  generateExcelReport,
  generateReport,
};
