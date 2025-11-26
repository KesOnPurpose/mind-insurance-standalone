import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { CATEGORY_HIERARCHY, isParentCategory } from '@/config/categoryHierarchy';

interface RoadmapFiltersProps {
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  allCategories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const RoadmapFilters = ({
  searchQuery,
  categoryFilter,
  statusFilter,
  allCategories,
  onSearchChange,
  onCategoryChange,
  onStatusChange
}: RoadmapFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tactics..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter with Hierarchy Support */}
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORY_HIERARCHY.map(group => (
            <SelectGroup key={group.parent}>
              <SelectLabel className="font-semibold text-primary">
                {group.parent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectLabel>
              <SelectItem value={group.parent} className="pl-4 font-medium">
                All {group.parent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
              {group.subcategories
                .filter(cat => allCategories.includes(cat))
                .map(category => (
                  <SelectItem key={category} value={category} className="pl-8">
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
            </SelectGroup>
          ))}
          {/* Include categories not in hierarchy */}
          {allCategories.filter(cat =>
            !CATEGORY_HIERARCHY.some(h => h.subcategories.includes(cat)) &&
            !isParentCategory(cat)
          ).length > 0 && (
            <SelectGroup>
              <SelectLabel>Other</SelectLabel>
              {allCategories.filter(cat =>
                !CATEGORY_HIERARCHY.some(h => h.subcategories.includes(cat)) &&
                !isParentCategory(cat)
              ).map(category => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};