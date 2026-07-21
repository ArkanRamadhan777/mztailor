/* oxlint-disable react/only-export-components -- provider and its hook intentionally share one module */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthValue = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const syncSession = async (next: Session | null) => {
      setSession(next);
      if (!next || !isSupabaseConfigured) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      setIsAdmin(!error && data === true);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setLoading(true);
      void syncSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      isAdmin,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isAdmin, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
