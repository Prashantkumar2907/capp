"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { createOrgSchema, type CreateOrgInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UtensilsCrossed } from "lucide-react";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema) as any,
    defaultValues: { name: "", gst_number: "", default_tax_percent: 5, tax_inclusive: true },
  });

  const onSubmit = async (data: CreateOrgInput) => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    // Check if user already has a staff record (idempotency guard)
    const { data: existingStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (existingStaff) {
      router.push("/dashboard");
      return;
    }

    // Create organization with a unique slug
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: data.name,
        slug,
        gst_number: data.gst_number || null,
        default_tax_percent: data.default_tax_percent,
        tax_inclusive: data.tax_inclusive,
      })
      .select()
      .single();

    if (orgError || !org) {
      toast.error(orgError?.message || "Failed to create organization");
      setIsLoading(false);
      return;
    }

    // Create default branch
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .insert({ org_id: org.id, name: "Main Branch", table_count: 10 })
      .select()
      .single();

    if (branchError || !branch) {
      toast.error("Failed to create default branch");
      setIsLoading(false);
      return;
    }

    // Create staff record for owner
    const { error: staffError } = await supabase.from("staff").insert({
      user_id: user.id,
      org_id: org.id,
      branch_id: branch.id,
      role: "owner",
      full_name: user.user_metadata.full_name || user.email?.split("@")[0] || "Owner",
      email: user.email!,
    });

    if (staffError) {
      toast.error("Failed to create staff record");
      setIsLoading(false);
      return;
    }

    toast.success("Organization created!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-poppins">Set up your restaurant</CardTitle>
          <CardDescription>Create your organization to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant / Organization Name</Label>
              <Input id="name" placeholder="My Restaurant" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number (optional)</Label>
              <Input id="gst_number" placeholder="22AAAAA0000A1Z5" {...register("gst_number")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
              <Label htmlFor="default_tax_percent">Tax %</Label>
              <Input
                  id="default_tax_percent"
                  type="number"
                  step="0.5"
                  {...register("default_tax_percent", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("tax_inclusive")} className="rounded" />
                  Tax Inclusive
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
