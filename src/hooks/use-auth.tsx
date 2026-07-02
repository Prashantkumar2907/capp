"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Branch, Organization, Staff } from "@/lib/supabase/types";

interface AuthState {
  user: User | null;
  staff: Staff | null;
  organization: Organization | null;
  branch: Branch | null;
  isLoading: boolean;
  role: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    staff: null,
    organization: null,
    branch: null,
    isLoading: true,
    role: null,
  });

  const [supabase] = useState(() => createClient());

  const fetchStaffData = async (userId: string) => {
    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!staffData) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const branchPromise = staffData.branch_id
      ? supabase.from("branches").select("*").eq("id", staffData.branch_id).single()
      : Promise.resolve({ data: null });

    const [{ data: orgData }, { data: branchData }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", staffData.org_id).single(),
      branchPromise,
    ]);

    setState((prev) => ({
      ...prev,
      staff: staffData,
      organization: orgData,
      branch: branchData,
      role: staffData.role,
      isLoading: false,
    }));
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setState((prev) => ({ ...prev, user }));
        await fetchStaffData(user.id);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setState((prev) => ({ ...prev, user }));
      if (user) {
        await fetchStaffData(user.id);
      } else {
        setState({
          user: null,
          staff: null,
          organization: null,
          branch: null,
          isLoading: false,
          role: null,
        });
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      staff: null,
      organization: null,
      branch: null,
      isLoading: false,
      role: null,
    });
  };

  const refreshStaff = async () => {
    if (state.user) {
      await fetchStaffData(state.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
