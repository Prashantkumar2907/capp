"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Store, MapPin, Phone, Pencil, Users, Loader2 } from "lucide-react";

export default function BranchesPage() {
  const { organization } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "", upi_vpa: "", table_count: 10 });
  const [saving, setSaving] = useState(false);

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", organization?.id],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("*").eq("org_id", organization!.id).order("created_at");
      return data || [];
    },
    enabled: !!organization,
  });

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("branches").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert({ ...form, org_id: organization!.id });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDialogOpen(false); setEditing(null);
      toast.success(editing ? "Branch updated" : "Branch created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("branches").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Branches"
        description={`${branches?.length || 0} branches`}
        actions={
          <Button size="sm" className="h-9 text-xs" onClick={() => { setEditing(null); setForm({ name: "", address: "", city: "", phone: "", upi_vpa: "", table_count: 10 }); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Branch
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch, i) => (
            <motion.div key={branch.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{branch.name}</h3>
                        <Badge variant={branch.is_active ? "default" : "secondary"} className="text-[9px] h-4 mt-0.5">
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <Switch checked={branch.is_active} onCheckedChange={(c) => toggleActive.mutate({ id: branch.id, active: c })} />
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {branch.address && <div className="flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0" />{branch.address}{branch.city && `, ${branch.city}`}</div>}
                    {branch.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" />{branch.phone}</div>}
                    <div className="flex items-center gap-2"><Users className="h-3 w-3 shrink-0" />{branch.table_count} tables</div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 h-7 text-[10px]" onClick={() => {
                    setEditing(branch); setForm({ name: branch.name, address: branch.address || "", city: branch.city || "", phone: branch.phone || "", upi_vpa: branch.upi_vpa || "", table_count: branch.table_count }); setDialogOpen(true);
                  }}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No branches" actionLabel="Add Branch" onAction={() => setDialogOpen(true)} />
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">{editing ? "Edit" : "Add"} Branch</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input className="h-9 text-xs" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input className="h-9 text-xs" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">City</Label><Input className="h-9 text-xs" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9 text-xs" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">UPI VPA</Label><Input className="h-9 text-xs" value={form.upi_vpa} onChange={e => setForm({ ...form, upi_vpa: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Tables</Label><Input className="h-9 text-xs" type="number" value={form.table_count} onChange={e => setForm({ ...form, table_count: +e.target.value })} /></div>
            </div>
            <Button className="w-full h-9 text-xs" onClick={save} disabled={saving || !form.name}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} {editing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
