import { apiRequest, apiUpload } from "./client";

// Products
export const adminGetProducts = () => apiRequest("/products?limit=100");
export const adminCreateProduct = (data) => apiRequest("/products", { method: "POST", body: JSON.stringify(data) });
export const adminUpdateProduct = (id, data) => apiRequest(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const adminDeleteProduct = (id) => apiRequest(`/products/${id}`, { method: "DELETE" });

// Product photo upload — takes a FileList/array of File objects (max 5),
// returns { urls: [...] } which go straight into a product's `images` field
export const uploadProductImages = (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("images", file));
  return apiUpload("/upload/products", formData);
};

// Categories
export const adminGetCategories = () => apiRequest("/categories");
export const adminCreateCategory = (data) => apiRequest("/categories", { method: "POST", body: JSON.stringify(data) });
export const adminUpdateCategory = (id, data) => apiRequest(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const adminDeleteCategory = (id) => apiRequest(`/categories/${id}`, { method: "DELETE" });

// Orders
export const adminGetOrders = (month = "") => apiRequest(`/orders${month ? `?month=${encodeURIComponent(month)}` : ""}`);
export const adminUpdateOrderStatus = (id, { status, note, courierName, trackingNumber } = {}) =>
  apiRequest(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, note, courierName, trackingNumber }) });
export const adminUpdateReturnStatus = (id, status) =>
  apiRequest(`/orders/${id}/return/status`, { method: "PUT", body: JSON.stringify({ status }) });

// Users
export const adminGetUsers = () => apiRequest("/users");
export const adminUpdateUserRole = (id, role) => apiRequest(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) });
export const adminDeleteUser = (id) => apiRequest(`/users/${id}`, { method: "DELETE" });

// Analytics
export const adminGetSummary = () => apiRequest("/analytics/summary");
export const adminGetSales = (days = 30) => apiRequest(`/analytics/sales?days=${days}`);
export const adminGetTopProducts = (limit = 5) => apiRequest(`/analytics/top-products?limit=${limit}`);
export const adminGetEmailNotifications = (page = 1) => apiRequest(`/notifications/emails?page=${page}`);
