"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLE_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, QrCode, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { TableRow } from "@/lib/supabase/types";

export default function TablesPage() {
  const { branch } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableRow | null>(null);
  const [newTable, setNewTable] = useState({ table_number: 1, capacity: 4 });

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables", branch?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tables")
        .select("*")
        .eq("branch_id", branch!.id)
        .order("table_number");
      return data || [];
    },
    enabled: !!branch,
  });

  const createTable = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tables").insert({
        branch_id: branch!.id,
        ...newTable,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setDialogOpen(false);
      setNewTable({ table_number: (tables?.length || 0) + 2, capacity: 4 });
      toast.success("Table created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tables").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
  });

  const getOrderUrl = (table: TableRow) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/order/${branch?.id}/${table.table_number}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Tables</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tables?.length || 0} tables</p>
        </div>
        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Table
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-sm font-poppins">Add Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Table Number</Label>
                <Input className="h-8 text-xs" type="number" value={newTable.table_number} onChange={(e) => setNewTable(p => ({ ...p, table_number: +e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Capacity</Label>
                <Input className="h-8 text-xs" type="number" value={newTable.capacity} onChange={(e) => setNewTable(p => ({ ...p, capacity: +e.target.value }))} />
              </div>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => createTable.mutate()} disabled={createTable.isPending}>
                {createTable.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {tables?.map((table) => (
            <Card
              key={table.id}
              className={`card-hover cursor-pointer border-2 transition-colors ${TABLE_STATUS_COLORS[table.status] || "border-zinc-200"}`}
              onClick={() => setQrTable(table)}
            >
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold">{table.table_number}</p>
                <p className="text-[10px] text-zinc-500 truncate">Table {table.table_number}</p>
                <Badge variant="outline" className="text-[9px] mt-1 h-4">{table.status}</Badge>
                <p className="text-[9px] text-zinc-400 mt-0.5">{table.capacity} seats</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrTable} onOpenChange={() => setQrTable(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-sm font-poppins">Table {qrTable?.table_number} QR Code</DialogTitle>
          </DialogHeader>
          {qrTable && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <QRCodeSVG value={getOrderUrl(qrTable)} size={180} fgColor="#14b8a6" />
              </div>
              <p className="text-[10px] text-zinc-500 break-all">{getOrderUrl(qrTable)}</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  navigator.clipboard.writeText(getOrderUrl(qrTable));
                  toast.success("Link copied!");
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy Link
              </Button>
              <div className="flex gap-2 pt-2">
                {["available", "occupied", "reserved", "inactive"].map((s) => (
                  <Button
                    key={s}
                    variant={qrTable.status === s ? "default" : "outline"}
                    size="sm"
                    className={`text-[10px] h-6 flex-1 ${qrTable.status === s ? "bg-teal-500 hover:bg-teal-600 text-white" : ""}`}
                    onClick={() => updateTableStatus.mutate({ id: qrTable.id, status: s })}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
