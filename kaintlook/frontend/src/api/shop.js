import { apiRequest } from "./client";

// Products
export const getProduct = (id) => apiRequest(`/products/${id}`);
export const getProductReviews = (id) => apiRequest(`/products/${id}/reviews`);
export const addProductReview = (id, rating, comment) =>
  apiRequest(`/products/${id}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) });

// Search / browse
export const searchProducts = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return apiRequest(`/products?${query}`);
};
export const getProductSuggestions = (q) => apiRequest(`/products/suggest?q=${encodeURIComponent(q)}`);
export const getCategories = () => apiRequest("/categories");

// Cart
export const getCart = () => apiRequest("/cart");
export const addToCart = (productId, quantity = 1) =>
  apiRequest("/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) });
export const updateCartItem = (productId, quantity) =>
  apiRequest(`/cart/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) });
export const removeFromCart = (productId) => apiRequest(`/cart/${productId}`, { method: "DELETE" });

// Addresses
export const getAddresses = () => apiRequest("/addresses");
export const addAddress = (address) => apiRequest("/addresses", { method: "POST", body: JSON.stringify(address) });
export const updateAddress = (id, address) =>
  apiRequest(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(address) });
export const deleteAddress = (id) => apiRequest(`/addresses/${id}`, { method: "DELETE" });

// Coupons
export const validateCoupon = (code, orderAmount) =>
  apiRequest("/coupons/validate", { method: "POST", body: JSON.stringify({ code, orderAmount }) });

// Orders
export const placeOrder = (addressId, couponCode) =>
  apiRequest("/orders", { method: "POST", body: JSON.stringify({ addressId, couponCode, paymentMethod: "cod" }) });
export const getMyOrders = () => apiRequest("/orders/my");
export const getOrder = (id) => apiRequest(`/orders/${id}`);
export const cancelOrder = (id, reason) =>
  apiRequest(`/orders/${id}/cancel`, { method: "PUT", body: JSON.stringify({ reason }) });
export const requestReturn = (id, reason) =>
  apiRequest(`/orders/${id}/return`, { method: "POST", body: JSON.stringify({ reason }) });
// Wishlist
export const getWishlist = () => apiRequest("/wishlist");
export const addToWishlist = (productId) =>
  apiRequest("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
export const removeFromWishlist = (productId) => apiRequest(`/wishlist/${productId}`, { method: "DELETE" });

// Reviews
export const getMyReviews = () => apiRequest("/reviews");
export const deleteMyReview = (productId, reviewId) =>
  apiRequest(`/products/${productId}/reviews/${reviewId}`, { method: "DELETE" });
export const deleteAccountReview = (reviewId) => apiRequest(`/reviews/${reviewId}`, { method: "DELETE" });