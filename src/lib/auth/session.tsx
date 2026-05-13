import type { Session } from "@supabase/supabase-js";
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { supabase } from "@/lib/supabase";

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = use(SessionContext);

  if (!value) {
    throw new Error("useSession must be wrapped in a SessionProvider.");
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(data.session);
      setError(sessionError?.message ?? null);
      setIsLoading(false);
    }

    loadSession();

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured for this build.");
      return false;
    }

    setIsSigningIn(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      setError(signInError.message);
      setIsSigningIn(false);
      return false;
    }

    setSession(data.session);
    setIsSigningIn(false);
    return Boolean(data.session);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isSigningIn,
      error,
      signIn,
      signOut,
    }),
    [error, isLoading, isSigningIn, session, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
