import assert from "node:assert/strict";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
assert.ok(connectionString, "DATABASE_URL is required");

async function main() {
  const client = new pg.Client({ connectionString });
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
    "select relname as tablename, relrowsecurity as rowsecurity from pg_class where relname = any($1)",
    [expectedTables]
  );
  assert.equal(rlsResult.rows.every((row) => row.rowsecurity), true, "RLS should be enabled on every application table");

  await client.end();
  console.log("database verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
