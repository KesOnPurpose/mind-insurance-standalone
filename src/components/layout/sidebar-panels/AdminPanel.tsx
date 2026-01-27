import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  Calendar,
  // GROUPHOME STANDALONE: Removed Brain - was used for MIO Reports
  BookOpen,
  Shield,
  Settings,
  Home,
  GraduationCap,
  Scale,
  // GROUPHOME STANDALONE: Removed ClipboardCheck - was used for MIO Assessments
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAdmin } from '@/contexts/AdminContext';
import { Badge } from '@/components/ui/badge';

// GROUPHOME STANDALONE: Tier type for admin access control
type AdminTier = 'admin' | 'super_admin';

const ADMIN_NAV_ITEMS: Array<{
  title: string;
  href: string;
  icon: any;
  description: string;
  requiredTier?: AdminTier;
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
    title: 'Programs',
    href: '/admin/programs',
    icon: GraduationCap,
    description: 'Course management',
  },
  {
    title: 'Compliance Binders',
    href: '/admin/compliance',
    icon: Scale,
    description: 'Generate compliance binders',
    requiredTier: 'super_admin',
  },
  {
    title: 'Protocols',
    href: '/admin/protocols',
    icon: Calendar,
    description: 'Coach protocols',
    requiredTier: 'super_admin',
  },
  // GROUPHOME STANDALONE: Removed MIO Reports nav item
  // GROUPHOME STANDALONE: Removed MIO Assessments nav item
  {
    title: 'Knowledge Base',
    href: '/admin/knowledge-base',
    icon: BookOpen,
    description: 'Nette AI knowledge',
    requiredTier: 'super_admin',
  },
];

export function AdminPanel() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  // GROUPHOME STANDALONE: Using useAdmin instead of useMIAccessControl
  const { adminUser, isSuperAdmin, isAdmin } = useAdmin();

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

  // GROUPHOME STANDALONE: Filter navigation items based on user's role
  const visibleNavItems = ADMIN_NAV_ITEMS.filter(item => {
    if (!item.requiredTier) return true; // No tier requirement
    // super_admin can access everything, admin can only access admin-level items
    if (item.requiredTier === 'super_admin') return isSuperAdmin;
    if (item.requiredTier === 'admin') return isAdmin || isSuperAdmin;
    return false;
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
              {adminUser?.role?.replace('_', ' ') || 'Loading...'}
            </p>
          </div>
          {isSuperAdmin && (
            <Badge variant="default" className="bg-purple-500">Super Admin</Badge>
          )}
          {isAdmin && !isSuperAdmin && (
            <Badge variant="default" className="bg-blue-500">Admin</Badge>
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
