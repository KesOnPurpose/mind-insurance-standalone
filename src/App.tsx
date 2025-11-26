import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";
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
import ProtectPage from "./pages/ProtectPage";
import ChatPage from "./pages/ChatPage";
import ModelWeekPage from "./pages/ModelWeekPage";
import RoadmapPage from "./pages/RoadmapPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import PopulateKnowledgeBasePage from "./pages/PopulateKnowledgeBasePage";
import AdminDashboard from "./pages/AdminDashboard";
import { DocumentManagement } from "./pages/admin/DocumentManagement";
// Resources pages removed - components not found
import MindInsuranceHub from "./pages/mind-insurance/MindInsuranceHub";
import MindInsurancePracticePage from "./pages/mind-insurance/MindInsurancePracticePage";
import ChampionshipPage from "./pages/mind-insurance/ChampionshipPage";
import InsightsPage from "./pages/mind-insurance/InsightsPage";
import VaultPage from "./pages/mind-insurance/VaultPage";
import PatternCheck from "./pages/mind-insurance/practices/PatternCheck";
import ReinforceIdentity from "./pages/mind-insurance/practices/ReinforceIdentity";
import OutcomeVisualization from "./pages/mind-insurance/practices/OutcomeVisualization";
import TriggerReset from "./pages/mind-insurance/practices/TriggerReset";
import EnergyAudit from "./pages/mind-insurance/practices/EnergyAudit";
import CelebrateWins from "./pages/mind-insurance/practices/CelebrateWins";
import TomorrowSetup from "./pages/mind-insurance/practices/TomorrowSetup";
import ProtocolDemo from "./pages/ProtocolDemo";
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
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
              <Route path="/avatar-assessment" element={<ProtectedRoute><AvatarAssessmentPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/protect" element={<ProtectedRoute><AppLayout><ProtectPage /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance" element={<ProtectedRoute><AppLayout><MindInsuranceHub /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practice" element={<ProtectedRoute><AppLayout><MindInsurancePracticePage /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/championship" element={<ProtectedRoute><AppLayout><ChampionshipPage /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/insights" element={<ProtectedRoute><AppLayout><InsightsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/vault" element={<ProtectedRoute><AppLayout><VaultPage /></AppLayout></ProtectedRoute>} />
              {/* PROTECT Practice Routes */}
              <Route path="/mind-insurance/practices/pattern-check" element={<ProtectedRoute><AppLayout><PatternCheck /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/reinforce-identity" element={<ProtectedRoute><AppLayout><ReinforceIdentity /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/outcome-visualization" element={<ProtectedRoute><AppLayout><OutcomeVisualization /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/trigger-reset" element={<ProtectedRoute><AppLayout><TriggerReset /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/energy-audit" element={<ProtectedRoute><AppLayout><EnergyAudit /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/celebrate-wins" element={<ProtectedRoute><AppLayout><CelebrateWins /></AppLayout></ProtectedRoute>} />
              <Route path="/mind-insurance/practices/tomorrow-setup" element={<ProtectedRoute><AppLayout><TomorrowSetup /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
              <Route path="/model-week" element={<ProtectedRoute><AppLayout><ModelWeekPage /></AppLayout></ProtectedRoute>} />
              <Route path="/roadmap" element={<ProtectedRoute><AppLayout><RoadmapPage /></AppLayout></ProtectedRoute>} />
              {/* Redirect old /my-journey route to consolidated /roadmap */}
              <Route path="/my-journey" element={<Navigate to="/roadmap" replace />} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
              <Route path="/populate-kb" element={<PopulateKnowledgeBasePage />} />
              {/* Test page for Glossary Tooltips - No auth required for testing */}
              <Route path="/test-tooltip" element={<TestTooltip />} />
              {/* Test page for Chat with SSE - No auth required for testing */}
              <Route path="/chat-demo" element={<ChatPageDemo />} />
              {/* Test page for SSE streaming with detailed logging */}
              <Route path="/test-sse" element={<TestSSE />} />
              {/* Protocol Demo page - Interactive glossary demonstration */}
              <Route path="/protocol-demo" element={<ProtectedRoute><AppLayout><ProtocolDemo /></AppLayout></ProtectedRoute>} />
              {/* Admin Dashboard - Requires admin authentication */}
              <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/documents" element={<ProtectedRoute><AdminRoute><AppLayout><DocumentManagement /></AppLayout></AdminRoute></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProductProvider>
        </BrowserRouter>
      </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
