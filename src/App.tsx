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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
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

// Grouphome pages
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RoadmapPage from "./pages/RoadmapPage";
// FEAT-GH-010: Programs Hub for course-based learning
import ProgramsPage from "./pages/ProgramsPage";
// FEAT-GH-011: Program Dashboard & Phase Roadmap
import ProgramDashboardPage from "./pages/ProgramDashboardPage";
// FEAT-GH-012: Phase View & Lesson List
import PhasePage from "./pages/PhasePage";
// FEAT-GH-013: Lesson Experience (Video + Tactics + Bottom Sheet)
import LessonPage from "./pages/LessonPage";
import ModelWeekPage from "./pages/ModelWeekPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ResourcesHubPage from "./pages/ResourcesHubPage";
import ResourcesDocumentsPage from "./pages/ResourcesDocumentsPage";
import ResourcesCalculatorPage from "./pages/ResourcesCalculatorPage";
import CalculatorPage from "./pages/CalculatorPage";

// Property Portfolio pages
import PropertyPortfolioPage from "./pages/PropertyPortfolioPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";

// Compliance Hub pages
import ComplianceHubPage from "./pages/ComplianceHubPage";
import ComplianceSearchPage from "./pages/ComplianceSearchPage";
import ComplianceBinderPage from "./pages/ComplianceBinderPage";
import ComplianceAssessmentPage from "./pages/ComplianceAssessmentPage";
import StateComparisonPage from "./pages/StateComparisonPage";
import SharedBinderPage from "./pages/SharedBinderPage";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import { DocumentManagement } from "./pages/admin/DocumentManagement";
import CoachDashboard from "./pages/CoachDashboard";
// GROUPHOME STANDALONE: Removed MIO-focused ProtocolManagement
// import ProtocolManagement from "./pages/admin/ProtocolManagement";
// GROUPHOME STANDALONE: Removed MIO-focused ReportManagement
// import ReportManagement from "./pages/admin/ReportManagement";
// GROUPHOME STANDALONE: Removed MIO-focused AssessmentCenter (useAssessmentInvitations hook deleted)
// import AssessmentCenter from "./pages/admin/AssessmentCenter";
import UserManagement from "./pages/admin/UserManagement";
// FEAT-GH-014: Admin Program Management
import AdminProgramsPage from "./pages/admin/AdminProgramsPage";
import AdminProgramDashboardPage from "./pages/admin/AdminProgramDashboardPage";
// FEAT-GH-015: Admin Phase & Lesson Builder
import PhaseBuilderPage from "./pages/admin/PhaseBuilderPage";
// FEAT-GH-016: Admin Lesson Editor
import LessonEditorPage from "./pages/admin/LessonEditorPage";
// FEAT-GH-018: Admin Learner Progress Drill-down
import AdminLearnerDetailPage from "./pages/admin/AdminLearnerDetailPage";
// Compliance Binder Generator
import ComplianceBinderGeneratorPage from "./pages/admin/ComplianceBinderGeneratorPage";
// Admin Notification Broadcasts
import BroadcastsPage from "./pages/admin/BroadcastsPage";

// FEAT-GH-TOUR: Tour Test Page
import TourTestPage from "./pages/TourTestPage";

// GHCF Post-Purchase pages
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ============================================================================
// AUTO CACHE CLEAR ON VERSION CHANGE + MOBILE CACHE BUST
// ============================================================================
// Clears localStorage/sessionStorage when a new version is deployed
// This fixes issues where stale cached data causes infinite loops or errors
// Increment this version when deploying fixes that require cache clearing
const APP_VERSION = '2026.01.18.1'; // GROUPHOME STANDALONE: Removed all Mind Insurance content

