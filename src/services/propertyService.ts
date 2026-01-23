// ============================================================================
// PROPERTY SERVICE
// ============================================================================
// Comprehensive CRUD operations for Multi-Property Portfolio Management.
// Includes properties, rooms, financials, timeline, goals, and portfolio stats.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  Property,
  PropertyRoom,
  PropertyFinancials,
  PropertyTimelineEvent,
  PropertyGoal,
  PropertyCalculatorScenario,
  PortfolioSummary,
  PropertyHealthScore,
  PropertyRevenueSummary,
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateRoomInput,
  UpdateRoomInput,
  RecordFinancialsInput,
  AddTimelineEventInput,
  SetGoalInput,
  SaveScenarioInput,
  StateCode,
} from '@/types/property';

// ============================================================================
// PROPERTY CRUD OPERATIONS
// ============================================================================

/**
 * Get all properties for the current user
 */
export async function getUserProperties(): Promise<Property[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_rooms(id, is_occupied, rate_per_month)
    `)
    .eq('user_id', user.user.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Get properties error:', error);
    throw new Error('Failed to fetch properties');
  }

  // Calculate occupancy, revenue, and profit for each property
  return (data || []).map((property) => {
    const rooms = property.property_rooms || [];
    const occupiedRooms = rooms.filter((r: PropertyRoom) => r.is_occupied);
    const totalRevenue = occupiedRooms.reduce(
      (sum: number, r: PropertyRoom) => sum + (r.rate_per_month || 0),
      0
    );
    // Calculate profit using monthly_rent_or_mortgage as base expense
    const monthlyExpense = property.monthly_rent_or_mortgage || 0;
    const monthlyProfit = totalRevenue - monthlyExpense;

    return {
      ...property,
      property_rooms: undefined,
      rooms: undefined,
      current_occupancy_percent:
        rooms.length > 0 ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0,
      current_monthly_revenue: totalRevenue,
      current_monthly_profit: monthlyProfit,
    };
  });
}

/**
 * Get a single property by ID with all related data
 */
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_rooms(*)
    `)
    .eq('id', propertyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Get property error:', error);
    throw new Error('Failed to fetch property');
  }

  if (!data) return null;

  // Calculate derived fields
  const rooms = (data.property_rooms || []).sort(
    (a: PropertyRoom, b: PropertyRoom) => a.sort_order - b.sort_order
  );
  const occupiedRooms = rooms.filter((r: PropertyRoom) => r.is_occupied);
  const totalRevenue = occupiedRooms.reduce(
    (sum: number, r: PropertyRoom) => sum + (r.rate_per_month || 0),
    0
  );
  // Calculate profit using monthly_rent_or_mortgage as base expense
  const monthlyExpense = data.monthly_rent_or_mortgage || 0;
  const monthlyProfit = totalRevenue - monthlyExpense;

  return {
    ...data,
    rooms,
    property_rooms: undefined,
    current_occupancy_percent:
      rooms.length > 0 ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0,
    current_monthly_revenue: totalRevenue,
    current_monthly_profit: monthlyProfit,
  };
}

/**
 * Create a new property
 */
export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      user_id: user.user.id,
      nickname: input.nickname,
      state_code: input.state_code,
      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      zip_code: input.zip_code,
      property_type: input.property_type,
      square_footage: input.square_footage,
      year_built: input.year_built,
      ownership_model: input.ownership_model,
      monthly_rent_or_mortgage: input.monthly_rent_or_mortgage,
      purchase_price: input.purchase_price,
      down_payment: input.down_payment,
      acquisition_date: input.acquisition_date,
      operating_since: input.operating_since,
      amenities: input.amenities || [],
      photos: [],
      configured_beds: input.configured_beds || 0,
      default_rate_per_bed: input.default_rate_per_bed,
      target_occupancy_percent: input.target_occupancy_percent || 90,
      is_active: true,
      is_archived: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Create property error:', error);
    throw new Error('Failed to create property');
  }

  // If configured_beds provided, create default rooms
  if (input.configured_beds && input.configured_beds > 0) {
    const roomsToCreate = Array.from({ length: input.configured_beds }, (_, i) => ({
      property_id: data.id,
      room_name: `Room ${i + 1}`,
      rate_per_month: input.default_rate_per_bed || 0,
      features: [],
      is_occupied: false,
      sort_order: i,
      is_active: true,
    }));

    await supabase.from('property_rooms').insert(roomsToCreate);
  }

  return data;
}

