import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrder } from "../api/shop";

const accent = "#2575FC";

export default function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div style={{ padding: 40 }}>{error}</div>;
  if (!order) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 30px", fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @media (max-width: 480px) {
          .kl-invoice-header { flex-wrap: wrap; gap: 16px; }
          .kl-invoice-header > div:last-child { text-align: left !important; }
          .kl-invoice-meta { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <button onClick={() => window.print()} className="no-print" style={printBtnStyle}>
        Download / Print Invoice
      </button>

      <div className="kl-invoice-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, borderBottom: "2px solid #1B1B1B", paddingBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>
            Kaint<span style={{ color: accent }}>Look</span>
          </h1>
          <p style={{ fontSize: 12, color: "#767676", marginTop: 4 }}>Ludhiana, Punjab, India</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>INVOICE</h2>
          <p style={{ fontSize: 12, color: "#767676", marginTop: 4 }}>
            #{order._id.slice(-8).toUpperCase()}<br />
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="kl-invoice-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30, fontSize: 13 }}>
        <div>
          <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "#767676", marginBottom: 6 }}>Billed To</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {order.shippingAddress?.fullName}<br />
            {order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
            {order.shippingAddress?.phone}
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "#767676", marginBottom: 6 }}>Payment</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Method: Cash on Delivery<br />
            Status: <span style={{ textTransform: "capitalize" }}>{order.paymentStatus}</span><br />
            Order Status: <span style={{ textTransform: "capitalize" }}>{order.status}</span>
          </p>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1B1B1B", textAlign: "left" }}>
            <th style={{ padding: "8px 0" }}>Item</th>
            <th style={{ padding: "8px 0", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "8px 0", textAlign: "right" }}>Price</th>
            <th style={{ padding: "8px 0", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #E7E5DF" }}>
              <td style={{ padding: "8px 0" }}>
                {it.name}
                {(it.variantColorName || it.size) && (
                  <div style={{ fontSize: 11, color: "#767676", marginTop: 2 }}>
                    {[it.variantColorName, it.size && `Size: ${it.size}`].filter(Boolean).join(" · ")}
                  </div>
                )}
              </td>
              <td style={{ padding: "8px 0", textAlign: "center" }}>{it.quantity}</td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>₹{it.price}</td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>₹{it.price * it.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginLeft: "auto", maxWidth: 240, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
          <span>Subtotal</span><span>₹{order.subtotal}</span>
        </div>
        {order.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span>Discount {order.coupon && `(${order.coupon})`}</span><span>−₹{order.discount}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #1B1B1B", marginTop: 6, fontWeight: 700, fontSize: 15 }}>
          <span>Total</span><span>₹{order.totalAmount}</span>
        </div>
      </div>

      <p style={{ marginTop: 50, fontSize: 11.5, color: "#9C998F", textAlign: "center" }}>
        Thank you for shopping with KaintLook.
      </p>
    </div>
  );
}

const printBtnStyle = {
  background: accent, color: "#fff", border: "none", borderRadius: 6,
  padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20,
};