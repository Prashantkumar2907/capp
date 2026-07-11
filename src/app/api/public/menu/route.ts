import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Branch, Category, Dish, DishAddon, DishVariant, RestaurantTable } from "@/types/database";

type BranchDishRow = {
  custom_price: number | null;
  is_available: boolean;
  dishes: (Dish & { categories: Pick<Category, "name"> | null; dish_variants?: DishVariant[]; dish_addons?: DishAddon[] }) | null;
};

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branchId");
  const tableNumber = Number(request.nextUrl.searchParams.get("tableNumber") ?? 0);

  if (!branchId) {
    return NextResponse.json({ error: "branchId is required" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("*, organizations(name, default_tax_percent, tax_inclusive, service_charge_percent, gst_scheme)")
    .eq("id", branchId)
    .eq("is_active", true)
    .single();

  if (branchError || !branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const [{ data: table }, { data: categories }, { data: branchDishes, error: menuError }] = await Promise.all([
    tableNumber
      ? admin.from("tables").select("*").eq("branch_id", branchId).eq("table_number", tableNumber).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("categories").select("*").eq("org_id", (branch as Branch).org_id).eq("is_active", true).order("sort_order"),
    admin
      .from("branch_dishes")
      .select("custom_price, is_available, dishes(*, categories(name), dish_variants(*), dish_addons(*))")
      .eq("branch_id", branchId)
      .eq("is_available", true)
      .order("created_at", { ascending: true }),
  ]);

  if (menuError) {
    return NextResponse.json({ error: menuError.message }, { status: 400 });
  }

  const dishes = ((branchDishes ?? []) as BranchDishRow[])
    .map((row) => {
      if (!row.dishes || !row.dishes.is_active) return null;
      return {
        ...row.dishes,
        price: Number(row.custom_price ?? row.dishes.price),
        categories: row.dishes.categories,
        dish_variants: (row.dishes.dish_variants ?? []).filter((variant) => variant.is_available),
        dish_addons: (row.dishes.dish_addons ?? []).filter((addon) => addon.is_available),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    branch: branch as Branch & { organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null },
    table: table as RestaurantTable | null,
    categories: categories ?? [],
    dishes,
  });
}
