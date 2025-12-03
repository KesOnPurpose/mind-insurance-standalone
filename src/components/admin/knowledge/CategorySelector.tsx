// ============================================================================
// CATEGORY SELECTOR COMPONENT
// ============================================================================
// Dynamic category selector that changes based on selected agent
// ============================================================================

import { cn } from '@/lib/utils';
import {
  AgentType,
  getCategoriesForAgent,
  CategoryConfig,
} from '@/types/knowledgeManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CategorySelectorProps {
  agent: AgentType;
  value: string | null;
  onChange: (category: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CategorySelector({
  agent,
  value,
  onChange,
  disabled,
  placeholder = 'Select category...',
}: CategorySelectorProps) {
  const categories = getCategoriesForAgent(agent);
  const categoryList = Object.values(categories);

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {value && categories[value] && (
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  categories[value].color.split(' ')[0]
                )}
              />
              {categories[value].label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categoryList.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs', category.color)}
              >
                {category.label}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Grid version for visual selection
interface CategoryGridProps {
  agent: AgentType;
  value: string | null;
  onChange: (category: string) => void;
  disabled?: boolean;
}

export function CategoryGrid({
  agent,
  value,
  onChange,
  disabled,
}: CategoryGridProps) {
  const categories = getCategoriesForAgent(agent);
  const categoryList = Object.values(categories);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {categoryList.map((category) => {
        const isSelected = value === category.id;

        return (
          <button
            key={category.id}
            onClick={() => !disabled && onChange(category.id)}
            disabled={disabled}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Badge
              variant="outline"
              className={cn('text-xs mb-1', category.color)}
            >
              {category.label}
            </Badge>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// Compact badge list for filtering
interface CategoryFilterProps {
  agent: AgentType;
  value: string | null;
  onChange: (category: string | null) => void;
  showAll?: boolean;
}

export function CategoryFilter({
  agent,
  value,
  onChange,
  showAll = true,
}: CategoryFilterProps) {
  const categories = getCategoriesForAgent(agent);
  const categoryList = Object.values(categories);

  return (
    <div className="flex flex-wrap gap-2">
      {showAll && (
        <button
          onClick={() => onChange(null)}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
            value === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          All
        </button>
      )}
      {categoryList.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
            value === category.id
              ? category.color
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}

// Category badge display (non-interactive)
interface CategoryBadgeProps {
  agent: AgentType;
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ agent, category, size = 'md' }: CategoryBadgeProps) {
  const categories = getCategoriesForAgent(agent);
  const config = categories[category];

  if (!config) {
    return (
      <Badge variant="outline" className="text-gray-500">
        {category}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        config.color,
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs'
      )}
    >
      {config.label}
    </Badge>
  );
}
