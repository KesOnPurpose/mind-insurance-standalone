import { Plus, Settings, LogOut, Home, Map, Calendar, Shield, BookOpen, MessageSquare, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Import context-specific panels
import { RoadmapPanel } from './sidebar-panels/RoadmapPanel';
import { DashboardPanel } from './sidebar-panels/DashboardPanel';
import { MindInsurancePanel } from './sidebar-panels/MindInsurancePanel';
import { ModelWeekPanel } from './sidebar-panels/ModelWeekPanel';
import { ResourcesPanel } from './sidebar-panels/ResourcesPanel';
import { ResourcesHubPanel } from './sidebar-panels/ResourcesHubPanel';
import { CalculatorPanel } from './sidebar-panels/CalculatorPanel';
import { ProfilePanel } from './sidebar-panels/ProfilePanel';
import { DefaultPanel } from './sidebar-panels/DefaultPanel';

export type SidebarMode = 'chat' | 'roadmap' | 'dashboard' | 'mind-insurance' | 'model-week' | 'resources' | 'resources-documents' | 'resources-calculator' | 'profile' | 'default';

interface AppSidebarProps {
  mode: SidebarMode;
}

/**
 * Context-aware sidebar panel that renders different content based on mode
 */
function SidebarContextPanel({ mode }: { mode: SidebarMode }) {
  switch (mode) {
    case 'roadmap':
      return <RoadmapPanel />;
    case 'dashboard':
      return <DashboardPanel />;
    case 'mind-insurance':
      return <MindInsurancePanel />;
    case 'model-week':
      return <ModelWeekPanel />;
    case 'resources':
      return <ResourcesHubPanel />;
    case 'resources-documents':
      return <ResourcesPanel />;
    case 'resources-calculator':
      return <CalculatorPanel />;
    case 'profile':
      return <ProfilePanel />;
    case 'chat':
      // Chat mode uses ChatSidebar directly, not AppSidebar
      return null;
    default:
      return <DefaultPanel />;
  }
}

/**
 * Get the section label for the current mode
 */
function getSectionLabel(mode: SidebarMode): string {
  switch (mode) {
    case 'roadmap':
      return 'Your Journey';
    case 'dashboard':
      return 'Quick Stats';
    case 'mind-insurance':
      return 'PROTECT Practice';
    case 'model-week':
      return 'This Week';
    case 'resources':
      return 'Resources';
    case 'resources-documents':
      return 'Documents';
    case 'resources-calculator':
      return 'Calculator Tips';
    case 'profile':
      return 'Your Profile';
    default:
      return 'Overview';
  }
}

/**
 * AppSidebar - Main sidebar component with composition pattern
 *
 * Displays:
 * 1. Header with logo and primary action button
 * 2. Context-specific panel based on current route
 * 3. Consistent navigation section
 * 4. Consistent account section
 */
export function AppSidebar({ mode }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

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
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className="p-4">
        {/* Logo/Brand */}
        <Link
          to="/chat"
          className="flex items-center gap-2 mb-4"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm">GH</span>
          </div>
          <span className="font-semibold text-lg">Grouphomes4newbies</span>
        </Link>

        {/* Primary Action Button - Changes based on mode */}
        {mode === 'chat' ? (
          <Button
            onClick={() => handleNavigate('/chat')}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        ) : (
          <Button
            onClick={() => handleNavigate('/chat')}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <MessageSquare className="h-4 w-4" />
            Ask Nette
          </Button>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Scrollable Content - Context Panel, Navigation & Account */}
      <SidebarContent className="px-2">
        {/* Context-Specific Panel */}
        {mode !== 'chat' && (
          <>
            <div className="text-xs font-medium text-muted-foreground px-2 py-2">
              {getSectionLabel(mode)}
            </div>
            <SidebarContextPanel mode={mode} />
            <SidebarSeparator className="my-3" />
          </>
        )}

        {/* Navigation Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
          Navigation
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Dashboard"
              isActive={isActive('/dashboard')}
            >
              <Link to="/dashboard" onClick={() => isMobile && setOpenMobile(false)}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Chat with Nette"
              isActive={isActive('/chat')}
            >
              <Link to="/chat" onClick={() => isMobile && setOpenMobile(false)}>
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Roadmap"
              isActive={isActive('/roadmap')}
            >
              <Link to="/roadmap" onClick={() => isMobile && setOpenMobile(false)}>
                <Map className="h-4 w-4" />
                <span>Roadmap</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Resources"
              isActive={isActive('/resources')}
            >
              <Link to="/resources" onClick={() => isMobile && setOpenMobile(false)}>
                <BookOpen className="h-4 w-4" />
                <span>Resources</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Model Week"
              isActive={isActive('/model-week')}
            >
              <Link to="/model-week" onClick={() => isMobile && setOpenMobile(false)}>
                <Calendar className="h-4 w-4" />
                <span>Model Week</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-3" />

        {/* Apps Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
          Apps
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Mind Insurance"
              isActive={isActive('/mind-insurance')}
            >
              <Link to="/mind-insurance" onClick={() => isMobile && setOpenMobile(false)}>
                <Shield className="h-4 w-4" />
                <span>Mind Insurance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-3" />

        {/* Account Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
          Account
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              isActive={isActive('/profile')}
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
            >
              <Link to="/settings" onClick={() => isMobile && setOpenMobile(false)}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User info */}
        {user && (
          <div className="mt-3 px-2 py-2 rounded-md bg-sidebar-accent/50">
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
