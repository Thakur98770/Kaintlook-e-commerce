import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Mail, BellRing } from "lucide-react";

const accent = "#2575FC";

const LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/notifications", label: "Email Logs", icon: Mail },
  { to: "/admin/stock-notifications", label: "Back-in-Stock Requests", icon: BellRing },
];

export default function AdminLayout() {
  return (
    <div className="kl-admin-layout" style={{ display: "flex", minHeight: "100vh", fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`@media (max-width: 700px) { .kl-admin-layout { display: block !important; } .kl-admin-layout aside { width: auto !important; border-right: none !important; border-bottom: 1px solid #E7E5DF; padding: 16px !important; } .kl-admin-layout aside nav { display: flex !important; flex-direction: row !important; overflow-x: auto; gap: 6px !important; } .kl-admin-layout aside nav a { white-space: nowrap; } .kl-admin-layout main { padding: 20px 14px !important; overflow-x: hidden; } }`}</style>
      <aside style={{ width: 220, borderRight: "1px solid #E7E5DF", padding: "24px 16px", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 24, padding: "0 8px" }}>
          Kaint<span style={{ color: accent }}>Look</span> <span style={{ fontSize: 11, color: "#9C998F" }}>Admin</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 6,
                fontSize: 13.5, textDecoration: "none",
                color: isActive ? accent : "#333",
                background: isActive ? "#FBF3EA" : "transparent",
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "28px 32px", background: "#FAF9F6", minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}