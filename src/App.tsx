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
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
              <Route path="/avatar-assessment" element={<ProtectedRoute><AvatarAssessmentPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/protect" element={<ProtectedRoute><AppLayout><ProtectPage /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
              <Route path="/model-week" element={<ProtectedRoute><AppLayout><ModelWeekPage /></AppLayout></ProtectedRoute>} />
              <Route path="/roadmap" element={<ProtectedRoute><AppLayout><RoadmapPage /></AppLayout></ProtectedRoute>} />
              {/* Redirect old /my-journey route to consolidated /roadmap */}
              <Route path="/my-journey" element={<Navigate to="/roadmap" replace />} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
              <Route path="/populate-kb" element={<PopulateKnowledgeBasePage />} />
              {/* Admin Dashboard - Requires admin authentication */}
              <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
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

export default App;
