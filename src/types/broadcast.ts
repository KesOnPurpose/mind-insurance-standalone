// =============================================================================
// NOTIFICATION BROADCAST TYPES
// TypeScript definitions for the admin notification broadcast system
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type MediaType = 'text' | 'image' | 'video' | 'link' | 'rich';

export type TargetType = 'global' | 'group' | 'tier' | 'individual';

export type DisplayMode = 'popup' | 'banner' | 'toast';

export type BroadcastPriority = 'low' | 'normal' | 'high' | 'urgent';

export type BroadcastStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled';

export type DeliveryStatus = 'pending' | 'delivered' | 'read' | 'dismissed' | 'failed';

export type AuditAction =
  | 'created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'cancelled';

// -----------------------------------------------------------------------------
// Media Metadata Types
// -----------------------------------------------------------------------------

export interface ImageMetadata {
  width?: number;
  height?: number;
  alt?: string;
  thumbnail_url?: string;
}

export interface VideoMetadata {
  duration?: number;
  thumbnail_url?: string;
  provider?: 'youtube' | 'vimeo' | 'loom' | 'direct';
  embed_url?: string;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image_url?: string;
  domain?: string;
}

export type MediaMetadata = ImageMetadata | VideoMetadata | LinkMetadata | Record<string, unknown>;

// -----------------------------------------------------------------------------
// Main Entity Types
// -----------------------------------------------------------------------------

export interface NotificationBroadcast {
  id: string;
  created_by: string;
  approved_by: string | null;

  // Content
  title: string;
  message: string;
  media_type: MediaType | null;
  media_url: string | null;
  media_metadata: MediaMetadata;
  action_url: string | null;
  action_label: string | null;

  // Targeting
  target_type: TargetType;
  target_group_id: string | null;
  target_tier: string | null;
  target_user_ids: string[] | null;

  // Scheduling
  scheduled_for: string | null;
  expires_at: string | null;

  // Display settings
  display_mode: DisplayMode;
  priority: BroadcastPriority;
  dismissible: boolean;
  require_acknowledgment: boolean;

  // Status
  status: BroadcastStatus;

  // Tracking
  idempotency_key: string;
  total_recipients: number;
  delivered_count: number;
  read_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export interface BroadcastDelivery {
  id: string;
  broadcast_id: string;
  user_id: string;

  // Delivery status
  status: DeliveryStatus;
  delivered_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  acknowledged_at: string | null;

  // Retry tracking
  retry_count: number;
  last_error: string | null;

  created_at: string;
}

export interface UserNotificationGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;

  // Dynamic vs static membership
  is_dynamic: boolean;
  dynamic_filter: DynamicGroupFilter | null;

  created_at: string;
  updated_at: string;

  // Computed fields (from joins)
  member_count?: number;
}

export interface DynamicGroupFilter {
  tier?: string;
  created_after?: string;
  created_before?: string;
  has_completed_assessment?: boolean;
  last_active_after?: string;
  [key: string]: unknown;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_by: string;
  added_at: string;

  // Computed fields (from joins)
  user_email?: string;
  user_name?: string;
}

export interface UserNotificationPreferences {
  id: string;
  user_id: string;

  // Consent
  broadcast_consent: boolean;
  consent_updated_at: string;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;

  // Channel preferences
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_digest_enabled: boolean;

  created_at: string;
  updated_at: string;
}

