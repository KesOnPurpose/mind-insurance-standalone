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
// MI STANDALONE: AccessGate removed - uses gh_approved_users which is GH-specific
// MI STANDALONE: AssessmentGuard removed - IdentityCollisionGuard handles MI assessment gating
import { SidebarLayout } from "@/components/layout/SidebarLayout";
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
import MentalPillarAssessmentPage from "./pages/mind-insurance/MentalPillarAssessmentPage";
import TemperamentAssessmentPage from "./pages/mind-insurance/TemperamentAssessmentPage";
import SubPatternAssessmentPage from "./pages/mind-insurance/SubPatternAssessmentPage";
import AvatarRevealPage from "./pages/mind-insurance/AvatarRevealPage";
import ExternalMentalPillarAssessmentPage from "./pages/external/ExternalMentalPillarAssessmentPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import { DocumentManagement } from "./pages/admin/DocumentManagement";
import ProtocolManagement from "./pages/admin/ProtocolManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import AssessmentCenter from "./pages/admin/AssessmentCenter";
import UserManagement from "./pages/admin/UserManagement";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
              <ProductProvider>
                <ConversationProvider>
                  <ConversationsProvider>
                    <Routes>
                      {/* Landing - MI-specific */}
                      <Route path="/" element={<MILandingPage />} />

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
            </BrowserRouter>
          </TooltipProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
