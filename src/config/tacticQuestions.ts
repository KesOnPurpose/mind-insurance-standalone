import type { TacticQuestionSet, TacticQuestion } from '@/types/assessment';

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

/**
 * Maps tactic categories/keywords to business profile questions
 * These questions help build the user's business profile progressively
 */
export const TACTIC_QUESTION_MAP: Record<string, TacticQuestion[]> = {
  // State/Licensing related tactics
  'licensing': [
    {
      id: 'target_state',
      question: 'Which state are you focusing on for your group home?',
      fieldName: 'targetState',
      inputType: 'select',
      options: US_STATES,
      required: true,
    },
    {
      id: 'target_state_reason',
      question: 'Why did you choose this state? (helps agents personalize advice)',
      fieldName: 'targetStateReason',
      inputType: 'textarea',
      placeholder: 'e.g., I live here, lower regulations, better reimbursement rates...',
      required: false,
    },
  ],

  // Entity Formation tactics
  'entity': [
    {
      id: 'business_name',
      question: 'What name did you choose for your business?',
      fieldName: 'businessName',
      inputType: 'text',
      placeholder: 'e.g., Sunshine Care Home LLC',
      required: true,
    },
    {
      id: 'entity_type',
      question: 'What type of business entity did you form?',
      fieldName: 'entityType',
      inputType: 'select',
      options: [
        { value: 'llc', label: 'LLC (Limited Liability Company)' },
        { value: 's-corp', label: 'S Corporation' },
        { value: 'c-corp', label: 'C Corporation' },
        { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'not-formed', label: 'Not formed yet' },
      ],
      required: true,
    },
  ],

  // Property related tactics
  'property': [
    {
      id: 'bed_count',
      question: 'How many beds are you planning for?',
      fieldName: 'bedCount',
      inputType: 'number',
      placeholder: '6',
      required: true,
      validation: {
        min: 1,
        max: 20,
        message: 'Bed count must be between 1 and 20',
      },
    },
    {
      id: 'property_type',
      question: 'What type of property are you looking for?',
      fieldName: 'propertyType',
      inputType: 'select',
      options: [
        { value: 'single-family', label: 'Single Family Home' },
        { value: 'duplex', label: 'Duplex' },
        { value: 'multi-family', label: 'Multi-Family Property' },
        { value: 'commercial', label: 'Commercial Property' },
        { value: 'not-selected', label: 'Not decided yet' },
      ],
      required: true,
    },
    {
      id: 'property_status',
      question: 'What is your current property status?',
      fieldName: 'propertyStatus',
      inputType: 'select',
      options: [
        { value: 'not-started', label: 'Haven\'t started looking' },
        { value: 'researching', label: 'Researching areas' },
        { value: 'searching', label: 'Actively searching' },
        { value: 'offer-pending', label: 'Offer pending' },
        { value: 'under-contract', label: 'Under contract' },
        { value: 'owned', label: 'Already own property' },
        { value: 'leasing', label: 'Leasing property' },
      ],
      required: true,
    },
  ],

  // Financial/Funding tactics
  'financial': [
    {
      id: 'funding_source',
      question: 'What is your primary funding source?',
      fieldName: 'fundingSource',
      inputType: 'select',
      options: [
        { value: 'personal-savings', label: 'Personal Savings' },
        { value: 'bank-loan', label: 'Traditional Bank Loan' },
        { value: 'sba-loan', label: 'SBA Loan' },
        { value: 'fha-loan', label: 'FHA Loan (203k, etc.)' },
        { value: 'investor', label: 'Private Investor' },
        { value: 'partner', label: 'Business Partner' },
        { value: 'seller-financing', label: 'Seller Financing' },
        { value: 'combination', label: 'Combination of Sources' },
        { value: 'not-decided', label: 'Not decided yet' },
      ],
      required: true,
    },
    {
      id: 'startup_capital',
      question: 'How much startup capital do you have available? ($)',
      fieldName: 'startupCapitalActual',
      inputType: 'number',
      placeholder: '45000',
      required: false,
    },
  ],

  // Revenue/Business Model tactics
  'revenue': [
    {
      id: 'monthly_revenue_target',
      question: 'What is your target monthly revenue? ($)',
      fieldName: 'monthlyRevenueTarget',
      inputType: 'number',
      placeholder: '15000',
      required: true,
    },
    {
      id: 'monthly_expense_estimate',
      question: 'What are your estimated monthly expenses? ($)',
      fieldName: 'monthlyExpenseEstimate',
      inputType: 'number',
      placeholder: '8000',
      required: false,
    },
    {
      id: 'service_model',
      question: 'What service model are you planning?',
      fieldName: 'serviceModel',
      inputType: 'select',
      options: [
        { value: 'owner-operator', label: 'Owner-Operator (you run day-to-day)' },
        { value: 'absentee-owner', label: 'Absentee Owner (fully delegated)' },
        { value: 'manager-operated', label: 'Manager-Operated (you oversee manager)' },
        { value: 'hybrid', label: 'Hybrid (mix of involvement)' },
        { value: 'not-decided', label: 'Not decided yet' },
      ],
      required: true,
    },
  ],

  // Marketing tactics
  'marketing': [
    {
      id: 'marketing_strategy',
      question: 'Briefly describe your marketing approach:',
      fieldName: 'marketingStrategy',
      inputType: 'textarea',
      placeholder: 'e.g., Partnering with hospitals, social services, online presence...',
      required: false,
    },
    {
      id: 'referral_sources',
      question: 'What are your planned referral sources?',
      fieldName: 'referralSources',
      inputType: 'multiselect',
      options: [
        { value: 'hospitals', label: 'Hospitals' },
        { value: 'social-services', label: 'Social Services' },
        { value: 'case-managers', label: 'Case Managers' },
        { value: 'family-referrals', label: 'Family Referrals' },
        { value: 'online-marketing', label: 'Online Marketing' },
        { value: 'word-of-mouth', label: 'Word of Mouth' },
        { value: 'community-events', label: 'Community Events' },
        { value: 'physician-offices', label: 'Physician Offices' },
      ],
      required: false,
    },
  ],

  // License Application tactics
  'license_application': [
    {
      id: 'license_status',
      question: 'What is your current licensing status?',
      fieldName: 'licenseStatus',
      inputType: 'select',
      options: [
        { value: 'not-started', label: 'Not started' },
        { value: 'researching', label: 'Researching requirements' },
        { value: 'documents-gathering', label: 'Gathering documents' },
        { value: 'application-submitted', label: 'Application submitted' },
        { value: 'inspection-scheduled', label: 'Inspection scheduled' },
        { value: 'approved', label: 'License approved' },
        { value: 'operational', label: 'Fully operational' },
      ],
      required: true,
    },
    {
      id: 'estimated_license_date',
      question: 'When do you expect to receive your license?',
      fieldName: 'estimatedLicenseDate',
      inputType: 'date',
      required: false,
    },
  ],

  // Launch/Operations tactics
  'launch': [
    {
      id: 'business_launch_date',
      question: 'When do you plan to launch your business?',
      fieldName: 'businessLaunchDate',
      inputType: 'date',
      required: false,
    },
    {
      id: 'first_resident_date',
      question: 'When do you expect your first resident?',
      fieldName: 'firstResidentDate',
      inputType: 'date',
      required: false,
    },
  ],
};

