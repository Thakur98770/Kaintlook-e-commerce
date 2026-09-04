// FILE PATH: kaintlook-auth/frontend/src/pages/admin/Products.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
import { adminGetProducts, adminGetCategories, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, uploadProductImages } from "../../api/admin";

const accent = "#2575FC";
const MAX_PHOTOS = 5;
const empty = { name: "", category: "", subcategory: "", tag: "", price: "", stock: "", unit: "Pcs", description: "", images: [] };
const primaryCategories = ["Men", "Women", "Children"];
const defaultSubcategories = {
  Men: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Footwear"],
  Women: ["Tops", "Dresses", "Kurtas", "Jeans", "Footwear"],
  Children: ["T-Shirts", "Dresses", "Jeans", "Sets", "Footwear"],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  const load = () => adminGetProducts().then((res) => setProducts(res.products || res));

  useEffect(() => {
    load();
    adminGetCategories().then(setCategories).catch(() => {});
  }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, subcategory: p.subcategory || "", tag: p.tag || "", price: p.price, stock: p.stock, unit: p.unit, description: p.description || "", images: p.images || [] });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be picked again later if removed
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - form.images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos per product.`);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const { urls } = await uploadProductImages(files.slice(0, remainingSlots));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { name: form.name, category: form.category, subcategory: form.subcategory, tag: form.tag, price: Number(form.price), stock: Number(form.stock), unit: form.unit, description: form.description, images: form.images };
      if (editingId) await adminUpdateProduct(editingId, payload);
      else await adminCreateProduct(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await adminDeleteProduct(id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700 }}>Products</h1>
        <button onClick={openNew} style={primaryBtn}><Plus size={14} /> Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
          {categories.length > 0 ? (
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={inputStyle}>
              <option value="">Select category</option>
              {[...new Set([...primaryCategories, ...categories.filter((category) => !category.parentCategory).map((category) => category.name)])].map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          ) : (
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={inputStyle} />
          )}
          <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} style={inputStyle}>
            <option value="">Select subcategory (optional)</option>
            {[...new Set([
              ...(defaultSubcategories[form.category] || []),
              ...categories.filter((category) => category.parentCategory === form.category).map((category) => category.name),
            ])].map((category) => <option key={`sub-${category}`} value={category}>{category}</option>)}
          </select>
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required style={inputStyle} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required style={inputStyle} />
          <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={inputStyle}>
            <option value="">No label</option>
            <option value="New">New Arrival</option>
            <option value="Bestseller">Bestseller</option>
            <option value="Sale">Sale</option>
          </select>
          <input placeholder="Unit (Pcs, Pair…)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }} rows={2} />

          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                ...inputStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: "fit-content",
                cursor: uploading || form.images.length >= MAX_PHOTOS ? "not-allowed" : "pointer",
                opacity: uploading || form.images.length >= MAX_PHOTOS ? 0.55 : 1,
                color: accent,
                fontWeight: 600,
              }}
            >
              <Upload size={14} />
              {uploading ? "Uploading…" : `Add Photos (${form.images.length}/${MAX_PHOTOS})`}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || form.images.length >= MAX_PHOTOS}
                style={{ display: "none" }}
              />
            </label>

            {form.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {form.images.map((url) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #E7E5DF" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      aria-label="Remove photo"
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#B03434", color: "#fff", border: "2px solid #fff", fontSize: 12, lineHeight: "16px", cursor: "pointer", padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p style={{ color: "#B03434", fontSize: 12.5, gridColumn: "1 / -1" }}>{error}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <button type="submit" style={primaryBtn}>{editingId ? "Save Changes" : "Create Product"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#FAF9F6", fontSize: 11.5, color: "#767676" }}>
              <th style={thStyle}>Photo</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Stock</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} style={{ borderTop: "1px solid #F0EEE8" }}>
                <td style={tdStyle}>
                  <img
                    src={p.images?.[0] || `https://picsum.photos/seed/${p._id}/60/60`}
                    alt={p.name}
                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                  />
                </td>
                <td style={tdStyle}>{p.name}</td>
                <td style={tdStyle}>{p.category}</td>
                <td style={tdStyle}>₹{p.price}</td>
                <td style={{ ...tdStyle, color: p.stock <= 5 ? "#B03434" : "#1B1B1B" }}>{p.stock}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <button onClick={() => openEdit(p)} style={iconBtn}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p._id)} style={{ ...iconBtn, color: "#B03434" }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>No products yet.</p>}
      </div>
    </div>
  );
}

const inputStyle = { padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer" };
const thStyle = { padding: "10px 14px" };
const tdStyle = { padding: "10px 14px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 4, color: "#555" };