// FILE PATH: kaintlook-auth/frontend/src/pages/ProductDetail.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { getProduct, getProductReviews, addProductReview, addToCart, addToWishlist, removeFromWishlist, getWishlist, searchProducts, subscribeStockNotification } from "../api/shop";
import { useAuth } from "../context/AuthContext";
import Seo, { siteName, siteUrl } from "../components/Seo";

const accent = "#2575FC";
const RECENT_KEY = "kaintlook_recently_viewed";

function trackRecentlyViewed(productId) {
  try {
    let ids = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    ids = ids.filter((id) => id !== productId);
    ids.unshift(productId);
    ids = ids.slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — recently viewed just won't persist, not critical
  }
}

// ---- variant helpers (mirrors backend/utils/variantHelpers.js) ----
const hasVariants = (product) => Array.isArray(product?.variants) && product.variants.length > 0;
const findVariant = (product, colorName) => (product?.variants || []).find((v) => v.colorName === colorName);
const findSizeRow = (variant, size) => (variant?.sizes || []).find((s) => s.size === size);
const stockStatusOf = (stock, threshold) => {
  if (stock <= 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
};
// First color that has at least one size in stock; falls back to the first
// color at all if every size of every color is currently out of stock.
const pickDefaultColor = (product) => {
  const variants = product?.variants || [];
  const withStock = variants.find((v) => v.sizes.some((s) => s.stock > 0));
  return (withStock || variants[0])?.colorName || "";
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState("");

  useEffect(() => {
    let active = true;
    getProduct(id).then((p) => {
      if (!active) return;
      setProduct(p);
      setSelectedImage(0);
      setQuantity(1);
      if (hasVariants(p)) {
        // Respect a variant preselected via URL (e.g. from a restock email link).
        const params = new URLSearchParams(window.location.search);
        const urlColor = params.get("color");
        const initialColor = (urlColor && findVariant(p, urlColor)) ? urlColor : pickDefaultColor(p);
        setSelectedColor(initialColor);
        const variant = findVariant(p, initialColor);
        const urlSize = params.get("size");
        const initialSize = (urlSize && findSizeRow(variant, urlSize)) ? urlSize : (variant?.sizes.find((s) => s.stock > 0) || variant?.sizes[0])?.size || "";
        setSelectedSize(initialSize);
      } else {
        setSelectedColor("");
        setSelectedSize("");
      }
      trackRecentlyViewed(p._id);
      // Related products: same category, excluding this one
      searchProducts({ category: p.category, limit: 8 }).then((res) => {
        if (!active) return;
        setRelated((res.products || []).filter((r) => r._id !== p._id).slice(0, 4));
      });
    }).catch(() => { if (active) setStatus("Product not found"); });
    getProductReviews(id).then((items) => { if (active) setReviews(items); }).catch(() => {});
    return () => { active = false; };
  }, [id]);

  // Check whether this product is already in the logged-in user's wishlist,
  // so the heart renders filled on load rather than only after clicking.
  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      return;
    }
    getWishlist()
      .then((w) => setIsWishlisted((w.products || []).some((p) => p._id === id)))
      .catch(() => {});
  }, [user, id]);

  // Prefill the Notify Me email once we know who's logged in.
  useEffect(() => {
    if (user?.email) setNotifyEmail(user.email);
  }, [user]);

  const variant = hasVariants(product) ? findVariant(product, selectedColor) : null;
  const sizeRow = hasVariants(product) ? findSizeRow(variant, selectedSize) : null;
  const threshold = product?.lowStockThreshold ?? 5;
  const stock = hasVariants(product) ? (sizeRow?.stock ?? 0) : (product?.stock ?? 0);
  const status_ = stockStatusOf(stock, threshold);
  const price = sizeRow?.price ?? product?.price;
  const images = useMemo(() => {
    if (hasVariants(product) && variant?.images?.length) return variant.images;
    return product?.images || [];
  }, [product, variant]);

  // Whenever the selected color changes, reset to its first image and land
  // on a size that's actually available for it (if any), without requiring a
  // page refresh — this is the "dynamic color image switching" requirement.
  const handleSelectColor = (colorName) => {
    setSelectedColor(colorName);
    setSelectedImage(0);
    const v = findVariant(product, colorName);
    const firstAvailable = v?.sizes.find((s) => s.stock > 0);
    setSelectedSize((firstAvailable || v?.sizes[0])?.size || "");
    setQuantity(1);
  };

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const canBuy = hasVariants(product) ? Boolean(selectedColor && selectedSize && stock > 0) : stock > 0;

  const handleAddToCart = async () => {
    if (!user) return navigate("/login");
    if (!canBuy) return;
    setStatus("Adding…");
    try {
      await addToCart(product._id, quantity, selectedColor, selectedSize);
      setStatus("Added to cart");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleBuyNow = () => {
    if (!user) return navigate("/login");
    if (!canBuy) return;
    navigate("/checkout", {
      state: {
        buyNow: {
          productId: product._id,
          variantColorName: selectedColor,
          colorCode: variant?.colorCode || "",
          size: selectedSize,
          quantity,
          product,
        },
      },
    });
  };

  const handleToggleWishlist = async () => {
    if (!user) return navigate("/login");
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
        setStatus("Removed from wishlist");
      } else {
        await addToWishlist(product._id);
        setIsWishlisted(true);
        setStatus("Added to wishlist");
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    setNotifyStatus("Saving…");
    try {
      const res = await subscribeStockNotification(product._id, selectedColor, selectedSize, notifyEmail);
      setNotifyStatus(res.message || "You'll be notified when it's back.");
    } catch (err) {
      setNotifyStatus(err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      const review = await addProductReview(id, Number(reviewForm.rating), reviewForm.comment);
      setReviews((prev) => [review, ...prev]);
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      setStatus(err.message);
    }
  };

  if (!product) return <div style={{ padding: 40, fontFamily: "'Work Sans', sans-serif" }}><Seo title="Product not found | KaintLook" description="The requested KaintLook product could not be found." path={`/products/${id}`} noindex />{status || "Loading…"}</div>;

  const productDescription = product.description || `${product.name} from the ${product.category} collection at ${siteName}.`;
  const productImage = images[0];
  const productSchema = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: productDescription, image: images.length ? images : undefined, category: product.category, sku: product.code || undefined, offers: { "@type": "Offer", url: `${siteUrl}/products/${product._id}`, priceCurrency: "INR", price, availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }, ...(product.rating > 0 && product.numReviews > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.numReviews } } : {}) };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <Seo title={`${product.name} | ${siteName}`} description={productDescription.slice(0, 155)} path={`/products/${product._id}`} image={productImage} type="product" jsonLd={productSchema} />
      <style>{`
        @media (max-width: 700px) { .kl-product-layout { grid-template-columns: 1fr !important; gap: 24px !important; } .kl-product-actions { flex-wrap: wrap; } }
        .kl-color-swatch { transition: transform .15s ease, box-shadow .15s ease; }
        .kl-color-swatch:hover { transform: scale(1.08); }
      `}</style>
      <div className="kl-product-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        <div>
          <img
            src={images[selectedImage] || `https://picsum.photos/seed/${product._id}/600/600`}
            alt={product.name}
            decoding="async"
            style={{ width: "100%", borderRadius: 12, aspectRatio: "1/1", objectFit: "cover" }}
          />
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Photo ${i + 1}`}
                  style={{
                    padding: 0,
                    width: 60,
                    height: 60,
                    flexShrink: 0,
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "none",
                    border: i === selectedImage ? `2px solid ${accent}` : "1px solid #E7E5DF",
                  }}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#767676" }}>{product.category}</span>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, margin: "6px 0 10px" }}>{product.name}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Star size={15} fill={accent} color={accent} />
            <span style={{ fontSize: 13 }}>{product.rating?.toFixed(1) || "0.0"} ({product.numReviews || 0} reviews)</span>
          </div>

          <p style={{ fontSize: 15, color: "#444", lineHeight: 1.6, marginBottom: 18 }}>{product.description}</p>

          <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 20 }}>₹{price}</div>

          {/* ---- Color selector ---- */}
          {hasVariants(product) && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>
                Color{selectedColor ? <span style={{ fontWeight: 400, color: "#767676" }}> — {selectedColor}</span> : ""}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {product.variants.map((v) => {
                  const totalStock = v.sizes.reduce((sum, s) => sum + s.stock, 0);
                  const isSelected = v.colorName === selectedColor;
                  return (
                    <button
                      key={v.colorName}
                      className="kl-color-swatch"
                      onClick={() => handleSelectColor(v.colorName)}
                      title={v.colorName}
                      aria-label={v.colorName}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: v.colorCode,
                        cursor: "pointer",
                        border: isSelected ? `3px solid ${accent}` : "2px solid #E7E5DF",
                        boxShadow: isSelected ? "0 0 0 2px #fff inset" : "none",
                        opacity: totalStock === 0 ? 0.4 : 1,
                        position: "relative",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Size selector ---- */}
          {hasVariants(product) && variant && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Size</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {variant.sizes.map((s) => {
                  const outOfStock = s.stock === 0;
                  const isSelected = s.size === selectedSize;
                  return (
                    <button
                      key={s.size}
                      className="kl-size-btn"
                      onClick={() => handleSelectSize(s.size)}
                      title={outOfStock ? `${s.size} — Out of stock` : s.size}
                      style={{
                        minWidth: 44,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: isSelected ? accent : "#fff",
                        color: outOfStock ? "#B8B4AA" : isSelected ? "#fff" : "#1B1B1B",
                        border: `1px solid ${isSelected ? accent : "#E7E5DF"}`,
                        textDecoration: outOfStock ? "line-through" : "none",
                      }}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Stock status ---- */}
          <div style={{ marginBottom: 18 }}>
            {status_ === "in_stock" && <span style={{ fontSize: 12.5, color: "#2E7D5B", fontWeight: 600 }}>✓ In Stock</span>}
            {status_ === "low_stock" && <span style={{ fontSize: 12.5, color: "#B8860B", fontWeight: 600 }}>⚠ Low Stock — {stock === 1 ? "Only 1 left" : `Only ${stock} left`}</span>}
            {status_ === "out_of_stock" && <span style={{ fontSize: 12.5, color: "#B03434", fontWeight: 600 }}>Out of Stock</span>}
          </div>

          {canBuy && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 6 }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={qtyBtnStyle}>−</button>
                <span style={{ padding: "0 16px", fontSize: 14 }}>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(stock, q + 1))} disabled={quantity >= stock} style={{ ...qtyBtnStyle, opacity: quantity >= stock ? 0.35 : 1 }}>+</button>
              </div>
            </div>
          )}

          <div className="kl-product-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canBuy ? (
              <>
                <button onClick={handleAddToCart} style={addBtnStyle}>Add to Cart</button>
                <button onClick={handleBuyNow} style={buyNowBtnStyle}>Buy Now</button>
              </>
            ) : (
              <button onClick={() => setNotifyOpen(true)} style={notifyBtnStyle}>Notify Me When Available</button>
            )}
            <button
              onClick={handleToggleWishlist}
              style={{ ...wishlistBtnStyle, borderColor: isWishlisted ? "#E0475C" : "#E7E5DF" }}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} color={isWishlisted ? "#E0475C" : "#1B1B1B"} fill={isWishlisted ? "#E0475C" : "none"} />
            </button>
          </div>
          {status && <p style={{ fontSize: 12.5, marginTop: 10, color: "#767676" }}>{status}</p>}
        </div>
      </div>

      {/* ---- Notify Me modal ---- */}
      {notifyOpen && (
        <div
          onClick={() => setNotifyOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 26, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Notify Me</h3>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
              This item is currently out of stock{selectedColor ? ` in ${selectedColor}${selectedSize ? ` / ${selectedSize}` : ""}` : ""}.
              Enter your email and we'll let you know when it's back.
            </p>
            <form onSubmit={handleNotifySubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                required
                placeholder="Email address"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                style={{ padding: 10, border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 }}
              />
              {notifyStatus && <p style={{ fontSize: 12.5, color: notifyStatus.includes("notif") || notifyStatus.includes("back") ? "#2E7D5B" : "#B03434" }}>{notifyStatus}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" style={{ ...addBtnStyle, flex: 1 }}>Notify Me</button>
                <button type="button" onClick={() => setNotifyOpen(false)} style={secondaryBtnStyle}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: 50, borderTop: "1px solid #E7E5DF", paddingTop: 30 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>You might also like</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {related.map((r) => (
              <Link key={r._id} to={`/products/${r._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden" }}>
                  <img src={r.images?.[0] || r.variants?.[0]?.images?.[0] || `https://picsum.photos/seed/${r._id}/300/300`} alt={r.name} loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
                  <div style={{ padding: "10px 12px" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.name}</h3>
                    <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>₹{r.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div style={{ marginTop: 50, borderTop: "1px solid #E7E5DF", paddingTop: 30 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Reviews</h2>

        <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26, maxWidth: 420 }}>
          <select
            value={reviewForm.rating}
            onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
            style={{ padding: 10, border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 }}
          >
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
          </select>
          <textarea
            placeholder="Share your thoughts…"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            rows={3}
            style={{ padding: 10, border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13, resize: "vertical" }}
          />
          <button type="submit" style={{ ...addBtnStyle, alignSelf: "flex-start", padding: "9px 20px" }}>Submit Review</button>
        </form>

        {reviews.length === 0 ? (
          <p style={{ color: "#767676", fontSize: 13.5 }}>No reviews yet — be the first.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map((r) => (
              <div key={r._id} style={{ borderBottom: "1px solid #F0EEE8", paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 13.5 }}>{r.name}</strong>
                  <span style={{ fontSize: 12, color: accent }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p style={{ fontSize: 13, color: "#555" }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const qtyBtnStyle = { width: 32, height: 32, border: "none", background: "none", fontSize: 16, cursor: "pointer" };
const addBtnStyle = { background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const buyNowBtnStyle = { background: "#1B1B1B", color: "#fff", border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const notifyBtnStyle = { background: "#fff", color: accent, border: `1.5px solid ${accent}`, borderRadius: 6, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const secondaryBtnStyle = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "12px 20px", fontSize: 13, cursor: "pointer" };
const wishlistBtnStyle = { border: "1px solid #E7E5DF", background: "none", borderRadius: 6, padding: "0 16px", cursor: "pointer" };
