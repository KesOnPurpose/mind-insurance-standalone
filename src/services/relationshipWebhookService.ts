/**
 * RKPI Module: Webhook Service
 * Triggers N8n workflows for:
 *   - RKPI-012-A: AI insight generation after check-in completion
 *   - RKPI-012-B: Partner invitation delivery (email + SMS via GHL)
 *
 * Webhooks are fire-and-forget (non-blocking) so the UI stays responsive.
 */

const N8N_BASE =
  import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ||
  'https://n8n-n8n.vq00fr.easypanel.host/webhook';

const INSIGHT_WEBHOOK_URL = `${N8N_BASE}/relationship-check-in-insight`;
const PARTNER_INVITE_WEBHOOK_URL = `${N8N_BASE}/relationship-partner-invite`;

// ============================================================================
// TYPES
// ============================================================================

export interface InsightWebhookPayload {
  check_in_id: string;
  user_id: string;
  kpi_scores: { kpi_name: string; score: number; note?: string | null }[];
  overall_score: number;
  trend_data?: {
    previous_scores: number[];
    direction: 'up' | 'down' | 'stable';
  };
  action_items?: { description: string; kpi_name: string }[];
}

export interface PartnerInviteWebhookPayload {
  partnership_id: string;
  partner_email: string;
  partner_phone?: string | null;
  partner_name?: string | null;
  invitation_token: string;
  inviter_name: string;
}

// ============================================================================
// WEBHOOK TRIGGERS
// ============================================================================

/**
 * Trigger the AI insight generation workflow after a check-in is completed.
 * Non-blocking — errors are logged but don't disrupt the user flow.
 */
export async function triggerInsightGeneration(
  payload: InsightWebhookPayload
): Promise<void> {
  try {
    const response = await fetch(INSIGHT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        '[RKPI Webhook] Insight generation failed:',
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error('[RKPI Webhook] Insight generation error:', err);
  }
}

/**
 * Trigger the partner invitation delivery workflow.
 * Non-blocking — errors are logged but don't disrupt the user flow.
 */
export async function triggerPartnerInvite(
  payload: PartnerInviteWebhookPayload
): Promise<void> {
  try {
    const response = await fetch(PARTNER_INVITE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        '[RKPI Webhook] Partner invite delivery failed:',
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error('[RKPI Webhook] Partner invite delivery error:', err);
  }
}
