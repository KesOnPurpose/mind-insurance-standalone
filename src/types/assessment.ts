export interface AssessmentAnswers {
  // Financial Readiness
  capital: string;
  creditScore: string;
  incomeStability: string;
  creativeFinancing: string;

  // Market Knowledge
  licensingFamiliarity: string;
  targetPopulations: string[];
  marketResearch: string;
  reimbursementRate: string;

  // Operational Readiness
  caregivingExperience: string;
  timeCommitment: string;
  supportTeam: string[];
  propertyManagement: number;

  // Mindset & Commitment
  primaryMotivation: string;
  commitmentLevel: number;
  timeline: string;
}

export interface AssessmentResults {
  financialScore: number;
  marketScore: number;
  operationalScore: number;
  mindsetScore: number;
  overallScore: number;
  readinessLevel: 'beginner' | 'intermediate' | 'advanced' | 'ready';
  recommendations: string[];
}
