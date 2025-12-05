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
import { AssessmentGuard } from "@/components/AssessmentGuard";
import { AccessGate } from "@/components/AccessGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import AssessmentPage from "./pages/AssessmentPage";
import AvatarAssessmentPage from "./pages/AvatarAssessmentPage";
import DashboardPage from "./pages/DashboardPage";
import ResourcesPage from "./pages/ResourcesPage";
import ResourcesHubPage from "./pages/ResourcesHubPage";
import ResourcesDocumentsPage from "./pages/ResourcesDocumentsPage";
import ResourcesCalculatorPage from "./pages/ResourcesCalculatorPage";
import ChatPage from "./pages/ChatPage";
import ModelWeekPage from "./pages/ModelWeekPage";
import RoadmapPage from "./pages/RoadmapPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CalculatorPage from "./pages/CalculatorPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import { DocumentManagement } from "./pages/admin/DocumentManagement";
import ProtocolManagement from "./pages/admin/ProtocolManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import UserManagement from "./pages/admin/UserManagement";
import MindInsuranceHub from "./pages/mind-insurance/MindInsuranceHub";
import MindInsurancePracticePage from "./pages/mind-insurance/MindInsurancePracticePage";
import ChampionshipPage from "./pages/mind-insurance/ChampionshipPage";
import WeeklyInsightsPage from "./pages/mind-insurance/WeeklyInsightsPage";
import VaultPage from "./pages/mind-insurance/VaultPage";
import InsightRevealPage from "./pages/mind-insurance/InsightRevealPage";
import ProtocolDetailPage from "./pages/mind-insurance/ProtocolDetailPage";
import PatternCheck from "./pages/mind-insurance/practices/PatternCheck";
import ReinforceIdentity from "./pages/mind-insurance/practices/ReinforceIdentity";
import OutcomeVisualization from "./pages/mind-insurance/practices/OutcomeVisualization";
import TriggerReset from "./pages/mind-insurance/practices/TriggerReset";
import EnergyAudit from "./pages/mind-insurance/practices/EnergyAudit";
import CelebrateWins from "./pages/mind-insurance/practices/CelebrateWins";
import TomorrowSetup from "./pages/mind-insurance/practices/TomorrowSetup";
import TestTooltip from "./pages/TestTooltip";
import ChatPageDemo from "./pages/ChatPageDemo";
import TestSSE from "./pages/TestSSE";
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
              <ProductProvider>
                <ConversationProvider>
                  <ConversationsProvider>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />

                      {/* Assessment routes - no assessment required */}
                      <Route path="/assessment" element={<ProtectedRoute requireAssessment={false}><AssessmentPage /></ProtectedRoute>} />
                      <Route path="/avatar-assessment" element={<ProtectedRoute requireAssessment={false}><AvatarAssessmentPage /></ProtectedRoute>} />

                      {/* Main dashboard */}
                      <Route path="/dashboard" element={<ProtectedRoute><AccessGate><AssessmentGuard><AppLayout><DashboardPage /></AppLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Resources routes */}
                      <Route path="/resources" element={<ProtectedRoute><AccessGate><AssessmentGuard><ResourcesHubPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/resources/documents" element={<ProtectedRoute><AccessGate><AssessmentGuard><ResourcesDocumentsPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/resources/calculator" element={<ProtectedRoute><AccessGate><AssessmentGuard><ResourcesCalculatorPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Mind Insurance routes */}
                      <Route path="/mind-insurance" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><MindInsuranceHub /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practice" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><MindInsurancePracticePage /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/championship" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><ChampionshipPage /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/insights" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><WeeklyInsightsPage /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/vault" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><VaultPage /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/insight/:protocolId" element={<ProtectedRoute><AccessGate><AssessmentGuard><InsightRevealPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/protocol/:protocolId" element={<ProtectedRoute><AccessGate><AssessmentGuard><ProtocolDetailPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Mind Insurance Practice Routes */}
                      <Route path="/mind-insurance/practices/pattern-check" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><PatternCheck /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/reinforce-identity" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><ReinforceIdentity /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/outcome-visualization" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><OutcomeVisualization /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/trigger-reset" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><TriggerReset /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/energy-audit" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><EnergyAudit /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/celebrate-wins" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><CelebrateWins /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/practices/tomorrow-setup" element={<ProtectedRoute><AccessGate><AssessmentGuard><SidebarLayout><TomorrowSetup /></SidebarLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Chat routes */}
                      <Route path="/chat" element={<ProtectedRoute><AccessGate><AssessmentGuard><ChatPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/mind-insurance/chat" element={<ProtectedRoute><AccessGate><AssessmentGuard><ChatPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/wealth/chat" element={<ProtectedRoute><AccessGate><AssessmentGuard><ChatPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Other protected routes */}
                      <Route path="/model-week" element={<ProtectedRoute><AccessGate><AssessmentGuard><AppLayout><ModelWeekPage /></AppLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/roadmap" element={<ProtectedRoute><AccessGate><AssessmentGuard><RoadmapPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/my-journey" element={<Navigate to="/roadmap" replace />} />
                      <Route path="/settings" element={<ProtectedRoute><AccessGate><AssessmentGuard><AppLayout><SettingsPage /></AppLayout></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><AccessGate><AssessmentGuard><ProfilePage /></AssessmentGuard></AccessGate></ProtectedRoute>} />
                      <Route path="/calculator" element={<ProtectedRoute><AccessGate><AssessmentGuard><CalculatorPage /></AssessmentGuard></AccessGate></ProtectedRoute>} />

                      {/* Test routes */}
                      <Route path="/test-tooltip" element={<TestTooltip />} />
                      <Route path="/chat-demo" element={<ChatPageDemo />} />
                      <Route path="/test-sse" element={<TestSSE />} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/documents" element={<ProtectedRoute><AdminRoute><DocumentManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/protocols" element={<ProtectedRoute><AdminRoute><ProtocolManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/reports" element={<ProtectedRoute><AdminRoute><ReportManagement /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/knowledge-base" element={<ProtectedRoute><AdminRoute><AdminKnowledgeBase /></AdminRoute></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute><AccessGate requiredTier="admin"><UserManagement /></AccessGate></ProtectedRoute>} />

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
