import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, MessageSquare, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLauncher, CurrentProductBadge } from './AppLauncher';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();

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
            {/* Quick Action: My Journey */}
            <Link to="/my-journey">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <Map className="w-4 h-4" />
                <span>My Journey</span>
              </Button>
            </Link>

            {/* Quick Action: Chat */}
            <Link to="/chat">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </Button>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
