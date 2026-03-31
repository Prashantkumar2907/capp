"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBranchSchema, type CreateBranchInput } from "@/lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, MapPin, Phone, Loader2, Store } from "lucide-react";

export default function BranchesPage() {
  const { organization } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("org_id", organization!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!organization,
  });

  const form = useForm({
    resolver: zodResolver(createBranchSchema) as any,
    defaultValues: { name: "", table_count: 10, address: "", city: "", phone: "", upi_vpa: "" },
  });

  const createBranch = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("branches").insert({ ...data, org_id: organization!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDialogOpen(false);
      form.reset();
      toast.success("Branch created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleBranch = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("branches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Branches</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{branches?.length || 0} branches</p>
        </div>
        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Branch
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-poppins">Add Branch</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((d) => createBranch.mutate(d))} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Branch Name</Label>
                <Input className="h-8 text-xs" {...form.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input className="h-8 text-xs" {...form.register("address")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input className="h-8 text-xs" {...form.register("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-8 text-xs" {...form.register("phone")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UPI VPA (for payments)</Label>
                <Input className="h-8 text-xs" placeholder="yourshop@upi" {...form.register("upi_vpa")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Number of Tables</Label>
                <Input className="h-8 text-xs" type="number" {...form.register("table_count", { valueAsNumber: true })} />
              </div>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={createBranch.isPending}>
                {createBranch.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Create Branch
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {branches?.map((b) => (
            <Card key={b.id} className="card-hover border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{b.name}</h3>
                      {b.address && (
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />{b.address}{b.city ? `, ${b.city}` : ""}
                        </p>
                      )}
                      {b.phone && (
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />{b.phone}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[9px] h-4">{b.table_count} tables</Badge>
                        {b.upi_vpa && <Badge variant="outline" className="text-[9px] h-4">UPI: {b.upi_vpa}</Badge>}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={b.is_active}
                    onCheckedChange={(checked) => toggleBranch.mutate({ id: b.id, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
