// FILE PATH: kaintlook-auth/frontend/src/pages/Shop.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { searchProducts, getCategories, addToWishlist, removeFromWishlist, getWishlist } from "../api/shop";
import { useAuth } from "../context/AuthContext";
import Seo, { siteName } from "../components/Seo";

const accent = "#2575FC";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [loadError, setLoadError] = useState("");

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const tag = searchParams.get("tag") || "";
  const sort = searchParams.get("sort") || "featured";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minRating = searchParams.get("minRating") || "";

  const [priceInputs, setPriceInputs] = useState({ minPrice, maxPrice });
  const [wishlistIds, setWishlistIds] = useState(() => new Set());

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    getWishlist()
      .then((w) => setWishlistIds(new Set((w.products || []).map((p) => p._id))))
      .catch(() => {});
  }, [user]);

  const handleToggleWishlist = async (productId) => {
    if (!user) return navigate("/login");
    const alreadySaved = wishlistIds.has(productId);
    try {
      if (alreadySaved) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        setStatus("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => new Set(prev).add(productId));
        setStatus("Added to wishlist");
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    searchProducts({ search: q, category, subcategory, tag, sort: sort === "featured" ? undefined : sort, minPrice, maxPrice, minRating, limit: 40 })
      .then((res) => {
        setProducts(res.products || []);
        setTotal(res.total || 0);
      })
      .catch((err) => setLoadError(err.message || "Products could not be loaded"))
      .finally(() => setLoading(false));
  }, [q, category, subcategory, tag, sort, minPrice, maxPrice, minRating]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    priceInputs.minPrice ? next.set("minPrice", priceInputs.minPrice) : next.delete("minPrice");
    priceInputs.maxPrice ? next.set("maxPrice", priceInputs.maxPrice) : next.delete("maxPrice");
    setSearchParams(next);
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "'Work Sans', sans-serif" }}>
      <Seo title={`${q ? `Search results for ${q}` : category || tag || "Shop all"} | ${siteName}`} description={`Browse ${q || category || tag || "KaintLook"} products and shop the current collection.`} path="/shop" noindex={Boolean(q || category || subcategory || tag || minPrice || maxPrice || minRating || sort !== "featured")} />
      <style>{`@media (min-width: 701px) and (max-width: 1000px) { .kl-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 12px !important; } } @media (max-width: 700px) { .kl-shop-layout { grid-template-columns: 1fr !important; gap: 20px !important; } .kl-shop-toolbar select { max-width: 100%; } .kl-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; } .kl-product-grid h3 { font-size: 12px !important; } .kl-product-grid > a > div > div:last-child { padding: 8px !important; } }`}</style>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {q ? `Results for "${q}"` : "Shop All"}
      </h1>
      <p style={{ fontSize: 12.5, color: "#767676", marginBottom: 24 }}>{total} products</p>

      <div className="kl-shop-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 30 }}>
        {/* Filters sidebar */}
        <aside>
          <div style={{ marginBottom: 26 }}>
            <h3 style={filterTitle}>Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={radioRow}>
                <input type="radio" name="cat" checked={!category} onChange={() => updateParam("category", "")} /> All
              </label>
              {categories.map((c) => (
                <label key={c._id} style={radioRow}>
                  <input type="radio" name="cat" checked={category === c.name} onChange={() => updateParam("category", c.name)} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <h3 style={filterTitle}>Price</h3>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                placeholder="Min"
                value={priceInputs.minPrice}
                onChange={(e) => setPriceInputs({ ...priceInputs, minPrice: e.target.value })}
                style={priceInputStyle}
              />
              <span style={{ color: "#9C998F" }}>–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceInputs.maxPrice}
                onChange={(e) => setPriceInputs({ ...priceInputs, maxPrice: e.target.value })}
                style={priceInputStyle}
              />
            </div>
            <button onClick={applyPriceFilter} style={applyBtnStyle}>Apply</button>
          </div>

          <div>
            <h3 style={filterTitle}>Customer Rating</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[4, 3, 2].map((r) => (
                <label key={r} style={radioRow}>
                  <input type="radio" name="rating" checked={minRating === String(r)} onChange={() => updateParam("minRating", String(r))} />
                  {r}★ & up
                </label>
              ))}
              <label style={radioRow}>
                <input type="radio" name="rating" checked={!minRating} onChange={() => updateParam("minRating", "")} /> Any
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="kl-shop-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            {status && <span style={{ fontSize: 12.5, color: "#767676" }}>{status}</span>}
            <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} style={{ ...sortSelectStyle, marginLeft: "auto" }}>
              <option value="featured">Sort: Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="az">Name: A–Z</option>
            </select>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: "#9C998F" }}>Loading…</p>
          ) : loadError ? (
            <p style={{ fontSize: 13, color: "#B03434" }}>{loadError}</p>
          ) : products.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9C998F" }}>No products match your filters.</p>
          ) : (
            <div className="kl-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 18 }}>
              {products.map((p) => (
                <Link key={p._id} to={`/products/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={p.images?.[0] || `https://picsum.photos/seed/${p._id}/300/300`}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
                      />
                      <button
                        onClick={(e) => { e.preventDefault(); handleToggleWishlist(p._id); }}
                        aria-label={wishlistIds.has(p._id) ? "Remove from wishlist" : "Add to wishlist"}
                        style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: "none", borderRadius: 999, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <Heart size={12} color={wishlistIds.has(p._id) ? "#E0475C" : "#999"} fill={wishlistIds.has(p._id) ? "#E0475C" : "none"} />
                      </button>
                    </div>
                    <div style={{ padding: "10px 12px 12px" }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                        <Star size={11} fill={accent} color={accent} />
                        <span style={{ fontSize: 11, color: "#767676" }}>{p.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>₹{p.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const filterTitle = { fontSize: 13, fontWeight: 700, marginBottom: 10 };
const radioRow = { display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" };
const priceInputStyle = { width: 60, padding: "6px 8px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 12.5 };
const applyBtnStyle = { marginTop: 8, background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" };
const sortSelectStyle = { border: "1px solid #E7E5DF", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 };
