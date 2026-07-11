"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, MapPin, Phone, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-provider";
import type { Branch } from "@/types/database";

const emptyForm = { name: "", address: "", city: "", phone: "", upi_vpa: "", table_count: 10 };

export default function BranchesPage() {
  const { organization } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);

  const branches = useQuery({
    queryKey: ["branches", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*").eq("org_id", organization!.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("branches").update(form).eq("id", editing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("branches").insert({ ...form, org_id: organization!.id });
      if (error) {
        if (error.message.includes("PLAN_LIMIT")) {
          throw new Error("Branch limit reached for your plan — upgrade in Settings to add more branches");
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(editing ? "Branch updated" : "Branch created");
    },
    onError: (error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (branch: Branch) => {
      const { error } = await supabase.from("branches").update({ is_active: !branch.is_active }).eq("id", branch.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      address: branch.address ?? "",
      city: branch.city ?? "",
      phone: branch.phone ?? "",
      upi_vpa: branch.upi_vpa ?? "",
      table_count: branch.table_count,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Branches"
        description="Manage physical locations and payment settings."
        actions={
          <Button onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add branch
          </Button>
        }
      />
      {branches.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40" />)}</div>
      ) : branches.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.data.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold">{branch.name}</h2>
                      <Badge className="mt-1" variant={branch.is_active ? "success" : "secondary"}>{branch.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                  <Switch checked={branch.is_active} onCheckedChange={() => toggle.mutate(branch)} />
                </div>
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{[branch.address, branch.city].filter(Boolean).join(", ") || "No address"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{branch.phone || "No phone"}</p>
                  <p>{branch.table_count} tables | UPI {branch.upi_vpa || "not set"}</p>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openEdit(branch)}>
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No branches yet" description="Add your first branch to start taking orders." actionLabel="Add branch" onAction={() => setDialogOpen(true)} />
      )}
      <Dialog open={dialogOpen} title={editing ? "Edit branch" : "Add branch"} onOpenChange={setDialogOpen}>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="UPI VPA"><Input value={form.upi_vpa} onChange={(event) => setForm({ ...form, upi_vpa: event.target.value })} /></Field>
            <Field label="Tables"><Input type="number" value={form.table_count} onChange={(event) => setForm({ ...form, table_count: Number(event.target.value) })} /></Field>
          </div>
          <Button className="w-full" disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
            {editing ? "Save branch" : "Create branch"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
