import React, { useEffect, useState } from "react";
import { adminGetEmailNotifications } from "../../api/admin";

export default function Notifications() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { adminGetEmailNotifications().then((data) => setLogs(data.notifications || [])).catch((err) => setError(err.message)); }, []);
  return <div><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, marginBottom: 20 }}>Email Logs</h1>{error && <p style={{ color: "#B03434" }}>{error}</p>}<div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E7E5DF", borderRadius: 10 }}><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ textAlign: "left", background: "#FAF9F6", color: "#767676" }}>{["Customer", "Email", "Event", "Status", "Sent", "Retries"].map((label) => <th key={label} style={{ padding: 12 }}>{label}</th>)}</tr></thead><tbody>{logs.map((log) => <tr key={log._id} style={{ borderTop: "1px solid #F0EEE8" }}><td style={{ padding: 12 }}>{log.user?.name || "-"}</td><td style={{ padding: 12 }}>{log.recipientEmail}</td><td style={{ padding: 12 }}>{log.eventType}</td><td style={{ padding: 12, color: log.status === "sent" ? "#2E7D5B" : "#B03434" }}>{log.status}</td><td style={{ padding: 12 }}>{log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}</td><td style={{ padding: 12 }}>{log.retryCount}</td></tr>)}</tbody></table>{!logs.length && <p style={{ padding: 20, color: "#9C998F" }}>No email events yet.</p>}</div></div>;
}