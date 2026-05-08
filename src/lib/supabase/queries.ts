import type { SupabaseClient } from "@supabase/supabase-js";
import { orderStatuses } from "@/lib/constants";
import { buildDashboardSummary } from "@/lib/analytics/dashboard-summary";
import type { Database, DishWithRelations, OrderWithItems } from "@/types/database";

export type TypedSupabase = SupabaseClient<Database>;

export async function getDashboardSummary(supabase: TypedSupabase, branchId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, items, feedback, payments] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, table_number, order_source, status, total, created_at")
      .eq("branch_id", branchId)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase.from("order_items").select("dish_name, quantity, price_at_order, created_at").eq("branch_id", branchId).gte("created_at", since),
    supabase.from("feedback").select("rating").eq("branch_id", branchId).gte("created_at", since),
    supabase.from("payments").select("status, amount").eq("branch_id", branchId).gte("created_at", since),
  ]);

  if (orders.error) throw orders.error;
  if (items.error) throw items.error;
  if (feedback.error) throw feedback.error;
  if (payments.error) throw payments.error;

  return buildDashboardSummary({
    orders: (orders.data ?? []).map((order) => ({ ...order, total: Number(order.total) })),
    items: (items.data ?? []).map((item) => ({ ...item, price_at_order: Number(item.price_at_order) })),
    feedback: feedback.data ?? [],
    payments: (payments.data ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    now: today,
  });
}

export async function getBranchMenu(supabase: TypedSupabase, orgId: string) {
  const [{ data: categories, error: categoryError }, { data: dishes, error: dishError }] = await Promise.all([
    supabase.from("categories").select("*").eq("org_id", orgId).order("sort_order"),
    supabase.from("dishes").select("*, categories(name), branch_dishes(*)").eq("org_id", orgId).order("name"),
  ]);
  if (categoryError) throw categoryError;
  if (dishError) throw dishError;
  return { categories: categories ?? [], dishes: (dishes ?? []) as DishWithRelations[] };
}

export async function getOrdersWithItems(supabase: TypedSupabase, branchId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("branch_id", branchId)
    .in("status", [...orderStatuses])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithItems[];
}