/**
 * Update a property
 */
export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput
): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Update property error:', error);
    throw new Error('Failed to update property');
  }

  return data;
}

/**
 * Archive a property (soft delete)
 */
export async function archiveProperty(propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({
      is_archived: true,
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);

  if (error) {
    console.error('Archive property error:', error);
    throw new Error('Failed to archive property');
  }
}

/**
 * Restore an archived property
 */
export async function restoreProperty(propertyId: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      is_archived: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Restore property error:', error);
    throw new Error('Failed to restore property');
  }

  return data;
}

/**
 * Delete a property permanently
 */
export async function deleteProperty(propertyId: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);

  if (error) {
    console.error('Delete property error:', error);
    throw new Error('Failed to delete property');
  }
}

// ============================================================================
// ROOM CRUD OPERATIONS
// ============================================================================

/**
 * Get all rooms for a property
 */
export async function getPropertyRooms(propertyId: string): Promise<PropertyRoom[]> {
  const { data, error } = await supabase
    .from('property_rooms')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Get rooms error:', error);
    throw new Error('Failed to fetch rooms');
  }

  return data || [];
}

/**
 * Create a new room
 */
export async function createRoom(input: CreateRoomInput): Promise<PropertyRoom> {
  // Get next sort order
  const { data: existingRooms } = await supabase
    .from('property_rooms')
    .select('sort_order')
    .eq('property_id', input.property_id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (existingRooms?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('property_rooms')
    .insert({
      property_id: input.property_id,
      room_name: input.room_name,
      rate_per_month: input.rate_per_month,
      features: input.features || [],
      is_occupied: input.is_occupied || false,
      occupied_since: input.occupied_since,
      tenant_notes: input.tenant_notes,
      sort_order: nextSortOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Create room error:', error);
    throw new Error('Failed to create room');
  }

  // Update property's configured_beds count
  await updatePropertyBedCount(input.property_id);

  return data;
}

/**
 * Update a room
 */
export async function updateRoom(
  roomId: string,
  input: UpdateRoomInput
): Promise<PropertyRoom> {
  const { data, error } = await supabase
    .from('property_rooms')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Update room error:', error);
    throw new Error('Failed to update room');
  }

  // Update parent property timestamp
  await supabase
    .from('properties')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', data.property_id);

  return data;
}

/**
 * Toggle room occupancy
 */
export async function toggleRoomOccupancy(roomId: string): Promise<PropertyRoom> {
  const { data: room, error: fetchError } = await supabase
    .from('property_rooms')
    .select('is_occupied, property_id')
    .eq('id', roomId)
    .single();

  if (fetchError) {
    throw new Error('Room not found');
  }

  const newOccupied = !room.is_occupied;

  const { data, error } = await supabase
    .from('property_rooms')
    .update({
      is_occupied: newOccupied,
      occupied_since: newOccupied ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Toggle occupancy error:', error);
    throw new Error('Failed to update room occupancy');
  }

  return data;
}

/**
 * Delete a room
 */
export async function deleteRoom(roomId: string): Promise<void> {
  // Get property_id first
  const { data: room } = await supabase
    .from('property_rooms')
    .select('property_id')
    .eq('id', roomId)
    .single();

  const { error } = await supabase.from('property_rooms').delete().eq('id', roomId);

  if (error) {
    console.error('Delete room error:', error);
    throw new Error('Failed to delete room');
  }

  // Update property's configured_beds count
  if (room?.property_id) {
    await updatePropertyBedCount(room.property_id);
  }
}

/**
 * Reorder rooms
 */
export async function reorderRooms(
  propertyId: string,
  roomIds: string[]
): Promise<void> {
  for (let i = 0; i < roomIds.length; i++) {
    const { error } = await supabase
      .from('property_rooms')
      .update({ sort_order: i })
      .eq('id', roomIds[i])
      .eq('property_id', propertyId);

    if (error) {
      console.error('Reorder room error:', error);
      throw new Error('Failed to reorder rooms');
    }
  }
}

/**
 * Helper: Update property bed count based on active rooms
 */
async function updatePropertyBedCount(propertyId: string): Promise<void> {
  const { count } = await supabase
    .from('property_rooms')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('is_active', true);

  await supabase
    .from('properties')
    .update({
      configured_beds: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);
}

// ============================================================================
// FINANCIALS OPERATIONS
// ============================================================================

/**
 * Get financials for a property
 */
export async function getPropertyFinancials(
  propertyId: string,
  limit: number = 12
): Promise<PropertyFinancials[]> {
  const { data, error } = await supabase
    .from('property_financials')
    .select('*')
    .eq('property_id', propertyId)
    .order('month_year', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get financials error:', error);
    throw new Error('Failed to fetch financials');
  }

  // Calculate computed fields including expanded expense categories
  return (data || []).map((f) => {
    // Calculate custom expenses total (from JSONB array)
    const customExpensesTotal = Array.isArray(f.custom_expenses)
      ? f.custom_expenses.reduce((sum: number, exp: { amount: number }) => sum + (exp.amount || 0), 0)
      : 0;

    // Calculate actual total expenses (including new utility and operations columns)
    const actualTotalExpenses =
      (f.actual_rent || 0) +
      (f.actual_utilities || 0) +     // Electric
      (f.actual_water || 0) +         // Water
      (f.actual_gas || 0) +           // Gas
      (f.actual_internet || 0) +      // Internet
      (f.actual_insurance || 0) +
      (f.actual_food || 0) +
      (f.actual_supplies || 0) +      // Supplies
      (f.actual_repairs || 0) +       // Repairs
      (f.actual_staffing || 0) +
      (f.actual_maintenance || 0) +
      (f.actual_misc || 0) +
      customExpensesTotal;            // Custom expenses

    const projectedTotalExpenses =
      (f.projected_rent || 0) +
      (f.projected_utilities || 0) +
      (f.projected_insurance || 0) +
      (f.projected_food || 0) +
      (f.projected_staffing || 0) +
      (f.projected_maintenance || 0) +
      (f.projected_misc || 0);

    return {
      ...f,
      actual_total_expenses: actualTotalExpenses,
      projected_total_expenses: projectedTotalExpenses,
      actual_profit: (f.actual_revenue || 0) - actualTotalExpenses,
      projected_profit: (f.projected_revenue || 0) - projectedTotalExpenses,
    };
  });
}

/**
 * Update an existing financial record by ID
 */
export async function updatePropertyFinancials(
  financialId: string,
  data: Partial<PropertyFinancials>
): Promise<PropertyFinancials> {
  const { data: result, error } = await supabase
    .from('property_financials')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', financialId)
    .select()
    .single();

  if (error) {
    console.error('Update financials error:', error);
    throw new Error('Failed to update financials');
  }

  return result;
}

/**
 * Record or update financials for a month
 */
export async function recordFinancials(
  input: RecordFinancialsInput
): Promise<PropertyFinancials> {
  // Check if record exists for this month
  const { data: existing } = await supabase
    .from('property_financials')
    .select('id')
    .eq('property_id', input.property_id)
    .eq('month_year', input.month_year)
    .single();

  let data: PropertyFinancials;
  let error: Error | null = null;

  if (existing) {
    // Update existing
    const result = await supabase
      .from('property_financials')
      .update({
        actual_revenue: input.actual_revenue,
        // Housing
        actual_rent: input.actual_rent,
        // Utilities (expanded)
        actual_utilities: input.actual_utilities,  // Electric
        actual_water: input.actual_water,
        actual_gas: input.actual_gas,
        actual_internet: input.actual_internet,
        // Operations
        actual_insurance: input.actual_insurance,
        actual_food: input.actual_food,
        actual_supplies: input.actual_supplies,
        actual_repairs: input.actual_repairs,
        actual_maintenance: input.actual_maintenance,
        actual_staffing: input.actual_staffing,
        // Other
        actual_misc: input.actual_misc,
        // Custom expenses (JSONB)
        custom_expenses: input.custom_expenses || [],
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    data = result.data;
    error = result.error as Error | null;
  } else {
    // Create new
    const result = await supabase
      .from('property_financials')
      .insert({
        property_id: input.property_id,
        month_year: input.month_year,
        actual_revenue: input.actual_revenue,
        // Housing
        actual_rent: input.actual_rent,
        // Utilities (expanded)
        actual_utilities: input.actual_utilities,  // Electric
        actual_water: input.actual_water,
        actual_gas: input.actual_gas,
        actual_internet: input.actual_internet,
        // Operations
        actual_insurance: input.actual_insurance,
        actual_food: input.actual_food,
        actual_supplies: input.actual_supplies,
        actual_repairs: input.actual_repairs,
        actual_maintenance: input.actual_maintenance,
        actual_staffing: input.actual_staffing,
        // Other
        actual_misc: input.actual_misc,
        // Custom expenses (JSONB)
        custom_expenses: input.custom_expenses || [],
        notes: input.notes,
      })
      .select()
      .single();

    data = result.data;
    error = result.error as Error | null;
  }

  if (error) {
    console.error('Record financials error:', error);
    throw new Error('Failed to record financials');
  }

  return data;
}

// ============================================================================
// TIMELINE OPERATIONS
// ============================================================================

/**
 * Get timeline events for a property
 */
export async function getPropertyTimeline(
  propertyId: string,
  limit: number = 50
): Promise<PropertyTimelineEvent[]> {
  const { data, error } = await supabase
    .from('property_timeline')
    .select('*')
    .eq('property_id', propertyId)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get timeline error:', error);
    throw new Error('Failed to fetch timeline');
  }

  return data || [];
}

/**
 * Add a timeline event
 */
export async function addTimelineEvent(
  input: AddTimelineEventInput
): Promise<PropertyTimelineEvent> {
  const { data, error } = await supabase
    .from('property_timeline')
    .insert({
      property_id: input.property_id,
      event_date: input.event_date,
      event_type: input.event_type,
      title: input.title,
      description: input.description,
      amount: input.amount,
      is_pinned: input.is_pinned || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Add timeline event error:', error);
    throw new Error('Failed to add timeline event');
  }

  return data;
}

/**
 * Toggle pin status of timeline event
 */
export async function toggleTimelinePin(eventId: string): Promise<PropertyTimelineEvent> {
  const { data: event } = await supabase
    .from('property_timeline')
    .select('is_pinned')
    .eq('id', eventId)
    .single();

  const { data, error } = await supabase
    .from('property_timeline')
    .update({ is_pinned: !event?.is_pinned })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Toggle pin error:', error);
    throw new Error('Failed to toggle pin');
  }

  return data;
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('property_timeline').delete().eq('id', eventId);

  if (error) {
    console.error('Delete timeline event error:', error);
    throw new Error('Failed to delete timeline event');
  }
}

// ============================================================================
// GOALS OPERATIONS
// ============================================================================

/**
 * Get goals for a property
 */
export async function getPropertyGoals(propertyId: string): Promise<PropertyGoal[]> {
  const { data, error } = await supabase
    .from('property_goals')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get goals error:', error);
    throw new Error('Failed to fetch goals');
  }

  // Calculate progress
  return (data || []).map((goal) => ({
    ...goal,
    progress_percent:
      goal.target_value > 0
        ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
        : 0,
  }));
}

/**
 * Set a goal for a property
 */
export async function setGoal(input: SetGoalInput): Promise<PropertyGoal> {
  const { data, error } = await supabase
    .from('property_goals')
    .insert({
      property_id: input.property_id,
      goal_type: input.goal_type,
      target_value: input.target_value,
      current_value: 0,
      target_period: input.target_period,
      is_achieved: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Set goal error:', error);
    throw new Error('Failed to set goal');
  }

  return data;
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<PropertyGoal> {
  const { data: goal } = await supabase
    .from('property_goals')
    .select('target_value')
    .eq('id', goalId)
    .single();

  const isAchieved = currentValue >= (goal?.target_value || 0);

  const { data, error } = await supabase
    .from('property_goals')
    .update({
      current_value: currentValue,
      is_achieved: isAchieved,
      achieved_at: isAchieved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Update goal progress error:', error);
    throw new Error('Failed to update goal progress');
  }

  return {
    ...data,
    progress_percent:
      data.target_value > 0
        ? Math.min(Math.round((data.current_value / data.target_value) * 100), 100)
        : 0,
  };
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('property_goals').delete().eq('id', goalId);

  if (error) {
    console.error('Delete goal error:', error);
    throw new Error('Failed to delete goal');
  }
}

// ============================================================================
// CALCULATOR SCENARIO OPERATIONS
// ============================================================================

/**
 * Get calculator scenarios for a property
 */
export async function getPropertyScenarios(
  propertyId: string
): Promise<PropertyCalculatorScenario[]> {
  const { data, error } = await supabase
    .from('property_calculator_scenarios')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get scenarios error:', error);
    throw new Error('Failed to fetch scenarios');
  }

  return data || [];
}

/**
 * Save a calculator scenario
 */
export async function saveScenario(
  input: SaveScenarioInput
): Promise<PropertyCalculatorScenario> {
  const { data, error } = await supabase
    .from('property_calculator_scenarios')
    .insert({
      property_id: input.property_id,
      scenario_name: input.scenario_name,
      calculator_inputs: input.calculator_inputs,
      is_active: input.is_active || false,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Save scenario error:', error);
    throw new Error('Failed to save scenario');
  }

  return data;
}

/**
 * Set a scenario as active (deactivates others)
 */
export async function setActiveScenario(
  scenarioId: string,
  propertyId: string
): Promise<PropertyCalculatorScenario> {
  // Deactivate all scenarios for this property
  await supabase
    .from('property_calculator_scenarios')
    .update({ is_active: false })
    .eq('property_id', propertyId);

  // Activate the specified scenario
  const { data, error } = await supabase
    .from('property_calculator_scenarios')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)
    .select()
    .single();

  if (error) {
    console.error('Set active scenario error:', error);
    throw new Error('Failed to set active scenario');
  }

  return data;
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from('property_calculator_scenarios')
    .delete()
    .eq('id', scenarioId);

  if (error) {
    console.error('Delete scenario error:', error);
    throw new Error('Failed to delete scenario');
  }
}

// ============================================================================
// PORTFOLIO AGGREGATIONS
// ============================================================================

/**
 * Get portfolio summary across all properties
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Get all active properties with rooms
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id, nickname, state_code, monthly_rent_or_mortgage,
      property_rooms(rate_per_month, is_occupied)
    `)
    .eq('user_id', user.user.id)
    .eq('is_archived', false);

  if (error) {
    console.error('Get portfolio summary error:', error);
    throw new Error('Failed to fetch portfolio summary');
  }

  const propertiesData = properties || [];

  // Calculate aggregates
  let totalBeds = 0;
  let occupiedBeds = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;
  const propertiesByState: Record<StateCode, number> = {} as Record<StateCode, number>;
  const revenueByProperty: PropertyRevenueSummary[] = [];

  propertiesData.forEach((property) => {
    const rooms = property.property_rooms || [];
    const occupied = rooms.filter((r: { is_occupied: boolean }) => r.is_occupied);
    const propRevenue = occupied.reduce(
      (sum: number, r: { rate_per_month: number }) => sum + (r.rate_per_month || 0),
      0
    );

    totalBeds += rooms.length;
    occupiedBeds += occupied.length;
    totalRevenue += propRevenue;
    totalExpenses += property.monthly_rent_or_mortgage || 0;

    // By state
    const stateCode = property.state_code as StateCode;
    propertiesByState[stateCode] = (propertiesByState[stateCode] || 0) + 1;

    // Revenue by property
    revenueByProperty.push({
      property_id: property.id,
      property_nickname: property.nickname,
      monthly_revenue: propRevenue,
      revenue_percent: 0, // Calculate after totaling
    });
  });

  // Calculate revenue percentages
  revenueByProperty.forEach((prop) => {
    prop.revenue_percent =
      totalRevenue > 0 ? Math.round((prop.monthly_revenue / totalRevenue) * 100) : 0;
  });

  // Sort by revenue descending
  revenueByProperty.sort((a, b) => b.monthly_revenue - a.monthly_revenue);

  const activeProperties = propertiesData.filter((p) => {
    const rooms = p.property_rooms || [];
    return rooms.some((r: { is_occupied: boolean }) => r.is_occupied);
  }).length;

  return {
    total_properties: propertiesData.length,
    active_properties: activeProperties,
    total_beds: totalBeds,
    occupied_beds: occupiedBeds,
    vacant_beds: totalBeds - occupiedBeds,
    average_occupancy_percent:
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    total_monthly_revenue: totalRevenue,
    total_monthly_expenses: totalExpenses,
    total_monthly_profit: totalRevenue - totalExpenses,
    average_profit_margin:
      totalRevenue > 0
        ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)
        : 0,
    average_break_even_percent:
      totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0,
    properties_by_state: propertiesByState,
    revenue_by_property: revenueByProperty,
  };
}

/**
 * Calculate health score for a property
 */
export async function calculatePropertyHealth(
  propertyId: string
): Promise<PropertyHealthScore> {
  const property = await getPropertyById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  // Get rooms for occupancy
  const rooms = property.rooms || [];
  const occupiedRooms = rooms.filter((r) => r.is_occupied);
  const occupancyRate =
    rooms.length > 0 ? (occupiedRooms.length / rooms.length) * 100 : 0;

  // Occupancy score (compared to target)
  const targetOccupancy = property.target_occupancy_percent || 90;
  const occupancyScore = Math.min(
    Math.round((occupancyRate / targetOccupancy) * 100),
    100
  );

  // Profitability score (simplified calculation)
  const monthlyRevenue = occupiedRooms.reduce((sum, r) => sum + (r.rate_per_month || 0), 0);
  const monthlyExpenses = property.monthly_rent_or_mortgage || 0;
  const profitMargin =
    monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;
  const profitabilityScore = Math.min(Math.max(Math.round(profitMargin * 2), 0), 100);

  // Compliance score (placeholder - would integrate with binder)
  const complianceScore = 75; // Default until integrated

  // Maintenance score (placeholder - based on recent issues)
  const maintenanceScore = 85; // Default

  // Overall score (weighted average)
  const overallScore = Math.round(
    occupancyScore * 0.35 +
      profitabilityScore * 0.35 +
      complianceScore * 0.15 +
      maintenanceScore * 0.15
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (overallScore < 50) {
    riskLevel = 'high';
  } else if (overallScore < 75) {
    riskLevel = 'medium';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (occupancyScore < 80) {
    recommendations.push('Consider marketing to fill vacant rooms');
  }
  if (profitabilityScore < 60) {
    recommendations.push('Review pricing or reduce expenses to improve margins');
  }
  if (complianceScore < 80) {
    recommendations.push('Complete your compliance binder to improve compliance score');
  }

  return {
    property_id: propertyId,
    overall_score: overallScore,
    components: {
      occupancy: occupancyScore,
      profitability: profitabilityScore,
      compliance: complianceScore,
      maintenance: maintenanceScore,
    },
    risk_level: riskLevel,
    recommendations,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Properties
  getUserProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  archiveProperty,
  restoreProperty,
  deleteProperty,
  // Rooms
  getPropertyRooms,
  createRoom,
  updateRoom,
  toggleRoomOccupancy,
  deleteRoom,
  reorderRooms,
  // Financials
  getPropertyFinancials,
  recordFinancials,
  updatePropertyFinancials,
  // Timeline
  getPropertyTimeline,
  addTimelineEvent,
  toggleTimelinePin,
  deleteTimelineEvent,
  // Goals
  getPropertyGoals,
  setGoal,
  updateGoalProgress,
  deleteGoal,
  // Scenarios
  getPropertyScenarios,
  saveScenario,
  setActiveScenario,
  deleteScenario,
  // Portfolio
  getPortfolioSummary,
  calculatePropertyHealth,
};
