import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, MessageSquare, Map, Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLauncher, CurrentProductBadge } from './AppLauncher';
import { BottomNav } from './BottomNav';
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
            {/* Quick Action: Roadmap (consolidated journey view) */}
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
