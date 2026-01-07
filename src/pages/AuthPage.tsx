import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/chat", { replace: true });
  }, [user, navigate]);

  return (
    // Mobile-first: allow scrolling when content is taller than the screen
    <div className="bg-gradient-hero min-h-[100svh] overflow-y-auto">
      {/* Mobile-first: start at top. On md+ center vertically */}
      <div className="mx-auto w-full max-w-md px-4 py-3 flex min-h-[100svh] flex-col justify-start md:justify-center md:px-8 md:py-6">
        {/* Back link (very compact) */}
        <Link
          to="/"
          className="mb-2 inline-flex w-fit items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-medium">Back to home</span>
        </Link>

        {/* Compact notice ABOVE login form */}
        <div className="relative mb-2 overflow-hidden rounded-lg bg-white/95 backdrop-blur-xl shadow-lg border border-white/20">
          {/* ultra-thin gradient accent */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

          <div className="p-2.5">
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 rounded-md bg-indigo-50 p-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-xs font-semibold text-gray-900">Login update</p>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    Magic Links retired
                  </span>
                </div>

                {/* Smaller warning text, minimal vertical space */}
                <p className="mt-0.5 text-[11px] leading-4 text-gray-600">
                  Use{" "}
                  <span className="font-medium text-gray-900">Google</span> or your{" "}
                  <span className="font-medium text-gray-900">password</span>.{" "}
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-indigo-700 hover:underline underline-offset-2"
                  >
                    Set your password
                  </Link>{" "}
                  if you used Magic Links before.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
};

export default AuthPage;