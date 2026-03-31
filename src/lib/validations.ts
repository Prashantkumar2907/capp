import { z } from "zod";

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Organization
export const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name is required").max(100),
  gst_number: z.string().optional(),
  default_tax_percent: z.number().min(0).max(100).default(5),
  tax_inclusive: z.boolean().default(true),
});

// Branch
export const createBranchSchema = z.object({
  name: z.string().min(2, "Branch name is required").max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  upi_vpa: z.string().optional(),
  table_count: z.number().int().min(1).max(200).default(10),
});

// Category
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

// Dish
export const dishSchema = z.object({
  name: z.string().min(1, "Dish name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Price must be positive"),
  category_id: z.string().uuid().nullable().optional(),
  is_veg: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

// Staff
export const inviteStaffSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "kitchen", "waiter", "cashier"]),
  branch_id: z.string().uuid("Select a branch"),
});

// Order
export const createOrderSchema = z.object({
  table_number: z.number().int().optional(),
  order_type: z.enum(["dine_in", "takeaway", "delivery"]).default("dine_in"),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(
    z.object({
      dish_id: z.string().uuid(),
      dish_name: z.string(),
      quantity: z.number().int().min(1).max(99),
      price_at_order: z.number().min(0),
      notes: z.string().optional(),
    })
  ).min(1, "Add at least one item"),
});

// Payment
export const markPaymentSchema = z.object({
  order_id: z.string().uuid(),
  method: z.enum(["cash", "upi", "card", "razorpay"]),
  amount: z.number().min(0),
  transaction_id: z.string().optional(),
});

// Table
export const tableSchema = z.object({
  table_number: z.number().int().min(1),
  capacity: z.number().int().min(1).max(20).default(4),
});

// Feedback
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Export inferred types
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type DishInput = z.infer<typeof dishSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MarkPaymentInput = z.infer<typeof markPaymentSchema>;
export type TableInput = z.infer<typeof tableSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
