import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { ConversationsProvider } from "@/contexts/ConversationsContext";
import { RelationshipProvider } from "@/contexts/RelationshipContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
// MI STANDALONE: AccessGate removed - uses gh_approved_users which is GH-specific
// MI STANDALONE: AssessmentGuard removed - IdentityCollisionGuard handles MI assessment gating
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { SheetTourProvider } from "@/components/ui/sheet";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { ScrollToTop } from "@/components/ScrollToTop";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

// Auth pages
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";

// Mind Insurance pages
import MILandingPage from "./pages/MILandingPage";
import ForCoachesPage from "./pages/ForCoachesPage";
import FoundersPage from "./pages/FoundersPage";
import MindInsuranceHub from "./pages/mind-insurance/MindInsuranceHub";
import IdentityCollisionAssessmentPage from "./pages/mind-insurance/IdentityCollisionAssessmentPage";
import { IdentityCollisionGuard } from "@/components/mind-insurance/IdentityCollisionGuard";
import MindInsurancePracticePage from "./pages/mind-insurance/MindInsurancePracticePage";
import ChampionshipPage from "./pages/mind-insurance/ChampionshipPage";
import CoverageCenterPage from "./pages/mind-insurance/CoverageCenterPage";
import FirstSessionPage from "./pages/mind-insurance/FirstSessionPage";
import VaultPage from "./pages/mind-insurance/VaultPage";
import InsightRevealPage from "./pages/mind-insurance/InsightRevealPage";
import ProtocolDetailPage from "./pages/mind-insurance/ProtocolDetailPage";
import CoachProtocolDetailPage from "./pages/mind-insurance/CoachProtocolDetailPage";
import PatternCheck from "./pages/mind-insurance/practices/PatternCheck";
import ReinforceIdentity from "./pages/mind-insurance/practices/ReinforceIdentity";
import OutcomeVisualization from "./pages/mind-insurance/practices/OutcomeVisualization";
import TriggerReset from "./pages/mind-insurance/practices/TriggerReset";
import EnergyAudit from "./pages/mind-insurance/practices/EnergyAudit";
import CelebrateWins from "./pages/mind-insurance/practices/CelebrateWins";
import TomorrowSetup from "./pages/mind-insurance/practices/TomorrowSetup";
import MIOInsightsPage from "./pages/mind-insurance/MIOInsightsPage";
import DebugProtocolStatus from "./pages/mind-insurance/DebugProtocolStatus";
import MentalPillarAssessmentPage from "./pages/mind-insurance/MentalPillarAssessmentPage";
import TemperamentAssessmentPage from "./pages/mind-insurance/TemperamentAssessmentPage";
import SubPatternAssessmentPage from "./pages/mind-insurance/SubPatternAssessmentPage";
import AvatarRevealPage from "./pages/mind-insurance/AvatarRevealPage";
import ExternalMentalPillarAssessmentPage from "./pages/external/ExternalMentalPillarAssessmentPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CEODashboardPage from "./pages/CEODashboardPage";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import { DocumentManagement } from "./pages/admin/DocumentManagement";
import ProtocolManagement from "./pages/admin/ProtocolManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import AssessmentCenter from "./pages/admin/AssessmentCenter";
import UserManagement from "./pages/admin/UserManagement";

// Relationship KPIs pages
import RelationshipDashboardPage from "./pages/relationship-kpis/RelationshipDashboardPage";
import RelationshipCheckInPage from "./pages/relationship-kpis/RelationshipCheckInPage";
import RelationshipHistoryPage from "./pages/relationship-kpis/RelationshipHistoryPage";
import RelationshipPartnerPage from "./pages/relationship-kpis/RelationshipPartnerPage";
import RelationshipPromptsPage from "./pages/relationship-kpis/RelationshipPromptsPage";
import AcceptPartnerInvite from "./pages/relationship-kpis/AcceptPartnerInvite";

// RIE lazy-loaded pages (code-split for performance)
const RelationshipSeasonsPage = lazy(() => import("./pages/relationship-kpis/RelationshipSeasonsPage"));
const RelationshipLearningPage = lazy(() => import("./pages/relationship-kpis/RelationshipLearningPage"));
const RelationshipDateNightsPage = lazy(() => import("./pages/relationship-kpis/RelationshipDateNightsPage"));
const RelationshipSafeSpacePage = lazy(() => import("./pages/relationship-kpis/RelationshipSafeSpacePage"));
const RelationshipJournalPage = lazy(() => import("./pages/relationship-kpis/RelationshipJournalPage"));

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ============================================================================
// AUTO CACHE CLEAR ON VERSION CHANGE + MOBILE CACHE BUST
// ============================================================================
// Clears localStorage/sessionStorage when a new version is deployed
// This fixes issues where stale cached data causes infinite loops or errors
// Increment this version when deploying fixes that require cache clearing
const APP_VERSION = '2025.12.18.5'; // EMERGENCY: Disabled IdentityCollisionGuard to unblock users

