// CSVTemplateDownloader Component
// Download empty CSV template for document-tactic links

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { downloadCSV } from '@/utils/csvHelpers';
import { toast } from 'sonner';

export const CSVTemplateDownloader = () => {
  const handleDownloadTemplate = () => {
    // Create template CSV with header and one example row
    const templateContent = `document_id,tactic_id,link_type
1,tactic_001,required
2,tactic_002,recommended
3,tactic_003,supplemental`;

    downloadCSV(templateContent, 'document-links-import-template.csv');
    toast.success('Template downloaded successfully');
  };

  return (
    <Button
      onClick={handleDownloadTemplate}
      variant="ghost"
      size="sm"
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Download Template
    </Button>
  );
};
