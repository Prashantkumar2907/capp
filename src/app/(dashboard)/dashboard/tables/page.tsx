"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Plus, QrCode, Table2, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { readApiResponse } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { clientEnv } from "@/lib/env";
import { useAuth } from "@/features/auth/auth-provider";
import type { RestaurantTable } from "@/types/database";

export default function TablesPage() {
  const { branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ label: "", capacity: 4 });

  const tables = useQuery({
    queryKey: ["tables", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tables").select("*").eq("branch_id", branch!.id).order("table_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branch,
  });

  const add = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branch?.id,
          label: form.label || undefined,
          capacity: form.capacity,
        }),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tables"] });
      setAddOpen(false);
      setForm({ label: "", capacity: 4 });
      toast.success("Table added");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ table, status }: { table: RestaurantTable; status: RestaurantTable["status"] }) => {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await readApiResponse(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
    onError: (error) => toast.error(error.message),
  });

  const counts = useMemo(() => {
    const rows = tables.data ?? [];
    return {
      total: rows.length,
      occupied: rows.filter((table) => table.status === "occupied").length,
      available: rows.filter((table) => table.status === "available").length,
    };
  }, [tables.data]);

  const urlFor = (tableNumber: number) => `${clientEnv.appUrl}/order/${branch?.id}/${tableNumber}`;
  const downloadQr = (table: RestaurantTable) => {
    const svg = document.getElementById(`table-${table.id}-qr`);
    if (!svg) return;

    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${table.table_number}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Tables" description={`${counts.available} available | ${counts.occupied} occupied | ${counts.total} total`} actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add table</Button>} />
      {tables.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-44" />)}</div>
      ) : tables.error ? (
        <EmptyState icon={AlertCircle} title="Tables could not be loaded" description="Refresh the page or check your branch access." />
      ) : tables.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tables.data.map((table) => (
            <Card key={table.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-numbers flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">{table.table_number}</div>
                    <div>
                      <h2 className="text-sm font-semibold">{table.label ?? `Table ${table.table_number}`}</h2>
                      <p className="mt-1 text-xs text-muted-foreground"><Users className="mr-1 inline h-3 w-3" />{table.capacity} seats</p>
                    </div>
                  </div>
                  <Badge variant={table.status === "available" ? "success" : table.status === "occupied" ? "warning" : "secondary"}>{table.status}</Badge>
                </div>
                <div className="mt-4">
                  <Select
                    value={table.status}
                    disabled={updateStatus.isPending}
                    onChange={(event) => {
                      const status = event.target.value as RestaurantTable["status"];
                      if (status === "inactive" && !window.confirm(`Mark Table ${table.table_number} inactive? Its QR link will no longer work for guests.`)) return;
                      updateStatus.mutate({ table, status });
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQrTable(table)}><QrCode className="h-3.5 w-3.5" />QR</Button>
                  <Button variant="ghost" size="sm" onClick={() => { void navigator.clipboard.writeText(urlFor(table.table_number)); toast.success("QR link copied"); }}><Copy className="h-3.5 w-3.5" />Copy</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Table2} title="No tables yet" description="Create tables to generate customer QR order links." actionLabel="Add table" onAction={() => setAddOpen(true)} />
      )}
      <Dialog open={addOpen} title="Add table" onOpenChange={setAddOpen}>
        <div className="space-y-3">
          <FormField id="table-label" label="Label"><Input id="table-label" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Window table" /></FormField>
          <FormField id="table-capacity" label="Capacity"><Input id="table-capacity" type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} /></FormField>
          <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>Create table</Button>
        </div>
      </Dialog>
      <Dialog open={!!qrTable} title={`Table ${qrTable?.table_number} QR`} onOpenChange={() => setQrTable(null)}>
        {qrTable ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-fit rounded-2xl bg-white p-4">
              <QRCodeSVG id={`table-${qrTable.id}-qr`} value={urlFor(qrTable.table_number)} size={220} fgColor="#128c7e" includeMargin />
            </div>
            <div className="text-sm font-semibold">{branch?.name ?? "Restaurant"} - Table {qrTable.table_number}</div>
            <p className="break-all text-xs text-muted-foreground">{urlFor(qrTable.table_number)}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => downloadQr(qrTable)}>Download SVG</Button>
              <Button onClick={() => window.print()}>Print QR</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
