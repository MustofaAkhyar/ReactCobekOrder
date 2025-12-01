// src/pages/PaymentQR.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";
import PhoneShell from "../components/PhoneShell";
import { useCart } from "../state/CartContext";
import { getOrder, createPayment } from "../lib/api";
import { updateOrderStatus } from "../utils/history";

export default function PaymentQR() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const nav = useNavigate();
  const { clear } = useCart();

  const [state, setState] = useState({
    loading: true,
    order: null,
    qr: "",
  });

  const [remaining, setRemaining] = useState(null); // hitung mundur detik

  // helper: URL home berdasarkan table_number dari order
  const homeUrl = useMemo(() => {
    const table = state.order?.table_number;
    return table ? `/?table=${table}` : "/";
  }, [state.order]);

  // Ambil order + QR
  useEffect(() => {
    if (!orderId) {
      nav("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const or = (await getOrder(orderId)).data;
        let qr = or.qr_string;
        if (!qr) {
          const pay = await createPayment(or.id);
          qr = pay.data.qr_string;
        }
        setState({ loading: false, order: or, qr });
        clear(); // bersihkan cart setelah order dibuat
      } catch (e) {
        alert("Gagal memuat QR. Silakan kembali dan ulangi order.");
        nav("/", { replace: true });
      }
    })();
  }, [orderId]);

  // hitung mundur berdasarkan expires_at
  useEffect(() => {
    if (!state.order?.expires_at) return;

    const expiryMs = new Date(state.order.expires_at).getTime();

    const tick = () => {
      const diffSec = Math.floor((expiryMs - Date.now()) / 1000);
      setRemaining(diffSec > 0 ? diffSec : 0);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.order?.expires_at]);

  // polling status setiap 3 detik
  useEffect(() => {
    if (!state.order) return;
    const t = setInterval(async () => {
      const or = (await getOrder(orderId)).data;
      if (or.status === "paid") {
        updateOrderStatus(or.id, "paid");
        clearInterval(t);
        alert("Pembayaran berhasil!");
        nav(homeUrl, { replace: true });
      } else if (or.status === "expired") {
        updateOrderStatus(or.id, "expired");
        clearInterval(t);
        alert("Order expired. Silakan buat order baru.");
        nav(homeUrl, { replace: true });
      }
    }, 3000);
    return () => clearInterval(t);
  }, [state.order, orderId, homeUrl, nav]);

  const header = (
    <>
      <button
        className="btn btn-light border btn-square-sm me-2"
        onClick={() => nav(-1)}
      >
        ‹
      </button>
      <div className="fw-bold">QRIS</div>
    </>
  );

  const handlePayNow = async () => {
    if (!orderId) return;
    try {
      const or = (await getOrder(orderId)).data;
      if (or.status === "paid") {
        updateOrderStatus(or.id, "paid");
        alert("Pembayaran sudah berhasil!");
        nav(homeUrl, { replace: true });
      } else if (or.status === "expired") {
        updateOrderStatus(or.id, "expired");
        alert("Order sudah expired. Silakan buat order baru.");
        nav(homeUrl, { replace: true });
      } else {
        alert("Silakan scan QR dengan aplikasi e-wallet Anda untuk membayar.");
      }
    } catch (e) {
      alert("Tidak bisa mengecek status pembayaran. Coba lagi.");
    }
  };

  const handleCancel = () => {
    alert("Order dibatalkan. Anda akan kembali ke menu.");
    nav(homeUrl, { replace: true });
  };

  // format countdown
  const countdownText = useMemo(() => {
    if (remaining == null) return "-";
    if (remaining <= 0) return "00:00";
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  return (
    <PhoneShell header={header} noFooter>
      {state.loading ? (
        <div className="d-flex justify-content-center align-items-center h-100">
          Menyiapkan pembayaran...
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center pt-3">
          <div className="text-muted small mb-1">
            Order: {state.order?.order_code}
          </div>

          {/* countdown */}
          <div className="mb-3 text-center">
            <div className="small text-muted">Batas waktu pembayaran</div>
            <div
              className={`fw-bold ${
                remaining === 0 ? "text-danger" : "text-dark"
              }`}
              style={{ fontSize: "1.4rem", letterSpacing: "0.08em" }}
            >
              {countdownText}
            </div>
            {remaining === 0 && (
              <div className="text-danger small">
                Waktu habis. Jika belum otomatis expired, silakan kembali dan buat order baru.
              </div>
            )}
          </div>

          {state.qr ? (
            <QRCode value={state.qr} size={240} />
          ) : (
            <div className="alert alert-warning">QR tidak tersedia.</div>
          )}

          <div className="mt-3 fw-semibold">
            Total: Rp {Number(state.order?.total || 0).toLocaleString()}
          </div>
          <div className="text-muted small mt-1">
            Meja: {state.order?.table_number || "-"}
          </div>

          <div className="mt-4 w-100 px-3">
            <button
              className="btn btn-success w-100 mb-2"
              onClick={handlePayNow}
            >
              Pay Now
            </button>
            <button
              className="btn btn-outline-danger w-100"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
