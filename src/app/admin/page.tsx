"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cloneElement, isValidElement, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  Clock3,
  IndianRupee,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useAuth } from "@/features/auth/auth-provider";
import { readApiResponse } from "@/lib/api/client";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import type { PlatformCustomer, PlatformOverview, PlatformPendingUser } from "@/lib/supabase/platform-admin";

type Plan = "starter" | "growth" | "pro" | "enterprise";
type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

const plans: Plan[] = ["starter", "growth", "pro", "enterprise"];
const statuses: SubscriptionStatus[] = ["trial", "active", "past_due", "cancelled", "expired"];

const emptyClientForm = {
  ownerEmail: "",
  orgName: "",
  restaurantType: "casual",
  gstNumber: "",
  taxPercent: 5,
  taxInclusive: true,
  branchName: "Main Branch",
  city: "",
  phone: "",
  upiVpa: "",
  tableCount: 10,
  plan: "starter" as Plan,
  status: "active" as SubscriptionStatus,
  durationDays: 30,
  seedMenu: true,
  paymentReference: "",
  notes: "",
};

const emptyGrantForm = {
  plan: "starter" as Plan,
  status: "active" as SubscriptionStatus,
  durationDays: 30,
  extendFromCurrentPeriod: true,
  paymentReference: "",
  notes: "",
};

