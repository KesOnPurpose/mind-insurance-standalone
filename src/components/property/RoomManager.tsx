// ============================================================================
// ROOM MANAGER COMPONENT
// ============================================================================
// Manages room configuration for a property with two modes:
// - Simple Mode: Quick configured capacity with aggregate stats
// - Detailed Mode: Individual room tracking with occupancy status
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BedDouble,
  Plus,
  Settings2,
  DollarSign,
  Users,
  TrendingUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { RoomCard } from './RoomCard';
import { RoomFeatureSelector } from './RoomFeatureSelector';
import type { PropertyRoom, RoomFeature } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomManagerProps {
  propertyId: string;
  rooms: PropertyRoom[];
  onAddRoom: (room: Omit<PropertyRoom, 'id' | 'property_id' | 'created_at'>) => Promise<void>;
  onUpdateRoom: (roomId: string, data: Partial<PropertyRoom>) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onToggleOccupancy: (roomId: string) => Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

interface NewRoomData {
  room_name: string;
  rate_per_month: number;
  features: RoomFeature[];
}

type ViewMode = 'simple' | 'detailed';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateOccupancyRate(rooms: PropertyRoom[]): number {
  if (rooms.length === 0) return 0;
  const occupied = rooms.filter((r) => r.is_occupied).length;
  return Math.round((occupied / rooms.length) * 100);
}

function calculateTotalRevenue(rooms: PropertyRoom[]): number {
  return rooms.reduce((sum, room) => sum + room.rate_per_month, 0);
}

function calculateActualRevenue(rooms: PropertyRoom[]): number {
  return rooms
    .filter((r) => r.is_occupied)
    .reduce((sum, room) => sum + room.rate_per_month, 0);
}

function calculateAverageRate(rooms: PropertyRoom[]): number {
  if (rooms.length === 0) return 0;
  const total = rooms.reduce((sum, room) => sum + room.rate_per_month, 0);
  return Math.round(total / rooms.length);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RoomManager({
  propertyId,
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onToggleOccupancy,
  isLoading = false,
  isReadOnly = false,
  className = '',
}: RoomManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoomData>({
    room_name: '',
    rate_per_month: 850,
    features: [],
  });

  // Calculate stats
  const totalBeds = rooms.length;
  const occupiedBeds = rooms.filter((r) => r.is_occupied).length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = calculateOccupancyRate(rooms);
  const totalPotentialRevenue = calculateTotalRevenue(rooms);
  const actualRevenue = calculateActualRevenue(rooms);
  const averageRate = calculateAverageRate(rooms);

  // Sort rooms by sort_order or name
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }
    return a.room_name.localeCompare(b.room_name);
  });

  // Handle add room
  const handleAddRoom = async () => {
    if (!newRoom.room_name) return;

    setIsAdding(true);
    try {
      await onAddRoom({
        room_name: newRoom.room_name,
        rate_per_month: newRoom.rate_per_month,
        features: newRoom.features,
        is_occupied: false,
        sort_order: rooms.length,
      });

      // Reset form
      setNewRoom({
        room_name: '',
        rate_per_month: 850,
        features: [],
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add room:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={className}>
      {/* Header with Stats */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                Room Configuration
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Each room represents one bed in your group home
              </p>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'simple' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('simple')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('detailed')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Room
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{totalBeds}</p>
              <p className="text-xs text-muted-foreground">Total Rooms</p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {occupiedBeds}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{vacantBeds}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Occupied / Vacant
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{occupancyRate}%</p>
              <p className="text-xs text-muted-foreground">Occupancy Rate</p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(actualRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                Monthly Revenue
              </p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Potential Revenue:</span>
              <span className="font-medium">
                {formatCurrency(totalPotentialRevenue)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Average Rate:</span>
              <span className="font-medium">
                {formatCurrency(averageRate)}/bed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Content */}
      {viewMode === 'simple' ? (
        // Simple Mode - Aggregate View
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <BedDouble className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {totalBeds} Rooms Configured
              </h3>
              <p className="text-muted-foreground mb-4">
                {formatCurrency(averageRate)} average per bed
              </p>

              <div className="flex items-center justify-center gap-4">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {occupiedBeds} Occupied
                </Badge>
                <Badge variant="secondary">
                  <BedDouble className="h-3 w-3 mr-1" />
                  {vacantBeds} Vacant
                </Badge>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      Projected Revenue
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        Math.round(totalPotentialRevenue * (occupancyRate / 100))
                      )}
                      /mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Target Occupancy
                    </p>
                    <p className="text-lg font-semibold">90%</p>
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setViewMode('detailed')}
                >
                  <Settings2 className="h-4 w-4 mr-1.5" />
                  Manage Individual Rooms
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Detailed Mode - Individual Rooms
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading rooms...
              </CardContent>
            </Card>
          ) : sortedRooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BedDouble className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Rooms Configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add rooms to track occupancy and revenue for this property.
                </p>
                {!isReadOnly && (
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Room
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            sortedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onUpdate={onUpdateRoom}
                onDelete={onDeleteRoom}
                onToggleOccupancy={onToggleOccupancy}
                isReadOnly={isReadOnly}
              />
            ))
          )}
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Each room represents one bed. Add a room to track occupancy and revenue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-room-name">Room Name</Label>
              <Input
                id="new-room-name"
                value={newRoom.room_name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_name: e.target.value })
                }
                placeholder="e.g., Master Suite, Room A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-room-rate">Monthly Rate ($)</Label>
              <Input
                id="new-room-rate"
                type="number"
                value={newRoom.rate_per_month}
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    rate_per_month: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 850"
              />
            </div>

            <div className="space-y-2">
              <Label>Room Features</Label>
              <RoomFeatureSelector
                selectedFeatures={newRoom.features}
                onChange={(features) => setNewRoom({ ...newRoom, features })}
                showPriceSuggestions={true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoom}
              disabled={isAdding || !newRoom.room_name}
            >
              {isAdding ? 'Adding...' : 'Add Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RoomManager;
