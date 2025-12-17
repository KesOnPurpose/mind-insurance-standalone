import { useMemo, useState } from 'react';
import { Settings, LogOut, User, MessageSquare, Shield, TrendingUp, FolderArchive } from 'lucide-react';
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
import { useAccessControl } from '@/hooks/useAccessControl';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useConversationContext } from '@/contexts/ConversationContext';
import { useProduct, ProductType } from '@/contexts/ProductContext';
import { ConversationList } from './ConversationList';
import { cn } from '@/lib/utils';
import { COACHES } from '@/types/coach';

// Product-specific branding configuration
const PRODUCT_BRANDING: Record<ProductType, {
  name: string;
  shortName: string;
  logoInitials: string;
  gradientClasses: string;
  chatRoute: string;
}> = {
  'grouphome': {
    name: 'Grouphomes4newbies',
    shortName: 'Grouphome',
    logoInitials: 'GH',
    gradientClasses: 'from-primary to-primary/60',
    chatRoute: '/chat',
  },
  'mind-insurance': {
    name: 'Mind Insurance',
    shortName: 'MI',
    logoInitials: 'MI',
    gradientClasses: 'from-[#05c3dd] to-[#0099aa]',
    chatRoute: '/mind-insurance/chat',
  },
  'me-wealth': {
    name: 'ME Wealth Builder',
    shortName: 'ME',
    logoInitials: 'ME',
    gradientClasses: 'from-amber-500 to-amber-400',
    chatRoute: '/wealth/chat',
  },
};

// Navigation items for Mind Insurance sidebar
const MI_NAV_ITEMS = [
  { path: '/mind-insurance/coverage', label: 'Coverage Center', icon: TrendingUp },
  { path: '/mind-insurance', label: 'Practice Center', icon: Shield },
  { path: '/mind-insurance/vault', label: 'My Evidence', icon: FolderArchive },
];

export function ChatSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const { currentProduct } = useProduct();

  const {
    conversations,
    isLoading,
    error,
    renameConversation,
    removeConversation,
  } = useConversationsContext();

  const {
    activeConversationId,
    startNewConversation,
    selectConversation,
  } = useConversationContext();

  const { canAccessAdminPanel } = useAccessControl();

  // MIO Insights Thread selection state
  const [isMIOInsightsActive, setIsMIOInsightsActive] = useState(false);

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

  // Get product-specific branding
  const branding = PRODUCT_BRANDING[currentProduct];
  const activeCoach = isMindInsurance ? COACHES.mio : COACHES.nette;

  const handleNewChat = () => {
    startNewConversation();
    setIsMIOInsightsActive(false); // Deselect MIO Insights when starting new chat
    // Close mobile sidebar after action
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setIsMIOInsightsActive(false); // Deselect MIO Insights when selecting a conversation
    // Close mobile sidebar after selection
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSelectMIOInsights = () => {
    setIsMIOInsightsActive(true);
    // Navigate to the MIO Insights thread page
    navigate('/mind-insurance/mio-insights');
    // Close mobile sidebar after selection
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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
      <SidebarHeader className={cn("p-4", isMindInsurance && "bg-mi-navy-light")}>
        {/* Logo/Brand - Dynamic based on current product */}
        <Link
          to={branding.chatRoute}
          className={cn("flex items-center gap-2 mb-4", isMindInsurance && "text-white")}
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
            branding.gradientClasses
          )}>
            <span className="text-white font-bold text-sm">{branding.logoInitials}</span>
          </div>
          <span className={cn("font-semibold text-lg", isMindInsurance && "text-white")}>
            {branding.name}
          </span>
        </Link>

        {/* Primary Action Button - "Ask MIO" for Mind Insurance, "New Chat" otherwise */}
        <Button
          onClick={handleNewChat}
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
      </SidebarHeader>

      <SidebarSeparator className={cn(isMindInsurance && "!bg-mi-cyan/20")} />

      {/* Main content area with flex layout for split scrolling */}
      <SidebarContent className={cn("flex flex-col px-2", isMindInsurance && "bg-mi-navy-light")}>
        {/* Scrollable Conversations Section */}
        <div className="flex-[2] min-h-[150px] overflow-y-auto">
          <div className={cn(
            "text-xs font-medium px-2 py-2",
            isMindInsurance ? "text-mi-cyan" : "text-muted-foreground"
          )}>
            Recent Conversations
          </div>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            isLoading={isLoading}
            error={error}
            onSelectConversation={handleSelectConversation}
            onRenameConversation={renameConversation}
            onArchiveConversation={removeConversation}
            onSelectMIOInsights={handleSelectMIOInsights}
            isMIOInsightsActive={isMIOInsightsActive}
          />
        </div>

        <SidebarSeparator className={cn("my-2 shrink-0", isMindInsurance && "!bg-mi-cyan/20")} />

        {/* Mind Insurance Navigation Section (only for MI) */}
        {isMindInsurance && (
          <div className="px-2 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Mind Insurance
            </div>
            <nav className="space-y-1">
              {MI_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-mi-cyan/20 text-mi-cyan border-l-2 border-mi-cyan"
                        : "text-gray-400 hover:bg-mi-navy hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <SidebarSeparator className={cn("my-2 shrink-0", isMindInsurance && "!bg-mi-cyan/20")} />

        {/* Account Section */}
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[280px]">
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy"
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
              className={cn(
                isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy"
              )}
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
                className={cn(
                  isMindInsurance && "text-gray-400 hover:text-white hover:bg-mi-navy"
                )}
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
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
