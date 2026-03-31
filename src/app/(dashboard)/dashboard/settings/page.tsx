"use client";

import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Building2, User, CreditCard } from "lucide-react";
import { PLANS } from "@/lib/constants";

export default function SettingsPage() {
  const { organization, branch, staff, refreshStaff } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const orgForm = useForm({
    defaultValues: {
      name: organization?.name || "",
      gst_number: organization?.gst_number || "",
      default_tax_percent: organization?.default_tax_percent || 5,
      tax_inclusive: organization?.tax_inclusive ?? true,
    },
  });

  const branchForm = useForm({
    defaultValues: {
      name: branch?.name || "",
      address: branch?.address || "",
      city: branch?.city || "",
      phone: branch?.phone || "",
      upi_vpa: branch?.upi_vpa || "",
    },
  });

  const updateOrg = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("organizations").update(data).eq("id", organization!.id);
      if (error) throw error;
    },
    onSuccess: () => { refreshStaff(); toast.success("Organization updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBranch = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("branches").update(data).eq("id", branch!.id);
      if (error) throw error;
    },
    onSuccess: () => { refreshStaff(); toast.success("Branch updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const PLAN_INFO: Record<string, { name: string; price: number; branches: number; staff: number; dishes: number }> = {
    starter: { name: "Starter", price: 999, branches: 1, staff: 10, dishes: 100 },
    growth: { name: "Growth", price: 1599, branches: 2, staff: 25, dishes: 300 },
    pro: { name: "Pro", price: 2499, branches: 3, staff: 50, dishes: 500 },
  };
  const planKey = organization?.plan || "starter";
  const currentPlan = PLAN_INFO[planKey] || PLAN_INFO.starter;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold font-poppins">Settings</h1>

      {/* Subscription */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-poppins flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-500" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-3">
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              {currentPlan.name || "Starter"}
            </Badge>
            <span className="text-xs text-zinc-500">
              ₹{currentPlan.price}/mo
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 text-center">
            <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900">
              <p className="text-lg font-bold text-teal-600">{currentPlan.branches}</p>
              <p className="text-[10px] text-zinc-500">Branches</p>
            </div>
            <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900">
              <p className="text-lg font-bold text-teal-600">{currentPlan.staff}</p>
              <p className="text-[10px] text-zinc-500">Staff</p>
            </div>
            <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900">
              <p className="text-lg font-bold text-teal-600">{currentPlan.dishes}</p>
              <p className="text-[10px] text-zinc-500">Dishes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-poppins flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-500" /> Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={orgForm.handleSubmit((d) => updateOrg.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input className="h-8 text-xs" {...orgForm.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GST Number</Label>
                <Input className="h-8 text-xs" {...orgForm.register("gst_number")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tax %</Label>
                <Input className="h-8 text-xs" type="number" step="0.1" {...orgForm.register("default_tax_percent", { valueAsNumber: true })} />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Switch
                  checked={orgForm.watch("tax_inclusive")}
                  onCheckedChange={(v) => orgForm.setValue("tax_inclusive", v)}
                />
                <Label className="text-xs">Tax Inclusive</Label>
              </div>
            </div>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={updateOrg.isPending}>
              {updateOrg.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save Organization
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Branch */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-poppins flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-500" /> Current Branch
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={branchForm.handleSubmit((d) => updateBranch.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input className="h-8 text-xs" {...branchForm.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input className="h-8 text-xs" {...branchForm.register("city")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input className="h-8 text-xs" {...branchForm.register("address")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input className="h-8 text-xs" {...branchForm.register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UPI VPA</Label>
                <Input className="h-8 text-xs" placeholder="shop@upi" {...branchForm.register("upi_vpa")} />
              </div>
            </div>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={updateBranch.isPending}>
              {updateBranch.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save Branch
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-poppins flex items-center gap-2">
            <User className="h-4 w-4 text-teal-500" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium">{staff?.full_name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium">{staff?.email || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-zinc-500">Role</span>
              <Badge className="bg-teal-100 text-teal-700 text-[9px] h-4">{staff?.role || "—"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
