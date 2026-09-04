// FILE PATH: kaintlook-auth/frontend/src/pages/admin/Dashboard.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { adminGetSummary, adminGetSales, adminGetTopProducts } from "../../api/admin";

const accent = "#2575FC";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, salesData, topProductData] = await Promise.all([
          adminGetSummary(), adminGetSales(30), adminGetTopProducts(5),
        ]);
        setSummary(summaryData);
        setSales(salesData);
        setTopProducts(topProductData);
        setError("");
      } catch (err) { setError(err.message); }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const cards = summary
    ? [
        { label: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString()}` },
        { label: "Total Orders", value: summary.totalOrders },
        { label: "Total Users", value: summary.totalUsers },
        { label: "Total Products", value: summary.totalProducts },
        { label: "Low Stock (≤5)", value: summary.lowStockCount, warn: summary.lowStockCount > 0 },
      ]
    : [];

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 22 }}>Dashboard</h1>
      {error && <p style={{ color: "#B03434", fontSize: 12.5 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 30 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 11.5, color: "#767676", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.warn ? "#B03434" : "#1B1B1B" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, padding: "20px 20px 10px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Revenue — last 30 days</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={sales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke={accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, padding: "20px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Top Products</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#767676", fontSize: 11.5 }}>
              <th style={{ paddingBottom: 8 }}>Product</th>
              <th style={{ paddingBottom: 8 }}>Units Sold</th>
              <th style={{ paddingBottom: 8 }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p._id} style={{ borderTop: "1px solid #F0EEE8" }}>
                <td style={{ padding: "8px 0" }}>{p.name}</td>
                <td style={{ padding: "8px 0" }}>{p.unitsSold}</td>
                <td style={{ padding: "8px 0" }}>₹{p.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topProducts.length === 0 && <p style={{ fontSize: 12.5, color: "#9C998F", marginTop: 10 }}>No sales yet.</p>}
      </div>
    </div>
  );
}
