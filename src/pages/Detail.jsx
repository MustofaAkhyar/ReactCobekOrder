// src/pages/Detail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMenu } from "../lib/api";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [menu, setMenu] = useState(null);
  const [qty, setQty] = useState(1);
  const { inc } = useCart();

  useEffect(() => { fetchMenu(id).then((res) => setMenu(res.data)); }, [id]);
  if (!menu) return <div className="app-viewport">Memuat...</div>;

  const header = (
    <>
      <button className="btn btn-light border btn-square-sm me-2" onClick={() => nav(-1)}>‹</button>
      <div className="fw-bold">Detail</div>
    </>
  );

  const footer = (
    <button
      className="btn btn-primary w-100"
      onClick={() => { inc(menu, qty); nav(-1); }}
    >
      Add Orders • Rp {(Number(menu.price) * qty).toLocaleString()}
    </button>
  );

  return (
    <PhoneShell header={header} footer={footer}>
      <img src={menu.photo_full_url || "https://via.placeholder.com/800x450"} className="img-fluid rounded mb-2" />
      <h5 className="mb-1">{menu.name}</h5>
      <div className="text-muted mb-2">{menu.description}</div>
      <div className="fw-bold mb-3">Rp {Number(menu.price).toLocaleString()}</div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-secondary" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
        <div className="fw-bold">{qty}</div>
        <button className="btn btn-outline-secondary" onClick={() => setQty(qty + 1)}>+</button>
      </div>
    </PhoneShell>
  );
}
