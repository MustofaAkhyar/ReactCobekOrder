import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import StickyDock from "../components/StickyDock";
import MenuCard from "../components/MenuCard";
import { useCart } from "../state/CartContext";
import { fetchMenus } from "../lib/api";

export default function Home({ tableNumber }) {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const { items, subtotal } = useCart();

  useEffect(() => {
    fetchMenus().then((r) => setData(r.data));
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return data;
    return data
      .map((c) => ({
        ...c,
        menus: (c.menus || []).filter((m) => m.name.toLowerCase().includes(kw)),
      }))
      .filter((c) => c.menus?.length);
  }, [data, q]);

  const header = (
    <>
      <div>
        <div className="text-muted small">Table</div>
        <div className="fw-bold">{tableNumber || "-"}</div>
      </div>
      <div className="ms-auto d-flex align-items-center gap-2">
        <Link to="/history" className="btn btn-light border btn-square-sm">
          <i className="bi bi-clock-history" />
        </Link>
      </div>
    </>
  );

  return (
    <PhoneShell header={header} noFooter>
      {/* Search */}
      <input
        className="form-control mb-3"
        placeholder="Cari menu..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* List kategori + menu */}
      {filtered.map((cat) => (
        <section key={cat.id} className="mb-3">
          <h6 className="fw-bold">{cat.name}</h6>
          {cat.menus?.map((m) => (
            <MenuCard key={m.id} menu={m} tableNumber={tableNumber} />
          ))}
        </section>
      ))}
      <br />

      {/* ANCHOR: taruh di PALING BAWAH konten */}
      <div id="homeDock" className="dock-anchor" />

      {/* Tombol Checkout mengambang -> nempel saat mentok bawah */}
      {items.length > 0 && (
        <StickyDock anchorId="homeDock">
          <div className="d-grid">
            <Link
              to={`/checkout?table=${tableNumber}`}
              className="btn btn-primary btn-lg"
            >
              Checkout • Rp {subtotal.toLocaleString()}
            </Link>
          </div>
        </StickyDock>
      )}
    </PhoneShell>
  );
}
