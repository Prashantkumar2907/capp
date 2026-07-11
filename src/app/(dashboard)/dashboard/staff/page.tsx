"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit2, KeyRound, Plus, RefreshCw, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/client";
import { roleLabels, roles, type Role } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import type { Staff } from "@/types/database";

const assignableRoles = roles.filter((role) => role !== "owner");

function randomPassword() {
  // readable for hand-over: 2 words-ish + 2 digits, no confusing chars
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let index = 0; index < 8; index += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function StaffPage() {
  const { organization, staff: currentStaff } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [filter, setFilter] = useState<Role | "all">("all");
  const [form, setForm] = useState({ full_name: "", username: "", password: randomPassword(), phone: "", roles: ["waiter"] as Role[] });
  const [issued, setIssued] = useState<{ login: string; password: string; roles: Role[] } | null>(null);
  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const [resetPassword, setResetPassword] = useState(randomPassword());

  const staff = useQuery({
    queryKey: ["staff", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").eq("org_id", organization!.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization,
  });

  const staffRoles = useQuery({
    queryKey: ["staff-roles", organization?.id],
    queryFn: async () => {
      const ids = (staff.data ?? []).map((member) => member.id);
      if (!ids.length) return {};
      const { data, error } = await supabase.from("staff_roles").select("staff_id, role").in("staff_id", ids);
      if (error) throw error;
      const map: Record<string, Role[]> = {};
      (data ?? []).forEach((row) => {
        map[row.staff_id] = [...(map[row.staff_id] ?? []), row.role as Role];
      });
      return map;
    },
    enabled: !!staff.data?.length,
  });

  const provision = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/staff/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.full_name,
          username: form.username,
          password: form.password,
          phone: form.phone,
          roles: form.roles,
        }),
      });
      const payload = (await response.json()) as { error?: string; login?: string; roles?: Role[] };
      if (!response.ok || !payload.login) throw new Error(payload.error ?? "Unable to create login");
      return payload;
    },
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({ queryKey: ["staff-roles"] }),
      ]);
      setIssued({ login: payload.login!, password: form.password, roles: payload.roles ?? form.roles });
      setForm({ full_name: "", username: "", password: randomPassword(), phone: "", roles: ["waiter"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const resetPass = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/staff/provision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: resetTarget!.id, password: resetPassword }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to reset password");
    },
    onSuccess: () => {
      toast.success(`New password set. Hand it over: ${resetPassword}`);
      setResetTarget(null);
      setResetPassword(randomPassword());
    },
    onError: (error) => toast.error(error.message),
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("staff")
        .update({ full_name: editing!.full_name, phone: editing!.phone })
        .eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
      setEditing(null);
      toast.success("Staff updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (member: Staff) => {
      const { error } = await supabase.from("staff").update({ is_active: !member.is_active }).eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
    onError: (error) => toast.error(error.message),
  });

  const toggleRole = (role: Role) => {
    setForm((previous) => {
      const has = previous.roles.includes(role);
      const next = has ? previous.roles.filter((held) => held !== role) : [...previous.roles, role];
      return { ...previous, roles: next.length ? next : previous.roles };
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed — note it down manually");
    }
  };

  const filtered = (staff.data ?? []).filter((member) => {
    if (filter === "all") return true;
    const held = staffRoles.data?.[member.id] ?? [member.role];
    return held.includes(filter);
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        description="Create logins for kitchen, waiters, and cashiers — one person can hold several roles."
        actions={
          <Button onClick={() => { setIssued(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4" />
            Create login
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        {(["all", ...roles] as Array<Role | "all">).map((role) => (
          <button key={role} onClick={() => setFilter(role)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === role ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
            {role === "all" ? "All" : roleLabels[role]}
          </button>
        ))}
      </div>
      {staff.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>
      ) : filtered.length ? (
        <div className="space-y-2">
          {filtered.map((member) => {
            const held = staffRoles.data?.[member.id] ?? [member.role];
            return (
              <Card key={member.id} className={member.is_active ? "" : "opacity-60"}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="font-numbers flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(member.full_name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{member.full_name || "Unnamed"}</p>
                      {member.id === currentStaff?.id ? <Badge variant="outline">You</Badge> : null}
                      {!member.user_id ? <Badge variant="outline">No login</Badge> : null}
                      {!member.is_active ? <Badge variant="outline">Inactive</Badge> : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                    {held.map((role) => (
                      <Badge key={role}><Shield className="h-3 w-3" />{roleLabels[role]}</Badge>
                    ))}
                  </div>
                  {member.id !== currentStaff?.id ? (
                    <div className="flex gap-1">
                      {member.user_id ? (
                        <Button variant="ghost" size="icon" title="Reset password" onClick={() => { setResetPassword(randomPassword()); setResetTarget(member); }}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(member)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" title={member.is_active ? "Deactivate" : "Reactivate"} onClick={() => toggleActive.mutate(member)}>
                        {member.is_active ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="No staff found" description="Create role logins your team can use on shared devices." actionLabel="Create login" onAction={() => setCreateOpen(true)} />
      )}

      {/* Create login */}
      <Dialog open={createOpen} title={issued ? "Login ready — hand it over" : "Create staff login"} onOpenChange={(open) => { setCreateOpen(open); if (!open) setIssued(null); }}>
        {issued ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Write these down or copy them — the password is not shown again.</p>
            <div className="space-y-2 rounded-2xl border bg-secondary p-3">
              <CredRow label="Login" value={issued.login} onCopy={copyText} />
              <CredRow label="Password" value={issued.password} onCopy={copyText} />
              <div className="flex flex-wrap gap-1 pt-1">
                {issued.roles.map((role) => <Badge key={role}>{roleLabels[role]}</Badge>)}
              </div>
            </div>
            <Button className="w-full" onClick={() => { setIssued(null); setCreateOpen(false); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Full name"><Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Ramesh" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Login handle"><Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })} placeholder="kitchen1" /></Field>
              <Field label="Password">
                <div className="flex gap-1">
                  <Input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                  <Button variant="secondary" size="icon" className="shrink-0" title="Generate" onClick={() => setForm({ ...form, password: randomPassword() })}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </Field>
            </div>
            <Field label="Phone (optional)"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Roles — pick every hat this person wears">
              <div className="grid grid-cols-2 gap-1.5">
                {assignableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${form.roles.includes(role) ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"}`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </Field>
            <Button className="w-full" disabled={!form.full_name || !form.username || provision.isPending} onClick={() => provision.mutate()}>
              Create login
            </Button>
          </div>
        )}
      </Dialog>

      {/* Edit name/phone */}
      <Dialog open={!!editing} title="Edit staff" onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <div className="space-y-3">
            <Field label="Full name"><Input value={editing.full_name ?? ""} onChange={(event) => setEditing({ ...editing, full_name: event.target.value })} /></Field>
            <Field label="Phone"><Input value={editing.phone ?? ""} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} /></Field>
            <Button className="w-full" disabled={saveEdit.isPending} onClick={() => saveEdit.mutate()}>Save</Button>
          </div>
        ) : null}
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetTarget} title={`Reset password — ${resetTarget?.full_name ?? ""}`} onOpenChange={(open) => !open && setResetTarget(null)}>
        <div className="space-y-3">
          <Field label="New password">
            <div className="flex gap-1">
              <Input value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
              <Button variant="secondary" size="icon" className="shrink-0" onClick={() => setResetPassword(randomPassword())}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </Field>
          <Button className="w-full" disabled={resetPass.isPending} onClick={() => resetPass.mutate()}>Set password</Button>
        </div>
      </Dialog>
    </div>
  );
}

function CredRow({ label, value, onCopy }: { label: string; value: string; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[0.65rem] uppercase text-muted-foreground">{label}</p>
        <p className="font-numbers truncate text-sm font-medium">{value}</p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onCopy(value)}><Copy className="h-4 w-4" /></Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
