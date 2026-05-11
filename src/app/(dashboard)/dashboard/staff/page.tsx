"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { readApiResponse } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { operationalListFetchLimit, roleLabels, roles, type Role } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import { useAuth } from "@/features/auth/auth-provider";
import type { Staff } from "@/types/database";

const emptyForm = { full_name: "", email: "", phone: "", role: "waiter" as Role };

export default function StaffPage() {
  const { organization, branch, staff: currentStaff } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [filter, setFilter] = useState<Role | "all">("all");
  const [form, setForm] = useState(emptyForm);

  const staff = useQuery({
    queryKey: ["staff", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").eq("org_id", organization!.id).order("created_at").limit(operationalListFetchLimit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, phone: form.phone || undefined, branch_id: branch?.id ?? null };
      if (editing) {
        const response = await fetch(`/api/staff/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, phone: form.phone || undefined }),
        });
        await readApiResponse(response);
        return;
      }
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(editing ? "Staff updated" : "Staff added");
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      await readApiResponse(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const filtered = staff.data?.filter((member) => filter === "all" || member.role === filter) ?? [];
  const pagination = usePagination(filtered, 8);
  const { setPage } = pagination;

  const edit = (member: Staff) => {
    setEditing(member);
    setForm({ full_name: member.full_name ?? "", email: member.email ?? "", phone: member.phone ?? "", role: member.role });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Staff" description="Assign focused roles for each part of service." actions={<Button onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}><Plus className="h-4 w-4" />Add staff</Button>} />
      <div className="flex flex-wrap gap-2">
        {(["all", ...roles] as Array<Role | "all">).map((role) => (
          <button
            key={role}
            onClick={() => {
              setFilter(role);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === role ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
          >
            {role === "all" ? "All" : roleLabels[role]}
          </button>
        ))}
      </div>
      {staff.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>
      ) : filtered.length ? (
        <>
          <div className="space-y-2">
            {pagination.pageItems.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="font-numbers flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(member.full_name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{member.full_name || "Unnamed"}</p>
                        {member.id === currentStaff?.id ? <Badge variant="outline">You</Badge> : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Badge><Shield className="h-3 w-3" />{roleLabels[member.role]}</Badge>
                    {member.id !== currentStaff?.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${member.full_name ?? member.email ?? "staff member"}`} onClick={() => edit(member)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Remove ${member.full_name ?? member.email ?? "staff member"}`} onClick={() => remove.mutate(member.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      ) : (
        <EmptyState icon={Users} title="No staff found" description="Invite or create staff records for service roles." actionLabel="Add staff" onAction={() => setDialogOpen(true)} />
      )}
      <Dialog open={dialogOpen} title={editing ? "Edit staff" : "Add staff"} onOpenChange={setDialogOpen}>
        <div className="space-y-3">
          <Field id="staff-full-name" label="Full name"><Input id="staff-full-name" value={form.full_name} maxLength={100} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></Field>
          <Field id="staff-email" label="Email"><Input id="staff-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field id="staff-phone" label="Phone"><Input id="staff-phone" value={form.phone} maxLength={24} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field id="staff-role" label="Role">
            <Select id="staff-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              {roles.filter((role) => role !== "owner").map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
            </Select>
          </Field>
          <Button className="w-full" disabled={!form.full_name || !form.email || save.isPending} onClick={() => save.mutate()}>{editing ? "Save staff" : "Add staff"}</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
