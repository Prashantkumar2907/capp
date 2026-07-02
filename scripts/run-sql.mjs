import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const sqlDir = path.join(process.cwd(), "supabase");
const files = (await fs.readdir(sqlDir)).filter((file) => file.endsWith(".sql")).sort();
const client = new Client(pgConfig(databaseUrl));

try {
  await client.connect();
} catch (error) {
  if (error?.code === "ENOTFOUND" || error?.code === "ENETUNREACH") {
    throw new Error(`Unable to reach Postgres host. Use the Supabase Session pooler connection string in DATABASE_URL. Original error: ${error.message}`);
  }
  throw error;
}

try {
  for (const file of files) {
    const sql = await fs.readFile(path.join(sqlDir, file), "utf8");
    console.log(`running ${file}`);
    await client.query(sql);
  }
  console.log("database migration complete");
} finally {
  await client.end();
}

function pgConfig(connectionString) {
  const host = new URL(connectionString).hostname;
  return {
    connectionString,
    ssl: host.endsWith(".pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
  };
}
