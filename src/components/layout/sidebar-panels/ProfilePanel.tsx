import { Link } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Building2,
  Target,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';

/**
 * ProfilePanel - Sidebar content for profile page
 *
 * Shows:
 * - Profile completion progress
 * - Quick links to profile sections
 * - Assessment summary
 */
export function ProfilePanel() {
  const { assessment } = usePersonalizedTactics();

  const profileSections = [
    {
      id: 'business',
      label: 'Business Profile',
      icon: Building2,
      description: 'Name, entity type, beds',
    },
    {
      id: 'strategy',
      label: 'Strategy & Goals',
      icon: Target,
      description: 'Ownership model, state, priorities',
    },
    {
      id: 'assessment',
      label: 'Assessment Results',
      icon: FileCheck,
      description: 'Scores and readiness level',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Profile Completion Summary */}
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Profile Status</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completeness</span>
            <span className="font-medium">{assessment?.overall_score || 0}%</span>
          </div>
          <Progress value={assessment?.overall_score || 0} className="h-1.5" />
        </div>
        {assessment?.readiness_level && (
          <Badge variant="outline" className="mt-2 text-xs">
            {assessment.readiness_level.replace(/_/g, ' ')}
          </Badge>
        )}
      </Card>

      {/* Profile Sections */}
      <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
        Profile Sections
      </div>
      <SidebarMenu>
        {profileSections.map((section) => {
          const Icon = section.icon;
          return (
            <SidebarMenuItem key={section.id}>
              <SidebarMenuButton asChild>
                <a href={`#${section.id}`} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{section.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      {/* Quick Actions */}
      <div className="text-xs font-medium text-muted-foreground px-2 mt-4 mb-2">
        Quick Actions
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/dashboard" className="flex items-center justify-between">
              <span>Back to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/roadmap" className="flex items-center justify-between">
              <span>View Roadmap</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

export default ProfilePanel;
