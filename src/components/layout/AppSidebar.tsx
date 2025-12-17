import { useMemo } from 'react';
import { Settings, LogOut, User, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

// Import context-specific panels
import { MindInsurancePanel } from './sidebar-panels/MindInsurancePanel';
import { ProfilePanel } from './sidebar-panels/ProfilePanel';
import { DefaultPanel } from './sidebar-panels/DefaultPanel';
import { AdminPanel } from './sidebar-panels/AdminPanel';

export type SidebarMode = 'chat' | 'roadmap' | 'dashboard' | 'mind-insurance' | 'model-week' | 'resources' | 'resources-documents' | 'resources-calculator' | 'profile' | 'admin' | 'default';

interface AppSidebarProps {
  mode: SidebarMode;
}

/**
 * Context-aware sidebar panel that renders different content based on mode
 * For MI standalone, only Mind Insurance, Profile, and Admin panels are relevant
 */
function SidebarContextPanel({ mode }: { mode: SidebarMode }) {
  switch (mode) {
    case 'mind-insurance':
      return <MindInsurancePanel />;
    case 'profile':
      return <ProfilePanel />;
    case 'admin':
      return <AdminPanel />;
    case 'chat':
      // Chat mode uses ChatSidebar directly, not AppSidebar
      return null;
    default:
      // Default to Mind Insurance panel for standalone app
      return <MindInsurancePanel />;
  }
}

/**
 * Get the section label for the current mode
 */
function getSectionLabel(mode: SidebarMode): string {
  switch (mode) {
    case 'mind-insurance':
      return 'PROTECT Practice';
    case 'profile':
      return 'Your Profile';
    case 'admin':
      return 'Admin Panel';
    default:
      return 'Mind Insurance';
  }
}

/**
 * AppSidebar - Main sidebar component for Mind Insurance standalone
 *
 * Displays:
 * 1. Header with Mind Insurance logo
 * 2. Context-specific panel (Mind Insurance navigation)
 * 3. Account section (Profile, Settings, Admin, Sign out)
 */
export function AppSidebar({ mode }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { canAccessAdminPanel } = useAccessControl();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  // Always use MI theme for standalone app
  const isMindInsurance = true;

  const handleNavigate = (path: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      side="left"
      collapsible="offcanvas"
      className="mi-sidebar-dark"
      style={{
        borderColor: 'rgba(5, 195, 221, 0.2)',
        borderRightColor: 'rgba(5, 195, 221, 0.2)'
      }}
    >
      {/* Single scrollable content - everything flows together */}
      <SidebarContent className="px-2 bg-mi-navy-light">
        {/* Logo/Brand - Mind Insurance */}
        <div className="p-2 pt-4">
          <Link
            to="/mind-insurance"
            className="flex items-center gap-2 mb-4 text-white"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-mi-cyan to-mi-cyan/60">
              <span className="text-white font-bold text-sm">MI</span>
            </div>
            <span className="font-semibold text-lg text-white">
              Mind Insurance
            </span>
          </Link>
        </div>

        <SidebarSeparator className="my-2 !bg-mi-cyan/20" />

        {/* Context-Specific Panel */}
        {mode !== 'chat' && (
          <>
            <div className="text-xs font-medium px-2 py-2 text-mi-cyan">
              {getSectionLabel(mode)}
            </div>
            <SidebarContextPanel mode={mode} />
            <SidebarSeparator className="my-3 !bg-mi-cyan/20" />
          </>
        )}

        {/* Account Section */}
        <div className="text-xs font-medium px-2 py-1 text-mi-cyan">
          Account
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              isActive={isActive('/profile')}
              className="text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
            >
              <Link to="/profile" onClick={() => isMobile && setOpenMobile(false)}>
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={isActive('/settings')}
              className="text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
            >
              <Link to="/settings" onClick={() => isMobile && setOpenMobile(false)}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {canAccessAdminPanel && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Admin"
                isActive={isActive('/admin')}
                className="text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              >
                <Link to="/admin" onClick={() => isMobile && setOpenMobile(false)}>
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="text-gray-400 hover:text-white hover:bg-mi-navy"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User info */}
        {user && (
          <div className="mt-2 mb-4 px-2 py-2 rounded-md bg-mi-navy">
            <p className="text-xs truncate text-gray-400">
              {user.email}
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
