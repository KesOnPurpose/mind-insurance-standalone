import { useState, useEffect } from 'react';
import { Settings, LogOut, User, MessageSquare, Shield, Home, FileText, Calculator, Phone, BookOpen, FolderOpen, ChevronDown, ChevronRight, ClipboardCheck, Building2 } from 'lucide-react';
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
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useConversationContext } from '@/contexts/ConversationContext';
import { ConversationList } from './ConversationList';
import { cn } from '@/lib/utils';
import { COACHES } from '@/types/coach';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type ChatMode = 'chat' | 'voice';

interface ChatSidebarProps {
  onModeChange?: (mode: ChatMode) => void;
}

// GROUPHOME STANDALONE: Product branding for Grouphome only
const PRODUCT_BRANDING = {
  name: 'Grouphomes4newbies',
  shortName: 'Grouphome',
  logoInitials: 'GH',
  gradientClasses: 'from-primary to-primary/60',
  chatRoute: '/chat',
};

export function ChatSidebar({ onModeChange }: ChatSidebarProps) {
  const [mode, setMode] = useState<ChatMode>('chat');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [resourcesOpen, setResourcesOpen] = useState(
    location.pathname.startsWith('/resources') || location.pathname === '/portfolio'
  );

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

  // GROUPHOME STANDALONE: Admin access controlled at route level
  // Show admin link - actual access controlled by admin page guards
  const canAccessAdminPanel = true;

  // GROUPHOME STANDALONE: Always use Nette coach
  const activeCoach = COACHES.nette;

  // Notify parent when mode changes
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    // Auto-close sidebar on mobile when switching to Voice so content is visible
    if (newMode === 'voice' && isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;
  const isResourcesActive = location.pathname.startsWith('/resources') || location.pathname === '/portfolio';

  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className="p-4 space-y-4">
        {/* Logo/Brand */}
        <Link
          to={PRODUCT_BRANDING.chatRoute}
          className="flex items-center gap-2"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
            PRODUCT_BRANDING.gradientClasses
          )}>
            <span className="text-white font-bold text-sm">{PRODUCT_BRANDING.logoInitials}</span>
          </div>
          <span className="font-semibold text-lg">
            {PRODUCT_BRANDING.name}
          </span>
        </Link>

        {/* Chat/Voice Mode Toggle - Premium Glassmorphic */}
        <div
          className="relative flex items-center p-1.5 rounded-2xl border border-white/20 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Animated background indicator - BOTH states use teal gradient */}
          <div
            className={cn(
              "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl",
              "shadow-md transition-all duration-300 ease-out",
              mode === 'voice' && "translate-x-[calc(100%+6px)]"
            )}
            style={{
              background: 'linear-gradient(135deg, hsl(187 85% 35% / 0.95), hsl(187 75% 45% / 0.85))',
              boxShadow: '0 4px 12px rgba(0, 128, 128, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
          />
          <button
            onClick={() => handleModeChange('chat')}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
              "transition-all duration-200 z-10",
              mode === 'chat'
                ? "text-white font-semibold"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => handleModeChange('voice')}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
              "transition-all duration-200 z-10",
              mode === 'voice'
                ? "text-white font-semibold"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <Phone className="h-4 w-4" />
            <span>Voice</span>
          </button>
        </div>

        {/* Mode-specific action button - Premium Glassmorphic Teal */}
        {mode === 'chat' ? (
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 transition-all duration-200 text-white font-medium rounded-xl border border-white/20 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, hsl(187 85% 35% / 0.95), hsl(187 75% 45% / 0.85))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 128, 128, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Ask {activeCoach.name}
          </Button>
        ) : null}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Main content area with flex layout */}
      <SidebarContent className="flex flex-col px-2">
        {/* Mode-specific content section */}
        {mode === 'chat' ? (
          /* Chat Mode: Scrollable Conversations Section */
          <div className="flex-[2] min-h-[150px] overflow-y-auto">
            <div className="text-xs font-medium px-2 py-2 text-muted-foreground">
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
            />
          </div>
        ) : (
          /* Voice Mode: Voice-specific info */
          <div className="flex-[2] min-h-[150px]">
            {/* Voice mode info card */}
            <div className="mt-2 mx-2 p-4 rounded-xl bg-gradient-to-br from-[hsl(187_85%_35%/0.08)] to-transparent border border-[hsl(187_85%_35%/0.15)]">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(187_85%_35%)] to-[hsl(187_75%_45%)] flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Talk with Nette</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Use the call button above</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Voice calls are private, encrypted, and tailored to your grouphome journey.
              </p>
            </div>
          </div>
        )}

        <SidebarSeparator className="my-2 shrink-0" />

        {/* Navigation Links */}
        <div className="py-2">
          <div className="text-xs font-medium px-2 py-2 text-muted-foreground">
            Navigation
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" isActive={isActive('/dashboard')}>
                <Link to="/dashboard" onClick={() => isMobile && setOpenMobile(false)}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="My Programs" isActive={location.pathname.startsWith('/programs')}>
                <Link to="/programs" onClick={() => isMobile && setOpenMobile(false)}>
                  <BookOpen className="h-4 w-4" />
                  <span>My Programs</span>
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
              <SidebarMenuButton asChild tooltip="Compliance" isActive={location.pathname.startsWith('/compliance')}>
                <Link to="/compliance" onClick={() => isMobile && setOpenMobile(false)}>
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Compliance</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarSeparator className="my-2 shrink-0" />

        {/* Account Section */}
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[280px]">
          <div className="text-xs font-medium px-2 py-1 text-muted-foreground">
            Account
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profile">
                <Link to="/profile" onClick={() => isMobile && setOpenMobile(false)}>
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link to="/settings" onClick={() => isMobile && setOpenMobile(false)}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {canAccessAdminPanel && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Admin">
                  <Link to="/admin" onClick={() => isMobile && setOpenMobile(false)}>
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
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
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
