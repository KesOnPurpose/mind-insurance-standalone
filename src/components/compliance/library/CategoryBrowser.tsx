// ============================================================================
// CATEGORY BROWSER COMPONENT
// ============================================================================
// Horizontal category navigation for filtering library items.
// Shows category icons and item counts.
// ============================================================================

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  FileText,
  Home,
  MapPin,
  Users,
  Shield,
  Flame,
  Building,
  User,
  Accessibility,
  BookOpen,
} from 'lucide-react';
import { LIBRARY_CATEGORIES, type LibraryCategoryType } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryBrowserProps {
  selectedCategory: LibraryCategoryType | null;
  onSelectCategory: (category: LibraryCategoryType | null) => void;
  categoryCounts?: Record<LibraryCategoryType, number>;
  className?: string;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const CATEGORY_ICONS: Record<LibraryCategoryType, React.ReactNode> = {
  licensure: <FileText className="h-4 w-4" />,
  housing_categories: <Home className="h-4 w-4" />,
  zoning: <MapPin className="h-4 w-4" />,
  occupancy: <Users className="h-4 w-4" />,
  fha: <Shield className="h-4 w-4" />,
  fire_safety: <Flame className="h-4 w-4" />,
  business_license: <Building className="h-4 w-4" />,
  population: <User className="h-4 w-4" />,
  ada: <Accessibility className="h-4 w-4" />,
  general: <BookOpen className="h-4 w-4" />,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CategoryBrowser({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {} as Record<LibraryCategoryType, number>,
  className = '',
}: CategoryBrowserProps) {
  return (
    <div className={className}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-3">
          {/* All Categories button */}
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(null)}
            className="shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            All
          </Button>

          {/* Category buttons - only show categories that have items */}
          {LIBRARY_CATEGORIES.filter(
            (category) => (categoryCounts[category.type] || 0) > 0
          ).map((category) => {
            const count = categoryCounts[category.type] || 0;
            const isSelected = selectedCategory === category.type;

            return (
              <Button
                key={category.type}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectCategory(category.type)}
                className="shrink-0"
              >
                {CATEGORY_ICONS[category.type]}
                <span className="ml-2">{category.name}</span>
                <Badge
                  variant={isSelected ? 'secondary' : 'outline'}
                  className="ml-2 text-xs px-1.5"
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CategoryBrowser;
