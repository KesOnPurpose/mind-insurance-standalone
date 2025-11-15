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
    title: 'Group Home Expert',
    description: 'Your educational guide and assessment expert. I conduct your readiness assessment, generate personalized roadmaps, and provide state-specific licensing guidance to get you started.',
    avatar: 'N',
    color: 'hsl(187 85% 35%)', // Primary teal
    gradient: 'linear-gradient(135deg, hsl(187 85% 35%), hsl(187 75% 45%))',
    personality: 'Warm and encouraging, patient educator, detail-oriented, and compliance-focused.',
    expertise: [
      'Comprehensive assessments',
      'Personalized roadmaps',
      'State licensing guidance',
      'Population-specific expertise',
      'Initial user onboarding'
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
    title: 'Money Evolution Expert',
    description: 'Your financial strategist and funding specialist. I provide creative financing strategies, ROI calculations, funding source identification, and cash flow optimization to fund your group home.',
    avatar: 'E',
    color: 'hsl(142 70% 45%)', // Success green
    gradient: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 55%))',
    personality: 'Numbers-driven, strategic thinker, opportunity-focused, and ROI-oriented.',
    expertise: [
      'Creative financing strategies',
      'ROI calculations & projections',
      'Funding source identification',
      'Cash flow optimization',
      'Investment structuring'
    ]
  }
};
