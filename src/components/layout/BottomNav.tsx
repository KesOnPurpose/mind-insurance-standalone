import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MessageSquare, BookOpen, MoreHorizontal, Settings, User, Calculator } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavTab {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string | null;
}

// GROUPHOME STANDALONE: Grouphome-specific navigation tabs
const tabs: NavTab[] = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Roadmap', path: '/roadmap' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: BookOpen, label: 'Resources', path: '/resources' },
  { icon: MoreHorizontal, label: 'More', path: null },
];

const moreMenuItems = [
  { icon: Calculator, label: 'Calculator', path: '/calculator', description: 'Financial projections' },
  { icon: Settings, label: 'Settings', path: '/settings', description: 'App preferences' },
  { icon: User, label: 'Profile', path: '/profile', description: 'Your account' },
];

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg sm:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          // "More" button opens a sheet
          if (tab.path === null) {
            return (
              <Sheet key={tab.label} open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                      moreOpen
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-xl">
                  <SheetHeader className="text-left pb-4">
                    <SheetTitle>More Options</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 pb-6">
                    {moreMenuItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg transition-colors",
                            "hover:bg-gray-50 active:bg-gray-100",
                            isActive(item.path) && "bg-primary/5 text-primary"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isActive(item.path) ? "bg-primary/10" : "bg-gray-100"
                          )}>
                            <ItemIcon className={cn(
                              "w-5 h-5",
                              isActive(item.path) ? "text-primary" : "text-gray-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          // Regular navigation tabs
          return (
            <Link
              key={tab.label}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive(tab.path)
                  ? "text-primary bg-primary/10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}

export default BottomNav;
