import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Shield, DollarSign, Heart, LucideIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  href: string;
  isDisabled: boolean;
  pathPrefix: string; // For detecting active state
}

const APPS: AppConfig[] = [
  {
    id: 'grouphome',
    name: 'Grouphomes4Newbies',
    shortName: 'Grouphome',
    description: 'Real estate education',
    icon: Home,
    gradient: 'from-blue-500 to-blue-600',
    href: '/dashboard',
    isDisabled: false,
    pathPrefix: '', // Always considered "in" the grouphome app for non-MI paths
  },
  {
    id: 'mind-insurance',
    name: 'Mind Insurance',
    shortName: 'Mind Insurance',
    description: 'Mental breakthrough',
    icon: Shield,
    gradient: 'from-purple-500 to-purple-600',
    href: '/mind-insurance',
    isDisabled: false,
    pathPrefix: '/mind-insurance',
  },
  {
    id: 'relationship-kpis',
    name: 'Relationship KPIs',
    shortName: 'Relationship',
    description: 'Strengthen your bond',
    icon: Heart,
    gradient: 'from-rose-500 to-rose-600',
    href: '/relationship-kpis',
    isDisabled: false,
    pathPrefix: '/relationship-kpis',
  },
  {
    id: 'me-wealth',
    name: 'Millionaire Essentials',
    shortName: 'ME Wealth',
    description: 'Business funding',
    icon: DollarSign,
    gradient: 'from-amber-500 to-amber-600',
    href: '#',
    isDisabled: true,
    pathPrefix: '/millionaire-essentials',
  },
];

/**
 * SidebarAppSwitcher - Visual app switcher component for the sidebar
 *
 * Displays product tiles with:
 * - Gradient icon
 * - Name and description
 * - Active/Soon badges
 */
export function SidebarAppSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  // Check if we're in a dark-themed section (MI or RKPI)
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance') || location.pathname.startsWith('/relationship-kpis');
  }, [location.pathname]);

  // Determine which app is currently active based on path
  const getIsActive = (app: AppConfig): boolean => {
    if (app.id === 'relationship-kpis') {
      return location.pathname.startsWith('/relationship-kpis');
    }
    if (app.id === 'mind-insurance') {
      return location.pathname.startsWith('/mind-insurance');
    }
    // Grouphome is active for all other paths (dashboard, roadmap, chat, resources, etc.)
    if (app.id === 'grouphome') {
      return !location.pathname.startsWith('/mind-insurance') && !location.pathname.startsWith('/relationship-kpis');
    }
    return false;
  };

  const handleAppClick = (app: AppConfig) => {
    if (app.isDisabled) return;
    navigate(app.href);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="space-y-2 px-1">
      {APPS.map((app) => {
        const Icon = app.icon;
        const isActive = getIsActive(app);

        return (
          <button
            key={app.id}
            onClick={() => handleAppClick(app)}
            disabled={app.isDisabled}
            className={cn(
              'relative w-full flex items-center gap-3 p-3 rounded-lg transition-all',
              isMindInsurance
                ? 'hover:bg-mi-navy'
                : 'hover:bg-sidebar-accent/50',
              isActive && (isMindInsurance
                ? 'bg-mi-navy border border-mi-cyan/30'
                : 'bg-sidebar-accent border border-sidebar-border'),
              app.isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Icon with gradient background */}
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                `bg-gradient-to-br ${app.gradient}`
              )}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 text-left">
              <h4 className={cn(
                "font-semibold text-sm truncate",
                isMindInsurance && "text-white"
              )}>{app.shortName}</h4>
              <p className={cn(
                "text-xs truncate",
                isMindInsurance ? "text-gray-400" : "text-muted-foreground"
              )}>{app.description}</p>
            </div>

            {/* Badge */}
            {isActive && !app.isDisabled && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded flex-shrink-0",
                isMindInsurance
                  ? "bg-mi-cyan/20 text-mi-cyan"
                  : "bg-primary/10 text-primary"
              )}>
                Active
              </span>
            )}
            {app.isDisabled && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded flex-shrink-0",
                isMindInsurance ? "bg-mi-navy text-gray-500" : "bg-muted"
              )}>
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SidebarAppSwitcher;
