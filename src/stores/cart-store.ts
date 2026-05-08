import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  updateNotes: (dishId: string, notes: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

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
      name: "capp-cart-v2",
      partialize: (state) => ({
        branchId: state.branchId,
        tableNumber: state.tableNumber,
        submissionKey: state.submissionKey,
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

function createSubmissionKey() {
  return globalThis.crypto?.randomUUID?.() ?? `order_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
