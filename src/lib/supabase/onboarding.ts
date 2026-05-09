import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { OnboardingInput } from "@/lib/validation/schemas";
import type { Database } from "@/types/database";

type OnboardingResult =
  | { ok: true; data: { organizationId: string | null; branchId: string | null; existing: boolean } }
  | { ok: false; status: number; code: string; message: string };

type AdminClient = SupabaseClient<Database>;

export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const server = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await server.auth.getUser();

  if (userError || !user) return failure(401, "AUTH_REQUIRED", "Sign in before creating a workspace");

  const admin = createAdminSupabase();
  const { data: existing } = await admin.from("staff").select("org_id, branch_id").eq("user_id", user.id).maybeSingle();
  if (existing) {
    return { ok: true, data: { organizationId: existing.org_id, branchId: existing.branch_id, existing: true } };
  }

  const slug = `${slugify(input.organization.name)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.organization.name,
      slug,
      restaurant_type: input.organization.restaurant_type,
      gst_number: input.organization.gst_number || null,
      default_tax_percent: input.organization.default_tax_percent,
      tax_inclusive: input.organization.tax_inclusive,
    })
    .select("*")
    .single();

  if (orgError || !organization) return failure(400, "ORGANIZATION_CREATE_FAILED", "Unable to create restaurant workspace");

  const rollback = () => rollbackOrganization(admin, organization.id);
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .insert({
      org_id: organization.id,
      name: input.branch.name,
      address: input.branch.address || null,
      city: input.branch.city || null,
      phone: input.branch.phone || null,
      upi_vpa: input.branch.upi_vpa || null,
      table_count: input.branch.table_count,
    })
    .select("*")
    .single();

  if (branchError || !branch) {
    await rollback();
    return failure(400, "BRANCH_CREATE_FAILED", "Unable to create first branch");
  }

  const fullName = String(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Owner");
  const { error: staffError } = await admin.from("staff").insert({
    user_id: user.id,
    org_id: organization.id,
    branch_id: branch.id,
    full_name: fullName,
    email: user.email,
    role: "owner",
  });

  if (staffError) {
    await rollback();
    return failure(400, "OWNER_STAFF_CREATE_FAILED", "Unable to create owner staff profile");
  }

  const { error: tablesError } = await admin.from("tables").insert(
    Array.from({ length: input.branch.table_count }).map((_, index) => ({
      branch_id: branch.id,
      table_number: index + 1,
      label: `Table ${index + 1}`,
      capacity: 4,
    }))
  );

  if (tablesError) {
    await rollback();
    return failure(400, "TABLES_CREATE_FAILED", "Unable to create starter tables");
  }

  if (input.seedMenu) {
    const seedResult = await seedStarterMenu(admin, organization.id, branch.id);
    if (!seedResult.ok) {
      await rollback();
      return seedResult;
    }
  }

  const { error: subscriptionError } = await admin.from("subscriptions").insert({ org_id: organization.id, plan: "starter", status: "trial" });
  if (subscriptionError) {
    await rollback();
    return failure(400, "SUBSCRIPTION_CREATE_FAILED", "Unable to initialize subscription");
  }

  return { ok: true, data: { organizationId: organization.id, branchId: branch.id, existing: false } };
}

async function seedStarterMenu(admin: AdminClient, orgId: string, branchId: string): Promise<OnboardingResult> {
  const categories = ["Starters", "Mains", "Breads", "Beverages"];
  const categoryRows: Array<{ id: string; name: string }> = [];

  for (let index = 0; index < categories.length; index += 1) {
    const { data, error } = await admin
      .from("categories")
      .insert({ org_id: orgId, name: categories[index], sort_order: index + 1 })
      .select("id, name")
      .single();
    if (error || !data) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to create starter menu categories");
    categoryRows.push(data);
  }

  const categoryId = (name: string) => categoryRows.find((row) => row.name === name)?.id ?? null;
  const dishes = [
    { name: "Paneer Tikka", price: 260, category_id: categoryId("Starters"), is_veg: true, prep_time_mins: 18 },
    { name: "Chicken 65", price: 320, category_id: categoryId("Starters"), is_veg: false, prep_time_mins: 22 },
    { name: "Dal Makhani", price: 280, category_id: categoryId("Mains"), is_veg: true, prep_time_mins: 30 },
    { name: "Butter Chicken", price: 390, category_id: categoryId("Mains"), is_veg: false, prep_time_mins: 28 },
    { name: "Garlic Naan", price: 70, category_id: categoryId("Breads"), is_veg: true, prep_time_mins: 8 },
    { name: "Mango Lassi", price: 130, category_id: categoryId("Beverages"), is_veg: true, prep_time_mins: 4 },
  ];

  for (const dish of dishes) {
    const { data, error } = await admin.from("dishes").insert({ ...dish, org_id: orgId }).select("id").single();
    if (error || !data) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to create starter menu dishes");

    const { error: branchDishError } = await admin.from("branch_dishes").insert({ branch_id: branchId, dish_id: data.id });
    if (branchDishError) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to enable starter menu for this branch");
  }

  return { ok: true, data: { organizationId: orgId, branchId, existing: false } };
}

async function rollbackOrganization(admin: AdminClient, organizationId: string) {
  await admin.from("organizations").delete().eq("id", organizationId);
}

function failure(status: number, code: string, message: string): OnboardingResult & { ok: false } {
  return { ok: false, status, code, message };
}
