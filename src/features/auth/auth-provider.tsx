"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { roleAccess, type Role } from "@/lib/constants";
import type { Branch, Organization, Staff } from "@/types/database";

interface AuthState {
  user: User | null;
  staff: Staff | null;
  organization: Organization | null;
  branch: Branch | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  role: Role | null;
  canAccess: (resource: keyof typeof roleAccess) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const profileRequestRef = useRef(0);
  const [state, setState] = useState<AuthState>({
    user: null,
    staff: null,
    organization: null,
    branch: null,
    loading: true,
  });

  const loadProfile = useCallback(async (user: User | null) => {
    const requestId = ++profileRequestRef.current;
    const commit = (nextState: AuthState) => {
      if (profileRequestRef.current === requestId) setState(nextState);
    };

    if (!user) {
      commit({ user: null, staff: null, organization: null, branch: null, loading: false });
      return;
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!staff) {
      commit({ user, staff: null, organization: null, branch: null, loading: false });
      return;
    }

    const [{ data: organization }, { data: branch }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", staff.org_id).maybeSingle(),
      staff.branch_id ? supabase.from("branches").select("*").eq("id", staff.branch_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    commit({ user, staff, organization, branch, loading: false });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) void loadProfile(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      profileRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const role = (state.staff?.role ?? null) as Role | null;
  const canAccess = useCallback(
    (resource: keyof typeof roleAccess) => {
      if (!role) return false;
      return (roleAccess[resource] as readonly Role[]).includes(role);
    },
    [role]
  );
  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user);
  }, [loadProfile, supabase]);
  const signOut = useCallback(async () => {
    profileRequestRef.current += 1;
    await supabase.auth.signOut();
    setState({ user: null, staff: null, organization: null, branch: null, loading: false });
  }, [supabase]);
  const value: AuthContextValue = { ...state, role, canAccess, refresh, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
