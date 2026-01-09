import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useIdentityCollisionStatus, hasCompletedCollisionAssessment } from '@/hooks/useIdentityCollisionStatus';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Maximum time to wait for loading states before showing retry UI
// Reduced to 10s to match other guards - 30s was masking real issues
const LOADING_TIMEOUT_MS = 10000; // 10 seconds

// ============================================================================
// IDENTITY COLLISION GUARD COMPONENT
// ============================================================================
// Enforces mandatory Identity Collision Assessment before accessing Mind Insurance
// - Admins can bypass (for testing/support purposes)
// - Regular users MUST complete assessment first
// - Redirects to /mind-insurance/assessment if not completed
// ============================================================================

interface IdentityCollisionGuardProps {
  children: React.ReactNode;
}

export const IdentityCollisionGuard: React.FC<IdentityCollisionGuardProps> = ({ children }) => {
  // TEMPORARY FIX: Guard completely disabled to unblock users stuck in infinite loop
  // TODO: Re-enable after root cause is identified and fixed
  // Date disabled: 2025-12-18
  // Reason: Users with completed assessments (data in DB) still getting redirected
  console.log('[IdentityCollisionGuard] DISABLED - allowing all users through');
  return <>{children}</>;
};

export default IdentityCollisionGuard;
