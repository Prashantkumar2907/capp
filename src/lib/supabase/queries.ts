import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DishWithRelations, OrderWithItems } from "@/types/database";

export type TypedSupabase = SupabaseClient<Database>;

export async function getDashboardSummary(supabase: TypedSupabase, branchId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, items, feedback, payments] = await Promise.all([
    supabase.from("orders").select("*").eq("branch_id", branchId).gte("created_at", since).order("created_at", { ascending: false }),
    supabase.from("order_items").select("*").eq("branch_id", branchId).gte("created_at", since),
    supabase.from("feedback").select("*").eq("branch_id", branchId).gte("created_at", since),
    supabase.from("payments").select("*").eq("branch_id", branchId).gte("created_at", since),
  ]);

  if (orders.error) throw orders.error;
  if (items.error) throw items.error;
  if (feedback.error) throw feedback.error;
  if (payments.error) throw payments.error;

  const allOrders = orders.data ?? [];
  const allItems = items.data ?? [];
  const allFeedback = feedback.data ?? [];
  const allPayments = payments.data ?? [];
  const todayOrders = allOrders.filter((order) => new Date(order.created_at) >= today);
  const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const paid = allPayments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageRating = allFeedback.length ? allFeedback.reduce((sum, row) => sum + row.rating, 0) / allFeedback.length : 0;

  const dishMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  allItems.forEach((item) => {
    const current = dishMap.get(item.dish_name) ?? { name: item.dish_name, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.quantity * Number(item.price_at_order);
    dishMap.set(item.dish_name, current);
  });

  return {
    revenue,
    paid,
    ordersToday: todayOrders.length,
    activeOrders: allOrders.filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status)).length,
    averageOrder: todayOrders.length ? revenue / todayOrders.length : 0,
    averageRating,
    recentOrders: allOrders.slice(0, 6),
    topDishes: [...dishMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    orders: allOrders,
    payments: allPayments,
  };
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
    .in("status", ["pending", "confirmed", "preparing", "ready", "served"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithItems[];
}