/**
 * Get questions for a specific tactic based on its name and category
 */
export function getQuestionsForTactic(tacticName: string, category: string): TacticQuestion[] {
  const lowerName = tacticName.toLowerCase();
  const lowerCategory = category.toLowerCase();

  const questions: TacticQuestion[] = [];

  // Match based on keywords in tactic name or category
  const keywords = [
    'licensing', 'entity', 'property', 'financial',
    'revenue', 'marketing', 'license_application', 'launch'
  ];

  for (const keyword of keywords) {
    if (lowerName.includes(keyword) || lowerCategory.includes(keyword)) {
      const matchedQuestions = TACTIC_QUESTION_MAP[keyword];
      if (matchedQuestions) {
        // Avoid duplicate questions
        for (const q of matchedQuestions) {
          if (!questions.find(existing => existing.id === q.id)) {
            questions.push(q);
          }
        }
      }
    }
  }

  // Special case matching for common tactic patterns
  if (lowerName.includes('state') || lowerName.includes('where to operate')) {
    if (!questions.find(q => q.id === 'target_state')) {
      questions.push(...TACTIC_QUESTION_MAP['licensing']);
    }
  }

  if (lowerName.includes('llc') || lowerName.includes('business entity') || lowerName.includes('incorporate')) {
    if (!questions.find(q => q.id === 'business_name')) {
      questions.push(...TACTIC_QUESTION_MAP['entity']);
    }
  }

  if (lowerName.includes('bed') || lowerName.includes('home search') || lowerName.includes('real estate')) {
    if (!questions.find(q => q.id === 'bed_count')) {
      questions.push(...TACTIC_QUESTION_MAP['property']);
    }
  }

  if (lowerName.includes('funding') || lowerName.includes('financing') || lowerName.includes('capital')) {
    if (!questions.find(q => q.id === 'funding_source')) {
      questions.push(...TACTIC_QUESTION_MAP['financial']);
    }
  }

  // Limit to 3 questions max per tactic to keep it simple
  return questions.slice(0, 3);
}

/**
 * Calculate profile completeness based on filled fields
 */
export function calculateProfileCompleteness(profile: Record<string, unknown>): number {
  const criticalFields = [
    'targetState',
    'businessName',
    'entityType',
    'bedCount',
    'propertyStatus',
    'fundingSource',
    'licenseStatus',
    'serviceModel',
    'monthlyRevenueTarget',
  ];

  let filledCount = 0;
  for (const field of criticalFields) {
    if (profile[field] !== undefined && profile[field] !== null && profile[field] !== '') {
      filledCount++;
    }
  }

  return Math.round((filledCount / criticalFields.length) * 100);
}
