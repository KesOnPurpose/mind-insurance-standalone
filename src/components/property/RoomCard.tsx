// ============================================================================
// ROOM CARD COMPONENT
// ============================================================================
// Individual room display with occupancy status, rate, and features.
// Supports both display and edit modes for room configuration.
// ============================================================================

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BedDouble,
  DollarSign,
  User,
  UserX,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { RoomFeatureSelector } from './RoomFeatureSelector';
import type { PropertyRoom, RoomFeature } from '@/types/property';
import { ROOM_FEATURE_LABELS } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomCardProps {
  room: PropertyRoom;
  onUpdate?: (roomId: string, data: Partial<PropertyRoom>) => Promise<void>;
  onDelete?: (roomId: string) => Promise<void>;
  onToggleOccupancy?: (roomId: string) => Promise<void>;
  isReadOnly?: boolean;
  className?: string;
}

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

function formatDate(date?: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RoomCard({
  room,
  onUpdate,
  onDelete,
  onToggleOccupancy,
  isReadOnly = false,
  className = '',
}: RoomCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState({
    room_name: room.room_name,
    rate_per_month: room.rate_per_month,
    features: (room.features || []) as RoomFeature[],
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle save
  const handleSave = async () => {
    if (!onUpdate) return;

    setIsUpdating(true);
    try {
      await onUpdate(room.id, {
        room_name: editData.room_name,
        rate_per_month: editData.rate_per_month,
        features: editData.features,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update room:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditData({
      room_name: room.room_name,
      rate_per_month: room.rate_per_month,
      features: (room.features || []) as RoomFeature[],
    });
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete(room.id);
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Handle toggle occupancy with loading guard to prevent double-clicks
  const [isToggling, setIsToggling] = useState(false);
  const handleToggleOccupancy = async () => {
    if (!onToggleOccupancy || isToggling) return;
    setIsToggling(true);
    try {
      await onToggleOccupancy(room.id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Card
        className={`
          ${room.is_occupied
            ? 'border-l-4 border-l-green-500'
            : 'border-l-4 border-l-gray-300'}
          ${className}
        `}
      >
        <CardContent className="p-4">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`room-name-${room.id}`}>Room Name</Label>
                <Input
                  id={`room-name-${room.id}`}
                  value={editData.room_name}
                  onChange={(e) =>
                    setEditData({ ...editData, room_name: e.target.value })
                  }
                  placeholder="e.g., Master Suite"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`room-rate-${room.id}`}>Monthly Rate ($)</Label>
                <Input
                  id={`room-rate-${room.id}`}
                  type="number"
                  value={editData.rate_per_month}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      rate_per_month: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 900"
                />
              </div>

              <div className="space-y-2">
                <Label>Room Features</Label>
                <RoomFeatureSelector
                  selectedFeatures={editData.features}
                  onChange={(features) => setEditData({ ...editData, features })}
                  showPriceSuggestions={true}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating || !editData.room_name}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="flex items-start gap-4">
              {/* Room Icon */}
              <div
                className={`
                  shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${room.is_occupied
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'}
                `}
              >
                <BedDouble
                  className={`h-5 w-5 ${
                    room.is_occupied
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500'
                  }`}
                />
              </div>

              {/* Room Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{room.room_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-lg font-semibold text-primary">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(room.rate_per_month)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={room.is_occupied ? 'default' : 'secondary'}
                      className={`
                        ${room.is_occupied
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                          : 'hover:bg-muted/80'}
                        ${!isReadOnly && onToggleOccupancy ? 'cursor-pointer active:scale-95 transition-all' : ''}
                        ${isToggling ? 'opacity-50 pointer-events-none' : ''}
                      `}
                      onClick={!isReadOnly && onToggleOccupancy ? handleToggleOccupancy : undefined}
                      role={!isReadOnly && onToggleOccupancy ? 'button' : undefined}
                      tabIndex={!isReadOnly && onToggleOccupancy ? 0 : undefined}
                      aria-label={!isReadOnly && onToggleOccupancy
                        ? `Toggle ${room.room_name} to ${room.is_occupied ? 'vacant' : 'occupied'}`
                        : undefined
                      }
                    >
                      {room.is_occupied ? (
                        <User className="h-3 w-3 mr-1" />
                      ) : (
                        <UserX className="h-3 w-3 mr-1" />
                      )}
                      {room.is_occupied ? 'Occupied' : 'Vacant'}
                    </Badge>

                    {!isReadOnly && (
                      <DropdownMenu modal={true}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                          {onToggleOccupancy && (
                            <DropdownMenuItem onClick={handleToggleOccupancy}>
                              {room.is_occupied ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Mark Vacant
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Mark Occupied
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Features */}
                {room.features && room.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {room.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-muted rounded-full"
                      >
                        {ROOM_FEATURE_LABELS[feature as RoomFeature] || feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Occupied Since */}
                {room.is_occupied && room.occupied_since && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Occupied since {formatDate(room.occupied_since)}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{room.room_name}" from this property.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RoomCard;
