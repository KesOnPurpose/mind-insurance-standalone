import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, GraduationCap, Clock, AlertTriangle } from 'lucide-react';
import { useMentorshipTactics, getUniqueCategories } from '@/hooks/useMentorshipTactics';
import type { MentorshipTactic } from '@/hooks/useMentorshipTactics';

interface TacticLinkSectionProps {
  selectedTacticId: string | null;
  selectedTacticName: string | null;
  onSelectTactic: (tacticId: string, tacticName: string, durationMinutes: number | null) => void;
  onClearTactic: () => void;
  existingTacticIds: string[];
}

export function TacticLinkSection({
  selectedTacticId,
  selectedTacticName,
  onSelectTactic,
  onClearTactic,
  existingTacticIds,
}: TacticLinkSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: tactics, isLoading } = useMentorshipTactics();

  // Get unique categories
  const categories = useMemo(() => {
    if (!tactics) return [];
    return getUniqueCategories(tactics);
  }, [tactics]);

  // Filter tactics based on search and category
  const filteredTactics = useMemo(() => {
    if (!tactics) return [];
    return tactics.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.tactic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tactics, searchQuery, categoryFilter]);

  const handleSelectTactic = (tactic: MentorshipTactic) => {
    onSelectTactic(tactic.tactic_id, tactic.tactic_name, tactic.duration_minutes_realistic);
  };

  // If a tactic is already selected, show it with option to clear
  if (selectedTacticId) {
    const isDuplicate = existingTacticIds.includes(selectedTacticId);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-purple-600" />
          Linked Mentorship Tactic
        </Label>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-purple-900 dark:text-purple-100 truncate">
              {selectedTacticName}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearTactic}
            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isDuplicate && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            This tactic is already scheduled elsewhere. You can still add it.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-purple-600" />
        Link Mentorship Tactic (optional)
      </Label>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tactics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            autoComplete="off"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tactic List */}
      <ScrollArea className="h-[140px] border rounded-md">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading tactics...</div>
        ) : filteredTactics.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No tactics found</div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTactics.map((tactic) => {
              const isDuplicate = existingTacticIds.includes(tactic.tactic_id);
              return (
                <button
                  key={tactic.tactic_id}
                  type="button"
                  onClick={() => handleSelectTactic(tactic)}
                  className="w-full text-left p-2 rounded hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tactic.tactic_name}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs h-5">
                          {tactic.category}
                        </Badge>
                        {tactic.duration_minutes_realistic && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {tactic.duration_minutes_realistic}m
                          </span>
                        )}
                        {isDuplicate && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
