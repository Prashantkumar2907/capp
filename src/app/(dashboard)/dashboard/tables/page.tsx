"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, QrCode, MapPin, Loader2, Users, Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  occupied: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500 animate-pulse" },
  reserved: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  inactive: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export default function TablesPage() {
  const { branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [addDialog, setAddDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState<any | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [isAdding, setIsAdding] = useState(false);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables", branch?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("*").eq("branch_id", branch!.id).order("table_number");
      return data || [];
    },
    enabled: !!branch,
  });

  const addTable = async () => {
    setIsAdding(true);
    const nextNumber = tables ? Math.max(...tables.map(t => t.table_number), 0) + 1 : 1;
    const { error } = await supabase.from("tables").insert({
      branch_id: branch!.id, table_number: nextNumber,
      label: newLabel || null, capacity: newCapacity,
    });
    setIsAdding(false);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["tables"] });
    setAddDialog(false); setNewLabel(""); setNewCapacity(4);
    toast.success(`Table ${nextNumber} created`);
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tables").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
  });

  const getQRUrl = (tableNumber: number) => `${typeof window !== "undefined" ? window.location.origin : ""}/order/${branch?.id}/${tableNumber}`;

  const copyLink = (tableNumber: number) => {
    navigator.clipboard.writeText(getQRUrl(tableNumber));
    toast.success("Link copied!");
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Tables"
        description={`${tables?.length || 0} tables configured`}
        actions={
          <Dialog open={addDialog} onOpenChange={setAddDialog}>
            <Button size="sm" className="h-9 text-xs" onClick={() => setAddDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Table
            </Button>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Add Table</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input className="h-9 text-xs" placeholder="e.g., Window 1, VIP" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Capacity</Label>
                  <Input className="h-9 text-xs" type="number" min={1} max={20} value={newCapacity} onChange={e => setNewCapacity(+e.target.value)} />
                </div>
                <Button className="w-full h-9 text-xs" onClick={addTable} disabled={isAdding}>
                  {isAdding && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Table
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Status legend */}
      <div className="flex gap-4">
        {Object.entries(STATUS_STYLES).map(([status, styles]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Tables grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : tables && tables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tables.map((table, i) => {
            const styles = STATUS_STYLES[table.status] || STATUS_STYLES.available;
            return (
              <motion.div key={table.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className={`card-hover border-2 ${table.status === "occupied" ? "border-amber-300 dark:border-amber-600" : "border-transparent"}`}>
                  <CardContent className="p-4 text-center space-y-3">
                    <div className={`mx-auto h-14 w-14 rounded-2xl ${styles.bg} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${styles.text}`}>{table.table_number}</span>
                    </div>
                    <div>
                      {table.label && <p className="text-xs font-medium">{table.label}</p>}
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4 capitalize">
                          <span className={`h-1.5 w-1.5 rounded-full mr-1 ${styles.dot}`} />
                          {table.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        <Users className="h-2.5 w-2.5 inline mr-0.5" /> {table.capacity} seats
                      </p>
                    </div>
                    <div className="flex gap-1.5 justify-center">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => setQrDialog(table)}>
                        <QrCode className="h-3 w-3 mr-1" /> QR
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => copyLink(table.table_number)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={MapPin} title="No tables yet" description="Add tables for QR code ordering" actionLabel="Add Table" onAction={() => setAddDialog(true)} />
      )}

      {/* QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle className="text-sm">Table {qrDialog?.table_number} QR Code</DialogTitle></DialogHeader>
          {qrDialog && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG value={getQRUrl(qrDialog.table_number)} size={200} fgColor="#14b8a6" includeMargin />
              </div>
              <p className="text-xs text-muted-foreground break-all">{getQRUrl(qrDialog.table_number)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => copyLink(qrDialog.table_number)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={() => window.print()}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
