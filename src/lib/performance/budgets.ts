export const CRITICAL_VIEWPORTS = ["desktop", "tablet", "mobile"] as const;

export type CriticalViewport = (typeof CRITICAL_VIEWPORTS)[number];

export type PerformancePersona =
  | "public_customer"
  | "owner"
  | "admin"
  | "manager"
  | "waiter"
  | "kitchen"
  | "cashier"
  | "platform_admin";

export type TrustBoundary =
  | "server_menu_prices"
  | "server_order_totals"
  | "server_payment_status"
  | "server_platform_admin"
  | "server_role_permissions"
  | "server_tenant_scope"
  | "webhook_signature";

export type CriticalRouteId =
  | "public-qr-menu"
  | "public-qr-payment"
  | "dashboard-overview"
  | "dashboard-analytics"
  | "kitchen-display"
  | "waiter-pos"
  | "cashier-payments"
  | "staff-management"
  | "menu-management"
  | "platform-admin";

export type PerformanceBudget = {
  readonly id: CriticalRouteId;
  readonly routePattern: string;
  readonly workflow: string;
  readonly personas: readonly PerformancePersona[];
  readonly maxInitialJsKb: number;
  readonly maxApiP95Ms: number;
  readonly maxImageKb: number;
  readonly maxDuplicateFetches: number;
  readonly maxMutationRequestsPerIntent: number;
  readonly requiresSkeleton: boolean;
  readonly requiresEmptyState: boolean;
  readonly requiresErrorState: boolean;
  readonly requiresServerPagination: boolean;
  readonly cacheKey: string;
  readonly indexedHotPaths: readonly string[];
  readonly trustBoundaries: readonly TrustBoundary[];
  readonly viewports: readonly CriticalViewport[];
};

