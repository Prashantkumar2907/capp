import type { User } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { platformAdminEmails } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { PlatformClientOnboardingInput, PlatformSubscriptionGrantInput } from "@/lib/validation/schemas";
import type { Branch, Organization, PlatformAdmin, Staff, Subscription } from "@/types/database";

type PlatformResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };
type AdminClient = ReturnType<typeof createAdminSupabase>;

type BranchLite = Pick<Branch, "id" | "org_id" | "name">;
type StaffLite = Pick<Staff, "id" | "user_id" | "org_id" | "full_name" | "email" | "role" | "is_active">;
type OrderLite = { id: string; branch_id: string; total: number; status: string; created_at: string };
type PaymentLite = { branch_id: string; amount: number; status: string; created_at: string };

export type PlatformOverview = {
  platformAdmin: Pick<PlatformAdmin, "id" | "email" | "full_name">;
  summary: {
    totalCustomers: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    expiringSoon: number;
    expiredOrPastDue: number;
    monthlyOrders: number;
    monthlyGmv: number;
    monthlyCollected: number;
    pendingLoggedInUsers: number;
  };
  customers: PlatformCustomer[];
  pendingUsers: PlatformPendingUser[];
};

export type PlatformCustomer = {
  orgId: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  branchCount: number;
  staffCount: number;
  monthlyOrders: number;
  monthlyGmv: number;
  monthlyCollected: number;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
  lastOrderAt: string | null;
};

export type PlatformPendingUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

export async function getPlatformOverview(): Promise<PlatformResult<PlatformOverview>> {
  const admin = createAdminSupabase();
  const context = await requirePlatformAdmin(admin);
  if (!context.ok) return context;

  const monthStart = startOfCurrentMonth();
  const [
    { data: organizations, error: orgError },
    { data: branches, error: branchError },
    { data: staff, error: staffError },
    { data: subscriptions, error: subscriptionError },
    { data: platformAdmins, error: platformAdminsError },
  ] = await Promise.all([
    admin.from("organizations").select("*").order("created_at", { ascending: false }),
    admin.from("branches").select("id, org_id, name"),
    admin.from("staff").select("id, user_id, org_id, full_name, email, role, is_active"),
    admin.from("subscriptions").select("*").order("current_period_end", { ascending: false }),
    admin.from("platform_admins").select("user_id, email, is_active"),
  ]);

  if (orgError || branchError || staffError || subscriptionError || platformAdminsError) {
    return failure(400, "PLATFORM_OVERVIEW_FAILED", "Unable to load customer portfolio");
  }

  const branchRows = (branches ?? []) as BranchLite[];
  const branchIds = branchRows.map((branch) => branch.id);
  const [ordersResult, paymentsResult, usersResult] = await Promise.all([
    branchIds.length
      ? admin.from("orders").select("id, branch_id, total, status, created_at").in("branch_id", branchIds).gte("created_at", monthStart.toISOString())
      : Promise.resolve({ data: [], error: null }),
    branchIds.length
      ? admin.from("payments").select("branch_id, amount, status, created_at").in("branch_id", branchIds).gte("created_at", monthStart.toISOString())
      : Promise.resolve({ data: [], error: null }),
    listAuthUsers(admin),
  ]);

  if (ordersResult.error || paymentsResult.error || !usersResult.ok) {
    return failure(400, "PLATFORM_ANALYTICS_FAILED", "Unable to load platform analytics");
  }

  const staffRows = (staff ?? []) as StaffLite[];
  const subscriptionRows = subscriptions ?? [];
  const orders = (ordersResult.data ?? []).map((order) => ({ ...order, total: Number(order.total) })) as OrderLite[];
  const payments = (paymentsResult.data ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })) as PaymentLite[];
  const now = new Date();

  const customers = ((organizations ?? []) as Organization[]).map((organization) => {
    const orgBranches = branchRows.filter((branch) => branch.org_id === organization.id);
    const orgBranchIds = new Set(orgBranches.map((branch) => branch.id));
    const orgStaff = staffRows.filter((member) => member.org_id === organization.id && member.is_active);
    const owner = orgStaff.find((member) => member.role === "owner") ?? orgStaff[0] ?? null;
    const orgOrders = orders.filter((order) => orgBranchIds.has(order.branch_id));
    const revenueOrders = orgOrders.filter((order) => !["cancelled", "refunded", "failed"].includes(order.status));
    const orgPayments = payments.filter((payment) => orgBranchIds.has(payment.branch_id) && payment.status === "completed");
    const subscription = latestSubscription(subscriptionRows, organization.id);
    const periodEnd = subscription?.current_period_end ?? null;

    return {
      orgId: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: subscription?.plan ?? organization.plan,
      subscriptionStatus: subscription?.status ?? organization.subscription_status,
      createdAt: organization.created_at,
      ownerName: owner?.full_name ?? null,
      ownerEmail: owner?.email ?? null,
      branchCount: orgBranches.length,
      staffCount: orgStaff.length,
      monthlyOrders: orgOrders.length,
      monthlyGmv: revenueOrders.reduce((sum, order) => sum + order.total, 0),
      monthlyCollected: orgPayments.reduce((sum, payment) => sum + payment.amount, 0),
      currentPeriodEnd: periodEnd,
      daysRemaining: periodEnd ? daysBetween(now, new Date(periodEnd)) : null,
      lastOrderAt: latestDate(orgOrders.map((order) => order.created_at)),
    };
  });

  const staffedUserIds = new Set(staffRows.map((member) => member.user_id).filter(Boolean));
  const platformAdminUserIds = new Set((platformAdmins ?? []).map((adminRow) => adminRow.user_id).filter(Boolean));
  const platformAdminEmailSet = new Set((platformAdmins ?? []).filter((adminRow) => adminRow.is_active).map((adminRow) => adminRow.email.toLowerCase()));
  const allPendingUsers = usersResult.data
    .filter((user) => user.email && !staffedUserIds.has(user.id) && !platformAdminUserIds.has(user.id) && !platformAdminEmailSet.has(user.email.toLowerCase()))
    .map((user) => ({
      id: user.id,
      email: user.email!,
      fullName: userDisplayName(user),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    }));
  const pendingUsers = allPendingUsers.slice(0, 25);

  const summary = {
    totalCustomers: customers.length,
    activeSubscriptions: customers.filter((customer) => customer.subscriptionStatus === "active").length,
    trialSubscriptions: customers.filter((customer) => customer.subscriptionStatus === "trial").length,
    expiringSoon: customers.filter((customer) => customer.daysRemaining !== null && customer.daysRemaining >= 0 && customer.daysRemaining <= 7).length,
    expiredOrPastDue: customers.filter((customer) => customer.subscriptionStatus === "expired" || customer.subscriptionStatus === "past_due" || (customer.daysRemaining ?? 1) < 0).length,
    monthlyOrders: orders.length,
    monthlyGmv: customers.reduce((sum, customer) => sum + customer.monthlyGmv, 0),
    monthlyCollected: customers.reduce((sum, customer) => sum + customer.monthlyCollected, 0),
    pendingLoggedInUsers: allPendingUsers.length,
  };

  return {
    ok: true,
    data: {
      platformAdmin: {
        id: context.data.platformAdmin.id,
        email: context.data.platformAdmin.email,
        full_name: context.data.platformAdmin.full_name,
      },
      summary,
      customers,
      pendingUsers,
    },
  };
}

