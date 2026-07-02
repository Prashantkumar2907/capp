import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types/database";

interface OnboardingBody {
  organization: {
    name: string;
    restaurant_type: string;
    gst_number?: string;
    default_tax_percent: number;
    tax_inclusive: boolean;
  };
  branch: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    upi_vpa?: string;
    table_count: number;
  };
  seedMenu: boolean;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as OnboardingBody;
  const server = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await server.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data: existing } = await admin.from("staff").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  const slug = `${slugify(body.organization.name)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: body.organization.name,
      slug,
      restaurant_type: body.organization.restaurant_type,
      gst_number: body.organization.gst_number || null,
      default_tax_percent: body.organization.default_tax_percent,
      tax_inclusive: body.organization.tax_inclusive,
    })
    .select("*")
    .single();

  if (orgError || !organization) {
    return NextResponse.json({ error: orgError?.message ?? "Unable to create organization" }, { status: 400 });
  }

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .insert({
      org_id: organization.id,
      name: body.branch.name,
      address: body.branch.address || null,
      city: body.branch.city || null,
      phone: body.branch.phone || null,
      upi_vpa: body.branch.upi_vpa || null,
      table_count: body.branch.table_count,
    })
    .select("*")
    .single();

  if (branchError || !branch) {
    return NextResponse.json({ error: branchError?.message ?? "Unable to create branch" }, { status: 400 });
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
    return NextResponse.json({ error: staffError.message }, { status: 400 });
  }

  await admin.from("tables").insert(
    Array.from({ length: body.branch.table_count }).map((_, index) => ({
      branch_id: branch.id,
      table_number: index + 1,
      label: `Table ${index + 1}`,
      capacity: 4,
    }))
  );

  if (body.seedMenu) {
    await seedStarterMenu(admin, organization.id, branch.id);
  }

  await admin.from("subscriptions").insert({ org_id: organization.id, plan: "starter", status: "trial" });

  return NextResponse.json({ ok: true, organizationId: organization.id, branchId: branch.id });
}

async function seedStarterMenu(admin: ReturnType<typeof createAdminSupabase>, orgId: string, branchId: string) {
  const categories = ["Starters", "Mains", "Breads", "Beverages"];
  const categoryRows: Category[] = [];

  for (let index = 0; index < categories.length; index += 1) {
    const { data } = await admin
      .from("categories")
      .insert({ org_id: orgId, name: categories[index], sort_order: index + 1 })
      .select("*")
      .single();
    if (data) categoryRows.push(data);
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
    const { data } = await admin.from("dishes").insert({ ...dish, org_id: orgId }).select("*").single();
    if (data) await admin.from("branch_dishes").insert({ branch_id: branchId, dish_id: data.id });
  }
}
