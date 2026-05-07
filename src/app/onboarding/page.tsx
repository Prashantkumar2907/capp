"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Store, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth-provider";

const steps = ["Restaurant", "Branch", "Menu", "Launch"];

export default function OnboardingPage() {
  const { refresh, staff } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seedMenu, setSeedMenu] = useState(true);
  const [organization, setOrganization] = useState({
    name: "",
    restaurant_type: "casual",
    gst_number: "",
    default_tax_percent: 5,
    tax_inclusive: true,
  });
  const [branch, setBranch] = useState({
    name: "Main Branch",
    address: "",
    city: "",
    phone: "",
    upi_vpa: "",
    table_count: 10,
  });

  useEffect(() => {
    if (staff) router.push("/dashboard");
  }, [router, staff]);

  const canContinue = step === 0 ? organization.name.trim().length >= 2 : step === 1 ? branch.name.trim().length >= 2 : true;

  const complete = async () => {
    setLoading(true);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization, branch, seedMenu }),
    });
    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(json.error ?? "Unable to complete setup");
      return;
    }

    await refresh();
    toast.success("Restaurant workspace is ready");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl animate-soft-rise">
        <CardContent className="p-5 md:p-7">
          <div className="mb-7 flex items-center justify-between">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${index <= step ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 ? <div className={`mx-2 h-px w-10 sm:w-20 ${index < step ? "bg-primary" : "bg-border"}`} /> : null}
              </div>
            ))}
          </div>

          {step === 0 ? (
            <section className="space-y-5">
              <Header icon={UtensilsCrossed} title="Name your restaurant" text="This creates the owner workspace and default settings." />
              <div className="space-y-1.5">
                <Label>Restaurant name</Label>
                <Input value={organization.name} onChange={(event) => setOrganization({ ...organization, name: event.target.value })} placeholder="Spice Garden" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Restaurant type</Label>
                  <select className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus-ring" value={organization.restaurant_type} onChange={(event) => setOrganization({ ...organization, restaurant_type: event.target.value })}>
                    <option value="casual">Casual dining</option>
                    <option value="qsr">Quick service</option>
                    <option value="cloud_kitchen">Cloud kitchen</option>
                    <option value="cafe">Cafe</option>
                    <option value="fine_dining">Fine dining</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>GST number</Label>
                  <Input value={organization.gst_number} onChange={(event) => setOrganization({ ...organization, gst_number: event.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tax percent</Label>
                  <Input type="number" value={organization.default_tax_percent} onChange={(event) => setOrganization({ ...organization, default_tax_percent: Number(event.target.value) })} />
                </div>
                <label className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
                  Tax inclusive menu prices
                  <Switch checked={organization.tax_inclusive} onCheckedChange={(checked) => setOrganization({ ...organization, tax_inclusive: checked })} />
                </label>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-5">
              <Header icon={MapPin} title="Set up your first branch" text="Tables and QR codes will be created from this branch." />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Branch name</Label>
                  <Input value={branch.name} onChange={(event) => setBranch({ ...branch, name: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={branch.city} onChange={(event) => setBranch({ ...branch, city: event.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={branch.address} onChange={(event) => setBranch({ ...branch, address: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={branch.phone} onChange={(event) => setBranch({ ...branch, phone: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>UPI VPA</Label>
                  <Input value={branch.upi_vpa} onChange={(event) => setBranch({ ...branch, upi_vpa: event.target.value })} placeholder="restaurant@upi" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tables</Label>
                  <Input type="number" min={1} max={200} value={branch.table_count} onChange={(event) => setBranch({ ...branch, table_count: Number(event.target.value) })} />
                </div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-5">
              <Header icon={Store} title="Choose menu starting point" text="You can edit categories, dishes, and prices later." />
              <div className="grid gap-3">
                <Choice active={seedMenu} title="Add a starter Indian menu" text="Six editable dishes across starters, mains, breads, and beverages." onClick={() => setSeedMenu(true)} />
                <Choice active={!seedMenu} title="Start empty" text="Create every category and dish from scratch." onClick={() => setSeedMenu(false)} />
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-5">
              <Header icon={Check} title="Ready to launch" text="Review the essentials before creating your workspace." />
              <div className="rounded-2xl border bg-secondary p-4 text-sm">
                <Row label="Restaurant" value={organization.name} />
                <Row label="Branch" value={branch.name} />
                <Row label="Tables" value={String(branch.table_count)} />
                <Row label="Menu" value={seedMenu ? "Starter menu" : "Empty"} />
              </div>
            </section>
          ) : null}

          <div className="mt-7 flex items-center justify-between border-t pt-4">
            <Button variant="ghost" disabled={step === 0 || loading} onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={loading} onClick={complete}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Launch workspace
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Header({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Choice({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition-colors ${active ? "border-primary bg-primary/10" : "bg-card hover:bg-secondary"}`}>
      <span className="text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{text}</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
