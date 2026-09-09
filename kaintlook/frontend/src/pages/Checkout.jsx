import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCart, getAddresses, addAddress, validateCoupon, placeOrder } from "../api/shop";

const accent = "#2575FC";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNow = location.state?.buyNow || null;

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ fullName: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", phone: "", addressType: "home" });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Buy Now bypasses the cart entirely — nothing to fetch, we already have
    // everything we need from the product page via router state.
    if (!buyNow) {
      getCart().then(setCart).catch((err) => setError(err.message));
    }
    getAddresses().then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) setSelectedAddress(def._id);
    }).catch((err) => setError(err.message));
  }, [buyNow]);

  // Normalise both checkout paths (cart vs. buy-now) into the same shape for
  // display: [{ key, name, image, price, quantity, variantColorName, colorCode, size }]
  const items = buyNow
    ? [{
        key: "buy-now",
        name: buyNow.product.name,
        image: (buyNow.variantColorName && buyNow.product.variants?.find((v) => v.colorName === buyNow.variantColorName)?.images?.[0]) || buyNow.product.images?.[0],
        price: buyNow.product.variants?.find((v) => v.colorName === buyNow.variantColorName)?.sizes?.find((s) => s.size === buyNow.size)?.price ?? buyNow.product.price,
        quantity: buyNow.quantity,
        variantColorName: buyNow.variantColorName,
        colorCode: buyNow.colorCode,
        size: buyNow.size,
      }]
    : (cart?.items || []).filter((i) => i.product).map((i) => ({
        key: `${i.product._id}::${i.variantColorName || ""}::${i.size || ""}`,
        name: i.product.name,
        image: (i.variantColorName && i.product.variants?.find((v) => v.colorName === i.variantColorName)?.images?.[0]) || i.product.images?.[0],
        price: i.product.price,
        quantity: i.quantity,
        variantColorName: i.variantColorName,
        colorCode: i.product.variants?.find((v) => v.colorName === i.variantColorName)?.colorCode || "",
        size: i.size,
      }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryCharge = subtotal - discount >= 1999 ? 0 : 99;
  const total = subtotal - discount + deliveryCharge;

  const handleApplyCoupon = async () => {
    setCouponMsg("");
    try {
      const res = await validateCoupon(couponCode, subtotal);
      setDiscount(res.discount);
      setCouponMsg(`Coupon applied: -₹${res.discount.toFixed(0)}`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err.message);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const saved = await addAddress(newAddress);
      setAddresses((prev) => [saved, ...prev]);
      setSelectedAddress(saved._id);
      setShowNewAddress(false);
    } catch (err) { setError(err.message); }
  };

  const handlePlaceOrder = async () => {
    setError("");
    const address = addresses.find((a) => a._id === selectedAddress);
    if (!address) return setError("Please select or add a shipping address.");

    setPlacing(true);
    try {
      const order = await placeOrder(
        address._id,
        couponCode ? couponCode : undefined,
        buyNow ? { productId: buyNow.productId, variantColorName: buyNow.variantColorName, size: buyNow.size, quantity: buyNow.quantity } : null
      );
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Checkout</h1>

      {/* Order items */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={sectionTitle}>Order Summary</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((i) => (
            <div key={i.key} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 8, padding: 12 }}>
              <img src={i.image || "https://picsum.photos/seed/order/80/80"} alt={i.name} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: "1 1 150px", minWidth: 120 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{i.name}</div>
                {(i.variantColorName || i.size) && (
                  <div style={{ fontSize: 12, color: "#767676", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    {i.variantColorName && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: i.colorCode || "#ccc", border: "1px solid #E7E5DF" }} />}
                    {[i.variantColorName, i.size && `Size: ${i.size}`].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#767676" }}>Qty: {i.quantity}</div>
              <div style={{ fontSize: 14, fontWeight: 600, minWidth: 70, textAlign: "right" }}>₹{i.price * i.quantity}</div>
            </div>
          ))}
          {items.length === 0 && <p style={{ fontSize: 13, color: "#767676" }}>Your cart is empty.</p>}
        </div>
      </section>

      {/* Address */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={sectionTitle}>Shipping Address</h2>
        {addresses.map((a) => (
          <label key={a._id} style={addressCard(selectedAddress === a._id)}>
            <input type="radio" name="address" checked={selectedAddress === a._id} onChange={() => setSelectedAddress(a._id)} />
            <div style={{ marginLeft: 10, fontSize: 13 }}>
              <strong>{a.fullName}</strong> — {a.line1}, {a.city}, {a.state} {a.pincode} · {a.phone}
            </div>
          </label>
        ))}

        {!showNewAddress ? (
          <button onClick={() => setShowNewAddress(true)} style={linkBtnStyle}>+ Add new address</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, maxWidth: 400 }}>
            {["fullName", "line1", "line2", "landmark", "city", "state", "pincode", "phone"].map((field) => (
              <input
                key={field}
                placeholder={field}
                value={newAddress[field]}
                onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                style={inputStyle}
              />
            ))}
            <button onClick={handleSaveAddress} style={{ ...addBtnStyle, alignSelf: "flex-start" }}>Save Address</button>
          </div>
        )}
      </section>

      {/* Coupon */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={sectionTitle}>Coupon</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={handleApplyCoupon} style={linkBtnStyle}>Apply</button>
        </div>
        {couponMsg && <p style={{ fontSize: 12.5, marginTop: 6, color: discount ? "#2E7D5B" : "#B03434" }}>{couponMsg}</p>}
      </section>

      {/* Payment method */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={sectionTitle}>Payment Method</h2>
        <label style={paymentCard(true)}>
          <input type="radio" name="payment" checked readOnly />
          <div style={{ marginLeft: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Cash on Delivery</div>
            <div style={{ fontSize: 11.5, color: "#767676" }}>Pay when your order arrives</div>
          </div>
        </label>
      </section>

      {/* Summary */}
      <section style={{ borderTop: "1px solid #E7E5DF", paddingTop: 20 }}>
        <div style={rowStyle}><span>Subtotal</span><span>₹{subtotal}</span></div>
        {discount > 0 && <div style={rowStyle}><span>Discount</span><span>−₹{discount.toFixed(0)}</span></div>}
        <div style={rowStyle}><span>Delivery</span><span>{deliveryCharge ? `₹${deliveryCharge}` : "Free"}</span></div>
        <div style={{ ...rowStyle, fontWeight: 700, fontSize: 16 }}><span>Total</span><span>₹{total.toFixed(0)}</span></div>

        {error && <p style={{ color: "#B03434", fontSize: 12.5, marginTop: 8 }}>{error}</p>}

        <button onClick={handlePlaceOrder} disabled={placing || items.length === 0} style={{ ...addBtnStyle, width: "100%", marginTop: 16 }}>
          {placing ? "Processing…" : "Place Order"}
        </button>
      </section>
    </div>
  );
}

const sectionTitle = { fontSize: 15, fontWeight: 700, marginBottom: 12 };
const addressCard = (active) => ({
  display: "flex", alignItems: "center", border: `1px solid ${active ? accent : "#E7E5DF"}`,
  borderRadius: 8, padding: "10px 14px", marginBottom: 8, cursor: "pointer",
});
const paymentCard = (active) => ({
  display: "flex", alignItems: "center", border: `1px solid ${active ? accent : "#E7E5DF"}`,
  borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
});
const inputStyle = { padding: "10px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 };
const addBtnStyle = { background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const linkBtnStyle = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer" };
const rowStyle = { display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0" };