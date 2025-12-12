/**
 * MIO Workflow Update: Prepare Analysis Payload
 * Node: "Prepare Analysis Payload"
 *
 * Changes:
 * 1. Format conversation context for better prompt injection
 * 2. Extract themes from conversations
 * 3. Add transformation gap from assessments
 */

// Prepare analysis payload using comprehensive get_user_mio_context data
const mioContextRow = $('Fetch User MIO Context').first().json;
const userFromResolution = $input.first().json;

// Parse the comprehensive context (it's a JSONB returned as mio_context column)
let context;
try {
  context = typeof mioContextRow.mio_context === 'string'
    ? JSON.parse(mioContextRow.mio_context)
    : mioContextRow.mio_context;
} catch (e) {
  context = mioContextRow.mio_context || {};
}

// Extract key data from comprehensive context
const profile = context.profile || {};
const journey = context.journey || {};
const practices = context.practices || [];
const streaks = context.streaks || {};
const assessments = context.assessments || {};
const conversations = context.conversations || {};
const previousProtocols = context.previous_protocols || [];

// ============================================================================
// NEW: Format conversation context for AI prompt injection
// ============================================================================
function formatConversationContext(conversations) {
  const mioChats = (conversations.mio || []).slice(0, 5).map(c => ({
    user_said: c.user_message,
    mio_said: (c.agent_response || '').substring(0, 200),
    date: c.created_at,
    detected_intent: c.detected_intent
  }));

  const netteChats = (conversations.nette || []).slice(0, 5).map(c => ({
    user_said: c.user_message,
    nette_said: (c.agent_response || '').substring(0, 200),
    date: c.created_at
  }));

  const agentChats = (conversations.agents || []).slice(0, 10).map(c => ({
    agent_type: c.agent_type,
    user_said: c.user_message,
    agent_said: (c.agent_response || '').substring(0, 200),
    date: c.created_at
  }));

  // Extract themes from user messages
  const allUserMessages = [
    ...mioChats.map(c => c.user_said),
    ...netteChats.map(c => c.user_said),
    ...agentChats.map(c => c.user_said)
  ].filter(Boolean);

  const themes = extractThemes(allUserMessages);

  return {
    mio_chats: mioChats,
    nette_chats: netteChats,
    agent_chats: agentChats,
    themes_discussed: themes,
    total_conversations: mioChats.length + netteChats.length + agentChats.length
  };
}

// Extract themes from user messages for pattern matching
function extractThemes(messages) {
  const themes = new Set();
  const themeKeywords = {
    'finances': ['money', 'finances', 'income', 'revenue', 'wealth', 'bills', 'budget'],
    'relationships': ['wife', 'husband', 'partner', 'kids', 'family', 'relationship', 'marriage'],
    'business': ['business', 'work', 'clients', 'customers', 'revenue', 'sales', 'team'],
    'leadership': ['team', 'lead', 'manage', 'delegate', 'staff', 'employee'],
    'time_management': ['overwhelmed', 'time', 'busy', 'too much', 'scattered', 'priorities'],
    'decision_making': ['decision', 'choice', 'uncertain', 'confused', 'direction', 'clarity'],
    'confidence': ['confidence', 'fear', 'doubt', 'imposter', 'worthy', 'enough'],
    'habits': ['habit', 'routine', 'consistency', 'discipline', 'procrastination'],
    'health': ['health', 'energy', 'sleep', 'exercise', 'stress', 'burnout']
  };

  const allText = messages.join(' ').toLowerCase();

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      themes.add(theme);
    }
  }

  return Array.from(themes);
}

// Format conversation context
const conversationContext = formatConversationContext(conversations);

// ============================================================================
// Build the analysis payload with all available data
// ============================================================================
return [{
  json: {
    // User identification
    user_id: profile.id || userFromResolution.user_id,
    email: profile.email || userFromResolution.email,
    full_name: profile.full_name || userFromResolution.full_name,

    // Journey context (from resolution or profile)
    journey_day: userFromResolution.journey_day || journey.current_day || 1,
    journey_start: userFromResolution.journey_start || journey.start_date,
    current_week: userFromResolution.current_week || journey.current_week || 1,

    // Pattern identification
    collision_pattern: userFromResolution.collision_pattern ||
                       assessments.partner_matching?.collision_pattern ||
                       profile.collision_patterns?.primary_pattern || 'unknown',
    temperament: userFromResolution.temperament ||
                 assessments.partner_matching?.temperament ||
                 profile.temperament || 'unknown',

    // Practice data (last 30 days)
    daily_practices: practices,
    practice_count: practices.length,

    // Streak information
    current_streak: streaks.current_streak || 0,
    longest_streak: streaks.longest_streak || 0,
    last_practice_date: streaks.last_practice_date,

    // Assessment data
    partner_matching: assessments.partner_matching || {},
    weekly_scores: assessments.weekly_scores || [],
    avatar_assessment: assessments.avatar || {},
    transformation_gap: assessments.partner_matching?.transformation_gap || '',
    biggest_challenge: assessments.partner_matching?.biggest_challenge || '',

    // NEW: Formatted conversation context
    conversation_context: conversationContext,
    themes_discussed: conversationContext.themes_discussed,

    // Previous protocols (to avoid repetition)
    previous_protocols: previousProtocols.slice(0, 3),

    // Full context for deep analysis
    full_context: context
  }
}];
