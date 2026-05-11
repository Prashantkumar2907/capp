import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CART_STORAGE_KEY = "capp-cart-v2";

export interface CartItem {
  dish_id: string;
  dish_name: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  is_veg?: boolean;
}

interface CartState {
  hasHydrated: boolean;
  branchId: string | null;
  tableNumber: number | null;
  submissionKey: string | null;
  items: CartItem[];
  setHasHydrated: (hasHydrated: boolean) => void;
  setContext: (branchId: string, tableNumber: number) => void;
  ensureSubmissionKey: () => string;
  resetSubmissionKey: () => void;
  restoreCart: (snapshot: StoredCartSnapshot) => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  updateNotes: (dishId: string, notes: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export type StoredCartSnapshot = {
  branchId: string | null;
  tableNumber: number | null;
  submissionKey: string | null;
  items: CartItem[];
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      branchId: null,
      tableNumber: null,
      submissionKey: null,
      items: [],
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setContext: (branchId, tableNumber) => {
        const state = get();
        if (state.branchId !== branchId || state.tableNumber !== tableNumber) {
          set({ branchId, tableNumber, submissionKey: null, items: [] });
        }
      },
      ensureSubmissionKey: () => {
        const existing = get().submissionKey;
        if (existing) return existing;
        const next = createSubmissionKey();
        set({ submissionKey: next });
        return next;
      },
      resetSubmissionKey: () => set({ submissionKey: null }),
      restoreCart: (snapshot) =>
        set({
          branchId: snapshot.branchId,
          tableNumber: snapshot.tableNumber,
          submissionKey: snapshot.submissionKey,
          items: snapshot.items,
        }),
      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const existing = get().items.find((current) => current.dish_id === item.dish_id);
        if (!existing) {
          set({ submissionKey: null, items: [...get().items, { ...item, quantity }] });
          return;
        }
        set({
          submissionKey: null,
          items: get().items.map((current) =>
            current.dish_id === item.dish_id ? { ...current, quantity: current.quantity + quantity } : current
          ),
        });
      },
      removeItem: (dishId) => set({ submissionKey: null, items: get().items.filter((item) => item.dish_id !== dishId) }),
      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }
        set({
          submissionKey: null,
          items: get().items.map((item) => (item.dish_id === dishId ? { ...item, quantity } : item)),
        });
      },
      updateNotes: (dishId, notes) => {
        set({
          submissionKey: null,
          items: get().items.map((item) => (item.dish_id === dishId ? { ...item, notes } : item)),
        });
      },
      clear: () => set({ submissionKey: null, items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({
        branchId: state.branchId,
        tableNumber: state.tableNumber,
        submissionKey: state.submissionKey,
        items: state.items,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...parsePersistedSnapshot(persisted),
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export function readStoredCartSnapshot(): StoredCartSnapshot | null {
  if (typeof window === "undefined") return null;
  return parseStoredCartSnapshot(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function parseStoredCartSnapshot(raw: string | null): StoredCartSnapshot | null {
  if (!raw) return null;

  try {
    return parsePersistedSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

function parsePersistedSnapshot(value: unknown): StoredCartSnapshot {
  const state = isRecord(value) && isRecord(value.state) ? value.state : value;
  if (!isRecord(state)) return emptySnapshot();

  const branchId = typeof state.branchId === "string" && state.branchId.length > 0 ? state.branchId : null;
  const tableNumber = Number(state.tableNumber);
  const submissionKey = typeof state.submissionKey === "string" && state.submissionKey.length > 0 ? state.submissionKey : null;
  const items = Array.isArray(state.items) ? state.items.map(parseCartItem).filter((item): item is CartItem => Boolean(item)) : [];

  return {
    branchId,
    tableNumber: Number.isInteger(tableNumber) && tableNumber > 0 ? tableNumber : null,
    submissionKey,
    items,
  };
}

function parseCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.dish_id !== "string" || typeof value.dish_name !== "string") return null;

  const unitPrice = Number(value.unit_price);
  const quantity = Number(value.quantity);
  if (!Number.isFinite(unitPrice) || !Number.isInteger(quantity) || quantity <= 0) return null;

  return {
    dish_id: value.dish_id,
    dish_name: value.dish_name,
    unit_price: unitPrice,
    quantity,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    image_url: typeof value.image_url === "string" ? value.image_url : null,
    is_veg: typeof value.is_veg === "boolean" ? value.is_veg : undefined,
  };
}

function emptySnapshot(): StoredCartSnapshot {
  return {
    branchId: null,
    tableNumber: null,
    submissionKey: null,
    items: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createSubmissionKey() {
  return globalThis.crypto?.randomUUID?.() ?? `order_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