export interface BroadcastAuditLog {
  id: string;
  broadcast_id: string | null;
  actor_id: string;
  action: AuditAction;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface PendingBroadcast {
  id: string;
  title: string;
  message: string;
  media_type: MediaType | null;
  media_url: string | null;
  media_metadata: MediaMetadata;
  action_url: string | null;
  action_label: string | null;
  display_mode: DisplayMode;
  priority: BroadcastPriority;
  dismissible: boolean;
  require_acknowledgment: boolean;
  created_at: string;
}

export interface BroadcastStatistics {
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  dismissed_count: number;
  acknowledged_count: number;
  failed_count: number;
  delivery_rate: number;
  read_rate: number;
}

// -----------------------------------------------------------------------------
// Form/Input Types
// -----------------------------------------------------------------------------

export interface CreateBroadcastInput {
  title: string;
  message: string;
  media_type?: MediaType;
  media_url?: string;
  media_metadata?: MediaMetadata;
  action_url?: string;
  action_label?: string;
  target_type: TargetType;
  target_group_id?: string;
  target_tier?: string;
  target_user_ids?: string[];
  scheduled_for?: string;
  expires_at?: string;
  display_mode?: DisplayMode;
  priority?: BroadcastPriority;
  dismissible?: boolean;
  require_acknowledgment?: boolean;
}

export interface UpdateBroadcastInput extends Partial<CreateBroadcastInput> {
  id: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  is_dynamic?: boolean;
  dynamic_filter?: DynamicGroupFilter;
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  id: string;
}

export interface AddGroupMembersInput {
  group_id: string;
  user_ids: string[];
}

export interface UpdatePreferencesInput {
  broadcast_consent?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  in_app_enabled?: boolean;
  push_enabled?: boolean;
  email_digest_enabled?: boolean;
}

// -----------------------------------------------------------------------------
// Context Types
// -----------------------------------------------------------------------------

export interface BroadcastNotificationContextType {
  // State
  pendingNotifications: PendingBroadcast[];
  currentNotification: PendingBroadcast | null;
  unreadCount: number;
  isLoading: boolean;

  // Actions
  refreshNotifications: () => Promise<void>;
  dismissNotification: (broadcastId: string) => Promise<void>;
  acknowledgeNotification: (broadcastId: string) => Promise<void>;
  markAsRead: (broadcastId: string) => Promise<void>;
}

// -----------------------------------------------------------------------------
// Admin Permission Types
// -----------------------------------------------------------------------------

export interface NotificationPermissions {
  read: boolean;
  create: boolean;
  send_group: boolean;
  send_global: boolean;
  approve: boolean;
  manage_groups: boolean;
}

// Helper function to get permissions by tier
export function getNotificationPermissions(tier: string): NotificationPermissions {
  switch (tier) {
    case 'owner':
    case 'super_admin':
      return {
        read: true,
        create: true,
        send_group: true,
        send_global: true,
        approve: true,
        manage_groups: true,
      };
    case 'admin':
      return {
        read: true,
        create: true,
        send_group: true,
        send_global: true, // Requires approval
        approve: false,
        manage_groups: true,
      };
    case 'coach':
      return {
        read: true,
        create: true,
        send_group: true,
        send_global: false,
        approve: false,
        manage_groups: false,
      };
    default:
      return {
        read: false,
        create: false,
        send_group: false,
        send_global: false,
        approve: false,
        manage_groups: false,
      };
  }
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export interface BroadcastWithCreator extends NotificationBroadcast {
  creator_email?: string;
  creator_name?: string;
  approver_email?: string;
  approver_name?: string;
}

export interface GroupWithMembers extends UserNotificationGroup {
  members: GroupMember[];
}

// Priority configuration for UI
export const PRIORITY_CONFIG: Record<
  BroadcastPriority,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500/30',
    icon: 'AlertTriangle',
  },
  high: {
    label: 'High',
    color: 'text-mi-gold',
    bgColor: 'bg-amber-50',
    borderColor: 'border-mi-gold/30',
    icon: 'AlertCircle',
  },
  normal: {
    label: 'Normal',
    color: 'text-mi-cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-mi-cyan/20',
    icon: 'Bell',
  },
  low: {
    label: 'Low',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: 'Info',
  },
};

// Status configuration for UI
export const STATUS_CONFIG: Record<
  BroadcastStatus,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending_approval: { label: 'Pending Approval', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  sending: { label: 'Sending...', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  sent: { label: 'Sent', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// URL allowlist for validation
export const ALLOWED_DOMAINS = [
  'purposewaze.com',
  'mindinsurance.io',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'loom.com',
  'calendly.com',
  'typeform.com',
];

// Validate URL against allowlist
export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