export async function onboardPlatformClient(input: PlatformClientOnboardingInput): Promise<PlatformResult<{ organizationId: string; branchId: string }>> {
  const admin = createAdminSupabase();
  const context = await requirePlatformAdmin(admin);
  if (!context.ok) return context;

  const targetUser = await findAuthUserByEmail(admin, input.ownerEmail);
  if (!targetUser.ok) return targetUser;

  const { data: existingStaff } = await admin.from("staff").select("id").eq("user_id", targetUser.data.user.id).maybeSingle();
  if (existingStaff) return failure(409, "USER_ALREADY_ONBOARDED", "This user already belongs to a restaurant workspace");

  const slug = `${slugify(input.organization.name)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.organization.name,
      slug,
      restaurant_type: input.organization.restaurant_type,
      gst_number: input.organization.gst_number || null,
      default_tax_percent: input.organization.default_tax_percent,
      tax_inclusive: input.organization.tax_inclusive,
      plan: input.subscription.plan,
      subscription_status: input.subscription.status,
    })
    .select("*")
    .single();

  if (orgError || !organization) return failure(400, "ORGANIZATION_CREATE_FAILED", "Unable to create restaurant workspace");

  const rollback = () => admin.from("organizations").delete().eq("id", organization.id);
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .insert({
      org_id: organization.id,
      name: input.branch.name,
      address: input.branch.address || null,
      city: input.branch.city || null,
      phone: input.branch.phone || null,
      upi_vpa: input.branch.upi_vpa || null,
      table_count: input.branch.table_count,
    })
    .select("*")
    .single();

  if (branchError || !branch) {
    await rollback();
    return failure(400, "BRANCH_CREATE_FAILED", "Unable to create first branch");
  }

  const fullName = String(targetUser.data.user.user_metadata?.full_name ?? targetUser.data.user.email?.split("@")[0] ?? "Owner");
  const { error: staffError } = await admin.from("staff").insert({
    user_id: targetUser.data.user.id,
    org_id: organization.id,
    branch_id: branch.id,
    full_name: fullName,
    email: targetUser.data.user.email,
    role: "owner",
  });

  if (staffError) {
    await rollback();
    return failure(400, "OWNER_STAFF_CREATE_FAILED", "Unable to create owner staff profile");
  }

  const { error: tablesError } = await admin.from("tables").insert(
    Array.from({ length: input.branch.table_count }).map((_, index) => ({
      branch_id: branch.id,
      table_number: index + 1,
      label: `Table ${index + 1}`,
      capacity: 4,
    }))
  );

  if (tablesError) {
    await rollback();
    return failure(400, "TABLES_CREATE_FAILED", "Unable to create starter tables");
  }

  if (input.seedMenu) {
    const seedResult = await seedStarterMenu(admin, organization.id, branch.id);
    if (!seedResult.ok) {
      await rollback();
      return seedResult;
    }
  }

  const grant = await grantSubscriptionForOrg(admin, context.data.platformAdmin, {
    orgId: organization.id,
    ...input.subscription,
  });
  if (!grant.ok) {
    await rollback();
    return grant;
  }

  return { ok: true, data: { organizationId: organization.id, branchId: branch.id } };
}

export async function grantPlatformSubscription(input: PlatformSubscriptionGrantInput): Promise<PlatformResult<{ subscription: Subscription }>> {
  const admin = createAdminSupabase();
  const context = await requirePlatformAdmin(admin);
  if (!context.ok) return context;
  return grantSubscriptionForOrg(admin, context.data.platformAdmin, input);
}

async function requirePlatformAdmin(admin: AdminClient): Promise<PlatformResult<{ platformAdmin: PlatformAdmin; user: User }>> {
  const server = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await server.auth.getUser();

  if (error || !user?.email) return failure(401, "AUTH_REQUIRED", "Platform admin sign-in is required");

  const email = user.email.toLowerCase();
  const existing = await findPlatformAdmin(admin, user.id, email);
  if (existing && existing.is_active) {
    const platformAdmin = existing.user_id ? existing : await attachPlatformAdminUser(admin, existing.id, user.id);
    if (!platformAdmin) return failure(403, "PLATFORM_ADMIN_FORBIDDEN", "Platform admin access is not available");
    return { ok: true, data: { platformAdmin, user } };
  }

  if (platformAdminEmails().includes(email)) {
    const { data, error: upsertError } = await admin
      .from("platform_admins")
      .upsert({ user_id: user.id, email, full_name: user.user_metadata?.full_name ? String(user.user_metadata.full_name) : null, is_active: true }, { onConflict: "email" })
      .select("*")
      .single();
    if (upsertError || !data) return failure(403, "PLATFORM_ADMIN_FORBIDDEN", "Platform admin access is not available");
    return { ok: true, data: { platformAdmin: data, user } };
  }

  return failure(403, "PLATFORM_ADMIN_FORBIDDEN", "Platform admin access is not available");
}

async function findPlatformAdmin(admin: AdminClient, userId: string, email: string) {
  const { data: byUser } = await admin.from("platform_admins").select("*").eq("user_id", userId).maybeSingle();
  if (byUser) return byUser;

  const { data: byEmail } = await admin.from("platform_admins").select("*").ilike("email", email).maybeSingle();
  return byEmail ?? null;
}

async function attachPlatformAdminUser(admin: AdminClient, platformAdminId: string, userId: string) {
  const { data } = await admin.from("platform_admins").update({ user_id: userId }).eq("id", platformAdminId).select("*").single();
  return data ?? null;
}

async function grantSubscriptionForOrg(
  admin: AdminClient,
  platformAdmin: PlatformAdmin,
  input: PlatformSubscriptionGrantInput
): Promise<PlatformResult<{ subscription: Subscription }>> {
  const { data: organization } = await admin.from("organizations").select("*").eq("id", input.orgId).maybeSingle();
  if (!organization) return failure(404, "ORGANIZATION_NOT_FOUND", "Customer workspace not found");

  const { data: existingSubscriptions } = await admin
    .from("subscriptions")
    .select("*")
    .eq("org_id", input.orgId)
    .order("current_period_end", { ascending: false })
    .limit(1);
  const existing = existingSubscriptions?.[0] ?? null;

  const now = new Date();
  const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
  const base = input.extendFromCurrentPeriod && existingEnd && existingEnd > now ? existingEnd : now;
  const periodStart = now.toISOString();
  const periodEnd = addDays(base, input.durationDays).toISOString();

  const subscriptionWrite = {
    org_id: input.orgId,
    plan: input.plan,
    status: input.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  };

  const { data: subscription, error } = existing
    ? await admin.from("subscriptions").update(subscriptionWrite).eq("id", existing.id).select("*").single()
    : await admin.from("subscriptions").insert(subscriptionWrite).select("*").single();

  if (error || !subscription) return failure(400, "SUBSCRIPTION_GRANT_FAILED", "Unable to grant subscription");

  const { error: orgUpdateError } = await admin
    .from("organizations")
    .update({ plan: input.plan, subscription_status: input.status })
    .eq("id", input.orgId);
  if (orgUpdateError) return failure(400, "ORGANIZATION_SUBSCRIPTION_SYNC_FAILED", "Subscription was updated, but customer status could not be synced");

  const { error: grantError } = await admin.from("subscription_grants").insert({
    org_id: input.orgId,
    subscription_id: subscription.id,
    platform_admin_id: platformAdmin.id,
    plan: input.plan,
    status: input.status,
    period_start: periodStart,
    period_end: periodEnd,
    days_granted: input.durationDays,
    payment_reference: input.paymentReference || null,
    notes: input.notes || null,
  });

  if (grantError) return failure(400, "SUBSCRIPTION_GRANT_AUDIT_FAILED", "Subscription was updated, but the grant audit record could not be saved");
  return { ok: true, data: { subscription } };
}

async function listAuthUsers(admin: AdminClient): Promise<PlatformResult<User[]>> {
  const users: User[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return failure(400, "AUTH_USERS_LOOKUP_FAILED", "Unable to load signed-in users");
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return { ok: true, data: users };
}

async function findAuthUserByEmail(admin: AdminClient, email: string): Promise<PlatformResult<{ user: User }>> {
  const normalized = email.toLowerCase();
  const users = await listAuthUsers(admin);
  if (!users.ok) return users;

  const user = users.data.find((candidate) => candidate.email?.toLowerCase() === normalized);
  if (!user) return failure(404, "AUTH_USER_NOT_FOUND", "Ask the client to sign in once before onboarding their workspace");
  return { ok: true, data: { user } };
}

async function seedStarterMenu(admin: AdminClient, orgId: string, branchId: string): Promise<PlatformResult<unknown>> {
  const categories = ["Starters", "Mains", "Breads", "Beverages"];
  const categoryRows: Array<{ id: string; name: string }> = [];

  for (let index = 0; index < categories.length; index += 1) {
    const { data, error } = await admin
      .from("categories")
      .insert({ org_id: orgId, name: categories[index], sort_order: index + 1 })
      .select("id, name")
      .single();
    if (error || !data) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to create starter menu categories");
    categoryRows.push(data);
  }

  const categoryId = (name: string) => categoryRows.find((row) => row.name === name)?.id ?? null;
  const dishes = [
    { name: "Paneer Tikka", price: 260, category_id: categoryId("Starters"), is_veg: true, prep_time_mins: 18 },
    { name: "Chicken 65", price: 320, category_id: categoryId("Starters"), is_veg: false, prep_time_mins: 22 },
    { name: "Dal Makhani", price: 280, category_id: categoryId("Mains"), is_veg: true, prep_time_mins: 30 },
    { name: "Butter Chicken", price: 390, category_id: categoryId("Mains"), is_veg: false, prep_time_mins: 28 },
    { name: "Garlic Naan", price: 70, category_id: categoryId("Breads"), is_veg: true, prep_time_mins: 8 },
    { name: "Mango Lassi", price: 130, category_id: categoryId("Beverages"), is_veg: true, prep_time_mins: 4 },
  ];

  for (const dish of dishes) {
    const { data, error } = await admin.from("dishes").insert({ ...dish, org_id: orgId }).select("id").single();
    if (error || !data) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to create starter menu dishes");
    const { error: branchDishError } = await admin.from("branch_dishes").insert({ branch_id: branchId, dish_id: data.id });
    if (branchDishError) return failure(400, "STARTER_MENU_CREATE_FAILED", "Unable to enable starter menu for this branch");
  }

  return { ok: true, data: {} };
}

function latestSubscription(subscriptions: Subscription[], orgId: string) {
  return subscriptions.find((subscription) => subscription.org_id === orgId) ?? null;
}

function latestDate(values: string[]) {
  return values.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function userDisplayName(user: User) {
  if (typeof user.user_metadata?.full_name === "string") return user.user_metadata.full_name;
  if (typeof user.user_metadata?.name === "string") return user.user_metadata.name;
  return null;
}

function daysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function failure(status: number, code: string, message: string): PlatformResult<never> & { ok: false } {
  return { ok: false, status, code, message };
}
