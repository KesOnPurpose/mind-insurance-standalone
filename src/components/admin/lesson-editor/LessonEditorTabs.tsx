// ============================================================================
// FEAT-GH-016: Lesson Editor Tabs Component
// ============================================================================
// Tab navigation for the lesson editor
// ============================================================================

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Target,
  ClipboardCheck,
  Settings,
  Eye,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type LessonEditorTab = 'content' | 'tactics' | 'assessment' | 'completion' | 'preview';

interface LessonEditorTabsProps {
  activeTab: LessonEditorTab;
  onTabChange: (tab: LessonEditorTab) => void;
  tacticsCount: number;
  hasUnsavedChanges?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const LessonEditorTabs = ({
  activeTab,
  onTabChange,
  tacticsCount,
  hasUnsavedChanges,
}: LessonEditorTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as LessonEditorTab)}
      className="w-full"
    >
      <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0 border-b rounded-none">
        <TabsTrigger
          value="content"
          className="gap-2 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none rounded-t-md px-4"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Content</span>
        </TabsTrigger>

        <TabsTrigger
          value="tactics"
          className="gap-2 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none rounded-t-md px-4"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Tactics</span>
          {tacticsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {tacticsCount}
            </span>
          )}
        </TabsTrigger>

        <TabsTrigger
          value="assessment"
          className="gap-2 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none rounded-t-md px-4"
        >
          <ClipboardCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Assessment</span>
        </TabsTrigger>

        <TabsTrigger
          value="completion"
          className="gap-2 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none rounded-t-md px-4"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Completion Rules</span>
        </TabsTrigger>

        <TabsTrigger
          value="preview"
          className="gap-2 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none rounded-t-md px-4"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </TabsTrigger>
      </TabsList>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" />
      )}
    </Tabs>
  );
};

export default LessonEditorTabs;
