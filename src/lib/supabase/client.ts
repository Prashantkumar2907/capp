"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireClientEnv } from "@/lib/env";

export function createClient() {
  const env = requireClientEnv();
  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey
  );
}
