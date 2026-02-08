/**
 * RIE Phase 1B: Relationship User Profile Types
 * Extended profile — love languages, attachment styles, communication prefs.
 *
 * Maps to: relationship_user_profiles
 */

// ============================================================================
// Enums & Literal Types
// ============================================================================

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export type CommunicationStyle = 'direct' | 'diplomatic' | 'analytical' | 'expressive';

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

export type RelationshipType =
  | 'dating' | 'engaged' | 'married' | 'domestic_partnership' | 'other';

export type PartnerResistanceType =
  | 'tech_averse' | 'emotionally_guarded' | 'too_busy'
  | 'skeptical' | 'controlling' | 'codependent'
  | 'avoidant_attachment' | 'culturally_resistant';

// ============================================================================
// Love Language
// ============================================================================

export type LoveLanguageName =
  | 'words_of_affirmation'
  | 'acts_of_service'
  | 'receiving_gifts'
  | 'quality_time'
  | 'physical_touch';

export interface LoveLanguageRanking {
  language: LoveLanguageName;
  rank: number; // 1 = primary, 5 = least
}

export const LOVE_LANGUAGE_LABELS: Record<LoveLanguageName, string> = {
  words_of_affirmation: 'Words of Affirmation',
  acts_of_service: 'Acts of Service',
  receiving_gifts: 'Receiving Gifts',
  quality_time: 'Quality Time',
  physical_touch: 'Physical Touch',
};

// ============================================================================
// Attachment Style Metadata
// ============================================================================

export interface AttachmentStyleDefinition {
  style: AttachmentStyle;
  label: string;
  description: string;
}

export const ATTACHMENT_STYLES: AttachmentStyleDefinition[] = [
  {
    style: 'secure',
    label: 'Secure',
    description: 'Comfortable with intimacy and independence.',
  },
  {
    style: 'anxious',
    label: 'Anxious',
    description: 'Craves closeness; may worry about partner\'s commitment.',
  },
  {
    style: 'avoidant',
    label: 'Avoidant',
    description: 'Values independence; may pull away when things get close.',
  },
  {
    style: 'disorganized',
    label: 'Disorganized',
    description: 'Mixed signals — wants closeness but fears it.',
  },
];

// ============================================================================
// Partner Resistance Metadata
// ============================================================================

export interface ResistanceTypeDefinition {
  type: PartnerResistanceType;
  label: string;
  description: string;
}

export const RESISTANCE_TYPES: ResistanceTypeDefinition[] = [
  { type: 'tech_averse', label: 'Tech Averse', description: 'Partner resists using apps or technology.' },
  { type: 'emotionally_guarded', label: 'Emotionally Guarded', description: 'Partner avoids emotional conversations.' },
  { type: 'too_busy', label: 'Too Busy', description: 'Partner claims they don\'t have time.' },
  { type: 'skeptical', label: 'Skeptical', description: 'Partner doesn\'t believe in relationship tools.' },
  { type: 'controlling', label: 'Controlling', description: 'Partner may feel threatened by self-improvement.' },
  { type: 'codependent', label: 'Codependent', description: 'Partner is enmeshed and resists individual growth.' },
  { type: 'avoidant_attachment', label: 'Avoidant Attachment', description: 'Partner withdraws when pressed for closeness.' },
  { type: 'culturally_resistant', label: 'Culturally Resistant', description: 'Cultural norms make participation difficult.' },
];

// ============================================================================
// Table: relationship_user_profiles
// ============================================================================

export interface RelationshipUserProfile {
  id: string;
  user_id: string;
  love_languages: LoveLanguageRanking[];
  attachment_style: AttachmentStyle | null;
  communication_style: CommunicationStyle | null;
  preferred_check_in_day: DayOfWeek;
  preferred_check_in_time: string; // HH:MM format
  relationship_goals: string[];
  relationship_start_date: string | null;
  relationship_type: RelationshipType;
  partner_resistance_type: PartnerResistanceType | null;
  solo_stage: number | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipUserProfileInsert {
  love_languages?: LoveLanguageRanking[];
  attachment_style?: AttachmentStyle | null;
  communication_style?: CommunicationStyle | null;
  preferred_check_in_day?: DayOfWeek;
  preferred_check_in_time?: string;
  relationship_goals?: string[];
  relationship_start_date?: string | null;
  relationship_type?: RelationshipType;
  partner_resistance_type?: PartnerResistanceType | null;
  solo_stage?: number | null;
}

export interface RelationshipUserProfileUpdate {
  love_languages?: LoveLanguageRanking[];
  attachment_style?: AttachmentStyle | null;
  communication_style?: CommunicationStyle | null;
  preferred_check_in_day?: DayOfWeek;
  preferred_check_in_time?: string;
  relationship_goals?: string[];
  relationship_start_date?: string | null;
  relationship_type?: RelationshipType;
  partner_resistance_type?: PartnerResistanceType | null;
  solo_stage?: number | null;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
}
