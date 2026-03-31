"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Staff = Record<string, any> & { id: string; full_name: string; role: string; org_id: string; branch_id?: string; is_active: boolean };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Organization = Record<string, any> & { id: string; name: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Branch = Record<string, any> & { id: string; name: string; org_id: string };

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

  const supabase = createClient();

  const fetchStaffData = async (userId: string) => {
    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!staffData) return;

    const [{ data: orgData }, { data: branchData }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", staffData.org_id).single(),
      supabase.from("branches").select("*").eq("id", staffData.branch_id).single(),
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
