import type { OrderWithItems } from "@/types/database";

/**
 * Prints a Kitchen Order Ticket sized for 80mm thermal paper via the
 * browser's print dialog. Works with any thermal printer installed as a
 * system printer — no drivers or ESC/POS integration needed, which is the
 * right first step for small restaurants.
 */
export function printKot(order: OrderWithItems, restaurantName?: string) {
  const items = order.order_items.filter((item) => item.status !== "cancelled");
  const token = order.order_type === "counter" ? order.order_number.split("-").pop() : null;
  const heading = token ? `TOKEN ${token}` : `#${order.order_number}`;
  const where =
    order.table_number ? `Table ${order.table_number}` : order.order_type === "takeaway" ? "Takeaway" : order.order_type === "counter" ? "Counter" : "";

  const lines = items
    .map((item) => {
      const addons = Array.isArray(item.addons) && item.addons.length
        ? `<div class="addons">+ ${(item.addons as { name: string }[]).map((addon) => addon.name).join(", ")}</div>`
        : "";
      const notes = item.notes ? `<div class="notes">${escapeHtml(item.notes)}</div>` : "";
      const variant = item.variant_name ? ` <span class="variant">(${escapeHtml(item.variant_name)})</span>` : "";
      return `<div class="item"><div class="row"><span>${escapeHtml(item.dish_name)}${variant}</span><span class="qty">x${item.quantity}</span></div>${addons}${notes}</div>`;
    })
    .join("");

  const html = `<!doctype html><html><head><title>KOT ${escapeHtml(order.order_number)}</title><style>
    @page { size: 80mm auto; margin: 4mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; width: 72mm; font-size: 12px; color: #000; }
    .center { text-align: center; }
    .heading { font-size: 18px; font-weight: bold; margin: 2mm 0; }
    .meta { font-size: 11px; margin-bottom: 2mm; }
    .rule { border-top: 1px dashed #000; margin: 2mm 0; }
    .item { margin-bottom: 2mm; }
    .row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
    .qty { font-size: 14px; }
    .variant { font-weight: normal; }
    .addons, .notes { font-size: 11px; padding-left: 2mm; }
    .notes { font-style: italic; }
    .foot { font-size: 10px; margin-top: 3mm; }
  </style></head><body>
    <div class="center">
      ${restaurantName ? `<div>${escapeHtml(restaurantName)}</div>` : ""}
      <div class="heading">${heading}</div>
      <div class="meta">${escapeHtml(where)} · ${new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>
    <div class="rule"></div>
    ${lines}
    <div class="rule"></div>
    ${order.notes ? `<div class="notes">Note: ${escapeHtml(order.notes)}</div>` : ""}
    <div class="foot center">KOT — kitchen copy</div>
    <script>window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; };</script>
  </body></html>`;

  const popup = window.open("", "_blank", "width=340,height=560");
  if (!popup) return false;
  popup.document.write(html);
  popup.document.close();
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
