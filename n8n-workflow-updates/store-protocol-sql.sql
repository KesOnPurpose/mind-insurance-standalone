-- MIO Workflow Update: Store Protocol SQL
-- Node: "Store Protocol" (Supabase node)
--
-- Changes:
-- 1. Added simplified_* columns for user-facing content
-- 2. Added raw_analysis for future AI queries
-- 3. Added conversation_context for audit trail
-- 4. Added transformation_impact_score for prioritization

-- Option 1: Using Supabase Node (Recommended)
-- Configure the Supabase node with these fields:

/*
Table: mio_weekly_protocols
Operation: Insert
Fields to Map:

- user_id: {{ $json.user_id }}
- week_number: {{ $json.week_number }}
- year: {{ $json.year }}
- assigned_week_start: {{ $json.assigned_week_start }}
- title: {{ $json.title }}
- insight_summary: {{ $json.insight_summary }}
- why_it_matters: {{ $json.why_it_matters }}
- neural_principle: {{ $json.neural_principle }}
- breakthrough_question: {{ $json.breakthrough_question }}
- day_tasks: {{ $json.day_tasks_json }}
- collision_pattern: {{ $json.collision_pattern }}
- status: {{ $json.status }}
- current_day: {{ $json.current_day }}
- days_completed: {{ $json.days_completed }}
- days_skipped: {{ $json.days_skipped }}

NEW FIELDS:
- simplified_insight_summary: {{ $json.simplified_insight_summary }}
- simplified_why_it_matters: {{ $json.simplified_why_it_matters }}
- simplified_neural_principle: {{ $json.simplified_neural_principle }}
- simplified_day_tasks: {{ $json.simplified_day_tasks_json }}
- raw_analysis: {{ $json.raw_analysis_json }}
- conversation_context: {{ $json.conversation_context_json }}
- transformation_impact_score: {{ $json.transformation_impact_score }}
*/


-- Option 2: Using Raw SQL (If using Execute Query node)
-- Note: Use this if the Supabase node doesn't support all JSONB columns

INSERT INTO mio_weekly_protocols (
  user_id,
  week_number,
  year,
  assigned_week_start,
  title,
  insight_summary,
  why_it_matters,
  neural_principle,
  breakthrough_question,
  day_tasks,
  collision_pattern,
  status,
  current_day,
  days_completed,
  days_skipped,
  -- NEW COLUMNS
  simplified_insight_summary,
  simplified_why_it_matters,
  simplified_neural_principle,
  simplified_day_tasks,
  raw_analysis,
  conversation_context,
  transformation_impact_score
) VALUES (
  '{{ $json.user_id }}'::uuid,
  {{ $json.week_number }},
  {{ $json.year }},
  '{{ $json.assigned_week_start }}'::date,
  '{{ $json.title }}',
  '{{ $json.insight_summary }}',
  '{{ $json.why_it_matters }}',
  '{{ $json.neural_principle }}',
  '{{ $json.breakthrough_question }}',
  '{{ $json.day_tasks_json }}'::jsonb,
  '{{ $json.collision_pattern }}',
  '{{ $json.status }}',
  {{ $json.current_day }},
  {{ $json.days_completed }},
  {{ $json.days_skipped }},
  -- NEW VALUES
  {{ $json.simplified_insight_summary ? "'" + $json.simplified_insight_summary + "'" : 'NULL' }},
  {{ $json.simplified_why_it_matters ? "'" + $json.simplified_why_it_matters + "'" : 'NULL' }},
  {{ $json.simplified_neural_principle ? "'" + $json.simplified_neural_principle + "'" : 'NULL' }},
  {{ $json.simplified_day_tasks_json ? "'" + $json.simplified_day_tasks_json + "'::jsonb" : 'NULL' }},
  {{ $json.raw_analysis_json ? "'" + $json.raw_analysis_json + "'::jsonb" : 'NULL' }},
  {{ $json.conversation_context_json ? "'" + $json.conversation_context_json + "'::jsonb" : 'NULL' }},
  {{ $json.transformation_impact_score || 0 }}
)
ON CONFLICT (user_id, week_number, year)
DO UPDATE SET
  title = EXCLUDED.title,
  insight_summary = EXCLUDED.insight_summary,
  why_it_matters = EXCLUDED.why_it_matters,
  neural_principle = EXCLUDED.neural_principle,
  breakthrough_question = EXCLUDED.breakthrough_question,
  day_tasks = EXCLUDED.day_tasks,
  collision_pattern = EXCLUDED.collision_pattern,
  -- NEW UPDATES
  simplified_insight_summary = EXCLUDED.simplified_insight_summary,
  simplified_why_it_matters = EXCLUDED.simplified_why_it_matters,
  simplified_neural_principle = EXCLUDED.simplified_neural_principle,
  simplified_day_tasks = EXCLUDED.simplified_day_tasks,
  raw_analysis = EXCLUDED.raw_analysis,
  conversation_context = EXCLUDED.conversation_context,
  transformation_impact_score = EXCLUDED.transformation_impact_score,
  updated_at = NOW()
RETURNING id, user_id, week_number, year, title, transformation_impact_score;


-- Option 3: Using HTTP Request Node to Supabase REST API
-- Endpoint: POST https://hpyodaugrkctagkrfofj.supabase.co/rest/v1/mio_weekly_protocols
-- Headers:
--   apikey: {{ $env.SUPABASE_SERVICE_KEY }}
--   Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
--   Content-Type: application/json
--   Prefer: resolution=merge-duplicates,return=representation

/*
Body (JSON):
{
  "user_id": "{{ $json.user_id }}",
  "week_number": {{ $json.week_number }},
  "year": {{ $json.year }},
  "assigned_week_start": "{{ $json.assigned_week_start }}",
  "title": "{{ $json.title }}",
  "insight_summary": "{{ $json.insight_summary }}",
  "why_it_matters": "{{ $json.why_it_matters }}",
  "neural_principle": "{{ $json.neural_principle }}",
  "breakthrough_question": "{{ $json.breakthrough_question }}",
  "day_tasks": {{ $json.day_tasks_json }},
  "collision_pattern": "{{ $json.collision_pattern }}",
  "status": "{{ $json.status }}",
  "current_day": {{ $json.current_day }},
  "days_completed": {{ $json.days_completed }},
  "days_skipped": {{ $json.days_skipped }},
  "simplified_insight_summary": {{ $json.simplified_insight_summary ? '"' + $json.simplified_insight_summary + '"' : null }},
  "simplified_why_it_matters": {{ $json.simplified_why_it_matters ? '"' + $json.simplified_why_it_matters + '"' : null }},
  "simplified_neural_principle": {{ $json.simplified_neural_principle ? '"' + $json.simplified_neural_principle + '"' : null }},
  "simplified_day_tasks": {{ $json.simplified_day_tasks_json || null }},
  "raw_analysis": {{ $json.raw_analysis_json || null }},
  "conversation_context": {{ $json.conversation_context_json || null }},
  "transformation_impact_score": {{ $json.transformation_impact_score || 0 }}
}
*/


-- Verification Query (run manually to check data)
SELECT
  id,
  user_id,
  week_number,
  year,
  title,
  transformation_impact_score,
  CASE WHEN simplified_insight_summary IS NOT NULL THEN 'Yes' ELSE 'No' END as has_simplified,
  CASE WHEN raw_analysis IS NOT NULL THEN 'Yes' ELSE 'No' END as has_raw_analysis,
  created_at
FROM mio_weekly_protocols
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;
