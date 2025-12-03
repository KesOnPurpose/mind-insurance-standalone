import { FileText, Calculator } from 'lucide-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ResourceHubTile } from '@/components/resources/ResourceHubTile';

export default function ResourcesHubPage() {
  return (
    <SidebarLayout>
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground mt-1">
            Tools and documents to help you build your group home business
          </p>
        </div>

        {/* Resource Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResourceHubTile
            title="Important Group Home Documents"
            description="Templates, checklists, compliance guides, and training materials"
            icon={<FileText className="w-6 h-6" />}
            href="/resources/documents"
            color="blue"
          />
          <ResourceHubTile
            title="Group Home Calculator"
            description="Financial projections, ROI analysis, and break-even calculations"
            icon={<Calculator className="w-6 h-6" />}
            href="/resources/calculator"
            color="green"
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
