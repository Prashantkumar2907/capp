export const appName = "CAPP";

export const roles = ["owner", "admin", "manager", "waiter", "kitchen", "cashier"] as const;

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  waiter: "Waiter",
  kitchen: "Kitchen",
  cashier: "Cashier",
};

export const orderStatuses = ["pending", "confirmed", "preparing", "ready", "served", "cancelled"] as const;

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

export const orderStatusFlow: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "served"];

export const orderStatusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  ready: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  served: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

export const itemStatuses = ["pending", "accepted", "preparing", "ready", "served", "cancelled"] as const;

export const itemStatusLabels: Record<ItemStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

export const paymentMethods = ["cash", "upi", "card", "razorpay"] as const;

export const paymentStatuses = ["pending", "completed", "failed", "refunded"] as const;

export type Role = (typeof roles)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type ItemStatus = (typeof itemStatuses)[number];

export const roleAccess = {
  dashboard: roles,
  analytics: ["owner", "admin", "manager", "cashier"],
  branches: ["owner", "admin"],
  staff: ["owner", "admin"],
  menu: ["owner", "admin", "manager"],
  tables: ["owner", "admin", "manager", "waiter"],
  orders: ["owner", "admin", "manager", "waiter", "cashier", "kitchen"],
  kitchen: ["owner", "admin", "manager", "kitchen"],
  waiter: ["owner", "admin", "manager", "waiter"],
  payments: ["owner", "admin", "manager", "cashier"],
  settings: roles,
} satisfies Record<string, readonly Role[]>;
