import { Link } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Shield,
  Brain,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

/**
 * ProfilePanel - Sidebar content for profile page (MI Standalone)
 * Shows MI-specific quick actions only: Coverage Center, Practice Center, My Evidence
 */
export function ProfilePanel() {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="text-xs font-medium text-mi-cyan px-2 mb-2">
        Quick Actions
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="text-gray-400 hover:text-white hover:bg-mi-navy">
            <Link to="/mind-insurance/coverage" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-mi-cyan" />
                <span>Coverage Center</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="text-gray-400 hover:text-white hover:bg-mi-navy">
            <Link to="/mind-insurance/practice" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-mi-cyan" />
                <span>Practice Center</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="text-gray-400 hover:text-white hover:bg-mi-navy">
            <Link to="/mind-insurance/vault" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-mi-gold" />
                <span>My Evidence</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

export default ProfilePanel;
