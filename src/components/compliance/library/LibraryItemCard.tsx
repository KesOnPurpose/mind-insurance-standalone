// ============================================================================
// LIBRARY ITEM CARD COMPONENT
// ============================================================================
// Card component for displaying a single library item in the browse grid.
// Shows title, summary, category, and actions (bookmark, save to binder).
// ============================================================================

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Plus,
  AlertTriangle,
  Star,
  FileText,
} from 'lucide-react';
import { LIBRARY_CATEGORIES, type LibraryItem, type LibraryCategoryType } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface LibraryItemCardProps {
  item: LibraryItem;
  isBookmarked?: boolean;
  onView: (item: LibraryItem) => void;
  onBookmark: (item: LibraryItem) => void;
  onSaveToBinder?: (item: LibraryItem) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategoryInfo(categoryType: LibraryCategoryType | string) {
  const category = LIBRARY_CATEGORIES.find((c) => c.type === categoryType);
  return category || { name: 'General', icon: '📄', type: 'general' as LibraryCategoryType };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LibraryItemCard({
  item,
  isBookmarked = false,
  onView,
  onBookmark,
  onSaveToBinder,
  className = '',
}: LibraryItemCardProps) {
  const categoryInfo = getCategoryInfo(item.category_id);

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={() => onView(item)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs shrink-0">
                <span className="mr-1">{categoryInfo.icon}</span>
                {categoryInfo.name}
              </Badge>
              <Badge variant="outline" className="text-xs shrink-0">
                {item.state_code}
              </Badge>
              {item.is_critical && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
              {item.is_featured && (
                <Badge
                  variant="outline"
                  className="text-xs shrink-0 border-yellow-500 text-yellow-600"
                >
                  <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                  Featured
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm leading-tight line-clamp-2" title={item.title}>
              {item.title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(item);
            }}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {truncateText(item.summary || item.content, 200)}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.regulation_code && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {item.regulation_code}
              </span>
            )}
            {item.source_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.source_url!, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </Button>
            )}
          </div>

          {onSaveToBinder && (
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={(e) => {
                e.stopPropagation();
                onSaveToBinder(item);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Binder
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LibraryItemCard;
