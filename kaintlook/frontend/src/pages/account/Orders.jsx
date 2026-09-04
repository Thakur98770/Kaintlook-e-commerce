// FILE PATH: kaintlook-auth/frontend/src/pages/account/Orders.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../../api/shop";

const accent = "#2575FC";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Orders</h1>

      {loading ? (
        <p style={{ fontSize: 13, color: "#9C998F" }}>Loading…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#767676" }}>
          No orders yet — <Link to="/" style={{ color: accent }}>start shopping</Link>.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 8, padding: "12px 16px", textDecoration: "none", color: "#1B1B1B", fontSize: 13.5 }}
            >
              <div>
                <strong>#{o._id.slice(-8).toUpperCase()}</strong>
                <div style={{ fontSize: 11.5, color: "#9C998F" }}>{new Date(o.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>₹{o.totalAmount}</div>
                <div style={{ fontSize: 11.5, textTransform: "capitalize", color: accent }}>{o.status}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}