export default function PlatformAdminPage() {
  const { user, staff, loading, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [grantTarget, setGrantTarget] = useState<PlatformCustomer | null>(null);
  const [grantForm, setGrantForm] = useState(emptyGrantForm);

  const overview = useQuery({
    queryKey: ["platform-overview"],
    queryFn: async () => {
      const response = await fetch("/api/platform/overview");
      return readApiResponse<PlatformOverview>(response);
    },
    enabled: !!user,
  });

  const customers = useMemo(() => {
    const rows = overview.data?.customers ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((customer) => `${customer.name} ${customer.ownerEmail ?? ""} ${customer.plan} ${customer.subscriptionStatus}`.toLowerCase().includes(needle));
  }, [overview.data?.customers, search]);

  const createClient = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/platform/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: clientForm.ownerEmail,
          organization: {
            name: clientForm.orgName,
            restaurant_type: clientForm.restaurantType,
            gst_number: clientForm.gstNumber || undefined,
            default_tax_percent: clientForm.taxPercent,
            tax_inclusive: clientForm.taxInclusive,
          },
          branch: {
            name: clientForm.branchName,
            city: clientForm.city || undefined,
            phone: clientForm.phone || undefined,
            upi_vpa: clientForm.upiVpa || undefined,
            table_count: clientForm.tableCount,
          },
          seedMenu: clientForm.seedMenu,
          subscription: {
            plan: clientForm.plan,
            status: clientForm.status,
            durationDays: clientForm.durationDays,
            extendFromCurrentPeriod: true,
            paymentReference: clientForm.paymentReference || undefined,
            notes: clientForm.notes || undefined,
          },
        }),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
      setClientOpen(false);
      setClientForm(emptyClientForm);
      toast.success("Client workspace created");
    },
    onError: (error) => toast.error(error.message),
  });

  const grantSubscription = useMutation({
    mutationFn: async () => {
      if (!grantTarget) return;
      const response = await fetch("/api/platform/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: grantTarget.orgId,
          plan: grantForm.plan,
          status: grantForm.status,
          durationDays: grantForm.durationDays,
          extendFromCurrentPeriod: grantForm.extendFromCurrentPeriod,
          paymentReference: grantForm.paymentReference || undefined,
          notes: grantForm.notes || undefined,
        }),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
      setGrantTarget(null);
      setGrantForm(emptyGrantForm);
      toast.success("Subscription granted");
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in?redirect=/admin");
  }, [loading, router, user]);

  const summary = overview.data?.summary;

  return (
    <main className="min-h-screen bg-background p-3 md:p-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader
          title="Platform admin"
          description={overview.data ? `Signed in as ${overview.data.platformAdmin.email}` : "Customer portfolio, subscriptions, and manual grants."}
          actions={
            <>
              <Link href={staff ? "/dashboard" : "/"}>
                <Button variant="secondary">
                  {staff ? "Dashboard" : "Home"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => void overview.refetch()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  router.push("/sign-in");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          }
        />

        {loading || overview.isLoading ? (
          <AdminSkeleton />
        ) : overview.error ? (
          <EmptyState icon={AlertCircle} title="Platform access unavailable" description={overview.error.message} />
        ) : overview.data && summary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Customers" value={summary.totalCustomers} icon={Building2} />
              <StatCard label="Active subscriptions" value={summary.activeSubscriptions} icon={ShieldCheck} tone="success" detail={`${summary.trialSubscriptions} trials`} />
              <StatCard label="Expiring soon" value={summary.expiringSoon} icon={CalendarClock} tone="warning" detail={`${summary.expiredOrPastDue} past due or expired`} />
              <StatCard label="Monthly GMV" value={formatCurrency(summary.monthlyGmv)} icon={IndianRupee} tone="info" detail={`${summary.monthlyOrders} orders`} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-3">
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-64 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search customer, owner, plan, status" value={search} onChange={(event) => setSearch(event.target.value)} />
                  </div>
                  <Button onClick={() => setClientOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                    Onboard client
                  </Button>
                </div>

                {customers.length ? (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <CustomerRow
                        key={customer.orgId}
                        customer={customer}
                        onGrant={() => {
                          setGrantTarget(customer);
                          setGrantForm({
                            ...emptyGrantForm,
                            plan: customer.plan as Plan,
                            status: customer.subscriptionStatus === "trial" ? "active" : (customer.subscriptionStatus as SubscriptionStatus),
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Store} title="No customers found" description="Adjust search or onboard a logged-in client." actionLabel="Onboard client" onAction={() => setClientOpen(true)} />
                )}
              </section>

              <aside className="space-y-4">
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <SectionTitle icon={Clock3} title="Logged-in users" description={`${summary.pendingLoggedInUsers} without a workspace`} />
                    {overview.data.pendingUsers.length ? (
                      <div className="space-y-2">
                        {overview.data.pendingUsers.map((pendingUser) => (
                          <PendingUserRow
                            key={pendingUser.id}
                            user={pendingUser}
                            onUseEmail={() => {
                              setClientForm({ ...emptyClientForm, ownerEmail: pendingUser.email, orgName: pendingUser.fullName ? `${pendingUser.fullName}'s Restaurant` : "" });
                              setClientOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Users} title="No pending users" description="New signups without workspaces will appear here." />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 p-4">
                    <SectionTitle icon={Sparkles} title="Portfolio pulse" description="This month across all customers" />
                    <PulseLine label="Collected" value={formatCurrency(summary.monthlyCollected)} />
                    <PulseLine label="GMV" value={formatCurrency(summary.monthlyGmv)} />
                    <PulseLine label="Orders" value={String(summary.monthlyOrders)} />
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        ) : null}
      </div>

      <Dialog open={clientOpen} title="Onboard client" onOpenChange={setClientOpen} className="max-w-2xl">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Owner email">
            <Input type="email" value={clientForm.ownerEmail} onChange={(event) => setClientForm({ ...clientForm, ownerEmail: event.target.value })} />
          </Field>
          <Field label="Restaurant name">
            <Input value={clientForm.orgName} onChange={(event) => setClientForm({ ...clientForm, orgName: event.target.value })} />
          </Field>
          <Field label="Restaurant type">
            <Select value={clientForm.restaurantType} onChange={(event) => setClientForm({ ...clientForm, restaurantType: event.target.value })}>
              <option value="casual">Casual dining</option>
              <option value="quick_service">Quick service</option>
              <option value="cafe">Cafe</option>
              <option value="cloud_kitchen">Cloud kitchen</option>
              <option value="fine_dining">Fine dining</option>
            </Select>
          </Field>
          <Field label="Branch name">
            <Input value={clientForm.branchName} onChange={(event) => setClientForm({ ...clientForm, branchName: event.target.value })} />
          </Field>
          <Field label="City">
            <Input value={clientForm.city} onChange={(event) => setClientForm({ ...clientForm, city: event.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} />
          </Field>
          <Field label="UPI VPA">
            <Input value={clientForm.upiVpa} onChange={(event) => setClientForm({ ...clientForm, upiVpa: event.target.value })} />
          </Field>
          <Field label="Tables">
            <Input type="number" min={1} max={200} value={clientForm.tableCount} onChange={(event) => setClientForm({ ...clientForm, tableCount: Number(event.target.value) })} />
          </Field>
          <Field label="Tax percent">
            <Input type="number" min={0} max={28} value={clientForm.taxPercent} onChange={(event) => setClientForm({ ...clientForm, taxPercent: Number(event.target.value) })} />
          </Field>
          <Field label="Plan">
            <PlanSelect value={clientForm.plan} onChange={(plan) => setClientForm({ ...clientForm, plan })} />
          </Field>
          <Field label="Status">
            <StatusSelect value={clientForm.status} onChange={(status) => setClientForm({ ...clientForm, status })} />
          </Field>
          <Field label="Days">
            <Input type="number" min={1} max={1095} value={clientForm.durationDays} onChange={(event) => setClientForm({ ...clientForm, durationDays: Number(event.target.value) })} />
          </Field>
          <Field label="Payment reference">
            <Input value={clientForm.paymentReference} onChange={(event) => setClientForm({ ...clientForm, paymentReference: event.target.value })} />
          </Field>
          <Field label="GST number">
            <Input value={clientForm.gstNumber} onChange={(event) => setClientForm({ ...clientForm, gstNumber: event.target.value })} />
          </Field>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
            Seed starter menu
            <Switch checked={clientForm.seedMenu} onCheckedChange={(seedMenu) => setClientForm({ ...clientForm, seedMenu })} />
          </label>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
            Tax-inclusive prices
            <Switch checked={clientForm.taxInclusive} onCheckedChange={(taxInclusive) => setClientForm({ ...clientForm, taxInclusive })} />
          </label>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea value={clientForm.notes} onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })} />
            </Field>
          </div>
          <Button className="md:col-span-2" loading={createClient.isPending} disabled={!clientForm.ownerEmail || !clientForm.orgName || !clientForm.branchName} onClick={() => createClient.mutate()}>
            <Plus className="h-4 w-4" />
            Create workspace
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!grantTarget} title={grantTarget ? `Grant subscription to ${grantTarget.name}` : "Grant subscription"} onOpenChange={() => setGrantTarget(null)}>
        <div className="space-y-3">
          <Field label="Plan">
            <PlanSelect value={grantForm.plan} onChange={(plan) => setGrantForm({ ...grantForm, plan })} />
          </Field>
          <Field label="Status">
            <StatusSelect value={grantForm.status} onChange={(status) => setGrantForm({ ...grantForm, status })} />
          </Field>
          <Field label="Days">
            <Input type="number" min={1} max={1095} value={grantForm.durationDays} onChange={(event) => setGrantForm({ ...grantForm, durationDays: Number(event.target.value) })} />
          </Field>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
            Extend from current end date
            <Switch checked={grantForm.extendFromCurrentPeriod} onCheckedChange={(extendFromCurrentPeriod) => setGrantForm({ ...grantForm, extendFromCurrentPeriod })} />
          </label>
          <Field label="Payment reference">
            <Input value={grantForm.paymentReference} onChange={(event) => setGrantForm({ ...grantForm, paymentReference: event.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea value={grantForm.notes} onChange={(event) => setGrantForm({ ...grantForm, notes: event.target.value })} />
          </Field>
          <Button className="w-full" loading={grantSubscription.isPending} onClick={() => grantSubscription.mutate()}>
            Grant subscription
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function CustomerRow({ customer, onGrant }: { customer: PlatformCustomer; onGrant: () => void }) {
  return (
    <Card className="animate-soft-rise">
      <CardContent className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{customer.name}</h2>
            <Badge variant={statusVariant(customer.subscriptionStatus)}>{customer.subscriptionStatus.replace("_", " ")}</Badge>
            <Badge variant="secondary">{customer.plan}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {customer.ownerEmail ?? "No owner email"} | {customer.branchCount} branches | {customer.staffCount} staff
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 xl:w-[560px]">
          <MiniMetric label="Ends" value={customer.currentPeriodEnd ? formatDate(customer.currentPeriodEnd) : "Not set"} detail={customer.daysRemaining === null ? "" : `${customer.daysRemaining} days`} />
          <MiniMetric label="Orders" value={String(customer.monthlyOrders)} detail="this month" />
          <MiniMetric label="GMV" value={formatCurrency(customer.monthlyGmv)} detail="this month" />
          <MiniMetric label="Last order" value={customer.lastOrderAt ? timeAgo(customer.lastOrderAt) : "None"} detail="" />
        </div>
        <Button size="sm" onClick={onGrant}>
          Grant
        </Button>
      </CardContent>
    </Card>
  );
}

function PendingUserRow({ user, onUseEmail }: { user: PlatformPendingUser; onUseEmail: () => void }) {
  return (
    <div className="rounded-xl border bg-secondary/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.fullName ?? user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-[0.625rem] text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onUseEmail}>
          Use
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-secondary p-3">
      <p className="truncate text-[0.625rem] text-muted-foreground">{label}</p>
      <p className="font-numbers mt-1 truncate text-xs font-semibold">{value}</p>
      {detail ? <p className="mt-0.5 truncate text-[0.625rem] text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function PulseLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-numbers font-semibold">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const child = isValidElement<{ id?: string }>(children) ? cloneElement(children, { id: children.props.id ?? id }) : children;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {child}
    </div>
  );
}

function PlanSelect({ id, value, onChange }: { id?: string; value: Plan; onChange: (value: Plan) => void }) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value as Plan)}>
      {plans.map((plan) => (
        <option key={plan} value={plan}>
          {plan}
        </option>
      ))}
    </Select>
  );
}

function StatusSelect({ id, value, onChange }: { id?: string; value: SubscriptionStatus; onChange: (value: SubscriptionStatus) => void }) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value as SubscriptionStatus)}>
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[520px]" />
      </div>
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "trial" || status === "past_due") return "warning";
  if (status === "cancelled" || status === "expired") return "destructive";
  return "secondary";
}
