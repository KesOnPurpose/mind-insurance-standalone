import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserSource, getSignupDomain } from '@/services/domainDetectionService';

// Link any external assessments when user signs in/up
async function linkExternalAssessmentsOnAuth(userId: string, userEmail: string) {
  try {
    const { data, error } = await supabase.rpc('link_external_assessments_on_auth', {
      p_user_id: userId,
      p_user_email: userEmail,
    });

    if (error) {
      console.error('Error linking external assessments:', error);
      return null;
    }

    if (data && data.linked_count > 0) {
      console.log(`Linked ${data.linked_count} external assessment(s) to user ${userId}`);
    }

    return data;
  } catch (err) {
    console.error('Failed to link external assessments:', err);
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  // Track if we've already linked assessments for this session to avoid duplicate calls
  const hasLinkedAssessmentsRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // PASSWORD_RECOVERY: redirect to /reset-password no matter where user landed
        // This catches the case where Supabase redirects to the Site URL (root)
        // instead of /reset-password when the redirect URL isn't in the allowed list
        if (event === 'PASSWORD_RECOVERY' && session) {
          console.log('[AuthContext] PASSWORD_RECOVERY event — redirecting to /reset-password');
          if (window.location.pathname !== '/reset-password') {
            window.location.replace('/reset-password');
            return;
          }
        }

        // Link external assessments when user signs in (SIGNED_IN event)
        // This covers both login and signup scenarios
        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.user?.id &&
          session?.user?.email &&
          hasLinkedAssessmentsRef.current !== session.user.id
        ) {
          // Mark as linked to prevent duplicate calls
          hasLinkedAssessmentsRef.current = session.user.id;
          // Run async linking in background (don't block auth flow)
          linkExternalAssessmentsOnAuth(session.user.id, session.user.email);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth sign in...');
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false, // Ensure browser redirect happens
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }

      console.log('Google OAuth initiated successfully:', data);
      return { error: null };
    } catch (error) {
      console.error('SignInWithGoogle error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Capture user_source from current domain for multi-product tracking
      const userSource = getUserSource();
      const signupDomain = getSignupDomain();

      console.log('[AuthContext] signUp with user_source:', userSource, 'domain:', signupDomain);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            user_source: userSource,
            signup_domain: signupDomain,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Use the canonical production domain for the redirect URL so it always
      // matches the Supabase Dashboard "Redirect URLs" allowlist.
      // On localhost, keep using window.location.origin for dev convenience.
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const resetRedirectOrigin = isLocalDev
        ? window.location.origin
        : 'https://grouphome4newbies.com';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${resetRedirectOrigin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // End active sessions for analytics (fire-and-forget)
      if (user?.id) {
        // Find and end any active sessions
        const { data: activeSessions } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', user.id)
          .is('ended_at', null);

        if (activeSessions && activeSessions.length > 0) {
          await supabase
            .from('user_sessions')
            .update({
              ended_at: new Date().toISOString(),
              exit_action: 'logout',
            })
            .eq('user_id', user.id)
            .is('ended_at', null);
        }
      }

      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signInWithPassword,
      signInWithGoogle,
      signUp,
      resetPassword,
      updatePassword,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
