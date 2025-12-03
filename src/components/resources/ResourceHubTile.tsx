import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceHubTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    hoverBorder: 'hover:border-green-300 dark:hover:border-green-700',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
  },
};

export function ResourceHubTile({ title, description, icon, href, color }: ResourceHubTileProps) {
  const styles = colorStyles[color];

  return (
    <Link to={href} className="block group">
      <Card
        className={cn(
          'transition-all duration-200 cursor-pointer h-full',
          'hover:shadow-lg active:scale-[0.98]',
          styles.hoverBorder
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                styles.iconBg
              )}
            >
              <div className={cn('w-6 h-6', styles.iconColor)}>{icon}</div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight
              className={cn(
                'flex-shrink-0 w-5 h-5 text-muted-foreground',
                'group-hover:text-primary group-hover:translate-x-0.5 transition-all'
              )}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ResourceHubTile;
