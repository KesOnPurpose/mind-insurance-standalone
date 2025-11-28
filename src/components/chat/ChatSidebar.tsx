import { Plus, Settings, LogOut, Home, Map, Calendar, BookOpen, User } from 'lucide-react';
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
import { SidebarAppSwitcher } from '@/components/layout/SidebarAppSwitcher';

export function ChatSidebar() {
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

  const handleNewChat = () => {
    startNewConversation();
    // Close mobile sidebar after action
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
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
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className="p-4">
        {/* Logo/Brand */}
        <Link to="/chat" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm">GH</span>
          </div>
          <span className="font-semibold text-lg">Grouphomes4newbies</span>
        </Link>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Scrollable Content - All sidebar content scrolls together */}
      <SidebarContent className="px-2">
        {/* Conversation History - with internal scroll for many conversations */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
          Recent Conversations
        </div>
        <div className="max-h-[400px] overflow-y-auto">
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

        <SidebarSeparator className="my-3" />

        {/* Apps Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
          Apps
        </div>
        <SidebarAppSwitcher />

        <SidebarSeparator className="my-3" />

        {/* Navigation Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
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
            <SidebarMenuButton asChild tooltip="Resources">
              <Link to="/resources" onClick={() => isMobile && setOpenMobile(false)}>
                <BookOpen className="h-4 w-4" />
                <span>Resources</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Model Week">
              <Link to="/model-week" onClick={() => isMobile && setOpenMobile(false)}>
                <Calendar className="h-4 w-4" />
                <span>Model Week</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        {/* Account Section */}
        <div className="text-xs font-medium text-muted-foreground px-2 py-1">
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
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
