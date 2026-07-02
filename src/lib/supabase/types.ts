export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          logo_url: string | null;
          plan: string;
          gst_number: string | null;
          default_tax_percent: number;
          tax_inclusive: boolean;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          logo_url?: string | null;
          plan?: string;
          gst_number?: string | null;
          default_tax_percent?: number;
          tax_inclusive?: boolean;
          subscription_status?: string;
        };
        Update: {
          name?: string;
          slug?: string | null;
          logo_url?: string | null;
          plan?: string;
          gst_number?: string | null;
          default_tax_percent?: number;
          tax_inclusive?: boolean;
          subscription_status?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          address: string | null;
          city: string | null;
          phone: string | null;
          upi_vpa: string | null;
          table_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          upi_vpa?: string | null;
          table_count?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          upi_vpa?: string | null;
          table_count?: number;
          is_active?: boolean;
        };
      };
      staff: {
        Row: {
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
        Insert: {
          id?: string;
          user_id?: string | null;
          org_id: string;
          branch_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role: "owner" | "admin" | "manager" | "waiter" | "kitchen" | "cashier";
          is_active?: boolean;
        };
        Update: {
          branch_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: "owner" | "admin" | "manager" | "waiter" | "kitchen" | "cashier";
          is_active?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      dishes: {
        Row: {
          id: string;
          org_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_veg: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_veg?: boolean;
          is_active?: boolean;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_veg?: boolean;
          is_active?: boolean;
        };
      };
      branch_dishes: {
        Row: {
          id: string;
          branch_id: string;
          dish_id: string;
          custom_price: number | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          dish_id: string;
          custom_price?: number | null;
          is_available?: boolean;
        };
        Update: {
          custom_price?: number | null;
          is_available?: boolean;
        };
      };
      tables: {
        Row: {
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
        Insert: {
          id?: string;
          branch_id: string;
          table_number: number;
          label?: string | null;
          capacity?: number;
          status?: "available" | "occupied" | "reserved" | "inactive";
          qr_code_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          table_number?: number;
          label?: string | null;
          capacity?: number;
          status?: "available" | "occupied" | "reserved" | "inactive";
          qr_code_url?: string | null;
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          branch_id: string;
          table_number: number | null;
          customer_name: string | null;
          customer_phone: string | null;
          waiter_id: string | null;
          order_type: "dine_in" | "takeaway" | "delivery";
          status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";
          subtotal: number;
          tax: number;
          discount: number;
          total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          branch_id: string;
          table_number?: number | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          waiter_id?: string | null;
          order_type?: "dine_in" | "takeaway" | "delivery";
          status?: "pending" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";
          subtotal?: number;
          tax?: number;
          discount?: number;
          total?: number;
          notes?: string | null;
        };
        Update: {
          table_number?: number | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          waiter_id?: string | null;
          order_type?: "dine_in" | "takeaway" | "delivery";
          status?: "pending" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";
          subtotal?: number;
          tax?: number;
          discount?: number;
          total?: number;
          notes?: string | null;
        };
      };
      order_items: {
        Row: {
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
        Insert: {
          id?: string;
          order_id: string;
          branch_id: string;
          dish_id?: string | null;
          dish_name: string;
          quantity?: number;
          price_at_order: number;
          notes?: string | null;
          status?: "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
        };
        Update: {
          quantity?: number;
          price_at_order?: number;
          notes?: string | null;
          status?: "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          branch_id: string;
          amount: number;
          method: "upi" | "razorpay" | "cash" | "card";
          status: "pending" | "completed" | "failed" | "refunded";
          transaction_id: string | null;
          provider_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          branch_id: string;
          amount: number;
          method: "upi" | "razorpay" | "cash" | "card";
          status?: "pending" | "completed" | "failed" | "refunded";
          transaction_id?: string | null;
          provider_data?: Json | null;
        };
        Update: {
          amount?: number;
          method?: "upi" | "razorpay" | "cash" | "card";
          status?: "pending" | "completed" | "failed" | "refunded";
          transaction_id?: string | null;
          provider_data?: Json | null;
        };
      };
      subscriptions: {
        Row: {
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
        Insert: {
          id?: string;
          org_id: string;
          plan: string;
          status?: string;
          razorpay_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          plan?: string;
          status?: string;
          razorpay_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          org_id: string;
          branch_id: string | null;
          staff_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          branch_id?: string | null;
          staff_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
        };
        Update: never;
      };
      feedback: {
        Row: {
          id: string;
          order_id: string | null;
          branch_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          branch_id?: string | null;
          rating: number;
          comment?: string | null;
        };
        Update: never;
      };
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_branch_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Commonly used types
export type Organization = Tables<"organizations">;
export type Branch = Tables<"branches">;
export type Staff = Tables<"staff">;
export type Category = Tables<"categories">;
export type Dish = Tables<"dishes">;
export type BranchDish = Tables<"branch_dishes">;
export type TableRow = Tables<"tables">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Payment = Tables<"payments">;
export type Subscription = Tables<"subscriptions">;
export type ActivityLog = Tables<"activity_logs">;
export type Feedback = Tables<"feedback">;

export type StaffRole = Staff["role"];

// Extended types with relations
export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export type DishWithCategory = Dish & {
  categories?: { name: string } | null;
};

export type DishWithBranchOverride = Dish & {
  branch_dishes?: BranchDish[];
  categories?: { name: string } | null;
};
