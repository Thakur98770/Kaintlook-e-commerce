import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart, updateCartItem, removeFromCart } from "../api/shop";

const accent = "#2575FC";

// Same helper logic as the backend's variantHelpers.js — kept in sync so the
// cart never disagrees with the server about what's in stock.
const findVariant = (product, colorName) => (product?.variants || []).find((v) => v.colorName === colorName);
const findSizeRow = (variant, size) => (variant?.sizes || []).find((s) => s.size === size);
const availableStock = (item) => {
  const hasVariants = Array.isArray(item.product?.variants) && item.product.variants.length > 0;
  if (!hasVariants) return item.product?.stock ?? 0;
  const row = findSizeRow(findVariant(item.product, item.variantColorName), item.size);
  return row?.stock ?? 0;
};
const lineImage = (item) => {
  const variant = findVariant(item.product, item.variantColorName);
  return variant?.images?.[0] || item.product?.images?.[0] || `https://picsum.photos/seed/${item.product?._id}/120/120`;
};
const lineKey = (item) => `${item.product._id}::${item.variantColorName || ""}::${item.size || ""}`;

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => getCart().then(setCart).catch((err) => setError(err.message)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const changeQty = async (item, quantity) => {
    try { setCart(await updateCartItem(item.product._id, quantity, item.variantColorName, item.size)); }
    catch (err) { setError(err.message); }
  };

  const remove = async (item) => {
    try { setCart(await removeFromCart(item.product._id, item.variantColorName, item.size)); }
    catch (err) { setError(err.message); }
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
            {items.map((item) => {
              const stock = availableStock(item);
              const atMax = item.quantity >= stock;
              return (
                <div key={lineKey(item)} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", borderBottom: "1px solid #E7E5DF", paddingBottom: 16 }}>
                  <img
                    src={lineImage(item)}
                    alt={item.product.name}
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                  />
                  <div style={{ flex: "1 1 150px", minWidth: 140 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.product.name}</h3>
                  {(item.variantColorName || item.size) && (
                    <p style={{ fontSize: 12, color: "#767676", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                      {item.variantColorName && (
                        <>
                          <span style={{ display: "inline-block", width: 11, height: 11, borderRadius: "50%", background: findVariant(item.product, item.variantColorName)?.colorCode || "#ccc", border: "1px solid #E7E5DF" }} />
                          {item.variantColorName}
                        </>
                      )}
                      {item.variantColorName && item.size && " · "}
                      {item.size && `Size: ${item.size}`}
                    </p>
                  )}
                  <span style={{ fontSize: 13, color: "#000000", fontWeight: 600 }}>₹{item.product.price}</span>
                    {stock <= 5 && stock > 0 && <span style={{ display: "block", fontSize: 11.5, color: "#B8860B", marginTop: 2 }}>Only {stock} left</span>}
                    {stock === 0 && <span style={{ display: "block", fontSize: 11.5, color: "#B03434", marginTop: 2 }}>Out of stock</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 6 }}>
                      <button onClick={() => changeQty(item, item.quantity - 1)} style={qtyBtnStyle}>−</button>
                      <span style={{ padding: "0 14px", fontSize: 14 }}>{item.quantity}</span>
                      <button onClick={() => changeQty(item, item.quantity + 1)} disabled={atMax} style={{ ...qtyBtnStyle, opacity: atMax ? 0.35 : 1, cursor: atMax ? "not-allowed" : "pointer" }}>+</button>
                    </div>

                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 60, textAlign: "right" }}>
                      ₹{item.product.price * item.quantity}
                    </span>

                    <button onClick={() => remove(item)} style={removeBtnStyle}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", alignItems: "center" }}>
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