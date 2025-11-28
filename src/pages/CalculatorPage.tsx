import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { UnderwritingCalculator } from "@/components/calculator/UnderwritingCalculator";

const CalculatorPage = () => {
  return (
    <SidebarLayout>
      <div className="space-y-4 pb-20 md:pb-4">
        <UnderwritingCalculator />
      </div>
    </SidebarLayout>
  );
};

export default CalculatorPage;
