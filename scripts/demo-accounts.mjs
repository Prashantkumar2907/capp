import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const action = process.argv.includes("--create") ? "create" : process.argv.includes("--remove") ? "remove" : "dry-run";
const demoDomain = "demo.capp.local";
const demoUsers = [
  { email: "owner.lotus@demo.capp.local", name: "Demo Cafe Owner" },
  { email: "admin.masala@demo.capp.local", name: "Demo Admin" },
  { email: "manager.harbour@demo.capp.local", name: "Demo Manager" },
  { email: "waiter.masala@demo.capp.local", name: "Demo Waiter" },
  { email: "kitchen.harbour@demo.capp.local", name: "Demo Kitchen Lead" },
  { email: "cashier.nightowl@demo.capp.local", name: "Demo Cashier" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
const allowMutation = process.env.ALLOW_DEMO_ACCOUNT_MUTATION === "1" || new URL(supabaseUrl ?? "http://localhost").hostname === "localhost";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or service role key");
}

if (action === "create" && (!demoPassword || demoPassword.length < 12)) {
  throw new Error("DEMO_ACCOUNT_PASSWORD must be at least 12 characters for demo account creation");
}

if (action !== "dry-run" && !allowMutation) {
  throw new Error("Refusing to mutate demo auth accounts without ALLOW_DEMO_ACCOUNT_MUTATION=1");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (action === "dry-run") {
  console.log(`Demo account dry run: ${demoUsers.length} ${demoDomain} accounts are configured.`);
  console.log("Use --create with DEMO_ACCOUNT_PASSWORD for disposable QA accounts, then --remove after testing.");
  process.exit(0);
}

if (action === "create") {
  for (const user of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { name: user.name, demo: true },
    });

    if (error && !alreadyRegistered(error.message)) {
      throw new Error(`Unable to create ${user.email}: ${error.message}`);
    }

    const authUser = data.user ?? (await findAuthUser(user.email));
    if (!authUser) throw new Error(`Unable to locate auth user for ${user.email}`);

    const { error: staffError } = await supabase.from("staff").update({ user_id: authUser.id }).eq("email", user.email);
    if (staffError) throw new Error(`Unable to link ${user.email}: ${staffError.message}`);
  }

  console.log(`Created or linked ${demoUsers.length} disposable demo accounts for ${demoDomain}.`);
}

if (action === "remove") {
  for (const user of demoUsers) {
    const authUser = await findAuthUser(user.email);
    await supabase.from("staff").update({ user_id: null }).eq("email", user.email);
    if (authUser) {
      const { error } = await supabase.auth.admin.deleteUser(authUser.id);
      if (error) throw new Error(`Unable to delete ${user.email}: ${error.message}`);
    }
  }

  console.log(`Removed disposable demo accounts for ${demoDomain}.`);
}

async function findAuthUser(email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`Unable to list auth users: ${error.message}`);
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

function alreadyRegistered(message) {
  return /already|registered|exists/i.test(message);
}
