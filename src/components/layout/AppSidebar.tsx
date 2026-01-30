import { useState } from 'react';
import { Settings, LogOut, User, Shield, Home, FileText, Calculator, MessageSquare, BookOpen, FolderOpen, ChevronDown, ChevronRight, ClipboardCheck, Building2, LifeBuoy, Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import context-specific panels
import { ProfilePanel } from './sidebar-panels/ProfilePanel';
import { DefaultPanel } from './sidebar-panels/DefaultPanel';
import { AdminPanel } from './sidebar-panels/AdminPanel';

// GROUPHOME STANDALONE: Simplified sidebar modes
export type SidebarMode = 'chat' | 'roadmap' | 'dashboard' | 'model-week' | 'resources' | 'resources-documents' | 'resources-calculator' | 'profile' | 'admin' | 'programs' | 'compliance' | 'portfolio' | 'default';

interface AppSidebarProps {
  mode: SidebarMode;
}

/**
 * Premium Support Modal Component
 */
function SupportModal({
  open,
  onOpenChange,
  userEmail
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const jsonData: any = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      suggestions: formData.get('suggestions'),
    };

    if (file) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        jsonData.attachment = {
          filename: file.name,
          mimeType: file.type,
          data: base64
        };
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    try {
      const response = await fetch('https://n8n-n8n.vq00fr.easypanel.host/webhook/support1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      toast.success("We have received your support request and will contact you shortly.");
      onOpenChange(false);
      setFile(null);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Support request error:', error);
      toast.error("Failed to send support request. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl bg-gradient-to-b from-background to-background/95 backdrop-blur-xl">
        {/* Premium Header with Gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-t-lg" />
        
        <DialogHeader className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
              <LifeBuoy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Contact Support</DialogTitle>
              <DialogDescription className="text-sm">
                Our team is here to help you succeed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Your Name" 
                required 
                className="h-11 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                placeholder="+1234567890"
                className="h-11 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={userEmail || ''}
              placeholder="you@example.com"
              required
              className="h-11 border-muted-foreground/20 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestions" className="text-sm font-medium">How can we help?</Label>
            <Textarea
              id="suggestions"
              name="suggestions"
              placeholder="Please describe your issue or suggestion..."
              className="min-h-[120px] resize-none border-muted-foreground/20 focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment" className="text-sm font-medium">Attachment (Optional)</Label>
            <div className="relative">
              <Input
                id="attachment"
                type="file"
                className="cursor-pointer h-11 border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Sparkles className="h-3 w-3 text-primary" />
                {file.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Context-aware sidebar panel that renders different content based on mode
 */
function SidebarContextPanel({ mode }: { mode: SidebarMode }) {
  switch (mode) {
    case 'profile':
      return <ProfilePanel />;
    case 'admin':
      return <AdminPanel />;
    case 'chat':
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
  const [isSupportOpen, setIsSupportOpen] = useState(false);

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
    <>
      <Sidebar
        side="left"
        collapsible="offcanvas"
        className="border-r"
      >
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
            
            {/* Premium Support Button */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsSupportOpen(true)}
                tooltip="Get Support"
                className="group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                  <div className="p-0.5 rounded-md bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-colors">
                    <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground group-hover:from-primary group-hover:to-purple-500 bg-clip-text group-hover:text-transparent transition-all duration-300">
                    Support
                  </span>
                </div>
                <Sparkles className="ml-auto h-3 w-3 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </SidebarMenuButton>
            </SidebarMenuItem>

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

      {/* Support Modal */}
      <SupportModal
        open={isSupportOpen}
        onOpenChange={setIsSupportOpen}
        userEmail={user?.email}
      />
    </>
  );
}

export default AppSidebar;