# Component Extraction Plan for Large Page Files

## Overview
This document outlines the extraction plan for refactoring large page components into smaller, manageable modules in the Mind Insurance Grouphome App.

## Completed Extractions

### 1. AssessmentPage.tsx (1,209 lines → 256 lines) ✅
**Original Size**: ~50KB
**New Structure**:
- `AssessmentHeader.tsx` - Progress indicator and navigation
- `AssessmentNavigation.tsx` - Back/Next buttons and submission logic
- `FinancialReadinessStep.tsx` - Financial questions component
- `StrategySelectionStep.tsx` - Strategy and property questions
- `MarketKnowledgeStep.tsx` - Market and licensing questions
- `OperationalReadinessStep.tsx` - Operations and team questions
- `MindsetCommitmentStep.tsx` - Motivation and commitment questions

### 2. RoadmapPage.tsx (Partial Extraction) 🔄
**Original Size**: ~48KB (~1,200 lines)
**Existing Components**:
- `WeekProgressCard.tsx` ✅
- `TacticCard.tsx` ✅
- `BudgetTracker.tsx` ✅
- `JourneyMap.tsx` ✅
- `TacticCompletionForm.tsx` ✅
- `TacticResourcePanel.tsx` ✅

**New Extracted Components**:
- `RoadmapHeader.tsx` - Page header with navigation
- `RoadmapFilters.tsx` - Search and filter controls
- `RoadmapProgress.tsx` - Overall progress metrics
- `WeekSelector.tsx` - Week navigation and selection

## Pending Extractions

### 3. ChatPage.tsx (660 lines) - ~25KB
**Current Structure Analysis**:
- Message handling and state management
- Coach selection logic
- API integration for chat
- Message rendering
- Input handling

**Proposed Extraction**:
```
src/components/chat/
├── ChatHeader.tsx - Header with back navigation and coach info
├── MessageList.tsx - Message list rendering and scrolling
├── MessageInput.tsx - Input field and send button
├── ChatActions.tsx - Quick action buttons
├── ConversationManager.tsx - Conversation state management
└── (existing components remain)
```

**Key Extractions**:
1. **ChatHeader** (~50 lines)
   - Back navigation
   - Current coach display
   - Coach switching UI

2. **MessageList** (~100 lines)
   - Message rendering loop
   - Auto-scroll logic
   - Typing indicator

3. **MessageInput** (~80 lines)
   - Input field state
   - Send message handler
   - Keyboard shortcuts

4. **ChatActions** (~60 lines)
   - Quick action buttons
   - Suggested responses
   - Context actions

5. **ConversationManager** (~150 lines)
   - API calls
   - Message state management
   - Local storage sync

### 4. ProfilePage.tsx (730 lines) - ~31KB
**Current Structure Analysis**:
- User profile display
- Assessment results
- Business information
- Settings management
- Achievement tracking

**Proposed Extraction**:
```
src/components/profile/
├── ProfileHeader.tsx - User info and avatar
├── AssessmentResults.tsx - Assessment summary display
├── BusinessInfo.tsx - Business details form
├── AchievementsList.tsx - Achievements and badges
├── ProfileSettings.tsx - Settings and preferences
├── ProfileStats.tsx - Statistics and metrics
└── ProfileActions.tsx - Action buttons and navigation
```

**Key Extractions**:
1. **ProfileHeader** (~80 lines)
   - User avatar and name
   - Edit profile button
   - Basic info display

2. **AssessmentResults** (~120 lines)
   - Assessment summary
   - Readiness level
   - Recommendations

3. **BusinessInfo** (~150 lines)
   - Business name and type
   - Location and state
   - Target populations

4. **AchievementsList** (~100 lines)
   - Achievement badges
   - Progress tracking
   - Milestone display

5. **ProfileSettings** (~120 lines)
   - Notification preferences
   - Privacy settings
   - Account management

6. **ProfileStats** (~80 lines)
   - Progress statistics
   - Time tracking
   - Completion rates

### 5. DashboardPage.tsx (564 lines) - ~23KB
**Current Structure Analysis**:
- Dashboard widgets
- Quick actions
- Progress overview
- Recent activity
- Navigation cards

**Proposed Extraction**:
```
src/components/dashboard/
├── DashboardHeader.tsx - Welcome message and date
├── QuickActions.tsx - Action buttons grid
├── ProgressWidget.tsx - Progress overview card
├── RecentActivity.tsx - Activity feed
├── NavigationCards.tsx - Feature navigation cards
├── DashboardStats.tsx - Key metrics display
└── OnboardingPrompt.tsx - New user guidance
```

**Key Extractions**:
1. **DashboardHeader** (~60 lines)
   - Welcome message
   - Current date/time
   - User greeting

2. **QuickActions** (~80 lines)
   - Quick action buttons
   - Common tasks
   - Shortcuts

3. **ProgressWidget** (~100 lines)
   - Overall progress
   - Week progress
   - Milestone tracking

4. **RecentActivity** (~90 lines)
   - Activity feed
   - Recent completions
   - Updates

5. **NavigationCards** (~100 lines)
   - Feature cards
   - Navigation links
   - Feature descriptions

6. **DashboardStats** (~70 lines)
   - Key metrics
   - Statistics cards
   - Performance indicators

## Implementation Guidelines

### Component Extraction Best Practices

1. **Props Interface Pattern**:
```typescript
interface ComponentProps {
  data: DataType;
  onAction?: () => void;
  className?: string;
}
```

2. **State Management**:
- Keep local state in components when possible
- Lift state only when needed for sharing
- Use custom hooks for complex logic

3. **File Organization**:
- Group related components in folders
- Keep component files under 200 lines
- Extract complex logic to hooks/utils

4. **Naming Conventions**:
- Component files: PascalCase
- Hook files: camelCase with 'use' prefix
- Utility files: camelCase

5. **Testing Considerations**:
- Each extracted component should be testable
- Props should be well-defined
- Side effects should be isolated

## Benefits of Extraction

1. **Maintainability**: Smaller files are easier to understand and modify
2. **Reusability**: Components can be reused across pages
3. **Performance**: Potential for better code splitting and lazy loading
4. **Testing**: Easier to write unit tests for focused components
5. **Collaboration**: Multiple developers can work on different components

## Priority Order

1. ✅ AssessmentPage - COMPLETED
2. 🔄 RoadmapPage - IN PROGRESS
3. ⏳ ProfilePage - HIGH PRIORITY (730 lines)
4. ⏳ ChatPage - MEDIUM PRIORITY (660 lines)
5. ⏳ DashboardPage - LOWER PRIORITY (564 lines)

## Success Metrics

- **Target**: All page components under 300 lines
- **Component Size**: Individual components under 200 lines
- **Code Reuse**: Identify and extract common patterns
- **Type Safety**: Maintain TypeScript strict mode compliance
- **Performance**: No regression in load times

## Notes

- All extractions must maintain existing functionality
- TypeScript interfaces must be properly defined
- Follow existing patterns in the codebase
- Use ShadCN UI components consistently
- Maintain @/ import aliases