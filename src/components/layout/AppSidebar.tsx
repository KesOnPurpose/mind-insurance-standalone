import { useMemo } from 'react';
import { Plus, Settings, LogOut, Home, Map, Calendar, BookOpen, MessageSquare, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { COACHES } from '@/types/coach';
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
import { SidebarAppSwitcher } from './SidebarAppSwitcher';

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

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

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
      className={cn(isMindInsurance && "mi-sidebar-dark")}
      style={isMindInsurance ? {
        borderColor: 'rgba(5, 195, 221, 0.2)',
        borderRightColor: 'rgba(5, 195, 221, 0.2)'
      } : undefined}
    >
      {/* Single scrollable content - everything flows together */}
      <SidebarContent className={cn("px-2", isMindInsurance && "bg-mi-navy-light")}>
        {/* Logo/Brand - now part of scrollable content */}
        <div className="p-2 pt-4">
          <Link
            to="/chat"
            className={cn("flex items-center gap-2 mb-4", isMindInsurance && "text-white")}
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isMindInsurance
                ? "bg-gradient-to-br from-mi-cyan to-mi-cyan/60"
                : "bg-gradient-to-br from-primary to-primary/60"
            )}>
              <span className="text-white font-bold text-sm">{isMindInsurance ? "MI" : "GH"}</span>
            </div>
            <span className={cn("font-semibold text-lg", isMindInsurance && "text-white")}>
              {isMindInsurance ? "Mind Insurance" : "Grouphomes4newbies"}
            </span>
          </Link>

          {/* Primary Action Button - Context-aware: Ask MIO in Mind Insurance, Ask Nette elsewhere */}
          {(() => {
            const isInMindInsurance = location.pathname.startsWith('/mind-insurance');
            const activeCoach = isInMindInsurance ? COACHES.mio : COACHES.nette;

            if (mode === 'chat') {
              return (
                <Button
                  onClick={() => handleNavigate('/chat')}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              );
            }

            return (
              <Button
                onClick={() => handleNavigate('/chat')}
                className={cn(
                  "w-full justify-start gap-2 transition-colors",
                  isMindInsurance && "bg-mi-navy-light border-mi-cyan/30 hover:bg-mi-navy text-mi-cyan hover:text-white"
                )}
                variant="outline"
                style={!isMindInsurance ? {
                  borderColor: activeCoach.color,
                  color: activeCoach.color
                } : undefined}
              >
                <MessageSquare className="h-4 w-4" />
                Ask {activeCoach.name}
              </Button>
            );
          })()}
        </div>

        <SidebarSeparator className={cn("my-2", isMindInsurance && "!bg-mi-cyan/20")} />
        {/* Context-Specific Panel */}
        {mode !== 'chat' && (
          <>
            <div className={cn(
              "text-xs font-medium px-2 py-2",
              isMindInsurance ? "text-mi-cyan" : "text-muted-foreground"
            )}>
              {getSectionLabel(mode)}
            </div>
            <SidebarContextPanel mode={mode} />
            <SidebarSeparator className={cn("my-3", isMindInsurance && "!bg-mi-cyan/20")} />
          </>
        )}

        {/* Apps Section */}
        <div className={cn(
          "text-xs font-medium px-2 py-2",
          isMindInsurance ? "text-mi-cyan" : "text-muted-foreground"
        )}>
          Apps
        </div>
        <SidebarAppSwitcher />

        <SidebarSeparator className={cn("my-3", isMindInsurance && "!bg-mi-cyan/20")} />

        {/* Navigation Section */}
        <div className={cn(
          "text-xs font-medium px-2 py-2",
          isMindInsurance ? "text-mi-cyan" : "text-muted-foreground"
        )}>
          Navigation
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Dashboard"
              isActive={isActive('/dashboard')}
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
            >
              <Link to="/model-week" onClick={() => isMobile && setOpenMobile(false)}>
                <Calendar className="h-4 w-4" />
                <span>Model Week</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className={cn("my-2", isMindInsurance && "!bg-mi-cyan/20")} />

        {/* Account Section */}
        <div className={cn(
          "text-xs font-medium px-2 py-1",
          isMindInsurance ? "text-mi-cyan" : "text-muted-foreground"
        )}>
          Account
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              isActive={isActive('/profile')}
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy data-[active=true]:text-mi-cyan data-[active=true]:bg-mi-cyan/10"
              )}
            >
              <Link to="/settings" onClick={() => isMobile && setOpenMobile(false)}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User info */}
        {user && (
          <div className={cn(
            "mt-2 mb-4 px-2 py-2 rounded-md",
            isMindInsurance ? "bg-mi-navy" : "bg-sidebar-accent/50"
          )}>
            <p className={cn(
              "text-xs truncate",
              isMindInsurance ? "text-gray-400" : "text-muted-foreground"
            )}>
              {user.email}
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
