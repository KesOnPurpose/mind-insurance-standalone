/**
 * Tour Components Export
 * Hub Tour System + FEAT-GH-TOUR: Nette Onboarding Tour
 */

// Legacy Hub Tour exports (kept for compatibility)
export { TourProvider, useTour } from './TourProvider';
export { TourHighlight } from './TourHighlight';
export { TourOfferDialog } from './TourOfferDialog';
export { TourSidebarController } from './TourSidebarController';

// FEAT-GH-TOUR: Nette Onboarding Tour Components
export { TourController } from './TourController';
export { TourOverlay } from './TourOverlay';
export { TourTooltip } from './TourTooltip';
export { NetteAvatar } from './NetteAvatar';
export { NetteProactiveMessage } from './NetteProactiveMessage';
export { IncomeRoadmapCard } from './IncomeRoadmapCard';

// Context exports
export { TourProvider as NetteTourProvider } from '@/contexts/TourContext';

// Re-export types for convenience
export type {
  TourStep,
  TourConfig,
  TourState,
  TourActions,
  TourTooltipPosition,
  ProactiveMessageConsent,
  IncomeReplacementRoadmap,
  IncomeReplacementMilestone,
  NetteProactiveMessage as NetteProactiveMessageType,
} from '@/types/assessment';
