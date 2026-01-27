/**
 * Admin Compliance Binder Generator Page
 * Route: /admin/compliance
 */

import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { BinderGenerator } from '@/components/admin/compliance';

export default function ComplianceBinderGeneratorPage() {
  return (
    <SidebarLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <BinderGenerator />
      </div>
    </SidebarLayout>
  );
}
