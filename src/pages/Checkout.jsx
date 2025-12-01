import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";

export default function Checkout({ tableNumber }) {
  const { items, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();

  // Hitung PPN & total
  const ppn = Math.round(subtotal * 0.1);        // 10% dari subtotal
  const total = subtotal + ppn;

  const header = (
    <>
      <button className="btn btn-light border btn-square-sm me-2" onClick={() => nav(-1)}>‹</button>
      <div className="fw-bold">Order</div>
    </>
  );

  const footer = (
    <div className="d-flex w-100 justify-content-between align-items-center">
      <div>
        <div className="small text-muted">Total (termasuk PPN 10%)</div>
        <div className="fw-semibold">Rp {total.toLocaleString()}</div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => nav(`/payment?table=${tableNumber}`)}
        disabled={!items.length}
      >
        Continue to Payment
      </button>
    </div>
  );

  return (
    <PhoneShell header={header} footer={footer}>
      {!items.length && <div className="alert alert-info">Keranjang kosong.</div>}

      {items.map(({ menu, qty }) => (
        <div className="card mb-2" key={menu.id}>
          <div className="card-body d-flex align-items-center gap-3">
            <img
              src={menu.photo_full_url || "https://via.placeholder.com/64"}
              width={64}
              height={64}
              style={{ objectFit: "cover" }}
              className="rounded"
            />
            <div className="flex-grow-1">
              <div className="fw-semibold">{menu.name}</div>
              <div className="text-muted small">
                Rp {Number(menu.price).toLocaleString()}
              </div>
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setQty(menu.id, Math.max(1, qty - 1))}
              >
                −
              </button>
              <button className="btn btn-light btn-sm" disabled>
                {qty}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setQty(menu.id, qty + 1)}
              >
                +
              </button>
            </div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => remove(menu.id)}
            >
              Hapus
            </button>
          </div>
        </div>
      ))}

      {/* Breakdown Subtotal, PPN, Total */}
      {items.length > 0 && (
        <div className="card mt-2">
          <div className="card-body">
            <div className="d-flex justify-content-between mb-1">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>PPN 10%</span>
              <span>Rp {ppn.toLocaleString()}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Total</span>
              <span className="fw-bold">Rp {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
