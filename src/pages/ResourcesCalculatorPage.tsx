import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { UnderwritingCalculator } from '@/components/calculator/UnderwritingCalculator';

export default function ResourcesCalculatorPage() {
  return (
    <SidebarLayout>
      <div className="space-y-4 pb-20 md:pb-4">
        {/* Back Button Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link to="/resources">
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Link>
          </Button>
        </div>

        {/* Calculator Component */}
        <UnderwritingCalculator />
      </div>
    </SidebarLayout>
  );
}
