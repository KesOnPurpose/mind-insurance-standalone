import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  Calendar,
  Brain,
  BookOpen,
  Shield,
  Settings,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAccessControl, UserTier } from '@/hooks/useAccessControl';
import { Badge } from '@/components/ui/badge';

const ADMIN_NAV_ITEMS: Array<{
  title: string;
  href: string;
  icon: any;
  description: string;
  requiredTier?: 'admin' | 'super_admin' | 'owner';
}> = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    description: 'Analytics & Overview',
  },
  {
    title: 'User Access',
    href: '/admin/users',
    icon: Users,
    description: 'Manage approved users',
  },
  {
    title: 'Documents',
    href: '/admin/documents',
    icon: FileText,
    description: 'Document management',
  },
  {
    title: 'Protocols',
    href: '/admin/protocols',
    icon: Calendar,
    description: 'Coach protocols',
    requiredTier: 'super_admin',
  },
  {
    title: 'MIO Reports',
    href: '/admin/reports',
    icon: Brain,
    description: 'Mind Insurance Oracle',
    requiredTier: 'super_admin',
  },
  {
    title: 'Knowledge Base',
    href: '/admin/knowledge-base',
    icon: BookOpen,
    description: 'KB management',
    requiredTier: 'super_admin',
  },
];

export function AdminPanel() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { tier, isOwner, isSuperAdmin, isAdmin, hasTierAccess } = useAccessControl();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Filter navigation items based on user's tier
  const visibleNavItems = ADMIN_NAV_ITEMS.filter(item => {
    if (!item.requiredTier) return true; // No tier requirement
    return hasTierAccess(item.requiredTier);
  });

  return (
    <div className="space-y-4">
      {/* Admin Status Badge */}
      <div className="px-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <Shield className="h-5 w-5 text-purple-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Admin Panel</p>
            <p className="text-xs text-muted-foreground capitalize">
              {tier?.replace('_', ' ') || 'Loading...'}
            </p>
          </div>
          {isOwner && (
            <Badge variant="default" className="bg-purple-500">Owner</Badge>
          )}
          {isSuperAdmin && !isOwner && (
            <Badge variant="default" className="bg-blue-500">Super</Badge>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <SidebarMenu>
        {visibleNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(item.href)}
              tooltip={item.description}
              className="h-auto py-2"
            >
              <Link to={item.href} onClick={handleClick}>
                <item.icon className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Back to App Link */}
      <div className="px-2 pt-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to App">
              <Link to="/dashboard" onClick={handleClick}>
                <Home className="h-4 w-4" />
                <span>Back to App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  );
}
