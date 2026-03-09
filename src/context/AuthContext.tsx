import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

type User = {
  id: string;
  email?: string | null;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;

        if (error) {
          // If there's an error getting the user (e.g., invalid session), clear it
          console.log("Error getting user, clearing session:", error.message);
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(
            data?.user ? { id: data.user.id, email: data.user.email } : null,
          );
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        // Clear any corrupt session
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error("Failed to sign out:", signOutErr);
        }
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      console.log("🔐 Attempting sign in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("❌ Sign in error:", error);
        throw error;
      }
      console.log("✅ Sign in successful:", data.user?.email);
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    } catch (error: any) {
      console.error("❌ Sign in failed:", error.message || error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      console.log("🚪 Attempting sign out...");
      await supabase.auth.signOut();
      setUser(null);
      console.log("✅ Sign out successful - user cleared");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      // Even if sign out fails, clear local user state
      setUser(null);
    } finally {
      setLoading(false);
      console.log("✅ Sign out complete, loading set to false");
    }
  }

  const value = useMemo(() => {
    const isAuth = !!user;
    console.log("🔄 AuthContext value updated - user:", user?.email, "isAuthenticated:", isAuth, "loading:", loading);
    return {
      user,
      isAuthenticated: isAuth,
      loading,
      signIn,
      signUp,
      signOut,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
