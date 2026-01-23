import { useState, useEffect } from 'react';
import { Settings, LogOut, User, MessageSquare, Shield, Home, Map, FileText, Calculator, Phone, PhoneCall, History, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

export type ChatMode = 'chat' | 'voice';

interface ChatSidebarProps {
  onModeChange?: (mode: ChatMode) => void;
  verifiedPhone?: string | null;
  onVerifyPhone?: () => void;
}

// GROUPHOME STANDALONE: Product branding for Grouphome only
const PRODUCT_BRANDING = {
  name: 'Grouphomes4newbies',
  shortName: 'Grouphome',
  logoInitials: 'GH',
  gradientClasses: 'from-primary to-primary/60',
  chatRoute: '/chat',
};

export function ChatSidebar({ onModeChange, verifiedPhone, onVerifyPhone }: ChatSidebarProps) {
  const [mode, setMode] = useState<ChatMode>('chat');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

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
  };

  // Mask phone number for display
  const maskedPhone = verifiedPhone
    ? verifiedPhone.replace(/(\d{1,3})(\d{3})(\d{4})$/, '$1 ***-$3')
    : null;

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

        {/* Chat/Voice Mode Toggle - Premium Apple-style */}
        <div className="relative flex items-center p-1 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/40 shadow-sm">
          {/* Animated background indicator */}
          <div
            className={cn(
              "absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-mi-navy-light",
              "shadow-md transition-all duration-200 ease-out",
              mode === 'voice' && "translate-x-[calc(100%+4px)]"
            )}
          />
          <button
            onClick={() => handleModeChange('chat')}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "transition-colors duration-200 z-10",
              mode === 'chat'
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => handleModeChange('voice')}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "transition-colors duration-200 z-10",
              mode === 'voice'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <Phone className="h-4 w-4" />
            <span>Voice</span>
          </button>
        </div>

        {/* Mode-specific action button */}
        {mode === 'chat' ? (
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 transition-colors"
            variant="outline"
            style={{
              borderColor: activeCoach.color,
              color: activeCoach.color
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Ask {activeCoach.name}
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Phone verification status - compact version */}
            {verifiedPhone ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Verified</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{maskedPhone}</p>
                </div>
              </div>
            ) : (
              <Button
                onClick={onVerifyPhone}
                variant="outline"
                className="w-full justify-start gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              >
                <Phone className="h-4 w-4" />
                Verify Phone
              </Button>
            )}
          </div>
        )}
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
          /* Voice Mode: Voice-specific quick actions */
          <div className="flex-[2] min-h-[150px]">
            <div className="text-xs font-medium px-2 py-2 text-muted-foreground">
              Voice Actions
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <PhoneCall className="h-4 w-4 text-primary" />
                  <span>Call Nette</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Available</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Call History">
                  <History className="h-4 w-4" />
                  <span>Call History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Voice mode info card */}
            <div className="mt-4 mx-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Voice calls with Nette are private, encrypted, and tailored to your grouphome journey.
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
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link to="/dashboard" onClick={() => isMobile && setOpenMobile(false)}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Roadmap">
                <Link to="/roadmap" onClick={() => isMobile && setOpenMobile(false)}>
                  <Map className="h-4 w-4" />
                  <span>Roadmap</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Documents">
                <Link to="/resources/documents" onClick={() => isMobile && setOpenMobile(false)}>
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Calculator">
                <Link to="/resources/calculator" onClick={() => isMobile && setOpenMobile(false)}>
                  <Calculator className="h-4 w-4" />
                  <span>Calculator</span>
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
