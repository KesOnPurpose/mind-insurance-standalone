// ============================================================================
// PROPERTY PROFILE COMPONENT
// ============================================================================
// Comprehensive property details view with photos, basics, ownership info,
// and amenities. Supports view and edit modes.
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Building2,
  Ruler,
  CalendarDays,
  Key,
} from 'lucide-react';
import type { Property, OwnershipModel, PropertyType } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyProfileProps {
  property: Property;
  onUpdate: (data: Partial<Property>) => Promise<void>;
  onPhotoUpload?: (file: File) => Promise<string>;
  onPhotoDelete?: (photoUrl: string) => Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'apartment', label: 'Apartment' },
];

const OWNERSHIP_MODELS: { value: OwnershipModel; label: string }[] = [
  { value: 'rental_arbitrage', label: 'Rental Arbitrage' },
  { value: 'owned', label: 'Owned' },
  { value: 'seller_financing', label: 'Seller Financing' },
];

const AMENITY_OPTIONS = [
  { id: 'washer_dryer', label: 'Washer/Dryer' },
  { id: 'parking', label: 'Parking' },
  { id: 'central_ac', label: 'Central AC' },
  { id: 'accessible', label: 'Accessible' },
  { id: 'backyard', label: 'Backyard' },
  { id: 'garage', label: 'Garage' },
  { id: 'storage', label: 'Storage' },
  { id: 'security_system', label: 'Security System' },
  { id: 'pool', label: 'Pool' },
  { id: 'fireplace', label: 'Fireplace' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPropertyTypeLabel(type?: PropertyType): string {
  const found = PROPERTY_TYPES.find((t) => t.value === type);
  return found?.label || 'Unknown';
}

function getOwnershipLabel(model?: OwnershipModel): string {
  const found = OWNERSHIP_MODELS.find((m) => m.value === model);
  return found?.label || 'Unknown';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PropertyProfile({
  property,
  onUpdate,
  onPhotoUpload,
  onPhotoDelete,
  isLoading = false,
  isReadOnly = false,
  className = '',
}: PropertyProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editData, setEditData] = useState({
    nickname: property.nickname,
    address_line1: property.address_line1 || '',
    address_line2: property.address_line2 || '',
    city: property.city || '',
    state_code: property.state_code,
    zip_code: property.zip_code || '',
    property_type: property.property_type,
    square_footage: property.square_footage,
    year_built: property.year_built,
    ownership_model: property.ownership_model,
    monthly_rent_or_mortgage: property.monthly_rent_or_mortgage,
    purchase_price: property.purchase_price,
    acquisition_date: property.acquisition_date || '',
    operating_since: property.operating_since || '',
    amenities: property.amenities || [],
  });

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        nickname: editData.nickname,
        address_line1: editData.address_line1 || undefined,
        address_line2: editData.address_line2 || undefined,
        city: editData.city || undefined,
        state_code: editData.state_code,
        zip_code: editData.zip_code || undefined,
        property_type: editData.property_type,
        square_footage: editData.square_footage,
        year_built: editData.year_built,
        ownership_model: editData.ownership_model,
        monthly_rent_or_mortgage: editData.monthly_rent_or_mortgage,
        purchase_price: editData.purchase_price,
        acquisition_date: editData.acquisition_date || undefined,
        operating_since: editData.operating_since || undefined,
        amenities: editData.amenities,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditData({
      nickname: property.nickname,
      address_line1: property.address_line1 || '',
      address_line2: property.address_line2 || '',
      city: property.city || '',
      state_code: property.state_code,
      zip_code: property.zip_code || '',
      property_type: property.property_type,
      square_footage: property.square_footage,
      year_built: property.year_built,
      ownership_model: property.ownership_model,
      monthly_rent_or_mortgage: property.monthly_rent_or_mortgage,
      purchase_price: property.purchase_price,
      acquisition_date: property.acquisition_date || '',
      operating_since: property.operating_since || '',
      amenities: property.amenities || [],
    });
    setIsEditing(false);
  };

  // Handle amenity toggle
  const handleAmenityToggle = (amenityId: string) => {
    const current = editData.amenities || [];
    if (current.includes(amenityId)) {
      setEditData({
        ...editData,
        amenities: current.filter((a) => a !== amenityId),
      });
    } else {
      setEditData({
        ...editData,
        amenities: [...current, amenityId],
      });
    }
  };

  // Handle photo upload (from file input)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onPhotoUpload || !e.target.files?.length) return;

    const file = e.target.files[0];
    try {
      const url = await onPhotoUpload(file);
      const currentPhotos = property.photos || [];
      await onUpdate({
        photos: [...currentPhotos, url],
      });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  // Handle drag-and-drop photo upload
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!onPhotoUpload) return;

    const files = e.dataTransfer.files;
    if (!files?.length) return;

    const file = files[0];
    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      console.error('Dropped file is not an image');
      return;
    }

    try {
      const url = await onPhotoUpload(file);
      const currentPhotos = property.photos || [];
      await onUpdate({
        photos: [...currentPhotos, url],
      });
    } catch (error) {
      console.error('Failed to upload dropped photo:', error);
    }
  };

  // Handle photo delete
  const handlePhotoDelete = async (photoUrl: string) => {
    if (!onPhotoDelete) return;

    try {
      await onPhotoDelete(photoUrl);
      const currentPhotos = property.photos || [];
      await onUpdate({
        photos: currentPhotos.filter((p) => p !== photoUrl),
      });
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  // Get address display
  const addressDisplay = [
    property.address_line1,
    property.address_line2,
    property.city,
    property.state_code,
    property.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={className}>
      {/* Header Card with Name and Address */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="h-6 w-6 text-primary" />
              </div>
              {isEditing ? (
                <Input
                  value={editData.nickname}
                  onChange={(e) =>
                    setEditData({ ...editData, nickname: e.target.value })
                  }
                  className="text-xl font-bold h-auto py-1"
                  placeholder="Property Name"
                />
              ) : (
                <div>
                  <CardTitle className="text-xl">{property.nickname}</CardTitle>
                  {addressDisplay && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {addressDisplay}
                    </p>
                  )}
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !editData.nickname}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Photo Gallery */}
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(property.photos || []).length > 0 ? (
              (property.photos || []).slice(0, 5).map((photo, idx) => (
                <div
                  key={idx}
                  className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden group"
                >
                  <img
                    src={photo}
                    alt={`Property photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!isReadOnly && (
                    <button
                      onClick={() => handlePhotoDelete(photo)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}

            {!isReadOnly && (property.photos || []).length < 5 && (
              <label
                className={`shrink-0 w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Plus className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs mt-1 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isDragging ? 'Drop' : 'Add'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Basics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Property Basics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select
                      value={editData.property_type}
                      onValueChange={(v) =>
                        setEditData({
                          ...editData,
                          property_type: v as PropertyType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Square Footage</Label>
                    <Input
                      type="number"
                      value={editData.square_footage || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          square_footage:
                            parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="e.g., 2400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Year Built</Label>
                  <Input
                    type="number"
                    value={editData.year_built || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        year_built: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 1985"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={editData.address_line1}
                    onChange={(e) =>
                      setEditData({ ...editData, address_line1: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={editData.city}
                      onChange={(e) =>
                        setEditData({ ...editData, city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={editData.state_code}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          state_code: e.target.value.toUpperCase().slice(0, 2),
                        })
                      }
                      placeholder="TX"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP</Label>
                    <Input
                      value={editData.zip_code}
                      onChange={(e) =>
                        setEditData({ ...editData, zip_code: e.target.value })
                      }
                      placeholder="12345"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {getPropertyTypeLabel(property.property_type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    Sqft
                  </span>
                  <span className="font-medium">
                    {property.square_footage?.toLocaleString() || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Year Built
                  </span>
                  <span className="font-medium">
                    {property.year_built || '-'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ownership Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              Ownership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Ownership Model</Label>
                  <Select
                    value={editData.ownership_model}
                    onValueChange={(v) =>
                      setEditData({
                        ...editData,
                        ownership_model: v as OwnershipModel,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNERSHIP_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent/Mortgage ($)</Label>
                  <Input
                    type="number"
                    value={editData.monthly_rent_or_mortgage || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        monthly_rent_or_mortgage:
                          parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price ($)</Label>
                  <Input
                    type="number"
                    value={editData.purchase_price || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        purchase_price: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 250000"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Acquisition Date</Label>
                    <Input
                      type="date"
                      value={editData.acquisition_date}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          acquisition_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Operating Since</Label>
                    <Input
                      type="date"
                      value={editData.operating_since}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          operating_since: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <Badge variant="secondary">
                    {getOwnershipLabel(property.ownership_model)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Monthly Cost
                  </span>
                  <span className="font-medium">
                    {formatCurrency(property.monthly_rent_or_mortgage)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Operating Since
                  </span>
                  <span className="font-medium">
                    {formatDate(property.operating_since)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Acquired
                  </span>
                  <span className="font-medium">
                    {formatDate(property.acquisition_date)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {AMENITY_OPTIONS.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={(editData.amenities || []).includes(amenity.id)}
                    onCheckedChange={() => handleAmenityToggle(amenity.id)}
                  />
                  <label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(property.amenities || []).length > 0 ? (
                (property.amenities || []).map((amenityId) => {
                  const amenity = AMENITY_OPTIONS.find(
                    (a) => a.id === amenityId
                  );
                  return (
                    <Badge key={amenityId} variant="secondary">
                      {amenity?.label || amenityId}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No amenities listed
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PropertyProfile;
