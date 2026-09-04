// FILE PATH: kaintlook-auth/frontend/src/pages/account/AccountLayout.jsx
// Replace the existing file at this path with the contents below.

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, Package, MapPin, Heart, Star, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const accent = "#2575FC";

const LINKS = [
  { to: "/account", label: "Orders", icon: Package, end: true },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/reviews", label: "My Reviews", icon: Star },
  { to: "/account/profile", label: "Profile", icon: User },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="kl-account-layout" style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif", display: "grid", gridTemplateColumns: "200px 1fr", gap: 30 }}>
      <style>{`@media (max-width: 700px) { .kl-account-layout { grid-template-columns: 1fr !important; gap: 22px !important; } .kl-account-layout aside nav { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); } }`}</style>
      <aside>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700 }}>Hi, {user?.name?.split(" ")[0]}</p>
          <p style={{ fontSize: 12, color: "#767676" }}>{user?.email}</p>
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
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 6, fontSize: 13.5, background: "none", border: "none", color: "#B03434", cursor: "pointer", textAlign: "left", marginTop: 8 }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}