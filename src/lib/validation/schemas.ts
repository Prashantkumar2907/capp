import { z } from "zod";
import { operationalOrderStatuses, roles } from "@/lib/constants";

export const dbUuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID");

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const signUpSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export const organizationSchema = z.object({
  name: z.string().min(2).max(100),
  restaurant_type: z.string().min(2).max(50),
  gst_number: z.string().max(30).optional(),
  default_tax_percent: z.number().min(0).max(28),
  tax_inclusive: z.boolean(),
});

export const branchSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(240).optional(),
  city: z.string().max(80).optional(),
  phone: z.string().max(24).optional(),
  upi_vpa: z.string().max(120).optional(),
  table_count: z.number().int().min(1).max(200),
});

export const branchUpdateSchema = branchSchema
  .extend({ is_active: z.boolean().optional() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one branch field is required");

export const staffSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.email(),
  phone: z.string().max(24).optional(),
  role: z.enum(roles.filter((role) => role !== "owner") as ["admin", "manager", "waiter", "kitchen", "cashier"]),
  branch_id: dbUuidSchema.nullable().optional(),
});

export const staffUpdateSchema = staffSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one staff field is required");

export const categorySchema = z.object({
  name: z.string().min(2).max(60),
  sort_order: z.number().int().min(0).max(999),
  is_active: z.boolean(),
});

export const dishSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.number().min(0).max(100000),
  category_id: dbUuidSchema.nullable().optional(),
  branch_id: dbUuidSchema.nullable().optional(),
  image_url: z.url().max(500).nullable().optional(),
  is_veg: z.boolean(),
  is_active: z.boolean(),
  prep_time_mins: z.number().int().min(1).max(240),
});

export const dishUpdateSchema = dishSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one dish field is required");

export const tableSchema = z.object({
  label: z.string().max(80).optional(),
  capacity: z.number().int().min(1).max(40),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(600).optional(),
});

export const publicMenuQuerySchema = z.object({
  branchId: dbUuidSchema,
  tableNumber: z.coerce.number().int().min(1).max(1000).optional(),
});

export const publicReceiptQuerySchema = z.object({
  orderId: dbUuidSchema,
});

export const publicFeedbackSchema = feedbackSchema.extend({
  orderId: dbUuidSchema,
  branchId: dbUuidSchema,
});

export const createOrderSchema = z.object({
  branchId: dbUuidSchema,
  tableNumber: z.number().int().min(1).max(1000).nullable().optional(),
  customerName: z.string().trim().min(1).max(80).optional(),
  customerPhone: z.string().trim().min(3).max(24).optional(),
  clientRequestId: z.string().trim().min(12).max(96).regex(/^[a-z0-9:_-]+$/i, "Invalid request id").optional(),
  orderType: z.enum(["dine_in", "takeaway", "delivery"]).default("dine_in"),
  orderSource: z.enum(["waiter", "qr_customer", "cashier"]).default("qr_customer"),
  notes: z.string().trim().max(500).optional(),
  items: z.array(
    z.object({
      dish_id: dbUuidSchema,
      quantity: z.number().int().min(1).max(50),
      notes: z.string().trim().max(240).optional(),
    })
  ).min(1).max(80),
});

export const paymentSettlementSchema = z.object({
  status: z.enum(["completed", "failed"]),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(operationalOrderStatuses),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type DishInput = z.infer<typeof dishSchema>;
export type DishUpdateInput = z.infer<typeof dishUpdateSchema>;
export type PaymentSettlementInput = z.infer<typeof paymentSettlementSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type PublicMenuQueryInput = z.infer<typeof publicMenuQuerySchema>;
export type PublicReceiptQueryInput = z.infer<typeof publicReceiptQuerySchema>;
export type PublicFeedbackInput = z.infer<typeof publicFeedbackSchema>;
