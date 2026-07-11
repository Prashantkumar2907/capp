import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function timeAgo(value: string | Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units: Array<[number, string]> = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [unitSeconds, label] of units) {
    const amount = Math.floor(seconds / unitSeconds);
    if (amount >= 1) return `${amount} ${label}${amount > 1 ? "s" : ""} ago`;
  }

  return "just now";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(value?: string | null) {
  if (!value) return "RX";
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function orderNumber() {
  const stamp = new Date();
  const date = `${String(stamp.getDate()).padStart(2, "0")}${String(stamp.getMonth() + 1).padStart(2, "0")}`;
  const entropy = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4).toUpperCase();
  return `ORD-${date}-${entropy}`;
}

export interface TotalsOptions {
  serviceChargePercent?: number;
  /** composition-scheme orgs charge no GST on the invoice */
  composition?: boolean;
}

/**
 * Mirrors order_totals_v2() in the database (supabase/10_gst_compliance.sql).
 * Rounding rule: each component is rounded to 2dp and the total is the SUM of
 * the rounded components, so printed invoice lines always add up.
 */
export function calculateTotals(subtotal: number, taxPercent: number, taxInclusive: boolean, discount = 0, options: TotalsOptions = {}) {
  const round2 = (value: number) => Math.round(value * 100) / 100;
  const cleanSubtotal = Math.max(0, Number(subtotal) || 0);
  const cleanDiscount = Math.max(0, Math.min(cleanSubtotal, Number(discount) || 0));
  const itemsTotal = cleanSubtotal - cleanDiscount;
  const rate = options.composition ? 0 : Math.max(0, Number(taxPercent) || 0);
  const scPercent = Math.max(0, Number(options.serviceChargePercent) || 0);

  const ex = round2(taxInclusive && rate > 0 ? itemsTotal / (1 + rate / 100) : itemsTotal);
  const serviceCharge = round2((ex * scPercent) / 100);
  const tax = round2(((ex + serviceCharge) * rate) / 100);

  return {
    subtotal: ex,
    serviceCharge,
    tax,
    discount: cleanDiscount,
    total: round2(ex + serviceCharge + tax),
  };
}

export function upiLink(input: { vpa: string; amount: number; reference: string; merchant: string }) {
  const params = new URLSearchParams({
    pa: input.vpa,
    pn: input.merchant,
    am: input.amount.toFixed(2),
    cu: "INR",
    tr: input.reference,
    tn: `Order ${input.reference}`,
  });
  return `upi://pay?${params.toString()}`;
}
