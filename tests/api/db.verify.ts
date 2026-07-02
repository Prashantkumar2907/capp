import assert from "node:assert/strict";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL ?? "";
assert.ok(connectionString, "DATABASE_URL is required");

async function main() {
  const client = new pg.Client(pgConfig(connectionString));
  try {
    await client.connect();

    const expectedTables = [
      "organizations",
      "branches",
      "staff",
      "categories",
      "dishes",
      "branch_dishes",
      "tables",
      "orders",
      "order_items",
      "payments",
      "subscriptions",
      "activity_logs",
      "feedback",
    ];

    const tableResult = await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)",
      [expectedTables]
    );
    assert.equal(tableResult.rows.length, expectedTables.length, "all application tables should exist");

    const rlsResult = await client.query<{ tablename: string; rowsecurity: boolean }>(
      "select c.relname as tablename, c.relrowsecurity as rowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any($1)",
      [expectedTables]
    );
    assert.equal(rlsResult.rows.length, expectedTables.length, "all application tables should be checked for RLS");
    assert.equal(rlsResult.rows.every((row) => row.rowsecurity), true, "RLS should be enabled on every application table");

    console.log("database verification passed");
  } finally {
    await client.end();
  }
}

function pgConfig(connectionString: string) {
  const host = new URL(connectionString).hostname;
  return {
    connectionString,
    ssl: host.endsWith(".pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
