// GROUPHOME STANDALONE: Only Nette coach (MIO intelligence built-in via N8n workflow)
export type CoachType = 'nette';

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
    avatar: '/nette-avatar.png',
    color: 'hsl(221 83% 53%)', // Primary blue
    gradient: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(221 70% 60%))',
    personality: 'Warm and encouraging, patient educator, detail-oriented, and compliance-focused.',
    expertise: [
      'Comprehensive assessments',
      'Personalized roadmaps',
      'State licensing guidance',
      'Population-specific expertise',
      'Initial user onboarding'
    ]
  }
};
