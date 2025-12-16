import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, MessageSquare, Map, BookOpen, Shield, LifeBuoy, Loader2, Upload } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppLauncher, CurrentProductBadge } from './AppLauncher';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useToast } from '@/hooks/use-toast';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { canAccessAdminPanel } = useAccessControl();
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header with App Launcher */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLauncher />
            <CurrentProductBadge />
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Roadmap */}
            <Link to="/roadmap">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <Map className="w-4 h-4" />
                <span>Roadmap</span>
              </Button>
            </Link>

            {/* Quick Action: Resources */}
            <Link to="/resources">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Resources</span>
              </Button>
            </Link>

            {/* Quick Action: Chat */}
            <Link to="/chat">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </Button>
            </Link>

            {/* Admin Link - Only visible to admin+ users */}
            {canAccessAdminPanel && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Button>
              </Link>
            )}

            {/* Support Modal */}
            <SupportModal 
              open={isSupportOpen} 
              onOpenChange={setIsSupportOpen} 
              userEmail={user?.email} 
            />

            {/* User Profile & Settings */}
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-700 hidden sm:inline font-medium">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - pb-20 for mobile bottom nav space */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 sm:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Support Modal Component
function SupportModal({ 
  open, 
  onOpenChange, 
  userEmail 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Append the actual file object if it exists (FormData might not catch file input directly depending on implementation, ensuring it here is safer)
    if (file) {
      formData.set('attachment', file);
    }

    try {
      const response = await fetch('https://n8n-n8n.vq00fr.easypanel.host/webhook/support', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Request Sent",
          description: "We have received your support request and will contact you shortly.",
        });
        onOpenChange(false);
        setFile(null); // Reset file
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send support request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
          <LifeBuoy className="w-4 h-4" />
          <span>Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Fill out the form below to reach our support team. We'll get back to you via email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Your Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1234567890" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              defaultValue={userEmail || ''} 
              placeholder="you@example.com" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestions">How can we help?</Label>
            <Textarea 
              id="suggestions" 
              name="suggestions" 
              placeholder="Please describe your issue or suggestion..." 
              className="min-h-[100px]"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="attachment" 
                type="file" 
                className="cursor-pointer"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}