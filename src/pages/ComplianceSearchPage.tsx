// ============================================================================
// COMPLIANCE SEARCH PAGE
// ============================================================================
// Dedicated page for compliance information search functionality.
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Shield, FolderOpen, Plus } from 'lucide-react';
import { ComplianceSearch } from '@/components/compliance/search';
import { useBinderList } from '@/hooks/useComplianceBinder';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceSearchPage() {
  const navigate = useNavigate();

  // Get user's binders to enable saving search results
  const { binders, isLoading: bindersLoading } = useBinderList();
  const primaryBinderId = binders.length > 0 ? binders[0].id : undefined;

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

      {/* Show create binder prompt if user has no binder */}
      {!bindersLoading && !primaryBinderId && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FolderOpen className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Create a binder to save your research
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You need a compliance binder before you can save search results.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/compliance?tab=binder')}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Binder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Search Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Search Compliance Information</CardTitle>
              <CardDescription>
                Search across all 50 states for licensing requirements, zoning
                rules, fair housing protections, and more.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ComplianceSearch
            binderId={primaryBinderId}
            showFilters={true}
            showHistory={true}
            showPopularSearches={true}
          />
        </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
