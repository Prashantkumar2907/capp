"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, UtensilsCrossed, ArrowRight, ArrowLeft, Check,
  Building2, MapPin, Store, ChefHat, Sparkles,
} from "lucide-react";

const RESTAURANT_TYPES = [
  { value: "casual", label: "Casual Dining", icon: "🍽️" },
  { value: "fine_dining", label: "Fine Dining", icon: "✨" },
  { value: "cafe", label: "Café", icon: "☕" },
  { value: "qsr", label: "Quick Service", icon: "🍔" },
  { value: "bar", label: "Bar & Lounge", icon: "🍸" },
  { value: "cloud_kitchen", label: "Cloud Kitchen", icon: "🏭" },
];

const STEPS = ["Restaurant", "Branch", "Menu", "Complete"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Form state
  const [orgData, setOrgData] = useState({
    name: "", restaurant_type: "casual", gst_number: "",
    default_tax_percent: 5, tax_inclusive: true,
  });
  const [branchData, setBranchData] = useState({
    name: "Main Branch", address: "", city: "", phone: "", upi_vpa: "", table_count: 10,
  });
  const [seedMenu, setSeedMenu] = useState(true);

  const canProceed = () => {
    if (step === 0) return orgData.name.length >= 2;
    if (step === 1) return branchData.name.length >= 2;
    return true;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check existing staff
      const { data: existingStaff } = await supabase
        .from("staff").select("id").eq("user_id", user.id).limit(1).single();
      if (existingStaff) { router.push("/dashboard"); return; }

      // Create organization
      const baseSlug = orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgData.name, slug,
          restaurant_type: orgData.restaurant_type,
          gst_number: orgData.gst_number || null,
          default_tax_percent: orgData.default_tax_percent,
          tax_inclusive: orgData.tax_inclusive,
        })
        .select().single();
      if (orgError || !org) throw new Error(orgError?.message || "Failed to create organization");

      // Create branch
      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert({
          org_id: org.id, name: branchData.name,
          address: branchData.address || null, city: branchData.city || null,
          phone: branchData.phone || null, upi_vpa: branchData.upi_vpa || null,
          table_count: branchData.table_count,
        })
        .select().single();
      if (branchError || !branch) throw new Error("Failed to create branch");

      // Create owner staff record
      const { error: staffError } = await supabase.from("staff").insert({
        user_id: user.id, org_id: org.id, branch_id: branch.id, role: "owner",
        full_name: user.user_metadata.full_name || user.email?.split("@")[0] || "Owner",
        email: user.email!,
      });
      if (staffError) throw new Error("Failed to create staff record");

      // Create tables
      const tables = Array.from({ length: branchData.table_count }, (_, i) => ({
        branch_id: branch.id, table_number: i + 1, capacity: 4,
      }));
      await supabase.from("tables").insert(tables);

      // Seed menu if opted in
      if (seedMenu) {
        const cats = ["Starters", "Main Course", "Breads", "Desserts", "Beverages"];
        const catIds: string[] = [];
        for (let i = 0; i < cats.length; i++) {
          const { data } = await supabase.from("categories").insert({
            org_id: org.id, name: cats[i], sort_order: i + 1,
          }).select("id").single();
          catIds.push(data?.id || "");
        }

        const dishes = [
          { name: "Paneer Tikka", price: 249, is_veg: true, cat: 0 },
          { name: "Chicken 65", price: 299, is_veg: false, cat: 0 },
          { name: "Veg Manchurian", price: 199, is_veg: true, cat: 0 },
          { name: "Butter Chicken", price: 349, is_veg: false, cat: 1 },
          { name: "Dal Makhani", price: 249, is_veg: true, cat: 1 },
          { name: "Palak Paneer", price: 269, is_veg: true, cat: 1 },
          { name: "Chicken Biryani", price: 299, is_veg: false, cat: 1 },
          { name: "Butter Naan", price: 49, is_veg: true, cat: 2 },
          { name: "Garlic Naan", price: 59, is_veg: true, cat: 2 },
          { name: "Gulab Jamun", price: 99, is_veg: true, cat: 3 },
          { name: "Masala Chai", price: 49, is_veg: true, cat: 4 },
          { name: "Sweet Lassi", price: 79, is_veg: true, cat: 4 },
        ];

        for (const d of dishes) {
          const { data: dish } = await supabase.from("dishes").insert({
            org_id: org.id, category_id: catIds[d.cat] || null,
            name: d.name, price: d.price, is_veg: d.is_veg,
          }).select("id").single();
          if (dish) {
            await supabase.from("branch_dishes").insert({ branch_id: branch.id, dish_id: dish.id });
          }
        }
      }

      toast.success("🎉 Restaurant setup complete!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-20 right-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-20 mx-1 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        </div>

        <Card className="border-border shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Restaurant */}
              {step === 0 && (
                <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Name your restaurant</h2>
                    <p className="text-sm text-muted-foreground mt-1">This is how it will appear to your customers</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Restaurant Name</Label>
                    <Input className="h-11" placeholder="e.g., Spice Garden" value={orgData.name}
                      onChange={e => setOrgData({ ...orgData, name: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESTAURANT_TYPES.map(t => (
                        <button key={t.value} onClick={() => setOrgData({ ...orgData, restaurant_type: t.value })}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            orgData.restaurant_type === t.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}>
                          <div className="text-xl mb-1">{t.icon}</div>
                          <div className="text-[10px] font-medium">{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Tax %</Label>
                      <Input className="h-10" type="number" step="0.5" value={orgData.default_tax_percent}
                        onChange={e => setOrgData({ ...orgData, default_tax_percent: +e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">GST (optional)</Label>
                      <Input className="h-10" placeholder="22AAAAA0000A1Z5" value={orgData.gst_number}
                        onChange={e => setOrgData({ ...orgData, gst_number: e.target.value })} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Branch */}
              {step === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Set up your branch</h2>
                    <p className="text-sm text-muted-foreground mt-1">You can add more branches later</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Branch Name</Label>
                    <Input className="h-11" value={branchData.name}
                      onChange={e => setBranchData({ ...branchData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Address</Label>
                    <Input className="h-10" placeholder="Street address" value={branchData.address}
                      onChange={e => setBranchData({ ...branchData, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">City</Label>
                      <Input className="h-10" placeholder="City" value={branchData.city}
                        onChange={e => setBranchData({ ...branchData, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Phone</Label>
                      <Input className="h-10" placeholder="+91 9876543210" value={branchData.phone}
                        onChange={e => setBranchData({ ...branchData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">UPI VPA</Label>
                      <Input className="h-10" placeholder="shop@upi" value={branchData.upi_vpa}
                        onChange={e => setBranchData({ ...branchData, upi_vpa: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Tables</Label>
                      <Input className="h-10" type="number" min={1} max={100} value={branchData.table_count}
                        onChange={e => setBranchData({ ...branchData, table_count: +e.target.value })} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Menu */}
              {step === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Quick menu setup</h2>
                    <p className="text-sm text-muted-foreground mt-1">Get started faster with sample Indian dishes</p>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => setSeedMenu(true)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${seedMenu ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Add sample menu</p>
                          <p className="text-xs text-muted-foreground">12 dishes across 5 categories (you can edit these later)</p>
                        </div>
                        {seedMenu && <Check className="h-5 w-5 text-primary ml-auto" />}
                      </div>
                    </button>
                    <button onClick={() => setSeedMenu(false)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${!seedMenu ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Start from scratch</p>
                          <p className="text-xs text-muted-foreground">Add your own dishes from the menu page</p>
                        </div>
                        {!seedMenu && <Check className="h-5 w-5 text-primary ml-auto" />}
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 3 && (
                <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Ready to go!</h2>
                    <p className="text-sm text-muted-foreground mt-1">Here&apos;s a summary of your setup</p>
                  </div>

                  <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Restaurant</span>
                      <span className="font-medium">{orgData.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{orgData.restaurant_type.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Branch</span>
                      <span className="font-medium">{branchData.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tables</span>
                      <span className="font-medium">{branchData.table_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Menu</span>
                      <span className="font-medium">{seedMenu ? "Sample dishes" : "Start empty"}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={step === 0} className="text-sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              {step < 3 ? (
                <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="text-sm px-6">
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleComplete} disabled={isLoading} className="text-sm px-6">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Launch Restaurant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
