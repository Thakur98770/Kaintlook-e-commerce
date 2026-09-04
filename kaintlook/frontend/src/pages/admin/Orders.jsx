// FILE PATH: kaintlook-auth/frontend/src/pages/admin/Orders.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { adminGetOrders, adminUpdateOrderStatus, adminUpdateReturnStatus } from "../../api/admin";

const STATUSES = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const RETURN_ACTIONS = ["approved", "rejected"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [trackingDraft, setTrackingDraft] = useState({}); // { [orderId]: { courierName, trackingNumber } }
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const load = () =>
    adminGetOrders(selectedMonth).then((data) => {
      setError("");
      setOrders(data);
      setTrackingDraft((prev) => {
        const next = { ...prev };
        data.forEach((o) => {
          if (!next[o._id]) {
            next[o._id] = { courierName: o.courierName || "", trackingNumber: o.trackingNumber || "" };
          }
        });
        return next;
      });
    }).catch((err) => setError(err.message));
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [selectedMonth]);

  const changeStatus = async (id, status) => {
    try { await adminUpdateOrderStatus(id, { status }); load(); } catch (err) { setError(err.message); }
  };

  const draftFor = (id) => trackingDraft[id] || { courierName: "", trackingNumber: "" };
  const updateDraft = (id, field, value) =>
    setTrackingDraft((prev) => ({ ...prev, [id]: { ...draftFor(id), [field]: value } }));

  const saveTracking = async (order) => {
    const draft = draftFor(order._id);
    try {
      await adminUpdateOrderStatus(order._id, {
        status: order.status,
        courierName: draft.courierName,
        trackingNumber: draft.trackingNumber,
      });
      load();
    } catch (err) { setError(err.message); }
  };

  const changeReturnStatus = async (id, status) => {
    try { await adminUpdateReturnStatus(id, status); load(); } catch (err) { setError(err.message); }
  };

  const pendingReturns = orders.filter((o) => o.return?.status === "requested");

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Orders</h1>
      {error && <p style={{ color: "#B03434", fontSize: 12.5 }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <label htmlFor="order-month" style={{ fontSize: 12.5, color: "#767676" }}>Monthly records</label>
        <input
          id="order-month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ border: "1px solid #E7E5DF", borderRadius: 6, padding: "7px 9px", fontSize: 12.5 }}
        />
        {selectedMonth && <button onClick={() => setSelectedMonth("")} style={clearFilterStyle}>Show all</button>}
        <span style={{ fontSize: 12, color: "#9C998F" }}>{orders.length} order{orders.length === 1 ? "" : "s"}</span>
      </div>

      {pendingReturns.length > 0 && (
        <div style={{ background: "#EAF1FE", border: "1px solid #2575FC", borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Pending Return Requests ({pendingReturns.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingReturns.map((o) => (
              <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, background: "#fff", borderRadius: 8, padding: "10px 14px" }}>
                <div>
                  <strong>#{o._id.slice(-8).toUpperCase()}</strong> — {o.user?.name}
                  <div style={{ fontSize: 11.5, color: "#767676" }}>{o.return.reason || "No reason given"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {RETURN_ACTIONS.map((action) => (
                    <button key={action} onClick={() => changeReturnStatus(o._id, action)} style={returnActionBtn(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#FAF9F6", fontSize: 11.5, color: "#767676" }}>
              <th style={thStyle}>Order</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Payment</th>
              <th style={thStyle}>Return</th>
              <th style={thStyle}>Tracking</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} style={{ borderTop: "1px solid #F0EEE8" }}>
                <td style={tdStyle}>#{o._id.slice(-8).toUpperCase()}</td>
                <td style={tdStyle}>{o.user?.name} <br /><span style={{ fontSize: 11, color: "#9C998F" }}>{o.user?.email}</span></td>
                <td style={tdStyle}>₹{o.totalAmount}</td>
                <td style={tdStyle}>
                  COD ·{" "}
                  <span style={{ color: o.paymentStatus === "paid" ? "#2E7D5B" : "#9C998F" }}>{o.paymentStatus}</span>
                </td>
                <td style={{ ...tdStyle, textTransform: "capitalize" }}>{o.return?.status !== "none" ? o.return.status : "—"}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
                    <input
                      value={draftFor(o._id).courierName}
                      onChange={(e) => updateDraft(o._id, "courierName", e.target.value)}
                      placeholder="Courier (e.g. Delhivery)"
                      style={trackingInputStyle}
                    />
                    <input
                      value={draftFor(o._id).trackingNumber}
                      onChange={(e) => updateDraft(o._id, "trackingNumber", e.target.value)}
                      placeholder="AWB / tracking no."
                      style={trackingInputStyle}
                    />
                    <button onClick={() => saveTracking(o)} style={saveTrackingBtnStyle}>Save</button>
                  </div>
                </td>
                <td style={tdStyle}>
                  <select value={o.status} onChange={(e) => changeStatus(o._id, e.target.value)} style={selectStyle}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>No orders yet.</p>}
      </div>
    </div>
  );
}

const thStyle = { padding: "10px 14px" };
const tdStyle = { padding: "10px 14px" };
const selectStyle = { border: "1px solid #E7E5DF", borderRadius: 6, padding: "5px 8px", fontSize: 12.5 };
const trackingInputStyle = { border: "1px solid #E7E5DF", borderRadius: 6, padding: "5px 8px", fontSize: 12, width: "100%" };
const saveTrackingBtnStyle = {
  alignSelf: "flex-start",
  background: "#2575FC",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
};
const clearFilterStyle = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" };
const returnActionBtn = (action) => ({
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
  color: "#fff",
  background: action === "approved" ? "#2E7D5B" : action === "rejected" ? "#B03434" : "#2575FC",
});
