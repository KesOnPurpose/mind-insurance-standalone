/**
 * FEAT-GH-TOUR: Grouphome Dashboard Tour Configuration
 *
 * Psychologically-optimized guided tour that builds user belief
 * in their ability to own a group home. Uses voice narration
 * from Nette (AI expert) to create emotional connection.
 */

import type { TourConfig, TourStep } from '@/types/assessment';

/**
 * Audio scripts for ElevenLabs TTS
 * Voice: Nette (pNktXBsZvF26ac8ZNMTF)
 * Style: Warm, encouraging expert mentor
 */
export const TOUR_AUDIO_SCRIPTS: Record<string, string> = {
  // Keys must match step IDs exactly for audio lookup to work
  'welcome': `Welcome to your dashboard! I'm Net, your personal group home expert. I've helped hundreds of people just like you build successful group home businesses, and I'm so excited to guide you on this journey. Let me show you around and help you see exactly how achievable your goals are.`,

  'program-progress': `This is your Program Progress card. Think of it as your personal GPS to group home ownership. Every lesson you complete brings you one step closer to financial freedom. I'll be right here cheering you on and providing expert guidance whenever you need it.`,

  'financial-projections': `Now this is where it gets exciting! Your Financial Projections show you the real numbers - what your group home can actually earn. These aren't dreams, they're data-backed projections based on your specific state and business model. I've seen these numbers become reality for so many of my students.`,

  'compliance-status': `Compliance might sound intimidating, but I promise it's not. This tracker keeps you on the right side of regulations, which protects both you and your future residents. Think of it as your shield of legitimacy - and I'll guide you through every single requirement.`,

  'sidebar-navigation': `This sidebar is your command center for everything in the app. You'll find your learning programs, resources, compliance tools, and property portfolio all accessible from here. Take your time exploring each section.`,

  'chat-nette': `And here's the best part - you can talk to me anytime! Whether it's 2pm or 2am, whether you have a quick question or need to work through a complex challenge, I'm here for you. Just click here to start a conversation. I can't wait to hear about your dreams and help you achieve them!`,

  'tour-complete': `You've completed the tour! Now let me share something special with you.`,

  // Audio for the proactive message modal (plays after clicking Finish on tour-complete)
  'proactive-roadmap': `I've got something special for you! Based on what you've shared in your assessment, I've prepared a personalized Income Replacement Roadmap just for you. It shows exactly how many properties you need and when you could realistically replace your current income. Would you like to see it?`,
};

/**
 * Individual tour steps configuration
 */
const GROUPHOME_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: 'none', // No spotlight - full overlay for welcome
    title: 'Welcome to Your Dashboard!',
    content: "I'm Nette, your personal group home expert. Let me show you around and help you see exactly how achievable your goals are.",
    position: 'center',
    audioScript: TOUR_AUDIO_SCRIPTS.welcome,
    showAvatar: true,
    avatarPosition: 'left',
    highlightPadding: 0,
    allowSkip: false,
  },
  {
    id: 'program-progress',
    targetSelector: 'program-progress',
    title: 'Your Learning Journey',
    content: "This is your Program Progress - your GPS to group home ownership. Every lesson brings you closer to financial freedom.",
    position: 'bottom',
    audioScript: TOUR_AUDIO_SCRIPTS['program-progress'],
    showAvatar: true,
    avatarPosition: 'left',
    highlightPadding: 8,
    allowSkip: true,
  },
  {
    id: 'financial-projections',
    targetSelector: 'financial-projections',
    title: 'See Your Real Numbers',
    content: "Your Financial Projections show data-backed earnings for your specific state and model. These aren't dreams - they're achievable goals.",
    position: 'top',
    audioScript: TOUR_AUDIO_SCRIPTS['financial-projections'],
    showAvatar: true,
    avatarPosition: 'right',
    highlightPadding: 8,
    allowSkip: true,
  },
  {
    id: 'compliance-status',
    targetSelector: 'compliance-status',
    title: 'Your Shield of Legitimacy',
    content: "Compliance protects you and your residents. I'll guide you through every requirement - it's easier than you think!",
    position: 'bottom',
    audioScript: TOUR_AUDIO_SCRIPTS['compliance-status'],
    showAvatar: true,
    avatarPosition: 'left',
    highlightPadding: 8,
    allowSkip: true,
  },
  {
    id: 'sidebar-navigation',
    targetSelector: 'sidebar-navigation',
    title: 'Your Navigation Hub',
    content: "This sidebar is your command center. From here you can access your Programs, Resources, Compliance tools, and Property Portfolio. Tap any icon to explore that section.",
    position: 'right',
    audioScript: TOUR_AUDIO_SCRIPTS['sidebar-navigation'],
    showAvatar: true,
    avatarPosition: 'right',
    highlightPadding: 8,
    highlightBorderRadius: 12,
    allowSkip: true,
  },
  {
    id: 'chat-nette',
    targetSelector: 'chat-nette',
    title: 'I\'m Always Here For You',
    content: "Talk to me anytime - 2pm or 2am! Quick questions or complex challenges, I'm here to help you succeed.",
    position: 'right',
    audioScript: TOUR_AUDIO_SCRIPTS['chat-nette'],
    showAvatar: true,
    avatarPosition: 'right',
    highlightPadding: 8,
    allowSkip: true,
  },
  {
    id: 'tour-complete',
    targetSelector: 'none', // No spotlight - full overlay for completion
    title: "You're All Set!",
    content: "Great job completing the tour! You now know your way around. Click Finish to see something special I've prepared for you.",
    position: 'center',
    audioScript: TOUR_AUDIO_SCRIPTS['tour-complete'],
    showAvatar: true,
    avatarPosition: 'left',
    highlightPadding: 0,
    allowSkip: false,
  },
];

/**
 * Complete tour configuration
 */
export const GROUPHOME_DASHBOARD_TOUR: TourConfig = {
  id: 'grouphome-dashboard-tour',
  name: 'Grouphome Dashboard Tour',
  steps: GROUPHOME_TOUR_STEPS,
  showProgressIndicator: true,
  allowSkipTour: true,
  persistProgress: true,
};

/**
 * Get step by ID
 */
export function getTourStepById(stepId: string): TourStep | undefined {
  return GROUPHOME_TOUR_STEPS.find(step => step.id === stepId);
}

/**
 * Get total number of steps
 */
export function getTotalSteps(): number {
  return GROUPHOME_TOUR_STEPS.length;
}

/**
 * Check if step is last step (tour complete)
 */
export function isLastStep(stepIndex: number): boolean {
  return stepIndex === GROUPHOME_TOUR_STEPS.length - 1;
}

/**
 * Get audio script for a step
 */
export function getStepAudioScript(stepId: string): string | undefined {
  const step = getTourStepById(stepId);
  return step?.audioScript;
}

export default GROUPHOME_DASHBOARD_TOUR;
