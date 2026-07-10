import type {
  Branch,
  BranchDish,
  Dish,
  Order,
  OrderItem,
  Organization,
  Payment,
} from "@/types/database";

export type BranchOrgSummary = Pick<
  Organization,
  "name" | "logo_url" | "default_tax_percent" | "tax_inclusive"
> & {
  accent_color?: string | null;
};

export type BranchWithOrganization = Branch & {
  organizations?: BranchOrgSummary | BranchOrgSummary[] | null;
};

export type DishCategorySummary = {
  name: string | null;
};

export type DishBranchOverride = Pick<
  BranchDish,
  "custom_price" | "is_available"
>;

export type DishWithRelations = Dish & {
  categories?: DishCategorySummary | DishCategorySummary[] | null;
  branch_dishes?: DishBranchOverride[] | null;
};

export type OrderItemSummary = Pick<
  OrderItem,
  "id" | "dish_name" | "quantity" | "price_at_order" | "notes" | "status"
>;

export type OrderWithItems = Order & {
  order_items?: OrderItemSummary[] | null;
};

export type PaymentWithOrder = Payment & {
  orders?: Pick<Order, "order_number" | "table_number"> | null;
};

export type ReceiptOrder = Order & {
  order_items?: OrderItemSummary[] | null;
  branches?: (Pick<Branch, "name"> & {
    organizations?: Pick<Organization, "name"> | null;
  }) | null;
};

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function getDishCategoryName(dish: DishWithRelations): string {
  return firstRelation(dish.categories)?.name || "Uncategorized";
}

export function getBranchOrganization(
  branch: BranchWithOrganization | null | undefined
): BranchOrgSummary | null {
  return firstRelation(branch?.organizations);
}

export function getDishPrice(dish: DishWithRelations): number {
  const override = dish.branch_dishes?.[0]?.custom_price;
  return override != null ? Number(override) : Number(dish.price);
}
