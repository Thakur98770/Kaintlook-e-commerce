import React from "react";
import { Link } from "react-router-dom";

const accent = "#2575FC";
const theme = { bg: "#FFFFFF", panel: "#FFFFFF", text: "#1B1B1B", sub: "#767676", line: "#E7E5DF" };

// Shared shell for Terms & Conditions / Privacy Policy / Refund Policy pages.
// Kept intentionally simple (no nav/dark-mode toggle) so it's safe to reuse
// without depending on Home.jsx's larger header state/logic.
export default function LegalPageLayout({ title, updatedAt, children }) {
  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: "'Work Sans','Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&display=swap');
        .kl-legal a { color: ${accent}; text-decoration: none; }
        .kl-legal a:hover { text-decoration: underline; }
        .kl-legal h2 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; margin: 28px 0 10px; }
        .kl-legal p, .kl-legal li { font-size: 13.5px; line-height: 1.8; color: #3a3a3a; }
        .kl-legal ul { padding-left: 20px; margin: 8px 0; }
      `}</style>

      <header style={{ borderBottom: `1px solid ${theme.line}`, padding: "18px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link to="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, textDecoration: "none", color: theme.text }}>
            Kaint<span style={{ color: accent }}>Look</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 64px" }} className="kl-legal">
        <Link to="/" style={{ fontSize: 12.5, color: theme.sub }}>&larr; Back to home</Link>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, margin: "14px 0 4px" }}>{title}</h1>
        {updatedAt && <p style={{ fontSize: 12, color: theme.sub, marginBottom: 24 }}>Last updated: {updatedAt}</p>}
        {children}
      </main>

      <footer style={{ borderTop: `1px solid ${theme.line}`, textAlign: "center", padding: "16px 20px", fontSize: 11.5, color: theme.sub }}>
        © {new Date().getFullYear()} KaintLook. All Rights Reserved.
      </footer>
    </div>
  );
}