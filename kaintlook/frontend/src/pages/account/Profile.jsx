import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest, changePasswordRequest } from "../../api/auth";

const accent = "#2575FC";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [nameStatus, setNameStatus] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwStatus, setPwStatus] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setNameStatus("");
    setNameSaving(true);
    try {
      const updated = await updateProfileRequest(name);
      updateUser({ ...user, name: updated.name });
      setNameStatus("Saved");
    } catch (err) {
      setNameStatus(err.message);
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwStatus("");
    setPwSaving(true);
    try {
      await changePasswordRequest(pwForm.currentPassword, pwForm.newPassword);
      setPwStatus("Password updated");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwStatus(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Profile</h1>

      <section style={{ marginBottom: 30, maxWidth: 380 }}>
        <h2 style={sectionTitle}>Name</h2>
        <form onSubmit={handleNameSubmit} style={{ display: "flex", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" disabled={nameSaving} style={primaryBtn}>{nameSaving ? "Saving…" : "Save"}</button>
        </form>
        {nameStatus && <p style={{ fontSize: 12.5, marginTop: 6, color: nameStatus === "Saved" ? "#2E7D5B" : "#B03434" }}>{nameStatus}</p>}
      </section>

      <section style={{ maxWidth: 380 }}>
        <h2 style={sectionTitle}>Email</h2>
        <p style={{ fontSize: 13.5, color: "#767676", marginBottom: 20 }}>{user?.email} <span style={{ fontSize: 11.5 }}>(can't be changed)</span></p>

        <h2 style={sectionTitle}>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="password"
            placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="New password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            required
            minLength={6}
            style={inputStyle}
          />
          <p style={{ fontSize: 11.5, color: "#9a9a9a", margin: "-4px 0 0 2px" }}>Must be at least 6 characters</p>
          <button type="submit" disabled={pwSaving} style={{ ...primaryBtn, alignSelf: "flex-start" }}>
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
        </form>
        {pwStatus && <p style={{ fontSize: 12.5, marginTop: 6, color: pwStatus === "Password updated" ? "#2E7D5B" : "#B03434" }}>{pwStatus}</p>}
      </section>
    </div>
  );
}

const sectionTitle = { fontSize: 13.5, fontWeight: 700, marginBottom: 10 };
const inputStyle = { padding: "9px 12px", border: "1px solid #E7E5DF", borderRadius: 6, fontSize: 13 };
const primaryBtn = { background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" };