// MOBILE CACHE BUST: Check for ?clearcache=1 in URL
// Send users this link: https://grouphome4newbies.com/?clearcache=1
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
      localStorage.setItem('gh_app_version', APP_VERSION);

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
    const storedVersion = localStorage.getItem('gh_app_version');
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
      localStorage.setItem('gh_app_version', APP_VERSION);

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
                      {/* Landing - Grouphome: redirect to dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />

                      {/* Auth routes */}
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />

                      {/* GHCF Post-Purchase: Subscription expired page (public, no auth) */}
                      <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />

                      {/* Public share link route - no auth required */}
                      <Route path="/compliance/binder/share/:token" element={<SharedBinderPage />} />

                      {/* Grouphome Core Routes - Pages handle their own SidebarLayout */}
                      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                      <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
                      <Route path="/model-week" element={<ProtectedRoute><ModelWeekPage /></ProtectedRoute>} />

                      {/* FEAT-GH-010: Programs Hub - Course-based learning */}
                      <Route path="/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
                      {/* FEAT-GH-011: Program Dashboard & Phase Roadmap */}
                      <Route path="/programs/:programId" element={<ProtectedRoute><ProgramDashboardPage /></ProtectedRoute>} />
                      {/* FEAT-GH-012: Phase View & Lesson List */}
                      <Route path="/programs/:programId/phases/:phaseId" element={<ProtectedRoute><PhasePage /></ProtectedRoute>} />
                      {/* FEAT-GH-013: Lesson Experience (Video + Tactics + Bottom Sheet) */}
                      <Route path="/programs/:programId/lessons/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />

                      {/* Chat - Nette AI (only coach) */}
                      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

                      {/* Resources - Pages handle their own SidebarLayout */}
                      <Route path="/resources" element={<ProtectedRoute><ResourcesHubPage /></ProtectedRoute>} />
                      <Route path="/resources/documents" element={<ProtectedRoute><ResourcesDocumentsPage /></ProtectedRoute>} />
                      <Route path="/resources/calculator" element={<ProtectedRoute><ResourcesCalculatorPage /></ProtectedRoute>} />
                      <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />

                      {/* Property Portfolio - Multi-property management */}
                      <Route path="/portfolio" element={<ProtectedRoute><PropertyPortfolioPage /></ProtectedRoute>} />
                      <Route path="/property/:propertyId" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />

                      {/* Compliance Hub - Digital compliance binder and research */}
                      <Route path="/compliance" element={<ProtectedRoute><ComplianceHubPage /></ProtectedRoute>} />
                      <Route path="/compliance/search" element={<ProtectedRoute><ComplianceSearchPage /></ProtectedRoute>} />
                      <Route path="/compliance/binder" element={<ProtectedRoute><ComplianceBinderPage /></ProtectedRoute>} />
                      <Route path="/compliance/assessment" element={<ProtectedRoute><ComplianceAssessmentPage /></ProtectedRoute>} />
                      <Route path="/compliance/compare" element={<ProtectedRoute><StateComparisonPage /></ProtectedRoute>} />

                      {/* User Settings & Profile - Pages handle their own SidebarLayout */}
                      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/documents" element={<ProtectedRoute><AdminRoute><DocumentManagement /></AdminRoute></ProtectedRoute>} />
                      {/* GROUPHOME STANDALONE: Removed MIO-focused ProtocolManagement route */}
                      <Route path="/admin/protocols" element={<Navigate to="/admin" replace />} />
                      {/* GROUPHOME STANDALONE: Removed MIO-focused ReportManagement route */}
                      {/* GROUPHOME STANDALONE: Removed MIO-focused AssessmentCenter route */}
                      <Route path="/admin/knowledge-base" element={<ProtectedRoute><AdminRoute><AdminKnowledgeBase /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><UserManagement /></AdminRoute></ProtectedRoute>} />
                      {/* FEAT-GH-008: Coach Dashboard for stuck user management and funnel analytics */}
                      <Route path="/admin/coach-dashboard" element={<ProtectedRoute><AdminRoute><CoachDashboard /></AdminRoute></ProtectedRoute>} />
                      {/* FEAT-GH-014: Admin Program Management */}
                      <Route path="/admin/programs" element={<ProtectedRoute><AdminRoute><AdminProgramsPage /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/programs/:programId" element={<ProtectedRoute><AdminRoute><AdminProgramDashboardPage /></AdminRoute></ProtectedRoute>} />
                      {/* FEAT-GH-015: Admin Phase & Lesson Builder */}
                      <Route path="/admin/programs/:programId/phases/:phaseId" element={<ProtectedRoute><AdminRoute><PhaseBuilderPage /></AdminRoute></ProtectedRoute>} />
                      {/* FEAT-GH-016: Admin Lesson Editor */}
                      <Route path="/admin/programs/:programId/lessons/:lessonId" element={<ProtectedRoute><AdminRoute><LessonEditorPage /></AdminRoute></ProtectedRoute>} />
                      {/* FEAT-GH-018: Admin Learner Progress Drill-down */}
                      <Route path="/admin/programs/:programId/learners/:userId" element={<ProtectedRoute><AdminRoute><AdminLearnerDetailPage /></AdminRoute></ProtectedRoute>} />
                      {/* Compliance Binder Generator */}
                      <Route path="/admin/compliance" element={<ProtectedRoute><AdminRoute><ComplianceBinderGeneratorPage /></AdminRoute></ProtectedRoute>} />
                      {/* Admin Notification Broadcasts */}
                      <Route path="/admin/broadcasts" element={<ProtectedRoute><AdminRoute><BroadcastsPage /></AdminRoute></ProtectedRoute>} />

                      {/* FEAT-GH-TOUR: Tour Test Page (for development/testing) */}
                      <Route path="/tour-test" element={<ProtectedRoute><TourTestPage /></ProtectedRoute>} />

                      {/* Legacy route redirects - for backwards compatibility */}
                      <Route path="/mind-insurance/*" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/wealth/*" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/assessment" element={<Navigate to="/dashboard" replace />} />

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
