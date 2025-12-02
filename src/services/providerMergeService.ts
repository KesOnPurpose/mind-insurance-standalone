import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAccount {
  id: string;
  email: string;
  provider: string;
  created_at: string;
  assessment_completed_at?: string;
}

export interface MigrationResult {
  success: boolean;
  migrated_count: number;
  from_user_id: string;
  to_user_id: string;
  errors: string[];
}

export interface ProviderInfo {
  primary: string;
  secondary: string;
}

export interface MergeResult {
  success: boolean;
  primary_user_id: string;
  migrated: boolean;
  message?: string;
  error?: string;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Detect if user has multiple accounts with the same email across different providers
 */
export async function detectMultiProviderAccounts(user: User): Promise<UserAccount[]> {
  try {
    if (!user?.email) {
      console.log('[providerMergeService] No email provided, skipping detection');
      return [];
    }

    console.log('[providerMergeService] Detecting multi-provider accounts for:', user.email);

    // Query auth.users for all accounts with same email
    // Note: This requires a database function since auth.users is not directly accessible via RLS
    const { data, error } = await supabase.rpc('gh_detect_multi_provider_accounts', {
      p_email: user.email
    });

    if (error) {
      console.error('[providerMergeService] Error detecting accounts:', error);
      throw error;
    }

    // Transform the response into UserAccount format
    const accounts: UserAccount[] = (data || []).map((account: any) => ({
      id: account.user_id,
      email: account.email,
      provider: account.provider,
      created_at: account.created_at,
      assessment_completed_at: account.assessment_completed_at
    }));

    console.log('[providerMergeService] Found accounts:', accounts.length);
    return accounts;

  } catch (error) {
    console.error('[providerMergeService] detectMultiProviderAccounts failed:', error);
    return [];
  }
}

/**
 * Determine which account should be the primary account
 * Priority: account with assessment data > email provider > oldest account
 */
export async function determinePrimaryAccount(accounts: UserAccount[]): Promise<string> {
  if (accounts.length === 0) {
    throw new Error('No accounts provided for primary selection');
  }

  if (accounts.length === 1) {
    return accounts[0].id;
  }

  console.log('[providerMergeService] Determining primary account from', accounts.length, 'accounts');

  // Priority 1: Account WITH assessment data
  const accountsWithAssessment = accounts.filter(acc => acc.assessment_completed_at);
  if (accountsWithAssessment.length > 0) {
    // If multiple have assessments, prefer email provider, then oldest
    const emailProvider = accountsWithAssessment.find(acc => acc.provider === 'email');
    if (emailProvider) {
      console.log('[providerMergeService] Selected primary: email provider with assessment');
      return emailProvider.id;
    }

    // Sort by created_at (oldest first)
    accountsWithAssessment.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    console.log('[providerMergeService] Selected primary: oldest account with assessment');
    return accountsWithAssessment[0].id;
  }

  // Priority 2: Email provider (magic link)
  const emailProvider = accounts.find(acc => acc.provider === 'email');
  if (emailProvider) {
    console.log('[providerMergeService] Selected primary: email provider');
    return emailProvider.id;
  }

  // Priority 3: Oldest account
  const sorted = [...accounts].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  console.log('[providerMergeService] Selected primary: oldest account');
  return sorted[0].id;
}

/**
 * Migrate assessment data from secondary to primary account
 */
export async function migrateAssessmentData(
  fromUserId: string,
  toUserId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated_count: 0,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    errors: []
  };

