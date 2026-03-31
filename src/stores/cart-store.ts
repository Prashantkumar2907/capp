import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  dish_id: string;
  dish_name: string;
  dish_image_url?: string | null;
  quantity: number;
  unit_price: number;
  notes?: string;
  is_veg?: boolean;
}

interface CartStore {
  items: CartItem[];
  branchId: string | null;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  notes: string;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  updateItemNotes: (dishId: string, notes: string) => void;
  clearCart: () => void;
  setOrderMeta: (meta: Partial<Pick<CartStore, "branchId" | "tableId" | "customerName" | "customerPhone" | "orderType" | "notes">>) => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      branchId: null,
      tableId: null,
      customerName: "",
      customerPhone: "",
      orderType: "dine_in",
      notes: "",

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.dish_id === item.dish_id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.dish_id === item.dish_id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (dishId) => {
        set({ items: get().items.filter((i) => i.dish_id !== dishId) });
      },

      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.dish_id !== dishId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.dish_id === dishId ? { ...i, quantity } : i
            ),
          });
        }
      },

      updateItemNotes: (dishId, notes) => {
        set({
          items: get().items.map((i) =>
            i.dish_id === dishId ? { ...i, notes } : i
          ),
        });
      },

      clearCart: () => {
        set({
          items: [],
          customerName: "",
          customerPhone: "",
          notes: "",
        });
      },

      setOrderMeta: (meta) => set(meta),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "capp-cart",
    }
  )
);
