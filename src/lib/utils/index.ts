import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined, currency = "INR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
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

export function capSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function truncate(value: string, maxLength = 80) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard") {
  const candidate = value?.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;

  try {
    const parsed = new URL(candidate, "https://capp.local");
    if (parsed.origin !== "https://capp.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
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

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeout = globalThis.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(timeout);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export function orderNumber() {
  const stamp = new Date();
  const date = `${String(stamp.getDate()).padStart(2, "0")}${String(stamp.getMonth() + 1).padStart(2, "0")}`;
  const entropy = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4).toUpperCase();
  return `ORD-${date}-${entropy}`;
}

export function calculateTotals(subtotal: number, taxPercent: number, taxInclusive: boolean, discount = 0) {
  const cleanSubtotal = Math.max(0, Number(subtotal) || 0);
  const cleanDiscount = Math.max(0, Math.min(cleanSubtotal, Number(discount) || 0));
  const taxable = cleanSubtotal - cleanDiscount;

  if (taxInclusive) {
    const tax = taxable - taxable / (1 + taxPercent / 100);
    return {
      subtotal: Math.round((taxable - tax) * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: cleanDiscount,
      total: Math.round(taxable * 100) / 100,
    };
  }

  const tax = taxable * (taxPercent / 100);
  return {
    subtotal: taxable,
    tax: Math.round(tax * 100) / 100,
    discount: cleanDiscount,
    total: Math.round((taxable + tax) * 100) / 100,
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
