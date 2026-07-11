import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: order, error } = await admin
    .from("orders")
    .select("*, order_items(*), payments(*), branches(*, organizations(name, default_tax_percent, tax_inclusive, gst_number, fssai_license, gst_scheme, service_charge_percent))")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
