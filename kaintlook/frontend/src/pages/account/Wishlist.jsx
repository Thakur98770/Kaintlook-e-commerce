import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { getWishlist, removeFromWishlist, addToCart } from "../../api/shop";

const accent = "#2575FC";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = () => getWishlist().then((w) => setProducts(w.products || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    await removeFromWishlist(id);
    load();
  };

  const handleAddToCart = async (id) => {
    setStatus("");
    try {
      await addToCart(id, 1);
      setStatus("Added to cart");
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Wishlist</h1>
      {status && <p style={{ fontSize: 12.5, color: "#767676", marginBottom: 10 }}>{status}</p>}

      {loading ? (
        <p style={{ fontSize: 13, color: "#9C998F" }}>Loading…</p>
      ) : products.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#767676" }}>
          Nothing saved yet — <Link to="/shop" style={{ color: accent }}>browse products</Link>.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {products.map((p) => (
            <div key={p._id} style={{ border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden" }}>
              <Link to={`/products/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <img src={p.images?.[0] || p.variants?.[0]?.images?.[0] || `https://picsum.photos/seed/${p._id}/300/300`} alt={p.name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
                <div style={{ padding: "8px 10px 0" }}>
                  <h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
                  <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>₹{p.price}</span>
                </div>
              </Link>
              <div style={{ display: "flex", gap: 6, padding: 10 }}>
                {Array.isArray(p.variants) && p.variants.length > 0 ? (
                  <Link to={`/products/${p._id}`} style={{ flex: 1, textAlign: "center", background: "#1B1B1B", color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 11.5, textDecoration: "none" }}>
                    Select Options
                  </Link>
                ) : (
                  <button onClick={() => handleAddToCart(p._id)} style={{ flex: 1, background: "#1B1B1B", color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 11.5, cursor: "pointer" }}>
                    Add to Cart
                  </button>
                )}
                <button onClick={() => handleRemove(p._id)} style={{ background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#B03434" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}