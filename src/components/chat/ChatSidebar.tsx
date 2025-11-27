import { Plus, Settings, LogOut, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useConversationContext } from '@/contexts/ConversationContext';
import { ConversationList } from './ConversationList';

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
  } = useConversations();

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
        <Link to="/dashboard" className="flex items-center gap-2 mb-4">
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

      {/* Conversation History */}
      <SidebarContent className="px-2">
        <div className="text-xs font-medium text-muted-foreground px-2 py-2">
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
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link to="/settings">
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
          <div className="mt-2 px-2 py-2 rounded-md bg-sidebar-accent/30">
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
