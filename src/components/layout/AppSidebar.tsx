import { useState } from 'react';
import { Settings, LogOut, User, Shield, Home, FileText, Calculator, MessageSquare, BookOpen, FolderOpen, ChevronDown, ChevronRight, ClipboardCheck, Building2 } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Import context-specific panels
import { ProfilePanel } from './sidebar-panels/ProfilePanel';
import { DefaultPanel } from './sidebar-panels/DefaultPanel';
import { AdminPanel } from './sidebar-panels/AdminPanel';

// GROUPHOME STANDALONE: Simplified sidebar modes
// Updated: Removed roadmap from nav, added resources collapsible, added compliance
export type SidebarMode = 'chat' | 'roadmap' | 'dashboard' | 'model-week' | 'resources' | 'resources-documents' | 'resources-calculator' | 'profile' | 'admin' | 'programs' | 'compliance' | 'portfolio' | 'default';

interface AppSidebarProps {
  mode: SidebarMode;
}

/**
 * Context-aware sidebar panel that renders different content based on mode
 * For Grouphome standalone, only Profile and Admin panels are relevant
 */
function SidebarContextPanel({ mode }: { mode: SidebarMode }) {
  switch (mode) {
    case 'profile':
      return <ProfilePanel />;
    case 'admin':
      return <AdminPanel />;
    case 'chat':
      // Chat mode uses ChatSidebar directly, not AppSidebar
      return null;
    default:
      // Default panel for other modes
      return <DefaultPanel />;
  }
}

/**
 * Get the section label for the current mode
 */
function getSectionLabel(mode: SidebarMode): string {
  switch (mode) {
    case 'profile':
      return 'Your Profile';
    case 'admin':
      return 'Admin Panel';
    case 'roadmap':
      return 'Your Roadmap';
    case 'dashboard':
      return 'Dashboard';
    case 'programs':
      return 'My Programs';
    case 'compliance':
      return 'Compliance';
    case 'portfolio':
      return 'Portfolio';
    case 'resources':
    case 'resources-documents':
    case 'resources-calculator':
      return 'Resources';
    default:
      return 'Navigation';
  }
}

/**
 * AppSidebar - Main sidebar component for Grouphome standalone
 *
 * Displays:
 * 1. Header with Grouphome logo
 * 2. Context-specific panel
 * 3. Account section (Profile, Settings, Admin, Sign out)
 */
export function AppSidebar({ mode }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [resourcesOpen, setResourcesOpen] = useState(
    location.pathname.startsWith('/resources') ||
    location.pathname === '/portfolio'
  );

  // GROUPHOME STANDALONE: Admin access controlled at route level
  const canAccessAdminPanel = true;

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
  const isResourcesActive = location.pathname.startsWith('/resources') || location.pathname === '/portfolio';

  return (
    <Sidebar
      side="left"
      collapsible="offcanvas"
      className="border-r"
    >
      {/* Single scrollable content - everything flows together */}
      <SidebarContent className="px-2 bg-background">
        {/* Logo/Brand - Grouphome */}
        <div className="p-2 pt-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 mb-4"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
              <span className="text-white font-bold text-sm">GH</span>
            </div>
            <span className="font-semibold text-lg">
              Grouphomes4newbies
            </span>
          </Link>
        </div>

        <SidebarSeparator className="my-2" />

        {/* Quick Navigation */}
        <div className="text-xs font-medium px-2 py-2 text-muted-foreground">
          Navigation
        </div>
        <SidebarMenu data-tour-target="sidebar-navigation">
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
          {/* FEAT-GH-010: Programs Hub for course-based learning */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="My Programs"
              isActive={location.pathname.startsWith('/programs')}
            >
              <Link to="/programs" onClick={() => isMobile && setOpenMobile(false)}>
                <BookOpen className="h-4 w-4" />
                <span>My Programs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem data-tour-target="chat-nette">
            <SidebarMenuButton
              asChild
              tooltip="Chat with Nette"
              isActive={isActive('/chat')}
            >
              <Link to="/chat" onClick={() => isMobile && setOpenMobile(false)}>
                <MessageSquare className="h-4 w-4" />
                <span>Ask Nette</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Resources - Collapsible Section */}
          <SidebarMenuItem>
            <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Resources"
                  className={cn(isResourcesActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Resources</span>
                  {resourcesOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                <SidebarMenuButton
                  asChild
                  tooltip="Documents"
                  isActive={isActive('/resources/documents')}
                  className="h-8"
                >
                  <Link to="/resources/documents" onClick={() => isMobile && setOpenMobile(false)}>
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuButton
                  asChild
                  tooltip="Calculator"
                  isActive={isActive('/resources/calculator')}
                  className="h-8"
                >
                  <Link to="/resources/calculator" onClick={() => isMobile && setOpenMobile(false)}>
                    <Calculator className="h-4 w-4" />
                    <span>Calculator</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuButton
                  asChild
                  tooltip="Portfolio"
                  isActive={isActive('/portfolio')}
                  className="h-8"
                >
                  <Link to="/portfolio" onClick={() => isMobile && setOpenMobile(false)}>
                    <Building2 className="h-4 w-4" />
                    <span>Portfolio</span>
                  </Link>
                </SidebarMenuButton>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

          {/* Compliance */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Compliance"
              isActive={location.pathname.startsWith('/compliance')}
            >
              <Link to="/compliance" onClick={() => isMobile && setOpenMobile(false)}>
                <ClipboardCheck className="h-4 w-4" />
                <span>Compliance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-3" />

        {/* Context-Specific Panel */}
        {mode !== 'chat' && mode !== 'default' && mode !== 'dashboard' && mode !== 'roadmap' && (
          <>
            <div className="text-xs font-medium px-2 py-2 text-muted-foreground">
              {getSectionLabel(mode)}
            </div>
            <SidebarContextPanel mode={mode} />
            <SidebarSeparator className="my-3" />
          </>
        )}

        {/* Account Section */}
        <div className="text-xs font-medium px-2 py-1 text-muted-foreground">
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
          {canAccessAdminPanel && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Admin"
                isActive={isActive('/admin')}
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
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User info */}
        {user && (
          <div className="mt-2 mb-4 px-2 py-2 rounded-md bg-sidebar-accent/50">
            <p className="text-xs truncate text-muted-foreground">
              {user.email}
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
