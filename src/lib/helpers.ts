import { CURRENCY_SYMBOL } from "./constants";

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${day}${month}-${random}`;
}

export function generateUPILink(
  vpa: string,
  amount: number,
  orderId: string,
  merchantName: string
): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: merchantName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
    tr: orderId,
  });
  return `upi://pay?${params.toString()}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const interval = Math.floor(seconds / secs);
    if (interval >= 1) {
      return `${interval} ${label}${interval > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function calculateTax(
  subtotal: number,
  taxPercentage: number,
  taxInclusive: boolean
): { subtotal: number; taxAmount: number; total: number } {
  if (taxInclusive) {
    const taxAmount = subtotal - subtotal / (1 + taxPercentage / 100);
    return {
      subtotal: subtotal - taxAmount,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: subtotal,
    };
  }
  const taxAmount = (subtotal * taxPercentage) / 100;
  return {
    subtotal,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}
