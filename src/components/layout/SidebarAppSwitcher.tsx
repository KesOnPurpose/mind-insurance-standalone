import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LucideIcon } from 'lucide-react';
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
}

// GROUPHOME STANDALONE: Only one app
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
  },
];

/**
 * SidebarAppSwitcher - Visual app switcher component for the sidebar
 * GROUPHOME STANDALONE: Simplified to single product
 */
export function SidebarAppSwitcher() {
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

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

        return (
          <button
            key={app.id}
            onClick={() => handleAppClick(app)}
            disabled={app.isDisabled}
            className={cn(
              'relative w-full flex items-center gap-3 p-3 rounded-lg transition-all',
              'hover:bg-sidebar-accent/50',
              'bg-sidebar-accent border border-sidebar-border',
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
              <h4 className="font-semibold text-sm truncate">{app.shortName}</h4>
              <p className="text-xs truncate text-muted-foreground">{app.description}</p>
            </div>

            {/* Active Badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 bg-primary/10 text-primary">
              Active
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SidebarAppSwitcher;
