import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireClientEnv, requireServerEnv } from "@/lib/env";

export function createAdminSupabase() {
  const client = requireClientEnv();
  const server = requireServerEnv();

  return createClient<Database>(client.supabaseUrl, server.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
