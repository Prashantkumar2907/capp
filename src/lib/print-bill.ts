import type { OrderWithItems } from "@/types/database";

interface BillOrg {
  name?: string | null;
  gst_number?: string | null;
  fssai_license?: string | null;
  gst_scheme?: "regular" | "composition" | null;
  default_tax_percent?: number | null;
}

/**
 * Prints the CUSTOMER GST bill on 80mm thermal paper (browser print).
 * Companion to printKot (kitchen copy) — this is the legal document the
 * cashier hands over: invoice number, GSTIN, FSSAI, CGST/SGST split,
 * voluntary service charge, composition note.
 */
export function printBill(order: OrderWithItems, org: BillOrg, branchName?: string | null) {
  const items = order.order_items.filter((item) => item.status !== "cancelled");
  const money = (value: number) => `₹${value.toFixed(2)}`;
  const taxRate = Number(org.default_tax_percent ?? 5);
  const halfRate = (taxRate / 2).toFixed(2);
  const tax = Number(order.tax);
  const composition = org.gst_scheme === "composition";

  const lines = items
    .map((item) => {
      const unit = Number(item.price_at_order) + Number(item.addon_total ?? 0);
      const addons = Array.isArray(item.addons) && item.addons.length
        ? `<div class="sub">+ ${(item.addons as { name: string }[]).map((addon) => escapeHtml(addon.name)).join(", ")}</div>`
        : "";
      return `<div class="item">
        <div class="row"><span>${escapeHtml(item.dish_name)}${item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ""}</span></div>
        ${addons}
        <div class="row sub"><span>${item.quantity} x ${money(unit)}</span><span>${money(unit * item.quantity)}</span></div>
      </div>`;
    })
    .join("");

  const totalsRows = [
    `<div class="row"><span>Subtotal</span><span>${money(Number(order.subtotal))}</span></div>`,
    Number(order.discount) > 0 ? `<div class="row"><span>Discount</span><span>-${money(Number(order.discount))}</span></div>` : "",
    Number(order.service_charge ?? 0) > 0 ? `<div class="row"><span>Service charge (voluntary)</span><span>${money(Number(order.service_charge))}</span></div>` : "",
    tax > 0 ? `<div class="row"><span>CGST @ ${halfRate}%</span><span>${money(tax / 2)}</span></div><div class="row"><span>SGST @ ${halfRate}%</span><span>${money(tax / 2)}</span></div>` : "",
    `<div class="row grand"><span>TOTAL</span><span>${money(Number(order.total))}</span></div>`,
  ].join("");

  const html = `<!doctype html><html><head><title>Bill ${escapeHtml(order.invoice_number ?? order.order_number)}</title><style>
    @page { size: 80mm auto; margin: 4mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; width: 72mm; font-size: 11px; color: #000; }
    .center { text-align: center; }
    .name { font-size: 14px; font-weight: bold; }
    .meta { font-size: 10px; }
    .rule { border-top: 1px dashed #000; margin: 2mm 0; }
    .row { display: flex; justify-content: space-between; }
    .item { margin-bottom: 1.5mm; }
    .sub { font-size: 10px; color: #000; padding-left: 1mm; }
    .grand { font-weight: bold; font-size: 13px; margin-top: 1mm; border-top: 1px solid #000; padding-top: 1mm; }
    .foot { font-size: 9px; margin-top: 3mm; }
  </style></head><body>
    <div class="center">
      <div class="name">${escapeHtml(org.name ?? "Restaurant")}</div>
      ${branchName ? `<div class="meta">${escapeHtml(branchName)}</div>` : ""}
      ${org.gst_number ? `<div class="meta">GSTIN: ${escapeHtml(org.gst_number)}</div>` : ""}
      ${org.fssai_license ? `<div class="meta">FSSAI Lic: ${escapeHtml(org.fssai_license)}</div>` : ""}
    </div>
    <div class="rule"></div>
    <div class="row meta"><span>${order.invoice_number ? `Invoice: ${escapeHtml(order.invoice_number)}` : `Order: ${escapeHtml(order.order_number)}`}</span></div>
    <div class="row meta">
      <span>${order.table_number ? `Table ${order.table_number}` : order.order_type === "counter" ? `Token ${order.order_number.split("-").pop()}` : "Takeaway"}</span>
      <span>${new Date(order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
    </div>
    ${order.customer_name ? `<div class="meta">Customer: ${escapeHtml(order.customer_name)}</div>` : ""}
    <div class="rule"></div>
    ${lines}
    <div class="rule"></div>
    ${totalsRows}
    ${composition ? `<div class="foot">Composition taxable person, not eligible to collect tax on supplies.</div>` : ""}
    <div class="foot center">Thank you! Visit again.</div>
    <script>window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; };</script>
  </body></html>`;

  const popup = window.open("", "_blank", "width=340,height=640");
  if (!popup) return false;
  popup.document.write(html);
  popup.document.close();
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