  try {
    console.log('[providerMergeService] Migrating assessment data:', fromUserId, '→', toUserId);

    // Check if source account has assessment data
    const { data: sourceAssessment, error: sourceError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', fromUserId)
      .single();

    if (sourceError && sourceError.code !== 'PGRST116') { // PGRST116 = no rows returned
      result.errors.push(`Failed to fetch source assessment: ${sourceError.message}`);
      return result;
    }

    if (!sourceAssessment) {
      console.log('[providerMergeService] No assessment data to migrate');
      result.success = true;
      return result;
    }

    // Check if destination already has assessment data
    const { data: targetAssessment, error: targetError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', toUserId)
      .single();

    if (targetError && targetError.code !== 'PGRST116') {
      result.errors.push(`Failed to fetch target assessment: ${targetError.message}`);
      return result;
    }

    // If target has assessment, keep it and mark source as migrated (for audit)
    if (targetAssessment) {
      console.log('[providerMergeService] Target already has assessment, marking source as secondary');

      // Update source record to mark as secondary
      const { error: updateError } = await supabase
        .from('user_onboarding')
        .update({
          migrated_from_user_id: fromUserId,
          migrated_at: new Date().toISOString(),
          is_primary_record: false
        })
        .eq('user_id', fromUserId);

      if (updateError) {
        result.errors.push(`Failed to mark source as secondary: ${updateError.message}`);
        return result;
      }

      result.success = true;
      result.migrated_count = 0; // No data copied, but marked as handled
      return result;
    }

    // Copy assessment data from source to target
    const migrationPayload = {
      ...sourceAssessment,
      user_id: toUserId,
      migrated_from_user_id: fromUserId,
      migrated_at: new Date().toISOString(),
      is_primary_record: true,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be copied
    delete migrationPayload.id;
    delete migrationPayload.created_at;

    const { error: insertError } = await supabase
      .from('user_onboarding')
      .upsert(migrationPayload, { onConflict: 'user_id' });

    if (insertError) {
      result.errors.push(`Failed to insert migrated assessment: ${insertError.message}`);
      return result;
    }

    // Mark source as secondary (keep for audit trail)
    const { error: updateError } = await supabase
      .from('user_onboarding')
      .update({
        is_primary_record: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', fromUserId);

    if (updateError) {
      result.errors.push(`Failed to mark source as secondary: ${updateError.message}`);
    }

    console.log('[providerMergeService] Assessment migration successful');
    result.success = true;
    result.migrated_count = 1;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('[providerMergeService] Migration failed:', error);
  }

  return result;
}

/**
 * Create provider link record for audit trail
 */
export async function createProviderLink(
  primaryId: string,
  secondaryId: string,
  email: string,
  providers: ProviderInfo,
  assessmentMigrated: boolean = false
): Promise<void> {
  try {
    console.log('[providerMergeService] Creating provider link:', primaryId, '←', secondaryId);

    const { error } = await supabase
      .from('provider_links')
      .insert({
        primary_user_id: primaryId,
        secondary_user_id: secondaryId,
        email: email.toLowerCase(),
        primary_provider: providers.primary,
        secondary_provider: providers.secondary,
        merged_by: 'auto',
        merge_reason: 'multi_provider_detection',
        assessment_migrated: assessmentMigrated,
        user_onboarding_migrated: assessmentMigrated,
        migration_log: [{
          timestamp: new Date().toISOString(),
          action: 'provider_link_created',
          details: `Linked ${providers.secondary} to ${providers.primary} for ${email}`
        }],
        merged_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      // Check if it's a duplicate (unique constraint violation)
      if (error.code === '23505') {
        console.log('[providerMergeService] Provider link already exists, skipping');
        return;
      }
      throw error;
    }

    console.log('[providerMergeService] Provider link created successfully');

  } catch (error) {
    console.error('[providerMergeService] Failed to create provider link:', error);
    throw error;
  }
}

/**
 * Check if accounts are already linked
 */
export async function checkExistingProviderLink(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('provider_links')
      .select('*')
      .or(`primary_user_id.eq.${userId},secondary_user_id.eq.${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[providerMergeService] Error checking existing link:', error);
    return null;
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main function to detect and merge multi-provider accounts
 * Called after successful authentication
 */
export async function detectAndMergeProviderAccounts(currentUser: User): Promise<MergeResult> {
  try {
    console.log('[providerMergeService] Starting provider merge check for:', currentUser.email);

    // 1. Detect multi-provider accounts
    const accounts = await detectMultiProviderAccounts(currentUser);

    if (accounts.length <= 1) {
      console.log('[providerMergeService] Single provider account, no merge needed');
      return {
        success: true,
        primary_user_id: currentUser.id,
        migrated: false
      };
    }

    console.log('[providerMergeService] Multiple provider accounts detected:', accounts.length);

    // 2. Check if already merged
    const existingLink = await checkExistingProviderLink(currentUser.id);
    if (existingLink) {
      console.log('[providerMergeService] Accounts already linked, using primary');
      return {
        success: true,
        primary_user_id: existingLink.primary_user_id,
        migrated: false,
        message: 'Accounts already linked'
      };
    }

    // 3. Determine primary account
    const primaryUserId = await determinePrimaryAccount(accounts);
    console.log('[providerMergeService] Primary account selected:', primaryUserId);

    // 4. Migrate assessment data from secondary accounts
    const secondaryUserIds = accounts
      .filter(acc => acc.id !== primaryUserId)
      .map(acc => acc.id);

    let totalMigrated = 0;
    const errors: string[] = [];

    for (const secondaryId of secondaryUserIds) {
      const migrationResult = await migrateAssessmentData(secondaryId, primaryUserId);

      if (migrationResult.success) {
        totalMigrated += migrationResult.migrated_count;

        // Create provider link record
        const primaryAccount = accounts.find(acc => acc.id === primaryUserId);
        const secondaryAccount = accounts.find(acc => acc.id === secondaryId);

        if (primaryAccount && secondaryAccount) {
          await createProviderLink(
            primaryUserId,
            secondaryId,
            currentUser.email!,
            {
              primary: primaryAccount.provider,
              secondary: secondaryAccount.provider
            },
            migrationResult.migrated_count > 0
          );
        }
      } else {
        errors.push(...migrationResult.errors);
      }
    }

    // 5. Return result
    const wasMigrated = totalMigrated > 0;
    const message = wasMigrated
      ? `Assessment data preserved from ${secondaryUserIds.length} previous login method(s)`
      : `Accounts linked successfully`;

    console.log('[providerMergeService] Merge complete:', {
      primary: primaryUserId,
      migrated: wasMigrated,
      errors: errors.length
    });

    return {
      success: errors.length === 0,
      primary_user_id: primaryUserId,
      migrated: wasMigrated,
      message,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };

  } catch (error) {
    console.error('[providerMergeService] detectAndMergeProviderAccounts failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during provider merge';

    return {
      success: false,
      primary_user_id: currentUser.id,
      migrated: false,
      error: errorMessage
    };
  }
}
