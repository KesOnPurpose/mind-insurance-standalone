import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MessageSquare, Calendar, MoreHorizontal, Shield, DollarSign, BookOpen, Settings, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavTab {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string | null;
}

const tabs: NavTab[] = [
  { icon: Home, label: 'Hub', path: '/mind-insurance' },
  { icon: Shield, label: 'Coverage', path: '/mind-insurance/coverage' },
  { icon: MessageSquare, label: 'Chat', path: '/mind-insurance/chat' },
  { icon: BookOpen, label: 'Practice', path: '/mind-insurance/practice' },
  { icon: MoreHorizontal, label: 'More', path: null },
];

const moreMenuItems = [
  { icon: Map, label: 'Championship', path: '/mind-insurance/championship', description: 'Track your progress' },
  { icon: DollarSign, label: 'Vault', path: '/mind-insurance/vault', description: 'Your evidence' },
  { icon: Settings, label: 'Settings', path: '/settings', description: 'App preferences' },
  { icon: User, label: 'Profile', path: '/profile', description: 'Your account' },
];

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Theme-aware styles
  const navStyles = isMindInsurance
    ? "fixed bottom-0 left-0 right-0 bg-mi-navy-light border-t border-mi-cyan/20 shadow-lg sm:hidden z-50"
    : "fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg sm:hidden z-50";

  const safeAreaStyles = isMindInsurance
    ? "h-safe-area-inset-bottom bg-mi-navy-light"
    : "h-safe-area-inset-bottom bg-white";

  return (
    <nav className={navStyles}>
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
                      isMindInsurance
                        ? moreOpen
                          ? "text-mi-cyan bg-mi-cyan/20"
                          : "text-gray-400 hover:text-mi-cyan hover:bg-mi-navy"
                        : moreOpen
                          ? "text-purple-600 bg-purple-50"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className={cn(
                    "rounded-t-xl",
                    isMindInsurance && "bg-mi-navy-light border-mi-cyan/20"
                  )}
                >
                  <SheetHeader className="text-left pb-4">
                    <SheetTitle className={isMindInsurance ? "text-white" : ""}>More Options</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 pb-6">
                    {moreMenuItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.disabled ? '#' : item.path}
                          onClick={(e) => {
                            if (item.disabled) {
                              e.preventDefault();
                              return;
                            }
                            setMoreOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg transition-colors",
                            isMindInsurance
                              ? item.disabled
                                ? "opacity-50 cursor-not-allowed bg-mi-navy"
                                : "hover:bg-mi-navy active:bg-mi-navy/80"
                              : item.disabled
                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                : "hover:bg-gray-50 active:bg-gray-100",
                            isActive(item.path) && !item.disabled && (
                              isMindInsurance
                                ? "bg-mi-cyan/20 text-mi-cyan"
                                : "bg-purple-50 text-purple-700"
                            )
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isMindInsurance
                              ? item.disabled ? "bg-mi-navy" : "bg-mi-cyan/20"
                              : item.disabled ? "bg-gray-200" : "bg-purple-100"
                          )}>
                            <ItemIcon className={cn(
                              "w-5 h-5",
                              isMindInsurance
                                ? item.disabled ? "text-gray-600" : "text-mi-cyan"
                                : item.disabled ? "text-gray-400" : "text-purple-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium",
                              isMindInsurance ? "text-white" : "text-gray-900"
                            )}>{item.label}</p>
                            <p className={cn(
                              "text-sm",
                              isMindInsurance ? "text-gray-400" : "text-gray-500"
                            )}>{item.description}</p>
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
                isMindInsurance
                  ? isActive(tab.path)
                    ? "text-mi-cyan bg-mi-cyan/20"
                    : "text-gray-400 hover:text-mi-cyan hover:bg-mi-navy"
                  : isActive(tab.path)
                    ? "text-purple-600 bg-purple-50"
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
      <div className={safeAreaStyles} />
    </nav>
  );
}

export default BottomNav;
