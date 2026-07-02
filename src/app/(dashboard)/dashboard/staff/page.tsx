"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Users, UserPlus, Pencil, Trash2, Loader2, Shield } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import type { Staff, StaffRole } from "@/lib/supabase/types";

const ROLES = ["owner", "admin", "manager", "waiter", "kitchen", "cashier"] as const;
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  manager: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  waiter: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  kitchen: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  cashier: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

export default function StaffPage() {
  const { organization, branch, staff: currentStaff } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "waiter" as StaffRole });
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staff", organization?.id],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("*").eq("org_id", organization!.id).order("created_at");
      return data || [];
    },
    enabled: !!organization,
  });

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("staff").update({ full_name: form.full_name, email: form.email, phone: form.phone, role: form.role }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff").insert({
          org_id: organization!.id, branch_id: branch?.id || null,
          full_name: form.full_name, email: form.email,
          phone: form.phone || null, role: form.role,
        });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false); setEditing(null);
      toast.success(editing ? "Staff updated" : "Staff invited");
    } catch (err: unknown) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff removed"); },
  });

  const filtered = staffList?.filter(s => roleFilter === "all" || s.role === roleFilter) || [];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Staff"
        description={`${staffList?.length || 0} team members`}
        actions={
          <Button size="sm" className="h-9 text-xs" onClick={() => { setEditing(null); setForm({ full_name: "", email: "", phone: "", role: "waiter" }); setDialogOpen(true); }}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Invite Staff
          </Button>
        }
      />

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...ROLES].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {r === "all" ? "All" : r} {r !== "all" && `(${staffList?.filter(s => s.role === r).length || 0})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="card-hover">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {member.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{member.full_name || "Unnamed"}</span>
                      {member.id === currentStaff?.id && <Badge variant="outline" className="text-[8px] h-4">You</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge className={`text-[10px] h-5 capitalize ${ROLE_COLORS[member.role] || ""}`}>
                    <Shield className="h-2.5 w-2.5 mr-1" /> {member.role}
                  </Badge>
                  <Badge variant={member.is_active ? "default" : "secondary"} className="text-[9px] h-4">{member.is_active ? "Active" : "Inactive"}</Badge>
                  {member.id !== currentStaff?.id && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(member); setForm({ full_name: member.full_name || "", email: member.email || "", phone: member.phone || "", role: member.role }); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setConfirmDeleteId(member.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No staff members" actionLabel="Invite Staff" onAction={() => setDialogOpen(true)} />
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">{editing ? "Edit" : "Invite"} Staff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Full Name</Label><Input className="h-9 text-xs" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="h-9 text-xs" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9 text-xs" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <select className="w-full h-9 text-xs border rounded-md px-2 bg-transparent" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })}>
                {ROLES.filter(r => r !== "owner").map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <Button className="w-full h-9 text-xs" onClick={save} disabled={saving || !form.full_name || !form.email}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} {editing ? "Update" : "Invite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Remove staff member?"
        description="This will permanently remove this staff member from your organisation. This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => { if (confirmDeleteId) deleteStaff.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
