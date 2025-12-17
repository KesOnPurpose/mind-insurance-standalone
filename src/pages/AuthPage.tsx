import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in - go to mind insurance hub (main dashboard)
  useEffect(() => {
    if (user) {
      navigate('/mind-insurance', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-mi-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </Link>

        <LoginForm />
      </div>
    </div>
  );
};

export default AuthPage;