import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A cart line is dish + variant + addon combination. The same dish can appear
 * on several lines (Half x2 and Full x1 are separate lines), which is how
 * Indian menus actually get ordered.
 */
export interface CartItem {
  line_id: string;
  dish_id: string;
  dish_name: string;
  /** variant price when a variant is chosen, else branch/base price */
  unit_price: number;
  quantity: number;
  variant_id?: string | null;
  variant_name?: string | null;
  addon_ids?: string[];
  addon_names?: string[];
  /** per-unit addon total */
  addon_total?: number;
  notes?: string;
  image_url?: string | null;
  is_veg?: boolean;
}

export function cartLineId(dishId: string, variantId?: string | null, addonIds?: string[]) {
  const addons = [...(addonIds ?? [])].sort().join(",");
  return `${dishId}:${variantId ?? ""}:${addons}`;
}

export function lineUnitTotal(item: Pick<CartItem, "unit_price" | "addon_total">) {
  return item.unit_price + (item.addon_total ?? 0);
}

interface CartState {
  branchId: string | null;
  tableNumber: number | null;
  items: CartItem[];
  setContext: (branchId: string, tableNumber: number) => void;
  addItem: (item: Omit<CartItem, "quantity" | "line_id"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateNotes: (lineId: string, notes: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  /** total quantity of a dish across all its lines (for menu tile badges) */
  dishQuantity: (dishId: string) => number;
  /** decrement the most recently added line of a dish (menu tile minus button) */
  decrementDish: (dishId: string) => void;
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
          return;
        }
        set({ branchId, tableNumber });
      },
      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const lineId = cartLineId(item.dish_id, item.variant_id, item.addon_ids);
        const existing = get().items.find((current) => current.line_id === lineId);
        if (!existing) {
          set({ items: [...get().items, { ...item, line_id: lineId, quantity }] });
          return;
        }
        set({
          items: get().items.map((current) =>
            current.line_id === lineId ? { ...current, quantity: current.quantity + quantity } : current
          ),
        });
      },
      removeItem: (lineId) => set({ items: get().items.filter((item) => item.line_id !== lineId) }),
      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({
          items: get().items.map((item) => (item.line_id === lineId ? { ...item, quantity } : item)),
        });
      },
      updateNotes: (lineId, notes) => {
        set({
          items: get().items.map((item) => (item.line_id === lineId ? { ...item, notes } : item)),
        });
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + lineUnitTotal(item) * item.quantity, 0),
      dishQuantity: (dishId) =>
        get().items.filter((item) => item.dish_id === dishId).reduce((sum, item) => sum + item.quantity, 0),
      decrementDish: (dishId) => {
        const lines = get().items.filter((item) => item.dish_id === dishId);
        const last = lines[lines.length - 1];
        if (last) get().updateQuantity(last.line_id, last.quantity - 1);
      },
    }),
    { name: "capp-cart-v3" }
  )
);