// MOBILE CACHE BUST: Check for ?clearcache=1 in URL
// Send users this link: https://mymindinsurance.com/?clearcache=1
const checkUrlCacheBust = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clearcache') === '1') {
      console.log('[App] URL cache bust triggered - clearing all caches...');

      // Clear everything
      localStorage.clear();
      sessionStorage.clear();

      // Clear service worker caches if any
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }

      // Set the new version so they don't get stuck
      localStorage.setItem('mi_app_version', APP_VERSION);

      // Remove the clearcache param and reload to clean URL
      params.delete('clearcache');
      const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.location.replace(cleanUrl);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[App] URL cache bust failed:', e);
    return false;
  }
};

const checkVersionAndClearCache = () => {
  try {
    const storedVersion = localStorage.getItem('mi_app_version');
    if (storedVersion !== APP_VERSION) {
      console.log(`[App] Version changed: ${storedVersion} → ${APP_VERSION}, clearing cache...`);
      // Preserve certain keys if needed
      const keysToPreserve = ['supabase.auth.token']; // Keep auth token
      const preserved: Record<string, string | null> = {};
      keysToPreserve.forEach(key => {
        preserved[key] = localStorage.getItem(key);
      });

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Restore preserved keys
      Object.entries(preserved).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });

      // Set new version
      localStorage.setItem('mi_app_version', APP_VERSION);

      // Reload to apply fresh state
      window.location.reload();
      return true; // Signal that reload is happening
    }
    return false;
  } catch (e) {
    console.warn('[App] Cache clear check failed:', e);
    return false;
  }
};

// Run URL cache bust check FIRST (for mobile users with old cached JS)
// Then run version check (for users who got the new JS)
const isReloading = checkUrlCacheBust() || checkVersionAndClearCache();

