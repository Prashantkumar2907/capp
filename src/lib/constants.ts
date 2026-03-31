// App constants

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "RestaurantOS";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Role constants
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  KITCHEN: "kitchen",
  WAITER: "waiter",
  CASHIER: "cashier",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  kitchen: "Kitchen Staff",
  waiter: "Waiter",
  cashier: "Cashier",
};

// Order status flow
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

// Item status
export const ITEM_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  CANCELLED: "cancelled",
} as const;

export const ITEM_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

// Payment
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_METHODS = {
  CASH: "cash",
  UPI: "upi",
  CARD: "card",
  RAZORPAY: "razorpay",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  razorpay: "Razorpay",
};

// Table status
export const TABLE_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  INACTIVE: "inactive",
} as const;

export const TABLE_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  occupied: "bg-red-100 text-red-800 border-red-300",
  reserved: "bg-yellow-100 text-yellow-800 border-yellow-300",
  inactive: "bg-gray-100 text-gray-500 border-gray-300",
};

// Subscription plans
export const PLANS = {
  STARTER: "starter",
  GROWTH: "growth",
  PRO: "pro",
} as const;

export const PLAN_LIMITS: Record<string, { branches: number; staff: number; dishes: number }> = {
  starter: { branches: 1, staff: 10, dishes: 100 },
  growth: { branches: 2, staff: 25, dishes: 300 },
  pro: { branches: 3, staff: 50, dishes: 500 },
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Order types
export const ORDER_TYPES = {
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  DELIVERY: "delivery",
} as const;

export const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

// Currency
export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";
