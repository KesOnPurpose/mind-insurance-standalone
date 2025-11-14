export type CoachType = 'nette' | 'mio' | 'me';

export interface Coach {
  id: CoachType;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  gradient: string;
  personality: string;
  expertise: string[];
}

export const COACHES: Record<CoachType, Coach> = {
  nette: {
    id: 'nette',
    name: 'Nette',
    title: 'Strategy Coach',
    description: 'Your group home business strategist. I help you navigate licensing, location, and tactics to build your first $100K.',
    avatar: 'N',
    color: 'hsl(187 85% 35%)', // Primary teal
    gradient: 'linear-gradient(135deg, hsl(187 85% 35%), hsl(187 75% 45%))',
    personality: 'Strategic, data-driven, and practical. Focuses on actionable tactics and proven strategies.',
    expertise: [
      'Business strategy',
      'State licensing',
      'Market analysis',
      'Tactic selection',
      'Revenue planning'
    ]
  },
  mio: {
    id: 'mio',
    name: 'MIO',
    title: 'Mindset & Accountability Coach',
    description: 'I help you overcome mental blocks, stay accountable, and build the mindset needed for breakthrough success.',
    avatar: 'M',
    color: 'hsl(35 95% 55%)', // Secondary amber
    gradient: 'linear-gradient(135deg, hsl(35 95% 55%), hsl(35 95% 65%))',
    personality: 'Empathetic, motivating, and insightful. Helps with mindset shifts and accountability.',
    expertise: [
      'Mindset coaching',
      'Accountability tracking',
      'Overcoming obstacles',
      'Identity collision work',
      'PROTECT practices'
    ]
  },
  me: {
    id: 'me',
    name: 'ME',
    title: 'Operations Coach',
    description: 'Your operations expert. I help with day-to-day execution, time management, and completing your model week.',
    avatar: 'E',
    color: 'hsl(142 70% 45%)', // Success green
    gradient: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 55%))',
    personality: 'Practical, detail-oriented, and systematic. Focuses on execution and operations.',
    expertise: [
      'Time management',
      'Model week planning',
      'Task execution',
      'Operations setup',
      'Daily scheduling'
    ]
  }
};
