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

export const orderStatuses = ["pending", "confirmed", "preparing", "ready", "served", "paid", "cancelled", "refunded", "failed"] as const;

export const operationalOrderStatuses = ["pending", "confirmed", "preparing", "ready", "served", "cancelled"] as const;

export const orderItemStatuses = ["pending", "accepted", "preparing", "ready", "served", "cancelled"] as const;

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

export const orderStatusFlow: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "served"];

export const paymentMethods = ["cash", "upi", "card", "razorpay"] as const;

export const paymentStatuses = ["pending", "completed", "failed", "refunded"] as const;

export const operationalListFetchLimit = 100;

export type Role = (typeof roles)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type OperationalOrderStatus = (typeof operationalOrderStatuses)[number];
export type OrderItemStatus = (typeof orderItemStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

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
