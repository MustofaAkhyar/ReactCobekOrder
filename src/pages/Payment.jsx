// src/pages/Payment.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../lib/api";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import { addOrderHistory } from "../utils/history";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Payment({ tableNumber }) {
  const nav = useNavigate();
  const { items, subtotal } = useCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "", // catatan
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Hitung PPN & total
  const ppn = Math.round(subtotal * 0.1);      // 10% dari subtotal
  const total = subtotal + ppn;

  // --- VALIDASI ---
  const validation = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi.";
    if (!form.phone.trim()) e.phone = "Nomor telepon wajib diisi.";
    else if (!/^\d+$/.test(form.phone.trim())) e.phone = "Nomor telepon hanya boleh angka.";
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    else if (!emailRegex.test(form.email.trim())) e.email = "Format email tidak valid.";
    if (!items.length) e.items = "Keranjang kosong.";
    return { valid: Object.keys(e).length === 0, e };
  }, [form, items.length]);

  const header = (
    <>
      <button className="btn btn-light border btn-square-sm me-2" onClick={() => nav(-1)}>‹</button>
      <div className="fw-bold">Payment</div>
    </>
  );

  async function submit() {
    if (!validation.valid) {
      setErrors(validation.e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        table_number: tableNumber,
        items: items.map(({ menu, qty }) => ({ menu_id: menu.id, qty })),
        other_fees: ppn, // kirim PPN 10% (backend tetap bisa hitung ulang)
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim(),
        customer_note: form.note.trim() || null,
      };

      const res = await createOrder(payload);
      addOrderHistory({
        id: res.data.id,
        order_code: res.data.order_code,
        total: res.data.total,
        created_at: res.data.created_at,
        status: res.data.status,
      });
      nav(`/payment/qr?orderId=${res.data.id}&table=${tableNumber}`);
    } catch (err) {
      if (err?.response?.status === 422) {
        const be = err.response.data?.errors || {};
        const flat = {};
        Object.keys(be).forEach(
          (k) => (flat[k] = Array.isArray(be[k]) ? be[k][0] : String(be[k]))
        );
        setErrors((prev) => ({ ...prev, ...flat }));
      } else {
        alert("Gagal membuat order. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  // tombol Pay: merah kalau invalid, hijau kalau valid
  const footer = (
    <button
      className={`btn w-100 ${validation.valid ? "btn-success" : "btn-danger"}`}
      disabled={loading || !validation.valid}
      onClick={submit}
    >
      {loading ? "Processing..." : "Pay"}
    </button>
  );

  // khusus Phone: hanya angka
  const onPhoneChange = (v) => {
    const digitsOnly = v.replace(/\D+/g, "");
    setForm((f) => ({ ...f, phone: digitsOnly }));
    if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
  };

  return (
    <PhoneShell header={header} footer={footer}>
      {"items" in errors && (
        <div className="alert alert-warning">
          Keranjang kosong. Tambahkan item terlebih dahulu.
        </div>
      )}

      <div className="card mb-2">
        <div className="card-body">
          <div className="mb-2">
            <label className="form-label">Full Name</label>
            <input
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
              }}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-2">
            <label className="form-label">Phone Number</label>
            <input
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              value={form.phone}
              inputMode="numeric"
              pattern="\d*"
              onChange={(e) => onPhoneChange(e.target.value)}
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>

          <div className="mb-2">
            <label className="form-label">Email (receipt)</label>
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Catatan di antara email & table number */}
          <div className="mb-2">
            <label className="form-label">Catatan (opsional)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Contoh: sambal dipisah, tanpa es, dsb."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="mb-0">
            <label className="form-label">Table Number</label>
            <input className="form-control" value={tableNumber} disabled />
          </div>
        </div>
      </div>

      {/* Ringkasan error di bawah form */}
      {!validation.valid && (
        <div className="alert alert-danger mb-2">
          <div className="fw-semibold mb-1">Periksa kembali isian berikut:</div>
          <ul className="m-0 ps-3">
            {validation.e.name && <li>{validation.e.name}</li>}
            {validation.e.phone && <li>{validation.e.phone}</li>}
            {validation.e.email && <li>{validation.e.email}</li>}
            {validation.e.items && <li>{validation.e.items}</li>}
          </ul>
        </div>
      )}

      {/* Breakdown Subtotal / PPN / Total */}
      <div className="card">
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
    </PhoneShell>
  );
}
