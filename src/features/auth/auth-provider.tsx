"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { roleAccess, type Role } from "@/lib/constants";
import type { Branch, Organization, Staff, Subscription } from "@/types/database";
import { effectiveState, type PlanId, type SubscriptionEffective } from "@/lib/plans";

interface AuthState {
  user: User | null;
  staff: Staff | null;
  organization: Organization | null;
  branch: Branch | null;
  roles: Role[];
  subscription: Subscription | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Resolved billing state: trial | active | grace | expired + effective plan. */
  plan: { effective: SubscriptionEffective; plan: PlanId; daysLeft: number | null };
  /** Primary role, used for display. Capability checks should use hasRole/canAccess. */
  role: Role | null;
  /** True when the user holds ANY of the given roles. */
  hasRole: (...check: Role[]) => boolean;
  canAccess: (resource: keyof typeof roleAccess) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<AuthState>({
    user: null,
    staff: null,
    organization: null,
    branch: null,
    roles: [],
    subscription: null,
    loading: true,
  });

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ user: null, staff: null, organization: null, branch: null, roles: [], subscription: null, loading: false });
      return;
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!staff) {
      setState({ user, staff: null, organization: null, branch: null, roles: [], subscription: null, loading: false });
      return;
    }

    const [{ data: organization }, { data: branch }, { data: roleRows }, { data: subscription }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", staff.org_id).maybeSingle(),
      staff.branch_id ? supabase.from("branches").select("*").eq("id", staff.branch_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("staff_roles").select("role").eq("staff_id", staff.id),
      supabase.from("subscriptions").select("*").eq("org_id", staff.org_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // A user always holds at least their primary role, even if staff_roles
    // hasn't been backfilled yet (pre-migration data safety).
    const roleSet = new Set<Role>([staff.role as Role]);
    (roleRows ?? []).forEach((row) => roleSet.add(row.role as Role));

    setState({ user, staff, organization, branch, roles: [...roleSet], subscription: subscription ?? null, loading: false });
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
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const role = (state.staff?.role ?? null) as Role | null;
  const hasRole = useCallback(
    (...check: Role[]) => check.some((candidate) => state.roles.includes(candidate)),
    [state.roles]
  );
  const canAccess = useCallback(
    (resource: keyof typeof roleAccess) => {
      const allowed = roleAccess[resource] as readonly Role[];
      return state.roles.some((held) => allowed.includes(held));
    },
    [state.roles]
  );
  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user);
  }, [loadProfile, supabase]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, staff: null, organization: null, branch: null, roles: [], subscription: null, loading: false });
  }, [supabase]);
  const plan = effectiveState(state.subscription);
  const value: AuthContextValue = { ...state, role, plan, hasRole, canAccess, refresh, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
