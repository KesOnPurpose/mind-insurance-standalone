import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, BarChart3, ClipboardCheck, History, Users, LayoutDashboard,
  Sun, CalendarHeart, MessageCircle, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const RKPI_NAV_ITEMS = [
  { path: '/relationship-kpis', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/relationship-kpis/check-in', label: 'Weekly Check-In', icon: ClipboardCheck },
  { path: '/relationship-kpis/history', label: 'History & Trends', icon: BarChart3 },
  { path: '/relationship-kpis/partner', label: 'Partner', icon: Users },
  { path: '/relationship-kpis/prompts', label: 'Connection Prompts', icon: Heart },
  { path: '/relationship-kpis/seasons', label: 'Marriage Seasons', icon: Sun },
  { path: '/relationship-kpis/learning', label: 'Know Your Partner', icon: Heart },
  { path: '/relationship-kpis/date-nights', label: 'Date Nights', icon: CalendarHeart },
  { path: '/relationship-kpis/safe-space', label: 'Safe Space', icon: MessageCircle },
  { path: '/relationship-kpis/journal', label: 'Journal', icon: PenLine },
];

/**
 * RelationshipKPIsPanel - Sidebar panel for Relationship KPIs module
 *
 * Structure:
 * 1. RKPI Navigation (Dashboard, Check-In, History, Partner, Prompts)
 */
export function RelationshipKPIsPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="space-y-1 px-1">
      {RKPI_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              'text-gray-400 hover:text-white hover:bg-mi-navy',
              isActive && 'text-rose-400 bg-rose-500/10 hover:text-rose-300'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default RelationshipKPIsPanel;
