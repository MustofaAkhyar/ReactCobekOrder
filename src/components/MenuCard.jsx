// src/components/MenuCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext";

export default function MenuCard({ menu, tableNumber }) {
  const { qtyOf, inc, dec } = useCart();
  const qty = qtyOf(menu.id);

  return (
    <div className="card shadow-sm mb-3">
      <div className="row g-0 align-items-center">
        <div className="col-4">
          <Link to={`/menu/${menu.id}?table=${tableNumber}`}>
            <img
              src={menu.photo_full_url || "https://via.placeholder.com/300x200?text=Foto"}
              className="img-fluid rounded-start"
              alt={menu.name}
              style={{ objectFit: "cover", height: 120, width: "100%" }}
            />
          </Link>
        </div>

        <div className="col-8">
          <div className="card-body">
            <Link to={`/menu/${menu.id}?table=${tableNumber}`} className="text-decoration-none">
              <h6 className="card-title mb-1">{menu.name}</h6>
            </Link>
            <p className="card-text text-muted small mb-1">{menu.description || ""}</p>

            <div className="d-flex justify-content-between align-items-center">
              <strong>Rp {Number(menu.price).toLocaleString()}</strong>

              {qty === 0 ? (
                // Klik ini -> langsung tambah 1, CheckoutBar otomatis muncul
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => inc(menu, 1)}
                >
                  + Tambah
                </button>
              ) : (
                // Stepper update qty inline (tidak navigate)
                <div className="btn-group" role="group" aria-label="qty">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => dec(menu.id, 1)}
                    aria-label="decrease"
                  >
                    −
                  </button>
                  <button className="btn btn-light btn-sm" disabled style={{ minWidth: 36 }}>
                    {qty}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => inc(menu, 1)}
                    aria-label="increase"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
