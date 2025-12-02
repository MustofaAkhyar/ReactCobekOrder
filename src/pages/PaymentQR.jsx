// src/pages/PaymentQR.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";
import PhoneShell from "../components/PhoneShell";
import { useCart } from "../state/CartContext";
import { getOrder, createPayment, payOrder, cancelOrder } from "../lib/api";
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

  const [remaining, setRemaining] = useState(null); // detik untuk countdown

  // home url berdasarkan meja dari order
  const homeUrl = useMemo(() => {
    const table = state.order?.table_number;
    return table ? `/?table=${table}` : "/";
  }, [state.order]);

  // --- ambil order + QR ---
  useEffect(() => {
    if (!orderId) {
      nav("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const or = (await getOrder(orderId)).data;

        // kalau status sudah final langsung lempar balik
        if (["paid", "expired", "cancelled"].includes(or.status)) {
          alert(`Order sudah ${or.status}.`);
          nav(homeUrl, { replace: true });
          return;
        }

        let qr = or.qr_string;
        if (!qr) {
          const pay = await createPayment(or.id);
          qr = pay.data.qr_string;
        }

        setState({ loading: false, order: or, qr });
        clear(); // cart dikosongkan setelah order berhasil dibuat
      } catch (e) {
        console.error(e);
        alert("Gagal memuat QR. Silakan kembali dan ulangi order.");
        nav("/", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // --- hitung mundur dari expires_at ---
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

  // --- polling status setiap 3 detik ---
  useEffect(() => {
    if (!state.order) return;

    const t = setInterval(async () => {
      try {
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
        } else if (or.status === "cancelled") {
          updateOrderStatus(or.id, "cancelled");
          clearInterval(t);
          alert("Order sudah dibatalkan.");
          nav(homeUrl, { replace: true });
        }
      } catch (e) {
        console.error(e);
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
      <div className="fw-bold">QRIS Payment</div>
    </>
  );

  // format countdown
  const countdownText = useMemo(() => {
    if (remaining == null) return "-";
    if (remaining <= 0) return "00:00";
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  // --- PAY NOW dengan konfirmasi ---
  const handlePayNow = async () => {
    if (!orderId || !state.order) return;

    const ok = window.confirm(
      "Yakin ingin membayar pesanan?"
    );
    if (!ok) return;

    try {
      const res = await payOrder(orderId); // panggil API ubah status
      const or = res.data;
      updateOrderStatus(or.id, or.status);
      alert("Pesanan berhasil dibayar.");
      nav(homeUrl, { replace: true });
    } catch (e) {
      console.error(e);
      alert("Gagal membayar pesanan. Coba lagi.");
    }
  };

  // --- CANCEL dengan konfirmasi ---
  const handleCancel = async () => {
    if (!orderId || !state.order) return;

    const ok = window.confirm(
      "Yakin ingin membatalkan pesanan?"
    );
    if (!ok) return;

    try {
      const res = await cancelOrder(orderId); // panggil API ubah status
      const or = res.data;
      updateOrderStatus(or.id, or.status);
      alert("Order telah dibatalkan.");
      nav(homeUrl, { replace: true });
    } catch (e) {
      console.error(e);
      alert(
        "Gagal membatalkan order. Mungkin order sudah dibayar atau expired."
      );
    }
  };

  const disabledActions =
    !state.order || state.order.status !== "unpaid" || remaining === 0;

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
                Waktu habis. Jika belum otomatis expired, silakan kembali dan
                buat order baru.
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
              disabled={disabledActions}
            >
              Pay Now
            </button>
            <button
              className="btn btn-outline-danger w-100"
              onClick={handleCancel}
              disabled={disabledActions}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