const App = () => {
  // If we're reloading due to version change, show nothing
  if (isReloading) {
    return null;
  }

  if (!isSupabaseConfigured) {
    return <ConfigurationRequired />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <SheetTourProvider>
                <ProductProvider>
                  <ConversationProvider>
                    <ConversationsProvider>
                      <Routes>
                      {/* Landing - MI-specific */}
                      <Route path="/" element={<MILandingPage />} />

                      {/* MIO for Coaches - Full Pitch Deck Page */}
                      <Route path="/for-coaches" element={<ForCoachesPage />} />

                      {/* Meet the Founders Page */}
                      <Route path="/founders" element={<FoundersPage />} />

                      {/* Auth routes */}
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />

                      {/* Legacy route redirects - for backwards compatibility with Grouphome routes */}
                      <Route path="/assessment" element={<Navigate to="/mind-insurance/assessment" replace />} />
                      <Route path="/chat" element={<Navigate to="/mind-insurance/chat" replace />} />
                      <Route path="/dashboard" element={<Navigate to="/mind-insurance" replace />} />

                      {/* External Assessment - Public, no auth required */}
                      <Route path="/mental-assessment" element={<ExternalMentalPillarAssessmentPage />} />
                      <Route path="/mind-insurance/mental-assessment" element={<ExternalMentalPillarAssessmentPage />} />

                      {/* Mind Insurance Identity Collision Assessment - entry point for new users */}
                      {/* IMPORTANT: requireAssessment=false to prevent infinite redirect loop */}
                      {/* MI STANDALONE: No AccessGate - legacy MI users shouldn't need gh_approved_users */}
                      <Route path="/mind-insurance/assessment" element={<ProtectedRoute requireAssessment={false}><IdentityCollisionAssessmentPage /></ProtectedRoute>} />

                      {/* Legacy Inner Wiring route - redirect to Temperament Assessment */}
                      <Route path="/mind-insurance/inner-wiring" element={<Navigate to="/mind-insurance/temperament-assessment" replace />} />

                      {/* Mental Pillar Baseline Assessment - requires Identity Collision first */}
                      <Route path="/mind-insurance/mental-pillar-assessment" element={<ProtectedRoute><IdentityCollisionGuard><MentalPillarAssessmentPage /></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Main Mind Insurance Hub - default after login */}
                      <Route path="/mind-insurance" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><MindInsuranceHub /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Mind Insurance Core Routes */}
                      <Route path="/mind-insurance/practice" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><MindInsurancePracticePage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/championship" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><ChampionshipPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/insights" element={<Navigate to="/mind-insurance/coverage" replace />} />
                      <Route path="/mind-insurance/coverage" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><CoverageCenterPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      {/* First Session - NO assessment guards, accessible immediately after login */}
                      <Route path="/mind-insurance/first-session" element={<ProtectedRoute><FirstSessionPage /></ProtectedRoute>} />
                      <Route path="/mind-insurance/vault" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><VaultPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/insight/:protocolId" element={<ProtectedRoute><IdentityCollisionGuard><InsightRevealPage /></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/protocol/:protocolId" element={<ProtectedRoute><IdentityCollisionGuard><ProtocolDetailPage /></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/coach-protocol" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><CoachProtocolDetailPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Mind Insurance Practice Routes */}
                      <Route path="/mind-insurance/practices/pattern-check" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><PatternCheck /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/reinforce-identity" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><ReinforceIdentity /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/outcome-visualization" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><OutcomeVisualization /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/trigger-reset" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><TriggerReset /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/energy-audit" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><EnergyAudit /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/celebrate-wins" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><CelebrateWins /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/tomorrow-setup" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><TomorrowSetup /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* MIO Insights Thread route */}
                      <Route path="/mind-insurance/mio-insights" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><MIOInsightsPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Debug Protocol Status - temporary diagnostic page */}
                      <Route path="/mind-insurance/debug-protocol" element={<ProtectedRoute><SidebarLayout><DebugProtocolStatus /></SidebarLayout></ProtectedRoute>} />

                      {/* Temperament Assessment - requires Identity Collision first */}
                      <Route path="/mind-insurance/temperament-assessment" element={<ProtectedRoute><IdentityCollisionGuard><TemperamentAssessmentPage /></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Sub-Pattern Assessment - requires Identity Collision first */}
                      <Route path="/mind-insurance/sub-pattern-assessment" element={<ProtectedRoute><IdentityCollisionGuard><SubPatternAssessmentPage /></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Avatar Reveal - shows combined assessment results */}
                      <Route path="/mind-insurance/avatar" element={<ProtectedRoute><IdentityCollisionGuard><AvatarRevealPage /></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* Chat - MI specific */}
                      <Route path="/mind-insurance/chat" element={<ProtectedRoute><IdentityCollisionGuard><ChatPage /></IdentityCollisionGuard></ProtectedRoute>} />

                      {/* User Settings & Profile */}
                      <Route path="/settings" element={<ProtectedRoute><IdentityCollisionGuard><SidebarLayout><SettingsPage /></SidebarLayout></IdentityCollisionGuard></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                      {/* Relationship KPIs Routes */}
                      <Route path="/relationship-kpis" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><RelationshipDashboardPage /></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/check-in" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><RelationshipCheckInPage /></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/history" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><RelationshipHistoryPage /></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/partner" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><RelationshipPartnerPage /></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/prompts" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><RelationshipPromptsPage /></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/accept-partner-invite" element={<RelationshipProvider><AcceptPartnerInvite /></RelationshipProvider>} />

                      {/* RIE New Routes (lazy-loaded) */}
                      <Route path="/relationship-kpis/seasons" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><RelationshipSeasonsPage /></Suspense></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/learning" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><RelationshipLearningPage /></Suspense></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/date-nights" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><RelationshipDateNightsPage /></Suspense></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/safe-space" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><RelationshipSafeSpacePage /></Suspense></SidebarLayout></RelationshipProvider></ProtectedRoute>} />
                      <Route path="/relationship-kpis/journal" element={<ProtectedRoute><RelationshipProvider><SidebarLayout><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><RelationshipJournalPage /></Suspense></SidebarLayout></RelationshipProvider></ProtectedRoute>} />

                      {/* CEO Dashboard - Protected route for owner only */}
                      <Route path="/ceo-dashboard" element={<ProtectedRoute><CEODashboardPage /></ProtectedRoute>} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/documents" element={<ProtectedRoute><AdminRoute><DocumentManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/protocols" element={<ProtectedRoute><AdminRoute><ProtocolManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/reports" element={<ProtectedRoute><AdminRoute><ReportManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/assessments" element={<ProtectedRoute><AdminRoute><AssessmentCenter /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/knowledge-base" element={<ProtectedRoute><AdminRoute><AdminKnowledgeBase /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><UserManagement /></AdminRoute></ProtectedRoute>} />

                      {/* 404 catch-all - must be last */}
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ConversationsProvider>
                  </ConversationProvider>
                </ProductProvider>
              </SheetTourProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
