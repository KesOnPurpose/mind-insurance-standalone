-- Migration: Fix Coach Protocol V2 Visibility RLS Policies
-- Date: 2025-12-11
-- Purpose: Fix tier-based and custom-group visibility that currently always returns TRUE

-- ============================================
-- FIX 1: coach_protocols_v2 SELECT policy
-- ============================================

-- Drop existing broken policy
DROP POLICY IF EXISTS "Users can view published protocols they have access to" ON coach_protocols_v2;

-- Create fixed policy with proper visibility checks
CREATE POLICY "Users can view published protocols they have access to" ON coach_protocols_v2
FOR SELECT TO authenticated
USING (
  status = 'published'
  AND (
    -- All users visibility
    visibility = 'all_users'

    -- Individual assignment: user ID in visibility_config.user_ids
    OR (
      visibility = 'individual'
      AND auth.uid()::text = ANY(
        ARRAY(SELECT jsonb_array_elements_text(visibility_config->'user_ids'))
      )
    )

    -- Tier-based: user's tier_level matches one of the configured tiers
    OR (
      visibility = 'tier_based'
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.tier_level::text = ANY(
          ARRAY(SELECT jsonb_array_elements_text(visibility_config->'tiers'))
        )
      )
    )

    -- Custom group: user is member of one of the configured groups
    OR (
      visibility = 'custom_group'
      AND EXISTS (
        SELECT 1 FROM mio_user_group_members gm
        WHERE gm.user_id = auth.uid()
        AND gm.group_id::text = ANY(
          ARRAY(SELECT jsonb_array_elements_text(visibility_config->'group_ids'))
        )
      )
    )
  )
);

-- ============================================
-- FIX 2: coach_protocol_tasks_v2 SELECT policy
-- ============================================

-- Drop existing broken policy
DROP POLICY IF EXISTS "Users can view tasks for accessible protocols" ON coach_protocol_tasks_v2;

-- Create fixed policy
CREATE POLICY "Users can view tasks for accessible protocols" ON coach_protocol_tasks_v2
FOR SELECT TO authenticated
USING (
  protocol_id IN (
    SELECT cp.id FROM coach_protocols_v2 cp
    WHERE
      cp.status = 'published'
      AND (
        -- All users visibility
        cp.visibility = 'all_users'

        -- Individual assignment
        OR (
          cp.visibility = 'individual'
          AND auth.uid()::text = ANY(
            ARRAY(SELECT jsonb_array_elements_text(cp.visibility_config->'user_ids'))
          )
        )

        -- Tier-based: Check user's tier
        OR (
          cp.visibility = 'tier_based'
          AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.tier_level::text = ANY(
              ARRAY(SELECT jsonb_array_elements_text(cp.visibility_config->'tiers'))
            )
          )
        )

        -- Custom group: Check group membership
        OR (
          cp.visibility = 'custom_group'
          AND EXISTS (
            SELECT 1 FROM mio_user_group_members gm
            WHERE gm.user_id = auth.uid()
            AND gm.group_id::text = ANY(
              ARRAY(SELECT jsonb_array_elements_text(cp.visibility_config->'group_ids'))
            )
          )
        )
      )
  )
  -- Also allow if user has an active assignment to this protocol
  OR protocol_id IN (
    SELECT uca.protocol_id
    FROM user_coach_protocol_assignments uca
    WHERE uca.user_id = auth.uid()
    AND uca.status IN ('active', 'paused')
  )
);

-- ============================================
-- VERIFICATION: Add comments for documentation
-- ============================================

COMMENT ON POLICY "Users can view published protocols they have access to" ON coach_protocols_v2 IS
'Fixed 2025-12-11: Properly checks tier_level and group membership instead of always returning TRUE';

COMMENT ON POLICY "Users can view tasks for accessible protocols" ON coach_protocol_tasks_v2 IS
'Fixed 2025-12-11: Properly checks protocol visibility AND allows access for assigned users';
