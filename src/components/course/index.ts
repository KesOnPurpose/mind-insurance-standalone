/**
 * FEAT-GH-005 & FEAT-GH-006: Course Components
 *
 * Video player, progress tracking, and assessment components for tactics
 */

export { VideoPlayer, default as VideoPlayerDefault } from './VideoPlayer';
export {
  VideoProgressGauge,
  VideoProgressBar,
  VideoProgressBadge,
  default as VideoProgressGaugeDefault,
} from './VideoProgressGauge';
export { LessonAssessmentModal, LessonAssessment } from './LessonAssessment';
export {
  AssessmentQuestion,
  AssessmentQuestionReview,
  default as AssessmentQuestionDefault,
} from './AssessmentQuestion';
export {
  CompletionGateStatus,
  CompletionGateBadge,
  default as CompletionGateStatusDefault,
} from './CompletionGateStatus';
