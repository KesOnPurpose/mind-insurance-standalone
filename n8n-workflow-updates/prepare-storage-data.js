/**
 * MIO Workflow Update: Prepare Storage Data
 * Node: "Prepare Storage Data"
 *
 * Changes:
 * 1. Parse both full_version and simplified_version from Claude response
 * 2. Extract raw_analysis for future AI queries
 * 3. Include conversation_context that influenced the insight
 * 4. Store transformation_impact_score
 */

// Get data from previous nodes
const analysisData = $('Parse Analysis Results').first().json;
const protocolData = $('Parse Protocol Results').first().json;
const userData = $('Prepare Analysis Payload').first().json;

// Parse the protocol response (handles both string and object)
let protocol;
try {
  protocol = typeof protocolData.response === 'string'
    ? JSON.parse(protocolData.response)
    : protocolData.response || protocolData;
} catch (e) {
  // Fallback: try to extract JSON from markdown code blocks
  const jsonMatch = (protocolData.response || '').match(/```json?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    protocol = JSON.parse(jsonMatch[1]);
  } else {
    protocol = protocolData;
  }
}

// Extract full and simplified versions
const fullVersion = protocol.full_version || protocol;
const simplifiedVersion = protocol.simplified_version || null;
const metadata = protocol.metadata || {};

// Calculate week number and year
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 1);
const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
const year = now.getFullYear();

// Calculate assigned week start (Monday of current week)
const dayOfWeek = now.getDay();
const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const assignedWeekStart = new Date(now);
assignedWeekStart.setDate(now.getDate() + mondayOffset);
assignedWeekStart.setHours(0, 0, 0, 0);

// Build raw_analysis for future queries
const rawAnalysis = {
  triggered_capabilities: analysisData.triggered_capabilities || [],
  full_insight: analysisData.selected_insight || {},
  pattern_context: {
    primary_pattern: analysisData.primary_pattern,
    pattern_frequency: analysisData.pattern_frequency,
    collision_pattern: userData.collision_pattern,
    temperament: userData.temperament
  },
  capability_scores: (analysisData.triggered_capabilities || [])
    .filter(c => c.triggered)
    .map(c => ({
      capability: c.capability_number,
      name: c.name,
      score: c.score,
      finding: c.finding
    })),
  metadata: metadata
};

// Build conversation_context for reference
const conversationContext = {
  mio_chats: (userData.conversation_context?.mio_chats || []).slice(0, 3),
  nette_chats: (userData.conversation_context?.nette_chats || []).slice(0, 3),
  themes_discussed: userData.themes_discussed || [],
  total_conversations: userData.conversation_context?.total_conversations || 0,
  influenced_insight: metadata.conversation_themes_incorporated || []
};

// Prepare the storage payload
return [{
  json: {
    // User identification
    user_id: userData.user_id,

    // Protocol timing
    week_number: weekNumber,
    year: year,
    assigned_week_start: assignedWeekStart.toISOString().split('T')[0],

    // Full version fields (existing schema)
    title: fullVersion.title || 'Your Weekly MIO Insight',
    insight_summary: fullVersion.insight_summary || '',
    why_it_matters: fullVersion.why_it_matters || '',
    neural_principle: fullVersion.neural_principle || '',
    breakthrough_question: fullVersion.breakthrough_question || '',
    day_tasks: fullVersion.day_tasks || [],
    day_tasks_json: JSON.stringify(fullVersion.day_tasks || []),

    // NEW: Simplified version fields
    simplified_insight_summary: simplifiedVersion?.insight_summary || null,
    simplified_why_it_matters: simplifiedVersion?.why_it_matters || null,
    simplified_neural_principle: simplifiedVersion?.neural_principle || null,
    simplified_day_tasks: simplifiedVersion?.day_tasks || null,
    simplified_day_tasks_json: JSON.stringify(simplifiedVersion?.day_tasks || null),

    // NEW: Raw analysis for future queries
    raw_analysis: rawAnalysis,
    raw_analysis_json: JSON.stringify(rawAnalysis),

    // NEW: Conversation context
    conversation_context: conversationContext,
    conversation_context_json: JSON.stringify(conversationContext),

    // NEW: Transformation impact score
    transformation_impact_score: analysisData.selected_insight?.transformation_impact_score ||
                                  metadata.transformation_impact_score ||
                                  0,

    // Pattern identification
    collision_pattern: userData.collision_pattern || metadata.pattern_addressed || 'unknown',

    // Status
    status: 'active',
    current_day: 1,
    days_completed: 0,
    days_skipped: 0,

    // Metadata for debugging/tracking
    generation_metadata: {
      analysis_confidence: analysisData.selected_insight?.confidence || 0,
      triggered_capability_count: (analysisData.triggered_capabilities || []).filter(c => c.triggered).length,
      rag_chunks_used: metadata.rag_chunks_used || [],
      journey_day: userData.journey_day,
      current_streak: userData.current_streak,
      generated_at: new Date().toISOString()
    }
  }
}];
