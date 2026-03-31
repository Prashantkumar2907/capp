"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteStaffSchema, type InviteStaffInput } from "@/lib/validations";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Loader2, UserCircle, Mail, Shield, XCircle, CheckCircle } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  manager: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  waiter: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  kitchen: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  cashier: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function StaffPage() {
  const { organization, branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ["branches", organization?.id],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").eq("org_id", organization!.id).eq("is_active", true);
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("org_id", organization!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!organization,
  });

  const form = useForm({
    resolver: zodResolver(inviteStaffSchema) as any,
    defaultValues: { full_name: "", email: "", phone: "", role: "waiter", branch_id: branch?.id || "" },
  });

  const inviteStaff = useMutation({
    mutationFn: async (data: any) => {
      // In production, this would send an invite email. For MVP, create a placeholder staff record.
      const { error } = await supabase.from("staff").insert({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        org_id: organization!.id,
        branch_id: branch?.id || data.branch_id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false);
      form.reset();
      toast.success("Staff member added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleStaff = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("staff").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Staff</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {staff?.filter(s => s.is_active).length || 0} active · {staff?.length || 0} total
          </p>
        </div>
        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Staff
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-poppins">Add Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((d) => inviteStaff.mutate(d))} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input className="h-8 text-xs" {...form.register("full_name")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input className="h-8 text-xs" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select defaultValue="waiter" onValueChange={(v) => form.setValue("role", v as InviteStaffInput["role"])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).filter(([k]) => k !== "OWNER").map(([key, value]) => (
                      <SelectItem key={key} value={value} className="text-xs">{key.charAt(0) + key.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch</Label>
                <Select defaultValue={branch?.id || ""} onValueChange={(v) => { if (v) form.setValue("branch_id", v); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={inviteStaff.isPending}>
                {inviteStaff.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Add Staff
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {staff?.map((s) => (
            <Card key={s.id} className={`card-hover border-zinc-200 dark:border-zinc-800 ${!s.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                    <UserCircle className="h-4 w-4 text-teal-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.full_name || "Unnamed"}</span>
                      <Badge className={`text-[9px] h-4 px-1.5 ${ROLE_COLORS[s.role] || "bg-zinc-100 text-zinc-600"}`}>
                        {ROLE_LABELS[s.role] || s.role}
                      </Badge>
                    </div>
                    {s.email && (
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" />{s.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleStaff.mutate({ id: s.id, is_active: !s.is_active })}
                    >
                      {s.is_active ? (
                        <><XCircle className="h-3 w-3 mr-1 text-red-500" /> Deactivate</>
                      ) : (
                        <><CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Activate</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
