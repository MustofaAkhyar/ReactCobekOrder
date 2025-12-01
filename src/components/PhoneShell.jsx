import React from "react";

/**
 * PhoneShell
 * - header: node -> dipasang di area absolut atas (56px)
 * - footer: node -> dipasang di area absolut bawah (64px)
 * - noFooter: bool -> bila true, konten sampai bawah (tanpa footer)
 */
export default function PhoneShell({ header, footer, noFooter = false, children }) {
  return (
    <div className="app-viewport">
      <div className="phone">
        <div className="phone-header">{header}</div>
        <div className={`phone-content ${noFooter ? "no-footer" : ""}`}>{children}</div>
        {!noFooter && <div className="phone-footer">{footer}</div>}
      </div>
    </div>
  );
}
