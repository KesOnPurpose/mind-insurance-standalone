import { CategoryGroup } from '@/types/tactic';

export const JOURNEY_PHASES: CategoryGroup[] = [
  {
    phase: 'foundation',
    name: 'Foundation Building',
    description: 'Set your vision, build mindset, and plan finances',
    weeks: [1, 2, 3],
    icon: '🎯',
    color: 'primary',
    categories: [
      'Vision & Goal Setting',
      'Mindset & Personal Development',
      'Education & Continuous Learning',
      'Financial Planning',
      'Market Research',
    ]
  },
  {
    phase: 'market_entry',
    name: 'Market Entry',
    description: 'Navigate licensing, legal setup, and business formation',
    weeks: [4, 5, 6],
    icon: '📋',
    color: 'secondary',
    categories: [
      'Licensing & Compliance',
      'Legal & Compliance',
      'Legal Structure',
      'Business Formation & Setup',
      'Insurance & Risk Management',
    ]
  },
  {
    phase: 'acquisition',
    name: 'Property Acquisition',
    description: 'Find, finance, and acquire your first property',
    weeks: [7, 8, 9],
    icon: '🏠',
    color: 'success',
    categories: [
      'Property Search',
      'Property Acquisition',
      'Property Purchase Strategy',
      'Creative Financing & Real Estate',
      'Rental Arbitrage Strategy',
      'Landlord Outreach & Pitch',
    ]
  },
  {
    phase: 'operations',
    name: 'Operations Setup',
    description: 'Launch operations, marketing, and onboard residents',
    weeks: [10, 11, 12],
    icon: '⚙️',
    color: 'accent',
    categories: [
      'Property Setup',
      'Utilities & Services Setup',
      'Furniture & Supplies',
      'House Manager/Staff',
      'Safety & Compliance',
      'Digital Marketing & Web Presence',
      'Marketing Materials Creation',
      'Boots-on-the-Ground Marketing',
      'Referral Source Development',
      'Lead Assessment & Qualification',
      'Onboarding Documents & Process',
      'Medical Clearance & Health',
      'Daily Operations',
      'Weekly Operations',
    ]
  },
  {
    phase: 'growth',
    name: 'Growth & Scaling',
    description: 'Optimize operations and expand your portfolio',
    weeks: [13, 14, 15],
    icon: '📈',
    color: 'muted',
    categories: [
      'Revenue Optimization',
      'Pricing Strategy',
      'Systems & Automation',
      'Scaling & Growth',
      'Expansion & Diversification',
      'Monthly Operations',
      'Quarterly Operations',
      'Annual Operations',
      'Non-Medical Home Care Agency',
    ]
  }
];

export function getCategoryColor(category: string): string {
  // Use muted background with proper border and text colors from design system
  return 'bg-muted/50 text-foreground border border-border';
}
