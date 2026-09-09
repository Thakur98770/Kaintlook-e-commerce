import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "../../api/shop";

const accent = "#2575FC";
const empty = { fullName: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "", isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = () => getAddresses().then(setAddresses);
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (a) => { setForm(a); setEditingId(a._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await updateAddress(editingId, form);
      else await addAddress(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    await deleteAddress(id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700 }}>Your Addresses</h1>
        <button onClick={openNew} style={primaryBtn}><Plus size={14} /> Add Address</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="kl-address-form" style={{ border: "1px solid #E7E5DF", borderRadius: 10, padding: 18, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <style>{`@media (max-width: 480px) { .kl-address-form { grid-template-columns: 1fr !important; } }`}</style>
          {["fullName", "line1", "line2", "city", "state", "pincode", "phone"].map((field) => (
            <input
              key={field}
              placeholder={field}
              value={form[field] || ""}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required={field !== "line2"}
              style={inputStyle}
            />
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default address
          </label>
          {error && <p style={{ color: "#B03434", fontSize: 12.5, gridColumn: "1 / -1" }}>{error}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <button type="submit" style={primaryBtn}>{editingId ? "Save Changes" : "Add Address"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#767676" }}>No saved addresses yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {addresses.map((a) => (
            <div key={a._id} style={{ border: "1px solid #E7E5DF", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{a.fullName}</strong>{a.isDefault && <span style={{ marginLeft: 8, fontSize: 10.5, color: accent, border: `1px solid ${accent}`, borderRadius: 4, padding: "1px 6px" }}>Default</span>}
                  <div style={{ color: "#555", marginTop: 4 }}>{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}</div>
                  <div style={{ color: "#767676", marginTop: 2 }}>{a.phone}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button onClick={() => openEdit(a)} style={iconBtn}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a._id)} style={{ ...iconBtn, color: "#B03434" }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { background: "none", border: "1px solid #E7E5DF", borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 4, color: "#555" };