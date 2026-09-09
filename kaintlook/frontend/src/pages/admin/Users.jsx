import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminGetUsers, adminUpdateUserRole, adminDeleteUser } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  const load = () => adminGetUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    await adminUpdateUserRole(id, role);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await adminDeleteUser(id);
    load();
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Users</h1>

      <div style={{ background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10, overflow: "hidden", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#FAF9F6", fontSize: 11.5, color: "#767676" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u._id === currentUser?._id;
              return (
                <tr key={u._id} style={{ borderTop: "1px solid #F0EEE8" }}>
                  <td style={tdStyle}>{u.name} {isSelf && <span style={{ fontSize: 11, color: "#9C998F" }}>(you)</span>}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <select value={u.role} disabled={isSelf} onChange={(e) => changeRole(u._id, e.target.value)} style={selectStyle}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => handleDelete(u._id)} disabled={isSelf} style={{ background: "none", border: "none", color: isSelf ? "#ccc" : "#B03434", cursor: isSelf ? "not-allowed" : "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p style={{ padding: 20, fontSize: 13, color: "#9C998F" }}>No users yet.</p>}
      </div>
    </div>
  );
}

const thStyle = { padding: "10px 14px" };
const tdStyle = { padding: "10px 14px" };
const selectStyle = { border: "1px solid #E7E5DF", borderRadius: 6, padding: "5px 8px", fontSize: 12.5 };