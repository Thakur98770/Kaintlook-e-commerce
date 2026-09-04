// FILE PATH: kaintlook-auth/frontend/src/pages/Cart.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart, updateCartItem, removeFromCart } from "../api/shop";

const accent = "#2575FC";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => getCart().then(setCart).catch((err) => setError(err.message)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const changeQty = async (productId, quantity) => {
    try { setCart(await updateCartItem(productId, quantity)); } catch (err) { setError(err.message); }
  };

  const remove = async (productId) => {
    try { setCart(await removeFromCart(productId)); } catch (err) { setError(err.message); }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (error) return <div style={{ padding: 40, color: "#B03434" }}>{error}</div>;

  const items = (cart?.items || []).filter((item) => item.product);
  const subtotal = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Your Cart</h1>

      {items.length === 0 ? (
        <p style={{ color: "#767676", fontSize: 14 }}>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((item) => (
              <div key={item.product._id} style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid #E7E5DF", paddingBottom: 16 }}>
                <img
                  src={item.product.images?.[0] || `https://picsum.photos/seed/${item.product._id}/120/120`}
                  alt={item.product.name}
                  style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 8 }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.product.name}</h3>
                  <span style={{ fontSize: 13, color: accent, fontWeight: 600 }}>₹{item.product.price}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 6 }}>
                  <button onClick={() => changeQty(item.product._id, item.quantity - 1)} style={qtyBtnStyle}>−</button>
                  <span style={{ padding: "0 14px", fontSize: 14 }}>{item.quantity}</span>
                  <button onClick={() => changeQty(item.product._id, item.quantity + 1)} style={qtyBtnStyle}>+</button>
                </div>

                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                  ₹{item.product.price * item.quantity}
                </span>

                <button onClick={() => remove(item.product._id)} style={removeBtnStyle}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Subtotal: ₹{subtotal}</span>
            <button onClick={() => navigate("/checkout")} style={checkoutBtnStyle}>Proceed to Checkout</button>
          </div>
        </>
      )}

      <Link to="/" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: accent }}>← Continue shopping</Link>
    </div>
  );
}

const qtyBtnStyle = { width: 30, height: 30, border: "none", background: "none", fontSize: 15, cursor: "pointer" };
const removeBtnStyle = { border: "none", background: "none", color: "#B03434", fontSize: 12.5, cursor: "pointer" };
const checkoutBtnStyle = { background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "12px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
