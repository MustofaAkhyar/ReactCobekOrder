import React from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import PaymentQR from "./pages/PaymentQR";
import History from "./pages/History";

// Halaman sederhana kalau nomor meja tidak valid
function InvalidTable() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-3" style={{ maxWidth: 320 }}>
        <h5 className="mb-2">Nomor Meja Tidak Valid</h5>
        <p className="mb-0 small text-muted">
          Kamu mau duduk dimana? Daftar meja tidak tersedia disini. Silakan scan ulang QR pada meja Anda.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [params] = useSearchParams();
  const raw = params.get("table");

  const n = Number(raw);
  const tableNumber =
    Number.isInteger(n) && n >= 1 && n <= 8
      ? String(n)
      : null; // hanya terima 1..8, selain itu null

  return (
    <div className="bg-light min-vh-100">
      <Routes>
        {/* Halaman yang BUTUH nomor meja valid */}
        <Route
          path="/"
          element={
            tableNumber ? (
              <Home tableNumber={tableNumber} />
            ) : (
              <InvalidTable />
            )
          }
        />
        <Route
          path="/menu/:id"
          element={
            tableNumber ? (
              <Detail tableNumber={tableNumber} />
            ) : (
              <InvalidTable />
            )
          }
        />
        <Route
          path="/checkout"
          element={
            tableNumber ? (
              <Checkout tableNumber={tableNumber} />
            ) : (
              <InvalidTable />
            )
          }
        />
        <Route
          path="/payment"
          element={
            tableNumber ? (
              <Payment tableNumber={tableNumber} />
            ) : (
              <InvalidTable />
            )
          }
        />

        {/* Halaman yang TIDAK tergantung nomor meja */}
        <Route path="/payment/qr" element={<PaymentQR />} />
        <Route path="/history" element={<History />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
