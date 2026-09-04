// FILE PATH: kaintlook-auth/frontend/src/pages/ProductDetail.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { getProduct, getProductReviews, addProductReview, addToCart, addToWishlist, removeFromWishlist, getWishlist, searchProducts } from "../api/shop";
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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    let active = true;
    getProduct(id).then((p) => {
      if (!active) return;
      setProduct(p);
      setSelectedImage(0);
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

  const handleAddToCart = async () => {
    if (!user) return navigate("/login");
    setStatus("Adding…");
    try {
      await addToCart(product._id, quantity);
      setStatus("Added to cart");
    } catch (err) {
      setStatus(err.message);
    }
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
  const productImage = product.images?.[0];
  const productSchema = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: productDescription, image: product.images?.length ? product.images : undefined, category: product.category, sku: product.code || undefined, offers: { "@type": "Offer", url: `${siteUrl}/products/${product._id}`, priceCurrency: "INR", price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }, ...(product.rating > 0 && product.numReviews > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.numReviews } } : {}) };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <Seo title={`${product.name} | ${siteName}`} description={productDescription.slice(0, 155)} path={`/products/${product._id}`} image={productImage} type="product" jsonLd={productSchema} />
      <style>{`@media (max-width: 700px) { .kl-product-layout { grid-template-columns: 1fr !important; gap: 24px !important; } .kl-product-actions { flex-wrap: wrap; } }`}</style>
      <div className="kl-product-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        <div>
          <img
            src={product.images?.[selectedImage] || `https://picsum.photos/seed/${product._id}/600/600`}
            alt={product.name}
            decoding="async"
            style={{ width: "100%", borderRadius: 12, aspectRatio: "1/1", objectFit: "cover" }}
          />
          {product.images?.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Photo ${i + 1}`}
                  style={{
                    padding: 0,
                    width: 60,
                    height: 60,
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

          <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 20 }}>₹{product.price}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E7E5DF", borderRadius: 6 }}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={qtyBtnStyle}>−</button>
              <span style={{ padding: "0 16px", fontSize: 14 }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} style={qtyBtnStyle}>+</button>
            </div>
            <span style={{ fontSize: 12.5, color: product.stock > 0 ? "#2E7D5B" : "#B03434" }}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="kl-product-actions" style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAddToCart} disabled={product.stock === 0} style={addBtnStyle}>
              Add to Cart
            </button>
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

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: 50, borderTop: "1px solid #E7E5DF", paddingTop: 30 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>You might also like</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {related.map((r) => (
              <Link key={r._id} to={`/products/${r._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden" }}>
                  <img src={r.images?.[0] || `https://picsum.photos/seed/${r._id}/300/300`} alt={r.name} loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
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
const wishlistBtnStyle = { border: "1px solid #E7E5DF", background: "none", borderRadius: 6, padding: "0 16px", cursor: "pointer" };