export const PERFORMANCE_BUDGETS = [
  {
    id: "public-qr-menu",
    routePattern: "/order/[branchId]/[tableNumber]",
    workflow: "Customer scans table QR, browses menu, and builds a cart",
    personas: ["public_customer"],
    maxInitialJsKb: 190,
    maxApiP95Ms: 650,
    maxImageKb: 140,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 0,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "public-menu:{branchId}:{tableNumber}",
    indexedHotPaths: ["idx_branch_dishes_branch", "idx_tables_branch", "idx_categories_org_sort"],
    trustBoundaries: ["server_menu_prices", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "public-qr-payment",
    routePattern: "/order/[branchId]/[tableNumber]/payment",
    workflow: "Customer reviews cart and submits one idempotent order",
    personas: ["public_customer"],
    maxInitialJsKb: 200,
    maxApiP95Ms: 750,
    maxImageKb: 100,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "cart:{branchId}:{tableNumber}",
    indexedHotPaths: ["idx_orders_branch_client_request", "idx_orders_branch_created", "idx_orders_branch_table_active"],
    trustBoundaries: ["server_order_totals", "server_menu_prices", "server_payment_status", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "dashboard-overview",
    routePattern: "/dashboard",
    workflow: "Owner reviews live operational KPIs and recent activity",
    personas: ["owner", "admin", "manager"],
    maxInitialJsKb: 230,
    maxApiP95Ms: 800,
    maxImageKb: 80,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 0,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "dashboard-summary:{branchId}:{rangeDays}",
    indexedHotPaths: ["idx_orders_branch_created", "idx_order_items_branch_created", "idx_payments_branch_created"],
    trustBoundaries: ["server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "dashboard-analytics",
    routePattern: "/dashboard/analytics",
    workflow: "Manager compares demand, revenue, source mix, and feedback trends",
    personas: ["owner", "admin", "manager"],
    maxInitialJsKb: 260,
    maxApiP95Ms: 900,
    maxImageKb: 80,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 0,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "analytics:{branchId}:{rangeDays}",
    indexedHotPaths: [
      "idx_orders_branch_created",
      "idx_order_items_branch_created",
      "idx_payments_branch_created",
      "idx_feedback_branch_created",
    ],
    trustBoundaries: ["server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "kitchen-display",
    routePattern: "/dashboard/kitchen",
    workflow: "Kitchen progresses active orders without leaking realtime subscriptions",
    personas: ["owner", "admin", "manager", "kitchen"],
    maxInitialJsKb: 220,
    maxApiP95Ms: 650,
    maxImageKb: 60,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "orders:{branchId}:active",
    indexedHotPaths: ["idx_orders_branch_status", "idx_orders_branch_table_active", "idx_order_items_order"],
    trustBoundaries: ["server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "waiter-pos",
    routePattern: "/dashboard/waiter",
    workflow: "Waiter creates a dine-in order with duplicate-click protection",
    personas: ["owner", "admin", "manager", "waiter"],
    maxInitialJsKb: 220,
    maxApiP95Ms: 750,
    maxImageKb: 120,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "waiter-menu:{branchId}",
    indexedHotPaths: ["idx_branch_dishes_branch", "idx_orders_branch_client_request", "idx_dishes_org_name", "idx_tables_branch_status"],
    trustBoundaries: ["server_order_totals", "server_menu_prices", "server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "cashier-payments",
    routePattern: "/dashboard/payments",
    workflow: "Cashier settles, retries, and audits order payments",
    personas: ["owner", "admin", "manager", "cashier"],
    maxInitialJsKb: 220,
    maxApiP95Ms: 700,
    maxImageKb: 60,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: true,
    cacheKey: "payments:{branchId}:{status}:{page}",
    indexedHotPaths: ["idx_payments_branch_created", "idx_payments_order", "idx_payments_transaction", "idx_orders_branch_table_active"],
    trustBoundaries: ["server_payment_status", "server_role_permissions", "server_tenant_scope", "webhook_signature"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "staff-management",
    routePattern: "/dashboard/staff",
    workflow: "Owner or admin invites, disables, and reassigns staff safely",
    personas: ["owner", "admin", "manager"],
    maxInitialJsKb: 210,
    maxApiP95Ms: 700,
    maxImageKb: 60,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: true,
    cacheKey: "staff:{orgId}:{branchId}:{page}",
    indexedHotPaths: ["idx_staff_org", "idx_staff_branch", "idx_staff_user"],
    trustBoundaries: ["server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "menu-management",
    routePattern: "/dashboard/menu",
    workflow: "Manager edits menu availability, prices, and imagery",
    personas: ["owner", "admin", "manager"],
    maxInitialJsKb: 240,
    maxApiP95Ms: 800,
    maxImageKb: 160,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: true,
    cacheKey: "menu-management:{orgId}:{branchId}:{page}",
    indexedHotPaths: ["idx_dishes_org", "idx_dishes_org_name", "idx_dishes_category", "idx_branch_dishes_branch", "idx_categories_org_sort"],
    trustBoundaries: ["server_menu_prices", "server_role_permissions", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
  {
    id: "platform-admin",
    routePattern: "/admin",
    workflow: "App creator reviews customers, pending users, subscription expiries, and manual grants",
    personas: ["platform_admin"],
    maxInitialJsKb: 240,
    maxApiP95Ms: 900,
    maxImageKb: 60,
    maxDuplicateFetches: 0,
    maxMutationRequestsPerIntent: 1,
    requiresSkeleton: true,
    requiresEmptyState: true,
    requiresErrorState: true,
    requiresServerPagination: false,
    cacheKey: "platform-overview:{adminId}",
    indexedHotPaths: [
      "idx_platform_admins_email",
      "idx_platform_admins_user",
      "idx_organizations_plan_status",
      "idx_subscriptions_org_period",
      "idx_subscription_grants_org_created",
    ],
    trustBoundaries: ["server_platform_admin", "server_tenant_scope"],
    viewports: CRITICAL_VIEWPORTS,
  },
] as const satisfies readonly PerformanceBudget[];

export function getPerformanceBudget(id: CriticalRouteId) {
  return PERFORMANCE_BUDGETS.find((budget) => budget.id === id);
}

export function performanceBudgetsForPersona(persona: PerformancePersona) {
  return PERFORMANCE_BUDGETS.filter((budget) => budget.personas.some((candidate) => candidate === persona));
}

export function requiredPerformanceIndexNames() {
  return [...new Set(PERFORMANCE_BUDGETS.flatMap((budget) => budget.indexedHotPaths))].sort();
}
