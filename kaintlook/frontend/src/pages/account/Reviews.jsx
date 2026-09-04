// FILE PATH: kaintlook-auth/frontend/src/pages/account/Reviews.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { getMyReviews, deleteMyReview, deleteAccountReview } from "../../api/shop";

const accent = "#2575FC";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => getMyReviews().then(setReviews).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (productId, reviewId) => {
    if (!confirm("Delete this review?")) return;
    if (productId) await deleteMyReview(productId, reviewId);
    else await deleteAccountReview(reviewId);
    load();
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Reviews</h1>

      {loading ? (
        <p style={{ fontSize: 13, color: "#9C998F" }}>Loading…</p>
      ) : reviews.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#767676" }}>You haven't reviewed anything yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <div key={r._id} style={{ border: "1px solid #E7E5DF", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Link to={`/products/${r.product?._id}`} style={{ fontSize: 13.5, fontWeight: 600, color: "#1B1B1B", textDecoration: "none" }}>
                    {r.product?.name || "Product no longer available"}
                  </Link>
                  <div style={{ fontSize: 12, color: accent, margin: "4px 0" }}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                  <p style={{ fontSize: 12.5, color: "#555" }}>{r.comment}</p>
                </div>
                <button onClick={() => handleDelete(r.product?._id, r._id)} style={{ background: "none", border: "none", color: "#B03434", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}