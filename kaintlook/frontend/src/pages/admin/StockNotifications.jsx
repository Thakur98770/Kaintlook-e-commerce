import React, { useEffect, useState } from "react";
import { adminGetStockNotifications } from "../../api/admin";

const STATUS_COLORS = { active: "#B8860B", notified: "#2E7D5B", cancelled: "#9C998F" };

export default function StockNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetStockNotifications(statusFilter).then(setNotifications).finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700 }}>Back-in-Stock Requests</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="active">Waiting</option>
          <option value="notified">Notified</option>
          <option value="">All</option>
        </select>
      </div>

      <p style={{ fontSize: 12.5, color: "#767676", marginBottom: 16 }}>
        This shows which products (and exact color/size) customers are waiting for — useful for deciding what to restock first.
      </p>

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#FAF9F6", fontSize: 11.5, color: "#767676" }}>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Color</th>
              <th style={thStyle}>Size</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Requested</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n._id} style={{ borderTop: "1px solid #F0EEE8" }}>
                <td style={tdStyle}>{n.productName}</td>
                <td style={tdStyle}>
                  {n.colorName && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: n.colorCode || "#ccc", border: "1px solid #E7E5DF" }} />
                      {n.colorName}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>{n.size || "—"}</td>
                <td style={tdStyle}>{n.email}</td>
                <td style={tdStyle}>{new Date(n.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <span style={{ color: STATUS_COLORS[n.status], fontWeight: 600, fontSize: 12 }}>
                    {n.status === "active" ? "Waiting" : n.status === "notified" ? "Notified" : "Cancelled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && notifications.length === 0 && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>No requests yet.</p>}
        {loading && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>Loading…</p>}
      </div>
    </div>
  );
}

const selectStyle = { border: "1px solid #E7E5DF", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
const thStyle = { padding: "10px 14px" };
const tdStyle = { padding: "10px 14px" };