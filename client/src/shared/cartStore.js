import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SESSION_KEY = 'billqr_cart_session';

// Generate or retrieve session ID
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      sessionId: getSessionId(),
      items: [],      // [{ product_id, name, price, unit_type, unit_value, image_url, brand_name, quantity }]

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
          set({
            items: items.map(i =>
              i.product_id === product.id
                ? { 
                    ...i, 
                    quantity: i.quantity + quantity,
                    price: parseFloat(product.price),
                    mrp: parseFloat(product.mrp) || parseFloat(product.price),
                    discount_percent: parseFloat(product.discount_percent) || 0,
                    gst_percent: parseFloat(product.gst_percent) || 0,
                  }
                : i
            ),
          });
        } else {
          set({
            items: [...items, {
              product_id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              mrp: parseFloat(product.mrp) || parseFloat(product.price),
              discount_percent: parseFloat(product.discount_percent) || 0,
              gst_percent: parseFloat(product.gst_percent) || 0,
              unit_type: product.unit_type,
              unit_value: parseFloat(product.unit_value),
              image_url: product.image_url,
              brand_name: product.brand_name,
              quantity,
            }],
          });
        }
      },

      updateQty: (product_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(product_id);
          return;
        }
        set({ items: get().items.map(i => i.product_id === product_id ? { ...i, quantity } : i) });
      },

      removeItem: (product_id) => {
        set({ items: get().items.filter(i => i.product_id !== product_id) });
      },

      clearCart: () => {
        // Regenerate session for next purchase
        const newSession = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, newSession);
        set({ items: [], sessionId: newSession });
      },

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'billqr-cart',
    }
  )
);
