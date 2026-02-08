// ============================================================================
// PROPERTY PORTFOLIO TYPE DEFINITIONS
// ============================================================================
// Types for Multi-Property Portfolio Management feature
// ============================================================================

import type { StateCode } from './compliance';
import type { CalculatorInputs } from './calculator';

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export type PropertyType =
  | 'single_family'
  | 'multi_family'
  | 'duplex'
  | 'triplex'
  | 'apartment'
  | 'townhouse'
  | 'manufactured'
  | 'other';

export type OwnershipModel =
  | 'rental_arbitrage'     // Renting from landlord, subleasing beds
  | 'owned'                // Fully owned property
  | 'seller_financing'     // Purchasing with seller financing
  | 'lease_option'         // Lease with option to buy
  | 'partnership'          // Joint ownership/partnership
  | 'other';

export type PropertyAmenity =
  | 'washer_dryer'
  | 'parking'
  | 'central_ac'
  | 'window_ac'
  | 'heating'
  | 'accessible'
  | 'wheelchair_ramp'
  | 'grab_bars'
  | 'walk_in_shower'
  | 'security_system'
  | 'fenced_yard'
  | 'garage'
  | 'basement'
  | 'attic'
  | 'storage'
  | 'furnished'
  | 'wifi'
  | 'cable';

export type RoomFeature =
  | 'private_bath'
  | 'shared_bath'
  | 'walk_in_closet'
  | 'closet'
  | 'window_ac'
  | 'ceiling_fan'
  | 'separate_entry'
  | 'near_kitchen'
  | 'near_bathroom'
  | 'wheelchair_accessible'
  | 'ground_floor'
  | 'furnished'
  | 'large'
  | 'small';

export type TimelineEventType =
  | 'milestone'     // Property opened, first profit, etc.
  | 'note'          // General journal note
  | 'goal'          // Goal set or achieved
  | 'maintenance'   // Maintenance performed
  | 'expense'       // Expense tracked
  | 'income'        // Income tracked
  | 'occupancy'     // Occupancy change
  | 'inspection';   // Inspection performed

export type GoalType =
  | 'monthly_profit'
  | 'annual_profit'
  | 'occupancy'
  | 'compliance_score'
  | 'expense_reduction'
  | 'revenue_target';

// ============================================================================
// CORE PROPERTY INTERFACE
// ============================================================================

export interface Property {
  id: string;
  user_id: string;
  nickname: string;
  // Address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_code: StateCode;
  zip_code?: string | null;
  // Property details
  property_type?: PropertyType | null;
  square_footage?: number | null;
  year_built?: number | null;
  lot_size?: string | null;
  // Ownership
  ownership_model?: OwnershipModel | null;
  monthly_rent_or_mortgage?: number | null;
  purchase_price?: number | null;
  down_payment?: number | null;
  acquisition_date?: string | null;
  operating_since?: string | null;
  // Features
  amenities: PropertyAmenity[];
  photos: string[];
  // Bed configuration
  configured_beds: number;
  default_rate_per_bed?: number | null;
  target_occupancy_percent: number;
  // Status
  is_active: boolean;
  is_archived: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Computed fields (from joins)
  rooms?: PropertyRoom[];
  binder_id?: string | null;
  compliance_score?: number;
  current_occupancy_percent?: number;
  current_monthly_revenue?: number;
  current_monthly_profit?: number;
}

// ============================================================================
// PROPERTY ROOM INTERFACE
// ============================================================================

