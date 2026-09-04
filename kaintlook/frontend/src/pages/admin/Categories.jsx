// FILE PATH: kaintlook-auth/frontend/src/pages/admin/Categories.jsx
// Replace the existing file at this path with the contents below.

import React, { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { adminGetCategories, adminCreateCategory, adminDeleteCategory } from "../../api/admin";

const accent = "#2575FC";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [error, setError] = useState("");

  const load = () => adminGetCategories().then(setCategories);
  useEffect(() => { load(); }, []);

  const slugify = (s) => s.toLowerCase().trim().replace(/\s+/g, "-");

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await adminCreateCategory({ name, slug: slugify(name), parentCategory });
      setName("");
      setParentCategory("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    await adminDeleteCategory(id);
    load();
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Categories</h1>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 560, flexWrap: "wrap" }}>
        <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required style={{ flex: 1, padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 }} />
        <select value={parentCategory} onChange={(e) => setParentCategory(e.target.value)} style={{ padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 }}>
          <option value="">Top-level section</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Children">Children</option>
        </select>
        <button type="submit" style={primaryBtn}><Plus size={14} /> Add</button>
      </form>
      {error && <p style={{ color: "#B03434", fontSize: 12.5, marginBottom: 12 }}>{error}</p>}

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden" }}>
        {categories.map((c) => (
          <div key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #F0EEE8", fontSize: 13.5 }}>
            <span>{c.parentCategory && <strong style={{ color: accent }}>{c.parentCategory} / </strong>}{c.name} <span style={{ fontSize: 11, color: "#9C998F" }}>/{c.slug}</span></span>
            <button onClick={() => handleDelete(c._id)} style={{ background: "none", border: "none", color: "#B03434", cursor: "pointer" }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {categories.length === 0 && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>No categories yet.</p>}
      </div>
    </div>
  );
}

const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
