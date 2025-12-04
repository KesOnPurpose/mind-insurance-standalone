import type { ActivityType } from '@/types/modelWeek';

// Activity configuration for calendar entries
export interface ActivityConfig {
  type: ActivityType;
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
}

// Predefined activity types with colors matching the user's legend
export const ACTIVITY_TYPES: ActivityConfig[] = [
  { type: 'work', label: 'Work', emoji: '🏢', color: '#EF4444', borderColor: '#DC2626' },
  { type: 'routine', label: 'Morning/Evening Routine', emoji: '📋', color: '#F97316', borderColor: '#EA580C' },
  { type: 'fitness', label: 'Fitness', emoji: '💪', color: '#84CC16', borderColor: '#65A30D' },
  { type: 'connection', label: 'Connection Time', emoji: '👫', color: '#E5E7EB', borderColor: '#D1D5DB' },
  { type: 'church', label: 'Church', emoji: '⛪', color: '#F9FAFB', borderColor: '#E5E7EB' },
  { type: 'date_night', label: 'Date Night', emoji: '💑', color: '#06B6D4', borderColor: '#0891B2' },
  { type: 'eat', label: 'Eat', emoji: '🍽️', color: '#A78BFA', borderColor: '#8B5CF6' },
  { type: 'business', label: 'Business', emoji: '💰', color: '#FBBF24', borderColor: '#F59E0B' },
  { type: 'sleep', label: 'Sleep', emoji: '💤', color: '#9CA3AF', borderColor: '#6B7280' },
  { type: 'fun', label: 'Fun', emoji: '😀', color: '#FB923C', borderColor: '#F97316' },
  { type: 'relax', label: 'Relax', emoji: '🧘', color: '#FDBA74', borderColor: '#FB923C' },
  { type: 'strategic', label: 'Strategic Block', emoji: '💭', color: '#FFFFFF', borderColor: '#E5E7EB' },
  { type: 'tactic', label: 'Tactic', emoji: '🎯', color: '#A855F7', borderColor: '#9333EA' },
  { type: 'custom', label: 'Custom', emoji: '🎨', color: '#8B5CF6', borderColor: '#7C3AED' },
];

// Get activity configuration by type
export function getActivityConfig(type?: ActivityType): ActivityConfig {
  if (!type) return ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]; // Default to custom
  return ACTIVITY_TYPES.find(a => a.type === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
}

// Get activity colors (supports custom color override)
export function getActivityColor(type?: ActivityType, customColor?: string): { bg: string; border: string } {
  if (customColor) {
    return { bg: customColor, border: customColor };
  }
  const config = getActivityConfig(type);
  return { bg: config.color, border: config.borderColor };
}

// Determine if a color is light (for auto text color)
export function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate perceived brightness using YIQ formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155;
}

// Get appropriate text color based on background
export function getTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? '#1F2937' : '#FFFFFF';
}

// Predefined color swatches for custom color picker
export const COLOR_SWATCHES = [
  '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
];