export interface PropertyRoom {
  id: string;
  property_id: string;
  room_name: string;
  rate_per_month: number;
  features: RoomFeature[];
  is_occupied: boolean;
  occupied_since?: string | null;
  tenant_notes?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CUSTOM EXPENSE TYPE
// ============================================================================

export interface CustomExpense {
  name: string;
  amount: number;
}

// ============================================================================
// FINANCIAL TRACKING INTERFACES
// ============================================================================

export interface PropertyFinancials {
  id: string;
  property_id: string;
  month_year: string; // '2026-01' format
  // Actual revenue
  actual_revenue?: number | null;
  projected_revenue?: number | null;
  // Actual expenses - Housing
  actual_rent?: number | null;
  // Actual expenses - Utilities (expanded)
  actual_utilities?: number | null;   // Electric
  actual_water?: number | null;       // Water
  actual_gas?: number | null;         // Gas
  actual_internet?: number | null;    // Internet
  // Actual expenses - Operations
  actual_insurance?: number | null;
  actual_food?: number | null;
  actual_supplies?: number | null;    // Supplies
  actual_repairs?: number | null;     // Repairs
  actual_maintenance?: number | null;
  actual_staffing?: number | null;
  // Actual expenses - Other
  actual_misc?: number | null;
  // Projected expenses (from calculator)
  projected_rent?: number | null;
  projected_utilities?: number | null;
  projected_insurance?: number | null;
  projected_food?: number | null;
  projected_staffing?: number | null;
  projected_maintenance?: number | null;
  projected_misc?: number | null;
  // Custom expenses (user-defined categories)
  custom_expenses?: CustomExpense[] | null;
  // Notes
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  actual_total_expenses?: number;
  projected_total_expenses?: number;
  actual_profit?: number;
  projected_profit?: number;
  variance_percent?: number;
}

// Type alias for backward compatibility (some components use singular form)
export type PropertyFinancial = PropertyFinancials;

// ============================================================================
// TIMELINE INTERFACE
// ============================================================================

export interface PropertyTimelineEvent {
  id: string;
  property_id: string;
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description?: string | null;
  amount?: number | null;
  is_pinned: boolean;
  created_at: string;
}

// ============================================================================
// GOALS INTERFACE
// ============================================================================

export interface PropertyGoal {
  id: string;
  property_id: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  target_period?: string | null;
  is_achieved: boolean;
  achieved_at?: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  progress_percent?: number;
}

// ============================================================================
// CALCULATOR SCENARIO INTERFACE
// ============================================================================

export interface PropertyCalculatorScenario {
  id: string;
  property_id: string;
  scenario_name: string;
  calculator_inputs: CalculatorInputs;
  calculator_outputs?: Record<string, unknown> | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PORTFOLIO AGGREGATE TYPES
// ============================================================================

export interface PortfolioSummary {
  total_properties: number;
  active_properties: number;
  total_beds: number;
  occupied_beds: number;
  vacant_beds: number;
  average_occupancy_percent: number;
  total_monthly_revenue: number;
  total_monthly_expenses: number;
  total_monthly_profit: number;
  average_profit_margin: number;
  average_break_even_percent: number;
  // By state
  properties_by_state: Record<StateCode, number>;
  // Revenue concentration
  revenue_by_property: PropertyRevenueSummary[];
}

export interface PropertyRevenueSummary {
  property_id: string;
  property_nickname: string;
  monthly_revenue: number;
  revenue_percent: number;
}

export interface PropertyHealthScore {
  property_id: string;
  overall_score: number; // 0-100
  components: {
    occupancy: number;      // Occupancy vs target
    profitability: number;  // Profit margin
    compliance: number;     // Binder completeness
    maintenance: number;    // Recent issues
  };
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// ============================================================================
// INPUT/OUTPUT TYPES FOR SERVICES
// ============================================================================

export interface CreatePropertyInput {
  nickname: string;
  state_code: StateCode;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  zip_code?: string;
  property_type?: PropertyType;
  square_footage?: number;
  year_built?: number;
  ownership_model?: OwnershipModel;
  monthly_rent_or_mortgage?: number;
  purchase_price?: number;
  down_payment?: number;
  acquisition_date?: string;
  operating_since?: string;
  amenities?: PropertyAmenity[];
  configured_beds?: number;
  default_rate_per_bed?: number;
  target_occupancy_percent?: number;
}

export interface UpdatePropertyInput {
  nickname?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_code?: StateCode;
  zip_code?: string;
  property_type?: PropertyType;
  square_footage?: number;
  year_built?: number;
  lot_size?: string;
  ownership_model?: OwnershipModel;
  monthly_rent_or_mortgage?: number;
  purchase_price?: number;
  down_payment?: number;
  acquisition_date?: string;
  operating_since?: string;
  amenities?: PropertyAmenity[];
  photos?: string[];
  configured_beds?: number;
  default_rate_per_bed?: number;
  target_occupancy_percent?: number;
  is_active?: boolean;
  is_archived?: boolean;
}

export interface CreateRoomInput {
  property_id: string;
  room_name: string;
  rate_per_month: number;
  features?: RoomFeature[];
  is_occupied?: boolean;
  occupied_since?: string;
  tenant_notes?: string;
}

export interface UpdateRoomInput {
  room_name?: string;
  rate_per_month?: number;
  features?: RoomFeature[];
  is_occupied?: boolean;
  occupied_since?: string;
  tenant_notes?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface RecordFinancialsInput {
  property_id: string;
  month_year: string;
  actual_revenue?: number;
  // Housing
  actual_rent?: number;
  // Utilities (expanded)
  actual_utilities?: number;  // Electric
  actual_water?: number;
  actual_gas?: number;
  actual_internet?: number;
  // Operations
  actual_insurance?: number;
  actual_food?: number;
  actual_supplies?: number;
  actual_repairs?: number;
  actual_maintenance?: number;
  actual_staffing?: number;
  // Other
  actual_misc?: number;
  // Custom expenses
  custom_expenses?: CustomExpense[];
  notes?: string;
}

export interface AddTimelineEventInput {
  property_id: string;
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description?: string;
  amount?: number;
  is_pinned?: boolean;
}

export interface SetGoalInput {
  property_id: string;
  goal_type: GoalType;
  target_value: number;
  target_period?: string;
}

export interface SaveScenarioInput {
  property_id: string;
  scenario_name: string;
  calculator_inputs: CalculatorInputs;
  is_active?: boolean;
  notes?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: 'Single Family',
  multi_family: 'Multi-Family',
  duplex: 'Duplex',
  triplex: 'Triplex',
  apartment: 'Apartment',
  townhouse: 'Townhouse',
  manufactured: 'Manufactured/Mobile',
  other: 'Other'
};

export const OWNERSHIP_MODEL_LABELS: Record<OwnershipModel, string> = {
  rental_arbitrage: 'Rental Arbitrage',
  owned: 'Owned',
  seller_financing: 'Seller Financing',
  lease_option: 'Lease Option',
  partnership: 'Partnership',
  other: 'Other'
};

export const AMENITY_LABELS: Record<PropertyAmenity, string> = {
  washer_dryer: 'Washer/Dryer',
  parking: 'Parking',
  central_ac: 'Central A/C',
  window_ac: 'Window A/C',
  heating: 'Heating',
  accessible: 'Accessible',
  wheelchair_ramp: 'Wheelchair Ramp',
  grab_bars: 'Grab Bars',
  walk_in_shower: 'Walk-in Shower',
  security_system: 'Security System',
  fenced_yard: 'Fenced Yard',
  garage: 'Garage',
  basement: 'Basement',
  attic: 'Attic',
  storage: 'Storage',
  furnished: 'Furnished',
  wifi: 'WiFi',
  cable: 'Cable TV'
};

export const ROOM_FEATURE_LABELS: Record<RoomFeature, string> = {
  private_bath: 'Private Bath',
  shared_bath: 'Shared Bath',
  walk_in_closet: 'Walk-in Closet',
  closet: 'Closet',
  window_ac: 'Window A/C',
  ceiling_fan: 'Ceiling Fan',
  separate_entry: 'Separate Entry',
  near_kitchen: 'Near Kitchen',
  near_bathroom: 'Near Bathroom',
  wheelchair_accessible: 'Wheelchair Accessible',
  ground_floor: 'Ground Floor',
  furnished: 'Furnished',
  large: 'Large Room',
  small: 'Small Room'
};

export const TIMELINE_EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  milestone: 'Milestone',
  note: 'Note',
  goal: 'Goal',
  maintenance: 'Maintenance',
  expense: 'Expense',
  income: 'Income',
  occupancy: 'Occupancy Change',
  inspection: 'Inspection'
};

export const TIMELINE_EVENT_TYPE_ICONS: Record<TimelineEventType, string> = {
  milestone: '🎯',
  note: '📝',
  goal: '🎉',
  maintenance: '🔧',
  expense: '💸',
  income: '💰',
  occupancy: '🏠',
  inspection: '📋'
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  monthly_profit: 'Monthly Profit',
  annual_profit: 'Annual Profit',
  occupancy: 'Occupancy Rate',
  compliance_score: 'Compliance Score',
  expense_reduction: 'Expense Reduction',
  revenue_target: 'Revenue Target'
};

export const GOAL_TYPE_UNITS: Record<GoalType, string> = {
  monthly_profit: '$',
  annual_profit: '$',
  occupancy: '%',
  compliance_score: '%',
  expense_reduction: '$',
  revenue_target: '$'
};
