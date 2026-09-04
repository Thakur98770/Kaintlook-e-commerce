const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const stored = localStorage.getItem("kaintlook_user");
  let token = null;
  try { token = stored ? JSON.parse(stored).token : null; } catch { localStorage.removeItem("kaintlook_user"); }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    error.data = data; // lets callers check extra fields, e.g. data.needsVerification
    throw error;
  }
  return data;
}

// For endpoints that take files (multipart/form-data) instead of JSON.
// Don't set Content-Type manually — the browser adds the correct
// multipart boundary itself when the body is a FormData instance.
export async function apiUpload(path, formData) {
  const stored = localStorage.getItem("kaintlook_user");
  let token = null;
  try { token = stored ? JSON.parse(stored).token : null; } catch { localStorage.removeItem("kaintlook_user"); }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Upload failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}
