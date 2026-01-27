// ============================================================================
// PROPERTY DETAIL PAGE
// ============================================================================
// Single property view with tabs: Profile, Calculator, Financials, Timeline
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProperty } from '@/hooks/useProperty';
import { usePropertyRooms } from '@/hooks/usePropertyRooms';
import { usePropertyFinancials } from '@/hooks/usePropertyFinancials';
import {
  PropertyProfile,
  RoomManager,
  FinancialTracker,
  PropertyTimeline,
  GoalTracker,
  CalculatorIntegration,
  PropertyComplianceTab,
} from '@/components/property';
import { toast } from 'sonner';
import { uploadPropertyPhoto, deletePropertyPhoto } from '@/services/propertyService';
import {
  Building2,
  Calculator,
  DollarSign,
  History,
  Target,
  BedDouble,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Settings,
  MoreHorizontal,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PropertyDetailPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Property data
  const {
    property,
    isLoading: isLoadingProperty,
    error: propertyError,
    updateProperty: updatePropertyMutation,
    scenarios,
    saveScenario,
    setActiveScenario: setActiveScenarioMutation,
    deleteScenario: deleteScenarioMutation,
    timeline: timelineEvents,
    addEvent: addTimelineEvent,
    goals,
    setGoal: addGoal,
    updateGoalProgress,
    deleteGoal: deleteGoalMutation,
    refetch,
  } = useProperty({ propertyId: propertyId || '', enabled: !!propertyId });

  // Alias for API compatibility
  const isUpdating = false; // Track via individual mutations if needed

  // Rooms data
  const {
    rooms,
    isLoading: isLoadingRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    toggleOccupancy,
    isCreating: isCreatingRoom,
    isUpdating: isUpdatingRoom,
    isDeleting: isDeletingRoom,
  } = usePropertyRooms(propertyId || '');

  // Financials data
  const {
    financials,
    isLoading: isLoadingFinancials,
    saveFinancial,
    updateFinancial,
    isSaving: isSavingFinancial,
  } = usePropertyFinancials(propertyId || '');

  const isLoading = isLoadingProperty || isLoadingRooms || isLoadingFinancials;

  // Handle property update
  const handleUpdateProperty = async (data: Parameters<typeof updatePropertyMutation>[0]) => {
    try {
      await updatePropertyMutation(data);
      toast.success('Property updated successfully');
    } catch (err) {
      toast.error('Failed to update property');
    }
  };

  // Handle room operations
  const handleCreateRoom = async (data: Parameters<typeof createRoom>[0]) => {
    try {
      await createRoom(data);
      toast.success('Room added successfully');
    } catch (err) {
      toast.error('Failed to add room');
    }
  };

  const handleUpdateRoom = async (roomId: string, data: Parameters<typeof updateRoom>[1]) => {
    try {
      await updateRoom(roomId, data);
      toast.success('Room updated');
    } catch (err) {
      toast.error('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      toast.success('Room deleted');
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  const handleToggleOccupancy = async (roomId: string) => {
    try {
      // Find the room to get current state
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      // Toggle the occupancy
      const newIsOccupied = !room.is_occupied;
      const occupiedSince = newIsOccupied ? new Date().toISOString() : undefined;

      await toggleOccupancy(roomId, newIsOccupied, occupiedSince);
      toast.success(newIsOccupied ? 'Room marked as occupied' : 'Room marked as vacant');
    } catch (err) {
      toast.error('Failed to toggle room occupancy');
    }
  };

  // Handle financial operations
  const handleSaveFinancial = async (data: Parameters<typeof saveFinancial>[0]) => {
    try {
      await saveFinancial(data);
      toast.success('Financials saved');
    } catch (err) {
      toast.error('Failed to save financials');
    }
  };

  const handleUpdateFinancial = async (
    financialId: string,
    data: Parameters<typeof updateFinancial>[1]
  ) => {
    try {
      await updateFinancial(financialId, data);
      toast.success('Financials updated');
    } catch (err) {
      toast.error('Failed to update financials');
    }
  };

  // Helper: Calculate projected monthly revenue from property data
  const calculateProjectedRevenue = (): number => {
    if (!property) return 0;
    const beds = property.configured_beds || 6;
    const rate = property.default_rate_per_bed || 907;
    const occupancy = (property.target_occupancy_percent || 90) / 100;
    return Math.round(beds * rate * occupancy);
  };

  // Helper: Get projected expenses from property or default values
  const getProjectedExpenses = () => ({
    rent: property?.monthly_rent_or_mortgage || 2000,
    utilities: 400,
    insurance: 200,
    food: 600,
    staffing: 0,
    maintenance: 200,
    misc: 200,
  });

  // Handle scenario operations
  const handleSaveScenario = async (data: Parameters<typeof saveScenario>[0]) => {
    try {
      await saveScenario(data);
      toast.success('Scenario saved');
    } catch (err) {
      toast.error('Failed to save scenario');
    }
  };

  const handleUpdateScenario = async (scenarioId: string, data: Record<string, unknown>) => {
    // Note: Update scenario by saving with same ID (upsert pattern)
    try {
      await saveScenario(data as Parameters<typeof saveScenario>[0]);
      toast.success('Scenario updated');
    } catch (err) {
      toast.error('Failed to update scenario');
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      await deleteScenarioMutation(scenarioId);
      toast.success('Scenario deleted');
    } catch (err) {
      toast.error('Failed to delete scenario');
    }
  };

  const handleSetActiveScenario = async (scenarioId: string) => {
    try {
      await setActiveScenarioMutation(scenarioId);
      toast.success('Active scenario changed');
    } catch (err) {
      toast.error('Failed to change active scenario');
    }
  };

  // Handle timeline operations
  const handleAddTimelineEvent = async (data: Parameters<typeof addTimelineEvent>[0]) => {
    try {
      await addTimelineEvent(data);
      toast.success('Event added');
    } catch (err) {
      toast.error('Failed to add event');
    }
  };

  // Handle goal operations
  const handleAddGoal = async (data: Parameters<typeof addGoal>[0]) => {
    try {
      await addGoal(data);
      toast.success('Goal added');
    } catch (err) {
      toast.error('Failed to add goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, data: { current_value?: number }) => {
    try {
      if (data.current_value !== undefined) {
        await updateGoalProgress(goalId, data.current_value);
      }
      toast.success('Goal updated');
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoalMutation(goalId);
      toast.success('Goal deleted');
    } catch (err) {
      toast.error('Failed to delete goal');
    }
  };

  const handleMarkGoalAchieved = async (goalId: string) => {
    try {
      // Mark goal as achieved by updating with is_achieved: true
      await updateGoalProgress(goalId, Infinity); // Trigger achieved state
      toast.success('Goal marked as achieved!');
    } catch (err) {
      toast.error('Failed to mark goal as achieved');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (file: File): Promise<string> => {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    try {
      const url = await uploadPropertyPhoto(propertyId, file);
      toast.success('Photo uploaded successfully');
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Handle photo delete
  const handlePhotoDelete = async (photoUrl: string): Promise<void> => {
    try {
      await deletePropertyPhoto(photoUrl);
      toast.success('Photo deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Navigate to full calculator
  const handleOpenFullCalculator = () => {
    navigate('/calculator', { state: { propertyId } });
  };

  // Loading state
  if (isLoading && !property) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (propertyError || !property) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Property not found</p>
          <p className="text-sm text-muted-foreground">
            {propertyError?.message || 'The requested property could not be found.'}
          </p>
          <Button asChild>
            <Link to="/portfolio">Back to Portfolio</Link>
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/portfolio')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{property.nickname}</h1>
                {property.is_active ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {property.address_line1 && `${property.address_line1}, `}
                {property.city}, {property.state_code} {property.zip_code || ''}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4" />
                  {property.configured_beds || 0} beds
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {property.property_type || 'Unknown type'}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenFullCalculator}>
                <Calculator className="h-4 w-4 mr-2" />
                Open Calculator
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUpdateProperty({ is_active: !property.is_active })}
              >
                {property.is_active ? 'Mark as Inactive' : 'Mark as Active'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-1">
            <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-1 text-xs sm:text-sm">
              <BedDouble className="h-4 w-4 hidden sm:inline" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-1 text-xs sm:text-sm">
              <Calculator className="h-4 w-4 hidden sm:inline" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-1 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 hidden sm:inline" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1 text-xs sm:text-sm">
              <Shield className="h-4 w-4 hidden sm:inline" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1 text-xs sm:text-sm">
              <Target className="h-4 w-4 hidden sm:inline" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1 text-xs sm:text-sm">
              <History className="h-4 w-4 hidden sm:inline" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <PropertyProfile
              property={property}
              onUpdate={handleUpdateProperty}
              onPhotoUpload={handlePhotoUpload}
              onPhotoDelete={handlePhotoDelete}
              isUpdating={isUpdating}
            />
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <RoomManager
              propertyId={property.id}
              rooms={rooms}
              onAddRoom={handleCreateRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
              onToggleOccupancy={handleToggleOccupancy}
              isLoading={isLoadingRooms}
            />
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator">
            <CalculatorIntegration
              property={property}
              scenarios={scenarios || []}
              onSaveScenario={handleSaveScenario}
              onUpdateScenario={handleUpdateScenario}
              onDeleteScenario={handleDeleteScenario}
              onSetActiveScenario={handleSetActiveScenario}
              onOpenFullCalculator={handleOpenFullCalculator}
            />
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials">
            <FinancialTracker
              propertyId={property.id}
              financials={financials}
              projectedRevenue={calculateProjectedRevenue()}
              projectedExpenses={getProjectedExpenses()}
              onSaveFinancials={handleSaveFinancial}
              onUpdateFinancials={handleUpdateFinancial}
              isLoading={isLoadingFinancials}
            />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <GoalTracker
              propertyId={property.id}
              goals={goals || []}
              currentMetrics={{
                monthlyProfit: property.current_monthly_profit || 0,
                occupancyRate: property.current_occupancy_percent || 0,
                complianceScore: property.compliance_score || 0,
              }}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onMarkAchieved={handleMarkGoalAchieved}
            />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <PropertyComplianceTab property={property} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <PropertyTimeline
              property={property}
              events={timelineEvents || []}
              onAddEvent={handleAddTimelineEvent}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default PropertyDetailPage;
