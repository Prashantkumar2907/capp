import type { OrderStatus } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/constants";

export type SummaryOrder = {
  id: string;
  order_number: string;
  table_number: number | null;
  order_source: "waiter" | "qr_customer" | "cashier";
  status: OrderStatus;
  total: number;
  created_at: string;
};

export type SummaryOrderItem = {
  dish_name: string;
  quantity: number;
  price_at_order: number;
  created_at: string;
};

export type SummaryPayment = {
  status: PaymentStatus;
  amount: number;
};

export type SummaryFeedback = {
  rating: number;
};

export type DashboardSummary = ReturnType<typeof buildDashboardSummary>;

export function buildDashboardSummary({
  orders,
  items,
  feedback,
  payments,
  now = new Date(),
}: {
  orders: SummaryOrder[];
  items: SummaryOrderItem[];
  feedback: SummaryFeedback[];
  payments: SummaryPayment[];
  now?: Date;
}) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((order) => new Date(order.created_at) >= today);
  const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const rangeRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const paid = payments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + payment.amount, 0);
  const averageRating = feedback.length ? feedback.reduce((sum, row) => sum + row.rating, 0) / feedback.length : 0;

  return {
    revenue,
    rangeRevenue,
    paid,
    ordersToday: todayOrders.length,
    ordersInRange: orders.length,
    activeOrders: orders.filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status)).length,
    averageOrder: todayOrders.length ? revenue / todayOrders.length : 0,
    rangeAverageOrder: orders.length ? rangeRevenue / orders.length : 0,
    averageRating,
    recentOrders: orders.slice(0, 6),
    topDishes: topDishes(items),
    dailyRevenue: dailyRevenue(orders),
    statusCounts: statusCounts(orders),
    sourceCounts: sourceCounts(orders),
  };
}

function topDishes(items: SummaryOrderItem[]) {
  const dishMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  items.forEach((item) => {
    const current = dishMap.get(item.dish_name) ?? { name: item.dish_name, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.quantity * item.price_at_order;
    dishMap.set(item.dish_name, current);
  });

  return [...dishMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
}

function dailyRevenue(orders: SummaryOrder[]) {
  const labels = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" });
  const map = new Map<string, { date: string; revenue: number; orders: number }>();

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    const key = date.toISOString().slice(0, 10);
    const current = map.get(key) ?? { date: labels.format(date), revenue: 0, orders: 0 };
    current.revenue += order.total;
    current.orders += 1;
    map.set(key, current);
  });

  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}

function statusCounts(orders: SummaryOrder[]) {
  const map = new Map<OrderStatus, number>();
  orders.forEach((order) => map.set(order.status, (map.get(order.status) ?? 0) + 1));
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function sourceCounts(orders: SummaryOrder[]) {
  const map = new Map<string, number>();
  orders.forEach((order) => {
    const source = order.order_source.replace("_", " ");
    map.set(source, (map.get(source) ?? 0) + 1);
  });
  return [...map.entries()].map(([source, orders]) => ({ source, orders }));
}
