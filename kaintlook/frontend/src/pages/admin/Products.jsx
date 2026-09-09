import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { adminGetProducts, adminGetCategories, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, uploadProductImages } from "../../api/admin";

const accent = "#2575FC";
const MAX_PHOTOS = 5;
const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const empty = { name: "", category: "", subcategory: "", tag: "", price: "", stock: "", unit: "Pcs", description: "", images: [], lowStockThreshold: 5, variants: [] };
const primaryCategories = ["Men", "Women", "Children"];
const defaultSubcategories = {
  Men: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Footwear"],
  Women: ["Tops", "Dresses", "Kurtas", "Jeans", "Footwear"],
  Children: ["T-Shirts", "Dresses", "Jeans", "Sets", "Footwear"],
};

const newVariant = () => ({ colorName: "", colorCode: "#000000", images: [], sizes: [] });

const stockStatusOf = (stock, threshold) => {
  if (stock <= 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
};
const statusColor = { in_stock: "#2E7D5B", low_stock: "#B8860B", out_of_stock: "#B03434" };
const statusLabel = { in_stock: "In Stock", low_stock: "Low Stock", out_of_stock: "Out of Stock" };

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
    setForm({
      name: p.name, category: p.category, subcategory: p.subcategory || "", tag: p.tag || "",
      price: p.price, stock: p.stock, unit: p.unit, description: p.description || "", images: p.images || [],
      lowStockThreshold: p.lowStockThreshold ?? 5,
      variants: (p.variants || []).map((v) => ({ colorName: v.colorName, colorCode: v.colorCode, images: v.images || [], sizes: (v.sizes || []).map((s) => ({ ...s })) })),
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const remainingSlots = MAX_PHOTOS - form.images.length;
    if (remainingSlots <= 0) return setError(`Maximum ${MAX_PHOTOS} photos per product.`);
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
  const removeImage = (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, newVariant()] }));
  const removeVariant = (vi) => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== vi) }));
  const updateVariant = (vi, field, value) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === vi ? { ...v, [field]: value } : v)) }));

  const handleVariantFileSelect = async (vi, e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const remainingSlots = MAX_PHOTOS - form.variants[vi].images.length;
    if (remainingSlots <= 0) return setError(`Maximum ${MAX_PHOTOS} photos per color.`);
    setError("");
    setUploading(true);
    try {
      const { urls } = await uploadProductImages(files.slice(0, remainingSlots));
      updateVariant(vi, "images", [...form.variants[vi].images, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const removeVariantImage = (vi, url) => updateVariant(vi, "images", form.variants[vi].images.filter((u) => u !== url));

  const toggleStandardSize = (vi, size) => {
    const variant = form.variants[vi];
    const exists = variant.sizes.some((s) => s.size === size);
    const nextSizes = exists
      ? variant.sizes.filter((s) => s.size !== size)
      : [...variant.sizes, { size, stock: 0, sku: "", price: "" }];
    updateVariant(vi, "sizes", nextSizes);
  };

  const addCustomSize = (vi, sizeName) => {
    const trimmed = sizeName.trim();
    if (!trimmed) return;
    const variant = form.variants[vi];
    if (variant.sizes.some((s) => s.size.toLowerCase() === trimmed.toLowerCase())) return;
    updateVariant(vi, "sizes", [...variant.sizes, { size: trimmed, stock: 0, sku: "", price: "" }]);
  };

  const updateSizeField = (vi, size, field, value) => {
    const variant = form.variants[vi];
    updateVariant(vi, "sizes", variant.sizes.map((s) => (s.size === size ? { ...s, [field]: value } : s)));
  };

  const removeSize = (vi, size) => {
    const variant = form.variants[vi];
    updateVariant(vi, "sizes", variant.sizes.filter((s) => s.size !== size));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cleanedVariants = form.variants.map((v) => ({
        colorName: v.colorName.trim(),
        colorCode: v.colorCode,
        images: v.images,
        sizes: v.sizes.map((s) => ({
          size: s.size,
          stock: Number(s.stock) || 0,
          sku: s.sku || "",
          ...(s.price !== "" && s.price !== undefined && s.price !== null ? { price: Number(s.price) } : {}),
        })),
      }));
      const payload = {
        name: form.name, category: form.category, subcategory: form.subcategory, tag: form.tag,
        price: Number(form.price), stock: Number(form.stock), unit: form.unit, description: form.description,
        images: form.images, lowStockThreshold: Number(form.lowStockThreshold) || 5, variants: cleanedVariants,
      };
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
        <form onSubmit={handleSubmit} className="kl-admin-form" style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <style>{`
            @media (max-width: 560px) { .kl-admin-grid { grid-template-columns: 1fr !important; } }
            .kl-color-input { -webkit-appearance: none; appearance: none; width: 40px; height: 40px; border: 1px solid #E7E5DF; border-radius: 8px; padding: 0; cursor: pointer; background: none; }
            .kl-color-input::-webkit-color-swatch-wrapper { padding: 2px; }
            .kl-color-input::-webkit-color-swatch { border: none; border-radius: 6px; }
          `}</style>

          <div className="kl-admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            <input placeholder="Stock (used only if no color variants below)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required style={inputStyle} />
            <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={inputStyle}>
              <option value="">No label</option>
              <option value="New">New Arrival</option>
              <option value="Bestseller">Bestseller</option>
              <option value="Sale">Sale</option>
            </select>
            <input placeholder="Unit (Pcs, Pair…)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12.5, color: "#767676", whiteSpace: "nowrap" }}>Low stock at:</label>
              <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} style={{ ...inputStyle, width: 70 }} />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }} rows={2} />
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#767676", marginBottom: 8 }}>
              Main photos {form.variants.length > 0 && "(not shown — each color below has its own photos)"}
            </p>
            <label style={{ ...uploadLabelStyle, opacity: uploading || form.images.length >= MAX_PHOTOS ? 0.55 : 1, cursor: uploading || form.images.length >= MAX_PHOTOS ? "not-allowed" : "pointer" }}>
              <Upload size={14} />
              {uploading ? "Uploading…" : `Add Photos (${form.images.length}/${MAX_PHOTOS})`}
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} disabled={uploading || form.images.length >= MAX_PHOTOS} style={{ display: "none" }} />
            </label>
            {form.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {form.images.map((url) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #E7E5DF" }} />
                    <button type="button" onClick={() => removeImage(url)} aria-label="Remove photo" style={removeImgBtnStyle}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, borderTop: "1px solid #E7E5DF", paddingTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Product Variants (Color + Size)</h3>
              <button type="button" onClick={addVariant} style={secondaryBtn}><Plus size={13} /> Add Color</button>
            </div>

            {form.variants.length === 0 && (
              <p style={{ fontSize: 12.5, color: "#9C998F" }}>No color variants — this product will use the single Price/Stock above.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {form.variants.map((variant, vi) => (
                <VariantEditor
                  key={vi}
                  variant={variant}
                  onChangeColorName={(v) => updateVariant(vi, "colorName", v)}
                  onChangeColorCode={(v) => updateVariant(vi, "colorCode", v)}
                  onRemove={() => removeVariant(vi)}
                  onFileSelect={(e) => handleVariantFileSelect(vi, e)}
                  onRemoveImage={(url) => removeVariantImage(vi, url)}
                  onToggleStandardSize={(size) => toggleStandardSize(vi, size)}
                  onAddCustomSize={(size) => addCustomSize(vi, size)}
                  onUpdateSizeField={(size, field, value) => updateSizeField(vi, size, field, value)}
                  onRemoveSize={(size) => removeSize(vi, size)}
                  uploading={uploading}
                  threshold={Number(form.lowStockThreshold) || 5}
                />
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#B03434", fontSize: 12.5, marginTop: 14 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="submit" style={primaryBtn}>{editingId ? "Save Changes" : "Create Product"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={secondaryBtnPlain}>Cancel</button>
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
                    src={p.images?.[0] || p.variants?.[0]?.images?.[0] || `https://picsum.photos/seed/${p._id}/60/60`}
                    alt={p.name}
                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                  />
                </td>
                <td style={tdStyle}>{p.name}</td>
                <td style={tdStyle}>{p.category}</td>
                <td style={tdStyle}>₹{p.price}</td>
                <td style={{ ...tdStyle, minWidth: 160 }}>
                  {p.variants?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {p.variants.map((v) => {
                        const total = v.sizes.reduce((sum, s) => sum + s.stock, 0);
                        const st = stockStatusOf(total, p.lowStockThreshold ?? 5);
                        return (
                          <span key={v.colorName} style={{ fontSize: 11.5 }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: v.colorCode, marginRight: 4, border: "1px solid #E7E5DF" }} />
                            {v.colorName}: <strong style={{ color: statusColor[st] }}>{total}</strong>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ color: p.stock <= (p.lowStockThreshold ?? 5) ? "#B03434" : "#1B1B1B" }}>{p.stock}</span>
                  )}
                </td>
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

function VariantEditor({
  variant, onChangeColorName, onChangeColorCode, onRemove, onFileSelect, onRemoveImage,
  onToggleStandardSize, onAddCustomSize, onUpdateSizeField, onRemoveSize, uploading, threshold,
}) {
  const [customSize, setCustomSize] = useState("");
  const selectedSizeNames = new Set(variant.sizes.map((s) => s.size));

  return (
    <div style={{ border: "1px solid #E7E5DF", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <input type="color" className="kl-color-input" value={/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(variant.colorCode) ? variant.colorCode : "#000000"} onChange={(e) => onChangeColorCode(e.target.value)} />
        <input placeholder="Color name (e.g. Hot Pink)" value={variant.colorName} onChange={(e) => onChangeColorName(e.target.value)} required style={{ ...inputStyle, flex: "1 1 160px" }} />
        <input placeholder="#RRGGBB" value={variant.colorCode} onChange={(e) => onChangeColorCode(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        <button type="button" onClick={onRemove} style={{ ...iconBtn, color: "#B03434" }} aria-label="Remove color"><Trash2 size={15} /></button>
      </div>

      <label style={{ ...uploadLabelStyle, fontSize: 12.5, opacity: uploading || variant.images.length >= MAX_PHOTOS ? 0.55 : 1, cursor: uploading || variant.images.length >= MAX_PHOTOS ? "not-allowed" : "pointer" }}>
        <Upload size={13} />
        {`Add Photos for ${variant.colorName || "this color"} (${variant.images.length}/${MAX_PHOTOS})`}
        <input type="file" accept="image/*" multiple onChange={onFileSelect} disabled={uploading || variant.images.length >= MAX_PHOTOS} style={{ display: "none" }} />
      </label>
      {variant.images.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {variant.images.map((url) => (
            <div key={url} style={{ position: "relative" }}>
              <img src={url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #E7E5DF" }} />
              <button type="button" onClick={() => onRemoveImage(url)} aria-label="Remove photo" style={removeImgBtnStyle}>×</button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, fontWeight: 600, marginTop: 14, marginBottom: 8 }}>Available Sizes</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        {STANDARD_SIZES.map((size) => (
          <label key={size} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, cursor: "pointer" }}>
            <input type="checkbox" checked={selectedSizeNames.has(size)} onChange={() => onToggleStandardSize(size)} />
            {size}
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          placeholder="Custom size (e.g. 3XL, Free Size)"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          style={{ ...inputStyle, maxWidth: 220 }}
        />
        <button
          type="button"
          onClick={() => { onAddCustomSize(customSize); setCustomSize(""); }}
          style={secondaryBtn}
        >
          Add Size
        </button>
      </div>

      {variant.sizes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {variant.sizes.map((s) => {
            const st = stockStatusOf(Number(s.stock) || 0, threshold);
            return (
              <div key={s.size} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, width: 60 }}>{s.size}</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Stock"
                  value={s.stock}
                  onChange={(e) => onUpdateSizeField(s.size, "stock", e.target.value)}
                  style={{ ...inputStyle, width: 80 }}
                />
                <span style={{ fontSize: 11, color: statusColor[st], fontWeight: 600, minWidth: 80 }}>{statusLabel[st]}</span>
                <input
                  placeholder="SKU (optional)"
                  value={s.sku}
                  onChange={(e) => onUpdateSizeField(s.size, "sku", e.target.value)}
                  style={{ ...inputStyle, width: 110 }}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Price override"
                  value={s.price}
                  onChange={(e) => onUpdateSizeField(s.size, "price", e.target.value)}
                  style={{ ...inputStyle, width: 110 }}
                />
                <button type="button" onClick={() => onRemoveSize(s.size)} aria-label={`Remove size ${s.size}`} style={{ ...iconBtn, color: "#B03434" }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${accent}`, color: accent, borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const secondaryBtnPlain = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer" };
const thStyle = { padding: "10px 14px" };
const tdStyle = { padding: "10px 14px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 4, color: "#555" };
const uploadLabelStyle = { display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content", color: accent, fontWeight: 600, fontSize: 13, border: "1px solid #E7E5DF", borderRadius: 6, padding: "9px 12px" };
const removeImgBtnStyle = { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#B03434", color: "#fff", border: "2px solid #fff", fontSize: 12, lineHeight: "16px", cursor: "pointer", padding: 0 };