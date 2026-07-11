/**
 * WhatsApp notifications — provider-abstracted, server-side only.
 *
 * India-first: customers expect a WhatsApp ping over email. Configure via env:
 *   WHATSAPP_PROVIDER   = "gupshup" | "meta" | "disabled" (default disabled)
 *   WHATSAPP_API_KEY    = provider API key
 *   WHATSAPP_SENDER     = registered sender/WABA number, e.g. 9198XXXXXXXX
 *   WHATSAPP_META_PHONE_ID = (meta only) phone number id
 *
 * Until configured, every send is a silent no-op — the product works fully
 * without it. Failures never break the calling flow; they only log.
 *
 * NOTE: WhatsApp Business requires pre-approved templates for
 * business-initiated messages. The session-message form used here works in
 * sandbox/testing; for production, register templates with your provider
 * and switch `sendTemplate` accordingly.
 */

interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}

export async function sendWhatsApp(rawPhone: string | null | undefined, message: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "disabled";
  if (provider === "disabled") return { ok: true, skipped: true };

  const phone = rawPhone ? normalizeIndianPhone(rawPhone) : null;
  if (!phone) return { ok: false, skipped: true, error: "No valid phone" };

  try {
    if (provider === "gupshup") {
      const response = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          apikey: process.env.WHATSAPP_API_KEY ?? "",
        },
        body: new URLSearchParams({
          channel: "whatsapp",
          source: process.env.WHATSAPP_SENDER ?? "",
          destination: phone,
          message: JSON.stringify({ type: "text", text: message }),
          "src.name": "capp",
        }),
      });
      if (!response.ok) return { ok: false, error: `gupshup ${response.status}` };
      return { ok: true };
    }

    if (provider === "meta") {
      const phoneId = process.env.WHATSAPP_META_PHONE_ID ?? "";
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY ?? ""}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      });
      if (!response.ok) return { ok: false, error: `meta ${response.status}` };
      return { ok: true };
    }

    return { ok: false, error: `Unknown provider ${provider}` };
  } catch (error) {
    console.error("[whatsapp] send failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}

/** "Your order is ready" ping, with the receipt link. */
export function orderReadyMessage(orderNumber: string, restaurantName: string, receiptUrl?: string) {
  const token = orderNumber.split("-").pop();
  return [
    `🍽️ ${restaurantName}: your order ${token ? `(token ${token})` : orderNumber} is ready!`,
    receiptUrl ? `Receipt: ${receiptUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Daily owner summary — yesterday's numbers, the ping that keeps owners engaged without opening the app. */
export function dailySummaryMessage(params: {
  restaurantName: string;
  date: string;
  revenue: number;
  orders: number;
  topDish?: string | null;
  avgRating?: number | null;
}) {
  const rupees = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
  return [
    `📊 ${params.restaurantName} — ${params.date}`,
    ``,
    `Sales: ${rupees(params.revenue)}`,
    `Orders: ${params.orders}`,
    params.topDish ? `Top dish: ${params.topDish}` : null,
    params.avgRating ? `Rating: ${params.avgRating.toFixed(1)}★` : null,
    ``,
    `Have a great day! 🙏`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
