/**
 * Category Hierarchy Configuration
 *
 * Purpose: $100M-level category consolidation strategy
 * Reduces cognitive load from 40 granular categories to 8 intuitive parent categories
 *
 * Design Philosophy:
 * - Apple-like simplicity: Clear, scannable, organized
 * - User mental model: "I want to see all my Marketing tactics"
 * - Progressive disclosure: Start with 8 parents, drill down to subcategories
 * - Visual hierarchy: Icons, colors, counts for quick scanning
 */

export interface CategoryHierarchy {
  /** Parent category name (shown in main dropdown) */
  parent: string;

  /** Emoji icon for visual scanning */
  icon: string;

  /** Granular subcategories that roll up to this parent */
  subcategories: string[];

  /** Color theme for visual distinction */
  color: 'purple' | 'red' | 'green' | 'blue' | 'amber' | 'cyan' | 'gray' | 'indigo';

  /** Short description (tooltip on hover) */
  description: string;

  /** Sort order (lower = higher in list) */
  sortOrder: number;
}

/**
 * Master category hierarchy mapping
 *
 * Maps 40 granular categories → 8 parent categories
 * Maintains backward compatibility (granular categories preserved as subcategories)
 */
export const CATEGORY_HIERARCHY: CategoryHierarchy[] = [
  {
    parent: 'Marketing & Lead Generation',
    icon: '📣',
    subcategories: [
      'Digital Marketing & Web Presence',
      'Marketing Materials Creation',
      'Boots-on-the-Ground Marketing',
      'Referral Source Development',
      'Lead Assessment & Qualification'
    ],
    color: 'purple',
    description: 'Attract and qualify potential residents through digital and traditional marketing',
    sortOrder: 1
  },
  {
    parent: 'Legal & Compliance',
    icon: '⚖️',
    subcategories: [
      'Legal Research',
      'Legal & Compliance',
      'Legal Structure',
      'Licensing & Compliance',
      'Insurance & Risk Management'
    ],
    color: 'red',
    description: 'Navigate legal requirements, licensing, and risk management',
    sortOrder: 2
  },
  {
    parent: 'Financial Strategy',
    icon: '💰',
    subcategories: [
      'Financial Planning',
      'Creative Financing & Real Estate',
      'Revenue Optimization',
      'Pricing Strategy'
    ],
    color: 'green',
    description: 'Plan finances, secure funding, and optimize revenue',
    sortOrder: 3
  },
  {
    parent: 'Property Operations',
    icon: '🏠',
    subcategories: [
      'Property Search',
      'Property Acquisition',
      'Property Purchase Strategy',
      'Rental Arbitrage Strategy',
      'Landlord Outreach & Pitch',
      'Property Setup',
      'Utilities & Services Setup',
      'Furniture & Supplies'
    ],
    color: 'blue',
    description: 'Find, acquire, and prepare properties for residents',
    sortOrder: 4
  },
  {
    parent: 'Market & Business Planning',
    icon: '📊',
    subcategories: [
      'Market Research',
      'Business Planning',
      'Business Formation & Setup'
    ],
    color: 'cyan',
    description: 'Research market opportunity and establish business foundation',
    sortOrder: 5
  },
  {
    parent: 'Staffing & Resident Care',
    icon: '👥',
    subcategories: [
      'House Manager/Staff',
      'Onboarding Documents & Process',
      'Medical Clearance & Health',
      'Safety & Compliance'
    ],
    color: 'amber',
    description: 'Recruit staff and ensure resident health and safety',
    sortOrder: 6
  },
  {
    parent: 'Operations Management',
    icon: '⚙️',
    subcategories: [
      'Daily Operations',
      'Weekly Operations',
      'Monthly Operations',
      'Quarterly Operations',
      'Annual Operations',
      'Systems & Automation'
    ],
    color: 'gray',
    description: 'Manage day-to-day operations and build scalable systems',
    sortOrder: 7
  },
  {
    parent: 'Growth & Scaling',
    icon: '🚀',
    subcategories: [
      'Scaling & Growth',
      'Expansion & Diversification',
      'Non-Medical Home Care Agency'
    ],
    color: 'indigo',
    description: 'Scale operations and expand into new markets',
    sortOrder: 8
  }
];

/**
 * Lookup map: subcategory → parent category
 * Used for reverse mapping (when you have a subcategory and need to find its parent)
 */
export const SUBCATEGORY_TO_PARENT_MAP = CATEGORY_HIERARCHY.reduce((acc, group) => {
  group.subcategories.forEach(subcat => {
    acc[subcat] = group.parent;
  });
  return acc;
}, {} as Record<string, string>);

/**
 * Get parent category for a given subcategory
 * @param subcategory - Granular category name
 * @returns Parent category name or null if not found
 */
export function getParentCategory(subcategory: string): string | null {
  return SUBCATEGORY_TO_PARENT_MAP[subcategory] || null;
}

/**
 * Get category hierarchy for a parent category
 * @param parentCategory - Parent category name
 * @returns CategoryHierarchy object or undefined
 */
export function getCategoryHierarchy(parentCategory: string): CategoryHierarchy | undefined {
  return CATEGORY_HIERARCHY.find(h => h.parent === parentCategory);
}

/**
 * Get all parent category names (for dropdown)
 * @returns Array of parent category names sorted by sortOrder
 */
export function getParentCategories(): string[] {
  return CATEGORY_HIERARCHY
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(h => h.parent);
}

/**
 * Get color theme for a parent category
 * @param parentCategory - Parent category name
 * @returns Tailwind color class or default 'gray'
 */
export function getCategoryColor(parentCategory: string): string {
  const hierarchy = getCategoryHierarchy(parentCategory);
  return hierarchy?.color || 'gray';
}

/**
 * Get icon for a parent category
 * @param parentCategory - Parent category name
 * @returns Emoji icon or default '📋'
 */
export function getCategoryIcon(parentCategory: string): string {
  const hierarchy = getCategoryHierarchy(parentCategory);
  return hierarchy?.icon || '📋';
}

/**
 * Check if a category is a parent category
 * @param category - Category name to check
 * @returns True if category is a parent category
 */
export function isParentCategory(category: string): boolean {
  return CATEGORY_HIERARCHY.some(h => h.parent === category);
}

/**
 * Check if a category is a subcategory
 * @param category - Category name to check
 * @returns True if category is a subcategory
 */
export function isSubcategory(category: string): boolean {
  return category in SUBCATEGORY_TO_PARENT_MAP;
}
