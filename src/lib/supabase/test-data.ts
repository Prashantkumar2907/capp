// Test/mock data for development without a running Supabase instance
// Enable by setting NEXT_PUBLIC_TEST_MODE=true in .env.local

const orgId = "org-test-001";
const branchId = "branch-test-001";
const staffId = "staff-test-001";
const userId = "user-test-001";

export const TEST_USER = {
  id: userId,
  email: "owner@demo.com",
  app_metadata: {},
  user_metadata: { full_name: "Demo Owner" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export const TEST_ORG = {
  id: orgId,
  name: "Demo Restaurant",
  slug: "demo-restaurant",
  logo_url: null,
  plan: "pro",
  gst_number: "22AAAAA0000A1Z5",
  default_tax_percent: 5,
  tax_inclusive: false,
  subscription_status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_BRANCH = {
  id: branchId,
  org_id: orgId,
  name: "Main Branch",
  address: "123 Food Street",
  city: "Mumbai",
  phone: "+919876543210",
  upi_vpa: "demo@upi",
  table_count: 10,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_STAFF = {
  id: staffId,
  user_id: userId,
  org_id: orgId,
  branch_id: branchId,
  full_name: "Demo Owner",
  email: "owner@demo.com",
  phone: "+919876543210",
  role: "owner" as const,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_CATEGORIES = [
  { id: "cat-1", org_id: orgId, name: "Starters", sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: "cat-2", org_id: orgId, name: "Main Course", sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: "cat-3", org_id: orgId, name: "Beverages", sort_order: 3, is_active: true, created_at: new Date().toISOString() },
];

export const TEST_DISHES = [
  { id: "dish-1", org_id: orgId, category_id: "cat-1", name: "Paneer Tikka", description: "Grilled cottage cheese with spices", price: 249, image_url: null, is_veg: true, is_active: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "dish-2", org_id: orgId, category_id: "cat-1", name: "Chicken 65", description: "Spicy deep-fried chicken", price: 299, image_url: null, is_veg: false, is_active: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "dish-3", org_id: orgId, category_id: "cat-2", name: "Dal Makhani", description: "Creamy black lentils", price: 199, image_url: null, is_veg: true, is_active: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "dish-4", org_id: orgId, category_id: "cat-2", name: "Butter Chicken", description: "Creamy tomato-based chicken curry", price: 349, image_url: null, is_veg: false, is_active: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "dish-5", org_id: orgId, category_id: "cat-3", name: "Mango Lassi", description: "Sweet mango yogurt drink", price: 99, image_url: null, is_veg: true, is_active: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const TEST_TABLES = [
  { id: "tbl-1", branch_id: branchId, table_number: 1, capacity: 4, status: "available" as const, qr_code_url: null, is_active: true, created_at: new Date().toISOString() },
  { id: "tbl-2", branch_id: branchId, table_number: 2, capacity: 2, status: "occupied" as const, qr_code_url: null, is_active: true, created_at: new Date().toISOString() },
  { id: "tbl-3", branch_id: branchId, table_number: 3, capacity: 6, status: "available" as const, qr_code_url: null, is_active: true, created_at: new Date().toISOString() },
  { id: "tbl-4", branch_id: branchId, table_number: 4, capacity: 4, status: "reserved" as const, qr_code_url: null, is_active: true, created_at: new Date().toISOString() },
  { id: "tbl-5", branch_id: branchId, table_number: 5, capacity: 8, status: "available" as const, qr_code_url: null, is_active: true, created_at: new Date().toISOString() },
];

export const TEST_ORDERS = [
  {
    id: "order-1",
    order_number: "ORD-001",
    branch_id: branchId,
    table_number: 2,
    customer_name: "John Doe",
    customer_phone: "+919999999999",
    waiter_id: staffId,
    order_type: "dine_in" as const,
    status: "preparing" as const,
    subtotal: 548,
    tax: 27.4,
    discount: 0,
    total: 575.4,
    notes: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { id: "oi-1", order_id: "order-1", branch_id: branchId, dish_id: "dish-1", dish_name: "Paneer Tikka", quantity: 1, price_at_order: 249, notes: null, status: "preparing" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "oi-2", order_id: "order-1", branch_id: branchId, dish_id: "dish-3", dish_name: "Dal Makhani", quantity: 1, price_at_order: 199, notes: "Extra spicy", status: "ready" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "oi-3", order_id: "order-1", branch_id: branchId, dish_id: "dish-5", dish_name: "Mango Lassi", quantity: 1, price_at_order: 99, notes: null, status: "pending" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
  },
  {
    id: "order-2",
    order_number: "ORD-002",
    branch_id: branchId,
    table_number: 4,
    customer_name: "Jane Smith",
    customer_phone: "+918888888888",
    waiter_id: null,
    order_type: "dine_in" as const,
    status: "confirmed" as const,
    subtotal: 648,
    tax: 32.4,
    discount: 50,
    total: 630.4,
    notes: "Birthday celebration",
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { id: "oi-4", order_id: "order-2", branch_id: branchId, dish_id: "dish-2", dish_name: "Chicken 65", quantity: 1, price_at_order: 299, notes: null, status: "pending" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "oi-5", order_id: "order-2", branch_id: branchId, dish_id: "dish-4", dish_name: "Butter Chicken", quantity: 1, price_at_order: 349, notes: "Mild spice", status: "accepted" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
  },
];

export const TEST_PAYMENTS = [
  {
    id: "pay-1",
    order_id: "order-1",
    branch_id: branchId,
    amount: 575.4,
    method: "upi" as const,
    status: "completed" as const,
    transaction_id: "UPI-TXN-12345",
    provider_data: null,
    created_at: new Date(Date.now() - 1700000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pay-2",
    order_id: "order-2",
    branch_id: branchId,
    amount: 630.4,
    method: "cash" as const,
    status: "pending" as const,
    transaction_id: null,
    provider_data: null,
    created_at: new Date(Date.now() - 800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const TEST_DAILY_STATS = [
  { date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0], revenue: 12500, orders: 28 },
  { date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], revenue: 15800, orders: 35 },
  { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], revenue: 11200, orders: 22 },
  { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], revenue: 18900, orders: 42 },
  { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], revenue: 16400, orders: 38 },
  { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], revenue: 20100, orders: 45 },
  { date: new Date().toISOString().split("T")[0], revenue: 8700, orders: 19 },
];
