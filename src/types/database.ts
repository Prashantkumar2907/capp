export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & Pick<Organization, "name" | "slug">;
        Update: Partial<Organization>;
        Relationships: [];
      };
      branches: {
        Row: Branch;
        Insert: Partial<Branch> & Pick<Branch, "org_id" | "name">;
        Update: Partial<Branch>;
        Relationships: [
          { foreignKeyName: "branches_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ];
      };
      staff: {
        Row: Staff;
        Insert: Partial<Staff> & Pick<Staff, "org_id" | "role">;
        Update: Partial<Staff>;
        Relationships: [
          { foreignKeyName: "staff_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
        ];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "org_id" | "name">;
        Update: Partial<Category>;
        Relationships: [
          { foreignKeyName: "categories_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ];
      };
      dishes: {
        Row: Dish;
        Insert: Partial<Dish> & Pick<Dish, "org_id" | "name" | "price">;
        Update: Partial<Dish>;
        Relationships: [
          { foreignKeyName: "dishes_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "dishes_category_id_fkey"; columns: ["category_id"]; referencedRelation: "categories"; referencedColumns: ["id"] },
        ];
      };
      branch_dishes: {
        Row: BranchDish;
        Insert: Partial<BranchDish> & Pick<BranchDish, "branch_id" | "dish_id">;
        Update: Partial<BranchDish>;
        Relationships: [
          { foreignKeyName: "branch_dishes_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "branch_dishes_dish_id_fkey"; columns: ["dish_id"]; referencedRelation: "dishes"; referencedColumns: ["id"] },
        ];
      };
      tables: {
        Row: RestaurantTable;
        Insert: Partial<RestaurantTable> & Pick<RestaurantTable, "branch_id" | "table_number">;
        Update: Partial<RestaurantTable>;
        Relationships: [
          { foreignKeyName: "tables_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
        ];
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & Pick<Order, "branch_id" | "order_number">;
        Update: Partial<Order>;
        Relationships: [
          { foreignKeyName: "orders_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_waiter_id_fkey"; columns: ["waiter_id"]; referencedRelation: "staff"; referencedColumns: ["id"] },
        ];
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & Pick<OrderItem, "order_id" | "branch_id" | "dish_name" | "quantity" | "price_at_order">;
        Update: Partial<OrderItem>;
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_dish_id_fkey"; columns: ["dish_id"]; referencedRelation: "dishes"; referencedColumns: ["id"] },
        ];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, "order_id" | "branch_id" | "amount" | "method">;
        Update: Partial<Payment>;
        Relationships: [
          { foreignKeyName: "payments_order_id_fkey"; columns: ["order_id"]; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
        ];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> & Pick<Subscription, "org_id">;
        Update: Partial<Subscription>;
        Relationships: [
          { foreignKeyName: "subscriptions_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Partial<ActivityLog> & Pick<ActivityLog, "org_id" | "action">;
        Update: never;
        Relationships: [
          { foreignKeyName: "activity_logs_org_id_fkey"; columns: ["org_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "activity_logs_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "activity_logs_staff_id_fkey"; columns: ["staff_id"]; referencedRelation: "staff"; referencedColumns: ["id"] },
        ];
      };
      feedback: {
        Row: Feedback;
        Insert: Partial<Feedback> & Pick<Feedback, "branch_id" | "rating">;
        Update: never;
        Relationships: [
          { foreignKeyName: "feedback_order_id_fkey"; columns: ["order_id"]; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "feedback_branch_id_fkey"; columns: ["branch_id"]; referencedRelation: "branches"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      app_user_org_id: { Args: Record<string, never>; Returns: string | null };
      app_user_role: { Args: Record<string, never>; Returns: string | null };
      app_user_branch_id: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string;
  restaurant_type: string;
  gst_number: string | null;
  default_tax_percent: number;
  tax_inclusive: boolean;
  plan: string;
  subscription_status: string;
  settings: Json;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  upi_vpa: string | null;
  table_count: number;
  is_active: boolean;
  settings: Json;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  user_id: string | null;
  org_id: string;
  branch_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "owner" | "admin" | "manager" | "waiter" | "kitchen" | "cashier";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  org_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Dish = {
  id: string;
  org_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_active: boolean;
  tags: string[];
  prep_time_mins: number;
  created_at: string;
  updated_at: string;
};

export type BranchDish = {
  id: string;
  branch_id: string;
  dish_id: string;
  custom_price: number | null;
  is_available: boolean;
  created_at: string;
};

export type RestaurantTable = {
  id: string;
  branch_id: string;
  table_number: number;
  label: string | null;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "inactive";
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  branch_id: string;
  table_number: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  waiter_id: string | null;
  order_type: "dine_in" | "takeaway" | "delivery";
  order_source: "waiter" | "qr_customer" | "cashier";
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "paid" | "cancelled" | "refunded" | "failed";
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  branch_id: string;
  dish_id: string | null;
  dish_name: string;
  quantity: number;
  price_at_order: number;
  notes: string | null;
  status: "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  branch_id: string;
  amount: number;
  method: "upi" | "razorpay" | "cash" | "card";
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id: string | null;
  provider_data: Json;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  org_id: string | null;
  branch_id: string | null;
  staff_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
};

export type Feedback = {
  id: string;
  order_id: string | null;
  branch_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };
export type DishWithRelations = Dish & { categories?: Pick<Category, "name"> | null; branch_dishes?: BranchDish[] };
export type StaffRole = Staff["role"];
