"use client";

/**
 * Lightweight per-device i18n for staff surfaces.
 *
 * Why per-device (localStorage) and not per-account: small restaurants share
 * devices. The kitchen tablet runs Hindi for the cook; the owner's phone
 * stays English. Each device remembers its own choice.
 *
 * Why not next-intl/routing locales: staff screens don't need localized URLs,
 * and our proxy.ts middleware stays untouched. Customer-menu languages are a
 * separate, per-branch concern (Phase 5).
 *
 * Usage: const t = useT();  →  t("kitchen.startCooking")
 * Missing keys fall back to English, then to the key itself, so partial
 * translation never breaks the UI. Add languages by extending `dictionaries`.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Locale = "en" | "hi";

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    // navigation
    "nav.counter": "Counter",
    "nav.orders": "Orders",
    "nav.kitchen": "Kitchen",
    "nav.waiter": "Waiter",
    "nav.payments": "Payments",
    "nav.menu": "Menu",
    "nav.tables": "Tables",
    "nav.branches": "Branches",
    "nav.staff": "Staff",
    "nav.analytics": "Analytics",
    "nav.settings": "Settings",
    // common actions
    "action.accept": "Accept",
    "action.startCooking": "Start cooking",
    "action.markReady": "Mark ready",
    "action.serve": "Serve",
    "action.settle": "Settle",
    "action.cancel": "Cancel",
    "action.save": "Save",
    "action.add": "Add",
    "action.remove": "Remove",
    "action.search": "Search",
    "action.print": "Print",
    "action.newOrder": "New order",
    "action.sendToKitchen": "Send to kitchen",
    "action.refresh": "Refresh",
    // counter
    "counter.todaysEarnings": "Today's earnings",
    "counter.ordersToday": "Orders today",
    "counter.activeNow": "Active now",
    "counter.rating": "Rating",
    "counter.liveOrders": "Live orders",
    "counter.history": "History",
    "counter.outOfStock": "Out of stock",
    "counter.outOfStockHint": "Switch a dish off and it disappears from customer menus instantly.",
    "counter.findDish": "Find dish",
    "counter.noActiveOrders": "No active orders",
    "counter.noActiveOrdersHint": "New orders from QR scans and waiters appear here instantly.",
    // kitchen
    "kitchen.newOrders": "New",
    "kitchen.accepted": "Accepted",
    "kitchen.cooking": "Cooking",
    "kitchen.ready": "Ready",
    "kitchen.itemsInQueue": "Items in queue",
    "kitchen.oldestTicket": "Oldest ticket",
    "kitchen.activeTickets": "Active tickets",
    "kitchen.station": "Station",
    "kitchen.all": "All",
    "kitchen.clear": "Clear",
    "kitchen.table": "Table",
    "kitchen.token": "Token",
    "kitchen.takeaway": "Takeaway",
    // waiter
    "waiter.title": "Waiter POS",
    "waiter.openOrders": "Open orders",
    "waiter.dineIn": "Dine-in",
    "waiter.takeaway": "Takeaway",
    "waiter.counter": "Counter",
    "waiter.pickTable": "Table…",
    "waiter.pickOpenOrder": "Pick open order…",
    "waiter.availableTables": "Available tables",
    "waiter.occupiedTables": "Occupied tables",
    "waiter.cartItems": "Cart items",
    "waiter.customerName": "Customer name optional",
    "waiter.orderNotes": "Order notes for kitchen",
    "waiter.moveTable": "Move table…",
    "waiter.mergeInto": "Merge into…",
    "waiter.applyDiscount": "Apply discount",
    "waiter.editDiscount": "Edit discount",
    "waiter.total": "Total",
    "waiter.discount": "Discount",
    "waiter.tapToAdd": "Tap dishes on the left to add to this order",
    // statuses
    "status.pending": "Pending",
    "status.confirmed": "Confirmed",
    "status.preparing": "Preparing",
    "status.ready": "Ready",
    "status.served": "Served",
    "status.cancelled": "Cancelled",
    // settings
    // orders page
    "orders.title": "Orders",
    "orders.subtitle": "Track every table, QR, waiter, and cashier order in real time.",
    "orders.activeOrders": "Active orders",
    "orders.pendingConfirmation": "Pending confirmation",
    "orders.readyToServe": "Ready to serve",
    "orders.orderValue": "Order value",
    "orders.searchPlaceholder": "Search order, table, customer",
    "orders.noneTitle": "No orders in this view",
    "orders.noneHint": "Change filters or create a waiter order to start service.",
    "orders.cancelOrder": "Cancel order",
    "orders.cancelConfirmTitle": "Cancel this order?",
    "orders.cancelConfirmBody": "The order and its items will be cancelled and the table freed. This cannot be undone.",
    "orders.keepOrder": "Keep order",
    "orders.cancelled": "Order cancelled",
    "orders.updated": "Order updated",
    "orders.allSources": "All sources",
    "orders.allStatuses": "All statuses",
    // tables page
    "tables.title": "Tables",
    "tables.subtitle": "Manage tables and print QR codes for contactless ordering.",
    "tables.addTable": "Add table",
    "tables.available": "Available",
    "tables.occupied": "Occupied",
    "tables.reserved": "Reserved",
    "tables.tableNumber": "Table number",
    "tables.seats": "Seats",
    "tables.printQr": "Print QR",
    "tables.downloadQr": "Download QR",
    "tables.noneTitle": "No tables yet",
    "tables.noneHint": "Add your first table to generate its QR code.",
    // shared
    "common.refresh": "Refresh",
    "common.saved": "Saved",
    "common.somethingWrong": "Something went wrong",
    "settings.language": "Language (this device)",
    "settings.languageHint": "Each device keeps its own language — set the kitchen tablet to Hindi, keep your phone in English.",
  },
  hi: {
    "nav.counter": "काउंटर",
    "nav.orders": "ऑर्डर",
    "nav.kitchen": "रसोई",
    "nav.waiter": "वेटर",
    "nav.payments": "भुगतान",
    "nav.menu": "मेन्यू",
    "nav.tables": "टेबल",
    "nav.branches": "ब्रांच",
    "nav.staff": "स्टाफ",
    "nav.analytics": "रिपोर्ट",
    "nav.settings": "सेटिंग",
    "action.accept": "स्वीकार करें",
    "action.startCooking": "पकाना शुरू करें",
    "action.markReady": "तैयार है",
    "action.serve": "परोसें",
    "action.settle": "भुगतान लें",
    "action.cancel": "रद्द करें",
    "action.save": "सेव करें",
    "action.add": "जोड़ें",
    "action.remove": "हटाएँ",
    "action.search": "खोजें",
    "action.print": "प्रिंट करें",
    "action.newOrder": "नया ऑर्डर",
    "action.sendToKitchen": "रसोई भेजें",
    "action.refresh": "रीफ़्रेश",
    "counter.todaysEarnings": "आज की कमाई",
    "counter.ordersToday": "आज के ऑर्डर",
    "counter.activeNow": "अभी चालू",
    "counter.rating": "रेटिंग",
    "counter.liveOrders": "लाइव ऑर्डर",
    "counter.history": "इतिहास",
    "counter.outOfStock": "स्टॉक ख़त्म",
    "counter.outOfStockHint": "डिश बंद करें — ग्राहक मेन्यू से तुरंत हट जाएगी।",
    "counter.findDish": "डिश खोजें",
    "counter.noActiveOrders": "कोई चालू ऑर्डर नहीं",
    "counter.noActiveOrdersHint": "QR स्कैन और वेटर के नए ऑर्डर यहाँ तुरंत दिखेंगे।",
    "kitchen.newOrders": "नए",
    "kitchen.accepted": "स्वीकृत",
    "kitchen.cooking": "पक रहा है",
    "kitchen.ready": "तैयार",
    "kitchen.itemsInQueue": "कतार में आइटम",
    "kitchen.oldestTicket": "सबसे पुराना टिकट",
    "kitchen.activeTickets": "चालू टिकट",
    "kitchen.station": "स्टेशन",
    "kitchen.all": "सभी",
    "kitchen.clear": "खाली",
    "kitchen.table": "टेबल",
    "kitchen.token": "टोकन",
    "kitchen.takeaway": "पार्सल",
    "waiter.title": "वेटर POS",
    "waiter.openOrders": "चालू ऑर्डर",
    "waiter.dineIn": "डाइन-इन",
    "waiter.takeaway": "पार्सल",
    "waiter.counter": "काउंटर",
    "waiter.pickTable": "टेबल…",
    "waiter.pickOpenOrder": "ऑर्डर चुनें…",
    "waiter.availableTables": "खाली टेबल",
    "waiter.occupiedTables": "भरी टेबल",
    "waiter.cartItems": "कार्ट आइटम",
    "waiter.customerName": "ग्राहक का नाम (वैकल्पिक)",
    "waiter.orderNotes": "रसोई के लिए नोट",
    "waiter.moveTable": "टेबल बदलें…",
    "waiter.mergeInto": "इसमें मिलाएँ…",
    "waiter.applyDiscount": "छूट दें",
    "waiter.editDiscount": "छूट बदलें",
    "waiter.total": "कुल",
    "waiter.discount": "छूट",
    "waiter.tapToAdd": "इस ऑर्डर में जोड़ने के लिए बाईं ओर डिश दबाएँ",
    "status.pending": "लंबित",
    "status.confirmed": "पुष्टि हुई",
    "status.preparing": "बन रहा है",
    "status.ready": "तैयार",
    "status.served": "परोसा गया",
    "status.cancelled": "रद्द",
    "orders.title": "ऑर्डर",
    "orders.subtitle": "हर टेबल, QR, वेटर और कैशियर ऑर्डर को रियल-टाइम में देखें।",
    "orders.activeOrders": "चालू ऑर्डर",
    "orders.pendingConfirmation": "पुष्टि बाकी",
    "orders.readyToServe": "परोसने के लिए तैयार",
    "orders.orderValue": "ऑर्डर मूल्य",
    "orders.searchPlaceholder": "ऑर्डर, टेबल, ग्राहक खोजें",
    "orders.noneTitle": "इस दृश्य में कोई ऑर्डर नहीं",
    "orders.noneHint": "फ़िल्टर बदलें या सेवा शुरू करने के लिए वेटर ऑर्डर बनाएँ।",
    "orders.cancelOrder": "ऑर्डर रद्द करें",
    "orders.cancelConfirmTitle": "यह ऑर्डर रद्द करें?",
    "orders.cancelConfirmBody": "ऑर्डर और उसके आइटम रद्द हो जाएँगे और टेबल खाली हो जाएगी। यह वापस नहीं होगा।",
    "orders.keepOrder": "रहने दें",
    "orders.cancelled": "ऑर्डर रद्द हुआ",
    "orders.updated": "ऑर्डर अपडेट हुआ",
    "orders.allSources": "सभी स्रोत",
    "orders.allStatuses": "सभी स्थिति",
    "tables.title": "टेबल",
    "tables.subtitle": "टेबल प्रबंधित करें और संपर्क रहित ऑर्डर के लिए QR कोड प्रिंट करें।",
    "tables.addTable": "टेबल जोड़ें",
    "tables.available": "खाली",
    "tables.occupied": "भरी",
    "tables.reserved": "आरक्षित",
    "tables.tableNumber": "टेबल नंबर",
    "tables.seats": "सीटें",
    "tables.printQr": "QR प्रिंट करें",
    "tables.downloadQr": "QR डाउनलोड करें",
    "tables.noneTitle": "अभी कोई टेबल नहीं",
    "tables.noneHint": "इसका QR कोड बनाने के लिए पहली टेबल जोड़ें।",
    "common.refresh": "रीफ़्रेश",
    "common.saved": "सेव हुआ",
    "common.somethingWrong": "कुछ गड़बड़ हुई",
    "settings.language": "भाषा (यह डिवाइस)",
    "settings.languageHint": "हर डिवाइस अपनी भाषा याद रखता है — रसोई का टैबलेट हिंदी में, आपका फ़ोन अंग्रेज़ी में।",
  },
};

const STORAGE_KEY = "capp-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => dictionaries.en[key] ?? key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "hi" || stored === "en") setLocaleState(stored);
    } catch {
      /* private-mode etc. — stay English */
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* non-fatal */
    }
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale]
  );

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useContext(LocaleContext).t;
}
