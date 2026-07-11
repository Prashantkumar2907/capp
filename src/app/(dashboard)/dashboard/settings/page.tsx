"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, Palette, Save, Settings2, Store } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-provider";
import { useLocale, type Locale } from "@/lib/i18n";
import { ChefHat, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { organization, branch, refresh } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [orgForm, setOrgForm] = useState(() => ({
    name: organization?.name ?? "",
    restaurant_type: organization?.restaurant_type ?? "casual",
    gst_number: organization?.gst_number ?? "",
    fssai_license: organization?.fssai_license ?? "",
    service_charge_percent: Number(organization?.service_charge_percent ?? 0),
    gst_scheme: organization?.gst_scheme ?? "regular",
    default_tax_percent: Number(organization?.default_tax_percent ?? 5),
    tax_inclusive: organization?.tax_inclusive ?? true,
  }));
  const [branchForm, setBranchForm] = useState(() => ({
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    city: branch?.city ?? "",
    phone: branch?.phone ?? "",
    upi_vpa: branch?.upi_vpa ?? "",
  }));

  const subscription = useQuery({
    queryKey: ["subscription", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").eq("org_id", organization!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const saveOrg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organizations")
        .update({ ...orgForm, gst_number: orgForm.gst_number || null, fssai_license: orgForm.fssai_license || null })
        .eq("id", organization!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Restaurant settings saved");
    },
    onError: (error) => toast.error(error.message),
  });

  const saveBranch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("branches")
        .update({
          name: branchForm.name,
          address: branchForm.address || null,
          city: branchForm.city || null,
          phone: branchForm.phone || null,
          upi_vpa: branchForm.upi_vpa || null,
        })
        .eq("id", branch!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Branch settings saved");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Control restaurant identity, tax, payment, appearance, and subscription details." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <SectionTitle icon={Building2} title="Restaurant" description="Business identity and tax defaults." />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Restaurant name">
                  <Input value={orgForm.name} onChange={(event) => setOrgForm({ ...orgForm, name: event.target.value })} />
                </Field>
                <Field label="Restaurant type">
                  <Select value={orgForm.restaurant_type} onChange={(event) => setOrgForm({ ...orgForm, restaurant_type: event.target.value })}>
                    <option value="casual">Casual dining</option>
                    <option value="quick_service">Quick service</option>
                    <option value="cafe">Cafe</option>
                    <option value="cloud_kitchen">Cloud kitchen</option>
                    <option value="fine_dining">Fine dining</option>
                  </Select>
                </Field>
                <Field label="GST number (GSTIN)">
                  <Input value={orgForm.gst_number} onChange={(event) => setOrgForm({ ...orgForm, gst_number: event.target.value })} />
                </Field>
                <Field label="FSSAI license no.">
                  <Input value={orgForm.fssai_license} onChange={(event) => setOrgForm({ ...orgForm, fssai_license: event.target.value })} />
                </Field>
                <Field label="GST rate %">
                  <Input type="number" value={orgForm.default_tax_percent} onChange={(event) => setOrgForm({ ...orgForm, default_tax_percent: Number(event.target.value) })} />
                </Field>
                <Field label="Service charge % (voluntary, 0 = off)">
                  <Input type="number" value={orgForm.service_charge_percent} onChange={(event) => setOrgForm({ ...orgForm, service_charge_percent: Math.max(0, Number(event.target.value)) })} />
                </Field>
                <Field label="GST scheme">
                  <Select value={orgForm.gst_scheme} onChange={(event) => setOrgForm({ ...orgForm, gst_scheme: event.target.value as "regular" | "composition" })}>
                    <option value="regular">Regular (charge CGST+SGST on bill)</option>
                    <option value="composition">Composition (no GST on bill)</option>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                  <p className="text-sm font-medium">Tax-inclusive pricing</p>
                  <p className="text-xs text-muted-foreground">Menu prices already include GST.</p>
                </div>
                <Switch checked={orgForm.tax_inclusive} onCheckedChange={(checked) => setOrgForm({ ...orgForm, tax_inclusive: checked })} />
              </div>
              <Button disabled={!orgForm.name || saveOrg.isPending} onClick={() => saveOrg.mutate()}>
                <Save className="h-4 w-4" />
                Save restaurant
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-4">
              <SectionTitle icon={Store} title="Branch" description="Location, table, and settlement details." />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Branch name">
                  <Input value={branchForm.name} onChange={(event) => setBranchForm({ ...branchForm, name: event.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={branchForm.phone} onChange={(event) => setBranchForm({ ...branchForm, phone: event.target.value })} />
                </Field>
                <Field label="Address">
                  <Input value={branchForm.address} onChange={(event) => setBranchForm({ ...branchForm, address: event.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={branchForm.city} onChange={(event) => setBranchForm({ ...branchForm, city: event.target.value })} />
                </Field>
                <Field label="UPI VPA">
                  <Input value={branchForm.upi_vpa} onChange={(event) => setBranchForm({ ...branchForm, upi_vpa: event.target.value })} />
                </Field>
              </div>
              <Button disabled={!branchForm.name || saveBranch.isPending} onClick={() => saveBranch.mutate()}>
                <Save className="h-4 w-4" />
                Save branch
              </Button>
            </CardContent>
          </Card>
          <StationsCard />
        </section>
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <SectionTitle icon={Palette} title="Appearance" description="Choose the interface theme." />
              <Select value={theme ?? "system"} onChange={(event) => setTheme(event.target.value)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
              <LanguagePicker />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-4">
              <SectionTitle icon={CreditCard} title="Subscription" description="Plan and billing state." />
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="mt-1 text-sm font-semibold capitalize">{subscription.data?.plan ?? organization?.plan ?? "starter"}</p>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold capitalize">{subscription.data?.status ?? organization?.subscription_status ?? "trial"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-4">
              <SectionTitle icon={Settings2} title="Operational defaults" description="Recommended best-practice defaults." />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Kitchen tickets refresh in real time.</p>
                <p>QR orders start as pending and require staff confirmation.</p>
                <p>Payment records are created automatically for every order.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}


/**
 * Kitchen stations (Tandoor, Chinese, Bar…). Map categories to stations in
 * the Menu page; each kitchen screen can then filter to its own tickets.
 */
function StationsCard() {
  const { branch, hasRole } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const stations = useQuery({
    queryKey: ["stations", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stations").select("*").eq("branch_id", branch!.id).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branch,
  });

  const addStation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Enter a station name");
      const { error } = await supabase
        .from("stations")
        .insert({ branch_id: branch!.id, name: name.trim(), sort_order: stations.data?.length ?? 0 });
      if (error) throw error;
    },
    onSuccess: async () => {
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const removeStation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stations"] }),
    onError: (error) => toast.error(error.message),
  });

  if (!hasRole("owner", "admin", "manager")) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <SectionTitle icon={ChefHat} title="Kitchen stations" description="Tandoor, Chinese, Bar — large kitchens route tickets by station." />
        <div className="space-y-1.5">
          {(stations.data ?? []).map((station) => (
            <div key={station.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
              <span className="text-sm">{station.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStation.mutate(station.id)} aria-label={`Remove ${station.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!stations.data?.length ? <p className="text-xs text-muted-foreground">No stations yet — small kitchens can skip this.</p> : null}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Tandoor" value={name} onChange={(event) => setName(event.target.value)} />
          <Button variant="secondary" size="icon" className="shrink-0" disabled={addStation.isPending} onClick={() => addStation.mutate()} aria-label="Add station">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


/** Per-device staff UI language — the kitchen tablet can run Hindi while the owner's phone stays English. */
function LanguagePicker() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="space-y-1.5">
      <Label>{t("settings.language")}</Label>
      <Select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </Select>
      <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
    </div>
  );
}
