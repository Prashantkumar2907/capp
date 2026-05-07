"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Building2, Store, User, CreditCard, Palette, Loader2, Save, Check, AlertTriangle } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "₹999/mo", features: ["1 Branch", "10 Staff", "100 Items", "Basic analytics"] },
  { name: "Growth", price: "₹1,599/mo", features: ["2 Branches", "25 Staff", "300 Items", "Advanced analytics", "Coupons"] },
  { name: "Pro", price: "₹2,499/mo", features: ["5 Branches", "Unlimited Staff", "Unlimited Items", "Full suite", "API access"] },
];

export default function SettingsPage() {
  const { organization, branch, staff } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState("");
  const [orgForm, setOrgForm] = useState({
    name: organization?.name || "", gst_number: organization?.gst_number || "",
    default_tax_percent: organization?.default_tax_percent || 5,
    tax_inclusive: organization?.tax_inclusive ?? true,
  });
  const [branchForm, setBranchForm] = useState({
    name: branch?.name || "", address: branch?.address || "",
    city: branch?.city || "", phone: branch?.phone || "",
    upi_vpa: branch?.upi_vpa || "",
  });
  const [profileForm, setProfileForm] = useState({
    full_name: staff?.full_name || "", email: staff?.email || "",
    phone: staff?.phone || "",
  });

  const saveOrg = async () => {
    setSaving("org");
    const { error } = await supabase.from("organizations").update(orgForm).eq("id", organization!.id);
    setSaving("");
    if (error) { toast.error(error.message); return; }
    toast.success("Organization updated");
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const saveBranch = async () => {
    setSaving("branch");
    const { error } = await supabase.from("branches").update(branchForm).eq("id", branch!.id);
    setSaving("");
    if (error) { toast.error(error.message); return; }
    toast.success("Branch updated");
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const saveProfile = async () => {
    setSaving("profile");
    const { error } = await supabase.from("staff").update({
      full_name: profileForm.full_name, phone: profileForm.phone,
    }).eq("id", staff!.id);
    setSaving("");
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" description="Manage your restaurant configuration" />

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="h-9 w-full justify-start">
          <TabsTrigger value="organization" className="text-xs gap-1.5"><Building2 className="h-3.5 w-3.5" /> Organization</TabsTrigger>
          <TabsTrigger value="branch" className="text-xs gap-1.5"><Store className="h-3.5 w-3.5" /> Branch</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Subscription</TabsTrigger>
        </TabsList>

        {/* Organization */}
        <TabsContent value="organization" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card><CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input className="h-9 text-xs" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">GST Number</Label><Input className="h-9 text-xs" value={orgForm.gst_number} onChange={e => setOrgForm({ ...orgForm, gst_number: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Default Tax %</Label><Input className="h-9 text-xs" type="number" step="0.5" value={orgForm.default_tax_percent} onChange={e => setOrgForm({ ...orgForm, default_tax_percent: +e.target.value })} /></div>
                <div className="flex items-center gap-3 pt-5">
                  <Switch checked={orgForm.tax_inclusive} onCheckedChange={c => setOrgForm({ ...orgForm, tax_inclusive: c })} />
                  <Label className="text-xs">Tax Inclusive Pricing</Label>
                </div>
              </div>
              <Button size="sm" className="h-9 text-xs" onClick={saveOrg} disabled={saving === "org"}>
                {saving === "org" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Save Changes
              </Button>
            </CardContent></Card>
          </motion.div>
        </TabsContent>

        {/* Branch */}
        <TabsContent value="branch" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card><CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold">Branch Details — {branch?.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Branch Name</Label><Input className="h-9 text-xs" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input className="h-9 text-xs" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">City</Label><Input className="h-9 text-xs" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9 text-xs" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">UPI VPA</Label><Input className="h-9 text-xs" value={branchForm.upi_vpa} onChange={e => setBranchForm({ ...branchForm, upi_vpa: e.target.value })} /></div>
              </div>
              <Button size="sm" className="h-9 text-xs" onClick={saveBranch} disabled={saving === "branch"}>
                {saving === "branch" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Save Changes
              </Button>
            </CardContent></Card>
          </motion.div>
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card><CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold">Your Profile</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {profileForm.full_name.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{profileForm.full_name}</p>
                  <Badge className="text-[10px] capitalize mt-0.5">{staff?.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Full Name</Label><Input className="h-9 text-xs" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="h-9 text-xs opacity-50" value={profileForm.email} disabled /></div>
                <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9 text-xs" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
              </div>
              <Button size="sm" className="h-9 text-xs" onClick={saveProfile} disabled={saving === "profile"}>
                {saving === "profile" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Save Changes
              </Button>
            </CardContent></Card>
          </motion.div>
        </TabsContent>

        {/* Subscription */}
        <TabsContent value="subscription" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">Current Plan</h3>
                  <p className="text-xs text-muted-foreground">Your subscription details</p>
                </div>
                <Badge className="text-xs capitalize">{organization?.plan || "starter"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Status</span><Badge variant="outline" className="text-[9px] capitalize">{organization?.subscription_status || "trialing"}</Badge></div>
                <div className="flex justify-between"><span>Plan</span><span className="font-medium text-foreground capitalize">{organization?.plan || "Starter"}</span></div>
              </div>
            </CardContent></Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan, i) => {
                const isCurrent = (organization?.plan || "starter") === plan.name.toLowerCase();
                return (
                  <Card key={plan.name} className={`${isCurrent ? "border-primary/50 shadow-md" : "border-border"}`}>
                    <CardContent className="p-5 space-y-4">
                      {isCurrent && <Badge className="text-[9px] bg-primary/10 text-primary">Current Plan</Badge>}
                      <h4 className="text-lg font-bold">{plan.name}</h4>
                      <p className="text-2xl font-bold text-primary">{plan.price}</p>
                      <div className="space-y-2">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-muted-foreground">{f}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant={isCurrent ? "outline" : "default"}
                        size="sm"
                        className="w-full h-9 text-xs"
                        disabled={isCurrent}
                      >
                        {isCurrent ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
