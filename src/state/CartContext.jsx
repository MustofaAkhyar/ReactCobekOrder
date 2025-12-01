import React, { createContext, useContext, useMemo, useState } from "react";
const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{menu, qty}]

  const qtyOf = (id) => items.find((i) => i.menu.id === id)?.qty || 0;

  const add = (menu, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.menu.id === menu.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next.filter((x) => x.qty > 0);
      }
      return [...prev, { menu, qty }];
    });
  };

  const inc = (menu, step = 1) => add(menu, step);

  const dec = (menuId, step = 1) =>
    setItems((prev) => {
      const i = prev.findIndex((p) => p.menu.id === menuId);
      if (i === -1) return prev;
      const next = [...prev];
      const q = next[i].qty - step;
      if (q <= 0) next.splice(i, 1);
      else next[i] = { ...next[i], qty: q };
      return next;
    });

  const setQty = (id, q) =>
    setItems((p) =>
      p.map((x) => (x.menu.id === id ? { ...x, qty: q } : x)).filter((x) => x.qty > 0)
    );

  const remove = (id) => setQty(id, 0);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.menu.price) * it.qty, 0),
    [items]
  );

  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, add, inc, dec, qtyOf, setQty, remove, subtotal, clear }}>
      {children}
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);
