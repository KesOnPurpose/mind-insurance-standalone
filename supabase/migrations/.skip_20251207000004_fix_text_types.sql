-- Fix return types - use TEXT for all string columns for maximum compatibility

DROP FUNCTION IF EXISTS get_group_users_at_milestone(TEXT, JSONB, INTEGER[]);
DROP FUNCTION IF EXISTS get_group_users_immediate(TEXT, JSONB);
DROP FUNCTION IF EXISTS resolve_target_users_direct(TEXT, JSONB, TEXT, INTEGER[]);

-- ============================================================================
-- SECTION 1: Create group milestone function with TEXT return types
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_users_at_milestone(
  p_target_type TEXT,
  p_target_config JSONB,
  p_milestone_days INTEGER[] DEFAULT ARRAY[7, 14, 21, 28]
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH base_users AS (
    SELECT (jsonb_array_elements_text(p_target_config->'user_ids'))::UUID AS uid
    WHERE p_target_type = 'individual'

    UNION ALL

    SELECT ugm.user_id AS uid
    FROM mio_user_group_members ugm
    WHERE p_target_type = 'custom_group'
      AND ugm.group_id = (p_target_config->>'group_id')::UUID

    UNION ALL

    SELECT ragu.user_id AS uid
    FROM resolve_auto_group_users(p_target_config) ragu
    WHERE p_target_type = 'auto_group'

    UNION ALL

    SELECT up.id AS uid
    FROM user_profiles up
    WHERE p_target_type = 'all'
      AND up.deleted_at IS NULL
  ),
  users_with_journey AS (
    SELECT
      bu.uid,
      up.email::TEXT AS email,
      up.full_name::TEXT AS full_name,
      COALESCE(
        (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
        1
      ) AS calc_journey_day,
      COALESCE(up.challenge_start_date, up.created_at::DATE) AS calc_journey_start,
      (up.collision_patterns->>'primary_pattern')::TEXT AS coll_pattern,
      up.temperament::TEXT AS temperament,
      COALESCE(up.current_journey_week,
        CEIL(COALESCE(
          (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
          1
        )::DECIMAL / 7)::INTEGER
      ) AS calc_week
    FROM base_users bu
    JOIN user_profiles up ON up.id = bu.uid
    WHERE up.deleted_at IS NULL
  ),
  at_milestone AS (
    SELECT *
    FROM users_with_journey uwj
    WHERE uwj.calc_journey_day = ANY(p_milestone_days)
  ),
  without_active_protocol AS (
    SELECT am.*
    FROM at_milestone am
    WHERE NOT EXISTS (
      SELECT 1 FROM mio_weekly_protocols mwp
      WHERE mwp.user_id = am.uid
      AND mwp.status = 'active'
      AND mwp.week_number = am.calc_week
      AND mwp.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    )
  )
  SELECT
    wap.uid,
    wap.email,
    wap.full_name,
    wap.calc_journey_day,
    wap.calc_journey_start,
    wap.coll_pattern,
    wap.temperament,
    wap.calc_week
  FROM without_active_protocol wap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: Create immediate mode function with TEXT return types
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_users_immediate(
  p_target_type TEXT,
  p_target_config JSONB
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH base_users AS (
    SELECT (jsonb_array_elements_text(p_target_config->'user_ids'))::UUID AS uid
    WHERE p_target_type = 'individual'

    UNION ALL

    SELECT ugm.user_id AS uid
    FROM mio_user_group_members ugm
    WHERE p_target_type = 'custom_group'
      AND ugm.group_id = (p_target_config->>'group_id')::UUID

    UNION ALL

    SELECT ragu.user_id AS uid
    FROM resolve_auto_group_users(p_target_config) ragu
    WHERE p_target_type = 'auto_group'

    UNION ALL

    SELECT up.id AS uid
    FROM user_profiles up
    WHERE p_target_type = 'all'
      AND up.deleted_at IS NULL
  )
  SELECT
    up.id,
    up.email::TEXT,
    up.full_name::TEXT,
    COALESCE(
      (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
      1
    ) AS journey_day,
    COALESCE(up.challenge_start_date, up.created_at::DATE) AS journey_start,
    (up.collision_patterns->>'primary_pattern')::TEXT AS collision_pattern,
    up.temperament::TEXT,
    COALESCE(up.current_journey_week,
      CEIL(COALESCE(
        (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
        1
      )::DECIMAL / 7)::INTEGER
    ) AS current_week
  FROM base_users bu
  JOIN user_profiles up ON up.id = bu.uid
  WHERE up.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: Create unified resolution function with TEXT return types
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_target_users_direct(
  p_target_type TEXT,
  p_target_config JSONB,
  p_journey_mode TEXT DEFAULT 'immediate',
  p_milestone_days INTEGER[] DEFAULT ARRAY[7, 14, 21, 28]
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  IF p_journey_mode = 'milestone' THEN
    RETURN QUERY
    SELECT * FROM get_group_users_at_milestone(p_target_type, p_target_config, p_milestone_days);
  ELSE
    RETURN QUERY
    SELECT * FROM get_group_users_immediate(p_target_type, p_target_config);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_group_users_at_milestone(TEXT, JSONB, INTEGER[]) TO service_role;
GRANT EXECUTE ON FUNCTION get_group_users_immediate(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_target_users_direct(TEXT, JSONB, TEXT, INTEGER[]) TO service_role;
