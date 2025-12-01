// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import PhoneShell from "../components/PhoneShell";
import { getHistory } from "../utils/history";
import { getOrder } from "../lib/api";
import { useNavigate } from "react-router-dom";

const badge = (s) => {
  const map = { unpaid: "warning", paid: "success", expired: "secondary", cancelled: "dark" };
  return `badge bg-${map[s] || "secondary"}`;
};

export default function History() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true); // <-- state loading

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const base = getHistory() || [];

        if (!base.length) {
          setList([]);
          return;
        }

        // update status dari backend
        const updated = await Promise.all(
          base.map(async (it) => {
            try {
              const or = (await getOrder(it.id)).data;
              return {
                ...it,
                status: or.status,
                total: or.total,
                created_at: or.created_at,
                code: or.order_code,
              };
            } catch {
              return it; // kalau gagal ambil, pakai data lokal
            }
          })
        );

        // ❗ Hanya tampilkan yang UNPAID
        const filtered = updated.filter((it) => it.status === "unpaid");

        setList(filtered);

        // simpan lagi ke sessionStorage supaya history ikut bersih
        try {
          sessionStorage.setItem("orderHistory", JSON.stringify(filtered));
        } catch {}
      } finally {
        setLoading(false); // selesai loading
      }
    };

    load();
  }, []);

  const header = (
    <>
      <button className="btn btn-light border btn-square-sm me-2" onClick={() => nav(-1)}>
        ‹
      </button>
      <div className="fw-bold">Riwayat Pesanan</div>
    </>
  );

  const handleClickItem = (it) => {
    // karena sekarang hanya unpaid yang tampil, klik -> langsung ke PaymentQR
    nav(`/payment/qr?orderId=${it.id}`);
  };

  return (
    <PhoneShell header={header} noFooter>
      {loading ? (
        // 🔄 Animasi loading
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="small text-muted">Memuat riwayat pesanan...</div>
          </div>
        </div>
      ) : !list.length ? (
        <div className="alert alert-info mt-2">
          Tidak ada pesanan yang masih menunggu pembayaran.
        </div>
      ) : (
        <ul className="list-group">
          {list.map((it) => (
            <li
              key={it.id}
              className="list-group-item d-flex justify-content-between align-items-center list-group-item-action"
              style={{ cursor: "pointer" }}
              onClick={() => handleClickItem(it)}
            >
              <div>
                <div className="fw-semibold">Order #{it.code}</div>
                <div className="text-muted small">
                  {new Date(it.created_at).toLocaleString()} • Total Rp{" "}
                  {Number(it.total || 0).toLocaleString()}
                </div>
                <div className="text-primary small">Tap untuk lanjut ke pembayaran</div>
              </div>
              <span className={badge(it.status)}>{it.status}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ height: 12 }} />
    </PhoneShell>
  );
}
