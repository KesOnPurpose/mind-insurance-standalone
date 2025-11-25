// DocumentLinkExporter Component
// Export document-tactic links to CSV file

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  generateCSV,
  downloadCSV,
  generateExportFilename,
  formatDateForCSV,
  type CSVLinkRow,
} from '@/utils/csvHelpers';

export const DocumentLinkExporter = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Query all links with document and tactic information
      const { data: links, error } = await supabase
        .from('gh_document_tactic_links')
        .select(`
          id,
          document_id,
          tactic_id,
          link_type,
          created_at,
          gh_documents!inner (
            document_name
          ),
          gh_tactic_instructions!inner (
            tactic_name
          )
        `)
        .order('document_id', { ascending: true })
        .order('tactic_id', { ascending: true });

      if (error) throw error;

      if (!links || links.length === 0) {
        toast.warning('No document links found to export');
        setIsExporting(false);
        return;
      }

      // Transform data to CSV format
      const csvData: CSVLinkRow[] = links.map((link: any) => ({
        document_id: link.document_id,
        document_name: link.gh_documents.document_name,
        tactic_id: link.tactic_id,
        tactic_name: link.gh_tactic_instructions.tactic_name,
        link_type: link.link_type,
        created_at: formatDateForCSV(link.created_at),
      }));

      // Generate CSV content
      const csvContent = generateCSV(csvData);

      // Download file
      const filename = generateExportFilename();
      downloadCSV(csvContent, filename);

      toast.success(`Exported ${csvData.length} links to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export links. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export Links to CSV
        </>
      )}
    </Button>
  );
};
