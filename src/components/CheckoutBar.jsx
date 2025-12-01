// src/components/CheckoutBar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../state/CartContext";

export default function CheckoutBar() {
  const { items, subtotal } = useCart();
  const loc = useLocation();
  if (!items.length) return null;

  return (
    <div className="d-flex w-100 justify-content-between align-items-center">
      <div className="small">
        {items.length} item • <strong>Rp {subtotal.toLocaleString()}</strong>
      </div>
      {loc.pathname !== "/checkout" && (
        <Link to="/checkout" className="btn btn-primary btn-sm">Checkout</Link>
      )}
    </div>
  );
}
