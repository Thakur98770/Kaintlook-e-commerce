// FILE PATH: kaintlook-auth/frontend/src/pages/OrderTracking.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder, cancelOrder, requestReturn } from "../api/shop";

const accent = "#2575FC";
const STAGES = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

// Best-effort tracking URL for well-known Indian couriers. Falls back to a
// Google search for the number if the courier isn't in this list — admin
// still enters whatever courier name they used, so this can't cover everyone.
const COURIER_TRACKING_URLS = {
  delhivery: (n) => `https://www.delhivery.com/track-v2/package/${n}`,
  "india post": (n) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?id=${n}`,
  "blue dart": (n) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${n}`,
  bluedart: (n) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${n}`,
  dtdc: (n) => `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${n}`,
  "ecom express": (n) => `https://ecomexpress.in/tracking/?awb_field=${n}`,
  shiprocket: (n) => `https://shiprocket.co/tracking/${n}`,
};

function courierTrackingUrl(courierName, trackingNumber) {
  if (!trackingNumber) return null;
  const key = (courierName || "").trim().toLowerCase();
  const builder = COURIER_TRACKING_URLS[key];
  if (builder) return builder(encodeURIComponent(trackingNumber));
  // Unknown courier — fall back to a search so the link is still useful.
  return `https://www.google.com/search?q=${encodeURIComponent(`${courierName || ""} tracking ${trackingNumber}`)}`;
}

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => getOrder(id).then(setOrder).catch((err) => setError(err.message));
  useEffect(() => { load(); }, [id]);

  if (error) return <div style={{ padding: 40 }}>{error}</div>;
  if (!order) return <div style={{ padding: 40 }}>Loading…</div>;

  const currentIndex = STAGES.indexOf(order.status);
  const canCancel = order.status === "pending";
  const orderReturn = order.return || { status: "none" };
  const canReturn = order.status === "delivered" && orderReturn.status === "none";

  const handleCancel = async () => {
    setBusy(true);
    try {
      const updated = await cancelOrder(order._id, reason);
      setOrder(updated);
      setShowCancelForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReturn = async () => {
    setBusy(true);
    try {
      const updated = await requestReturn(order._id, reason);
      setOrder(updated);
      setShowReturnForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`
        @media (max-width: 560px) {
          .kl-order-header { flex-wrap: wrap; gap: 14px; }
          .kl-order-actions { width: 100%; }
          .kl-order-actions button { flex: 1; }
          .kl-stage-track { overflow-x: auto; justify-content: flex-start !important; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
          .kl-stage-item { flex: 0 0 68px !important; }
        }
      `}</style>
      <div className="kl-order-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p style={{ fontSize: 13, color: "#767676", marginBottom: 6 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p style={{ fontSize: 12.5, marginBottom: 6 }}>
            Payment: <strong>Cash on Delivery</strong>
            {" · "}
            <span style={{ color: order.paymentStatus === "paid" ? "#2E7D5B" : order.paymentStatus === "failed" ? "#B03434" : "#9C998F" }}>
              {order.paymentStatus}
            </span>
          </p>
          <Link to={`/orders/${order._id}/invoice`} style={{ fontSize: 12.5, color: accent }}>
            Download Invoice
          </Link>

          {order.trackingNumber && (
            <div style={{ marginTop: 10, fontSize: 12.5 }}>
              <strong>{order.courierName || "Courier"}</strong> — {order.trackingNumber}
              {" · "}
              <a
                href={courierTrackingUrl(order.courierName, order.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: accent }}
              >
                Track on courier site
              </a>
            </div>
          )}
        </div>

        {(canCancel || canReturn) && (
          <div className="kl-order-actions" style={{ display: "flex", gap: 8 }}>
            {canCancel && (
              <button onClick={() => setShowCancelForm(!showCancelForm)} style={dangerBtnStyle}>Cancel Order</button>
            )}
            {canReturn && (
              <button onClick={() => setShowReturnForm(!showReturnForm)} style={outlineBtnStyle}>Return Order</button>
            )}
          </div>
        )}
      </div>

      {showCancelForm && (
        <div style={formBoxStyle}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>Why are you cancelling? (optional)</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} style={textareaStyle} placeholder="Reason…" />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleCancel} disabled={busy} style={dangerBtnStyle}>{busy ? "Cancelling…" : "Confirm Cancellation"}</button>
            <button onClick={() => setShowCancelForm(false)} style={outlineBtnStyle}>Never mind</button>
          </div>
        </div>
      )}

      {showReturnForm && (
        <div style={formBoxStyle}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>What's the reason for the return?</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} style={textareaStyle} placeholder="e.g. wrong size, damaged item…" />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleReturn} disabled={busy} style={primaryBtnStyle}>{busy ? "Submitting…" : "Submit Return Request"}</button>
            <button onClick={() => setShowReturnForm(false)} style={outlineBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {orderReturn.status !== "none" && (
        <div style={{ background: "#FBF3EA", border: `1px solid ${accent}`, borderRadius: 8, padding: "12px 16px", marginTop: 16, fontSize: 12.5 }}>
          <strong style={{ textTransform: "capitalize" }}>Return {orderReturn.status}</strong>
          {orderReturn.reason && <span> — {orderReturn.reason}</span>}
        </div>
      )}

      {order.status === "cancelled" ? (
        <p style={{ color: "#B03434", fontSize: 14, fontWeight: 600, marginTop: 30 }}>
          This order was cancelled{order.cancelReason ? ` — ${order.cancelReason}` : "."}
        </p>
      ) : (
        <div className="kl-stage-track" style={{ display: "flex", justifyContent: "space-between", margin: "40px 0", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, left: 0, right: 0, height: 2, background: "#E7E5DF", zIndex: 0 }} />
          <div style={{ position: "absolute", top: 12, left: 0, height: 2, background: accent, zIndex: 1, width: `${(currentIndex / (STAGES.length - 1)) * 100}%`, transition: "width .3s" }} />
          {STAGES.map((stage, i) => (
            <div key={stage} className="kl-stage-item" style={{ position: "relative", zIndex: 2, textAlign: "center", flex: 1 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", margin: "0 auto 8px",
                background: i <= currentIndex ? accent : "#fff",
                border: `2px solid ${i <= currentIndex ? accent : "#E7E5DF"}`,
              }} />
              <span style={{ fontSize: 11.5, textTransform: "capitalize", color: i <= currentIndex ? "#1B1B1B" : "#9C998F" }}>{stage.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px solid #E7E5DF", paddingTop: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>History</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...(order.trackingHistory || [])].reverse().map((h, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#555" }}>
              <strong style={{ textTransform: "capitalize" }}>{h.status}</strong> — {h.note} · {new Date(h.at).toLocaleString()}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E7E5DF", marginTop: 24, paddingTop: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Items</h2>
        {order.items.map((it, i) => (
          <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 13, marginBottom: 8 }}>
            <span>
              {it.name} × {it.quantity}
              {(it.variantColorName || it.size) && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 8, fontSize: 11.5, color: "#767676" }}>
                  {it.variantColorName && <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: it.variantColorCode || "#ccc", border: "1px solid #E7E5DF" }} />}
                  {[it.variantColorName, it.size && `Size: ${it.size}`].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
            <span>₹{it.price * it.quantity}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 12 }}>
          <span>Total</span>
          <span>₹{order.totalAmount}</span>
        </div>
      </div>
    </div>
  );
}

const formBoxStyle = { background: "#FAF9F6", border: "1px solid #E7E5DF", borderRadius: 8, padding: 16, marginTop: 16 };
const textareaStyle = { width: "100%", padding: "8px 10px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13, resize: "vertical" };
const dangerBtnStyle = { background: "#fff", color: "#B03434", border: "1px solid #B03434", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const outlineBtnStyle = { background: "#fff", border: "1px solid #E7E5DF", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, cursor: "pointer" };
const primaryBtnStyle = { background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };