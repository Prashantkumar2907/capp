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
  branchId: string | null;
  tableNumber: number | null;
  items: CartItem[];
  setContext: (branchId: string, tableNumber: number) => void;
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
      branchId: null,
      tableNumber: null,
      items: [],
      setContext: (branchId, tableNumber) => {
        const state = get();
        if (state.branchId !== branchId || state.tableNumber !== tableNumber) {
          set({ branchId, tableNumber, items: [] });
        }
      },
      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const existing = get().items.find((current) => current.dish_id === item.dish_id);
        if (!existing) {
          set({ items: [...get().items, { ...item, quantity }] });
          return;
        }
        set({
          items: get().items.map((current) =>
            current.dish_id === item.dish_id ? { ...current, quantity: current.quantity + quantity } : current
          ),
        });
      },
      removeItem: (dishId) => set({ items: get().items.filter((item) => item.dish_id !== dishId) }),
      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }
        set({
          items: get().items.map((item) => (item.dish_id === dishId ? { ...item, quantity } : item)),
        });
      },
      updateNotes: (dishId, notes) => {
        set({
          items: get().items.map((item) => (item.dish_id === dishId ? { ...item, notes } : item)),
        });
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    }),
    { name: "capp-cart-v2" }
  )
);
