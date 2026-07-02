"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Returns a stable Supabase browser client for use in client components.
 * Using this hook instead of calling `createClient()` directly ensures
 * the same client instance is reused across re-renders.
 */
export function useSupabase(): SupabaseClient {
  const [client] = useState(() => createClient());
  return client;
}
