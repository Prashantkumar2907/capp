export const PUBLIC_ORDER_RECEIPT_REDIRECT_KEY = "capp-public-order-receipt-redirect";

export function publicReceiptPath(orderId: string, receiptToken: string) {
  return `/receipt/${orderId}?token=${encodeURIComponent(receiptToken)}`;
}

export function readPendingReceiptRedirect() {
  try {
    const path = sessionStorage.getItem(PUBLIC_ORDER_RECEIPT_REDIRECT_KEY);
    return path?.startsWith("/receipt/") ? path : null;
  } catch {
    return null;
  }
}

export function persistReceiptRedirect(path: string) {
  try {
    sessionStorage.setItem(PUBLIC_ORDER_RECEIPT_REDIRECT_KEY, path);
  } catch {
    // The order was already created; blocked storage must not prevent receipt navigation.
  }
}

export function clearReceiptRedirect() {
  try {
    sessionStorage.removeItem(PUBLIC_ORDER_RECEIPT_REDIRECT_KEY);
  } catch {
    // Ignore storage failures in private or locked-down browser contexts.
  }
}
