// ============================================================================
// LOOKUP USER BY PHONE - Voice AI User Identification
// ============================================================================
// Called by Voice AI when caller provides their phone number.
// Looks up user by phone, returns context for personalized conversation.
//
// This is the RELIABLE identification method:
// 1. Voice AI asks: "What's the phone number you signed up with?"
// 2. Caller says: "347-283-4717"
// 3. Voice AI triggers this action (phone number mentioned = trigger)
// 4. We look up user by phone, return greeting + context
// 5. Voice AI continues with personalized conversation
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface LookupRequest {
  // The phone number provided by the caller
  phone: string;
  // Optional: GHL contact ID of the "Guest Visitor" to link later
  ghl_contact_id?: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  timezone: string | null;
  tier_level: string | null;
  current_journey_day: number | null;
  current_journey_week: number | null;
  challenge_start_date: string | null;
}

interface LookupResponse {
  success: boolean;
  identity_matched: boolean;
  greeting_hint?: string;
  context_for_agent?: string;
  user_data?: {
    user_id: string;
    full_name: string | null;
    first_name: string | null;
    email: string | null;
    tier_level: string | null;
    journey_day: number;
    journey_week: number;
    verified_phone: string;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Word to digit mapping for spoken phone numbers from Voice AI
 */
const WORD_TO_DIGIT: Record<string, string> = {
  'zero': '0', 'oh': '0', 'o': '0',
  'one': '1',
  'two': '2', 'to': '2', 'too': '2',
  'three': '3',
  'four': '4', 'for': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',
  'niner': '9', // Military/aviation
};

/**
 * Convert spoken words to digits
 * Examples:
 *   "three four seven" -> "347"
 *   "three four seven two eight three four seven one seven" -> "3472834717"
 *   "Three four seven two eight three. Four seven one seven." -> "3472834717"
 */
function wordsToDigits(input: string): string {
  // Split on whitespace, hyphens, commas, periods, and other punctuation
  const words = input.toLowerCase().split(/[\s,.\-;:!?]+/).filter(w => w.length > 0);
  let result = '';

  for (const rawWord of words) {
    // Strip any remaining punctuation from the word
    const word = rawWord.replace(/[^a-z0-9]/g, '');

    if (!word) continue;

    // Check if it's a word that maps to a digit
    if (WORD_TO_DIGIT[word]) {
      result += WORD_TO_DIGIT[word];
    }
    // Check if it's already a digit
    else if (/^\d$/.test(word)) {
      result += word;
    }
    // Check if it's a multi-digit number (like "47" or "347")
    else if (/^\d+$/.test(word)) {
      result += word;
    }
    // Skip non-digit, non-word-digit content (like "and", "um", etc.)
  }

  return result;
}

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 * Handles:
 *   - Digits with formatting: "347-283-4717", "(347) 283-4717"
 *   - E.164 format: "+13472834717"
 *   - 10/11 digit: "3472834717", "13472834717"
 *   - Spoken words: "three four seven two eight three four seven one seven"
 */
function normalizePhone(phone: string): string {
  // First, try to extract digits directly
  let digits = phone.replace(/\D/g, '');

  // If we got less than 10 digits, try word-to-digit conversion
  // (Voice AI might pass spoken numbers)
  if (digits.length < 10) {
    const convertedDigits = wordsToDigits(phone);
    if (convertedDigits.length >= 10) {
      digits = convertedDigits;
      console.log('[Lookup By Phone] Converted spoken words to digits:', phone, '->', digits);
    }
  }

  // Handle different formats
  if (digits.length === 10) {
    // US number without country code
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code but no +
    return `+${digits}`;
  } else if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }

  // Return with + if not already there
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Calculate journey day from start date
 */
function calculateJourneyDay(startDate: string | null): number {
  if (!startDate) return 1;

  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

/**
 * Build context summary for Voice AI agent
 */
function buildContextForAgent(
  profile: UserProfile,
  journeyDay: number,
  journeyWeek: number
): string {
  const parts: string[] = [];

  if (profile.full_name) {
    parts.push(`Name: ${profile.full_name}`);
  }

  parts.push(`Journey: Day ${journeyDay}, Week ${journeyWeek}`);

  if (profile.tier_level) {
    parts.push(`Tier: ${profile.tier_level}`);
  }

  return parts.join('. ');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Lookup By Phone] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          identity_matched: false,
          error: 'Database not configured'
        } satisfies LookupResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          identity_matched: false,
          error: 'Method not allowed. Use POST.'
        } satisfies LookupResponse),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: LookupRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          identity_matched: false,
          error: 'Invalid JSON body. Provide { "phone": "+1XXXXXXXXXX" }'
        } satisfies LookupResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.phone) {
      return new Response(
        JSON.stringify({
          success: false,
          identity_matched: false,
          error: 'Phone number is required'
        } satisfies LookupResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the phone number
    const normalizedPhone = normalizePhone(body.phone);
    console.log('[Lookup By Phone] Searching for:', normalizedPhone);

    // Look up user by verified phone in user_profiles
    const { data: profile, error: queryError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, timezone, tier_level, current_journey_day, current_journey_week, challenge_start_date')
      .eq('verified_phone', normalizedPhone)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        // No user found with this phone
        console.log('[Lookup By Phone] No user found for phone:', normalizedPhone);
        return new Response(
          JSON.stringify({
            success: true,
            identity_matched: false,
            error: 'No user found with this phone number'
          } satisfies LookupResponse),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('[Lookup By Phone] Query error:', queryError);
      return new Response(
        JSON.stringify({
          success: false,
          identity_matched: false,
          error: `Database error: ${queryError.message}`
        } satisfies LookupResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use journey metrics from profile or calculate from start date
    const journeyDay = profile.current_journey_day || calculateJourneyDay(profile.challenge_start_date);
    const journeyWeek = profile.current_journey_week || Math.ceil(journeyDay / 7);

    // Build greeting
    const firstName = profile.full_name?.split(' ')[0] || null;
    const greetingHint = firstName
      ? `${firstName}! Great, I found you in our system.`
      : `Great, I found you in our system.`;

    // Build context summary for agent
    const contextForAgent = buildContextForAgent(profile, journeyDay, journeyWeek);

    console.log('[Lookup By Phone] User found:', {
      user_id: profile.id,
      full_name: profile.full_name,
      tier_level: profile.tier_level,
      journey_day: journeyDay
    });

    // Return success with user data
    const response: LookupResponse = {
      success: true,
      identity_matched: true,
      greeting_hint: greetingHint,
      context_for_agent: contextForAgent,
      user_data: {
        user_id: profile.id,
        full_name: profile.full_name,
        first_name: firstName,
        email: profile.email,
        tier_level: profile.tier_level,
        journey_day: journeyDay,
        journey_week: journeyWeek,
        verified_phone: normalizedPhone
      }
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Lookup By Phone] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        identity_matched: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } satisfies LookupResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
