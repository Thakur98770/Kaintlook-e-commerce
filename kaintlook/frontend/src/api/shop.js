import { apiRequest } from "./client";

// Products
export const getProduct = (id) => apiRequest(`/products/${id}`);
export const getProductFilters = () => apiRequest("/products/filters");
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

// Cart — variantColorName/size are "" for a simple/legacy product with no variants.
export const getCart = () => apiRequest("/cart");
export const addToCart = (productId, quantity = 1, variantColorName = "", size = "") =>
  apiRequest("/cart", { method: "POST", body: JSON.stringify({ productId, quantity, variantColorName, size }) });
export const updateCartItem = (productId, quantity, variantColorName = "", size = "") => {
  const q = new URLSearchParams({ ...(variantColorName && { color: variantColorName }), ...(size && { size }) }).toString();
  return apiRequest(`/cart/${productId}${q ? `?${q}` : ""}`, { method: "PUT", body: JSON.stringify({ quantity }) });
};
export const removeFromCart = (productId, variantColorName = "", size = "") => {
  const q = new URLSearchParams({ ...(variantColorName && { color: variantColorName }), ...(size && { size }) }).toString();
  return apiRequest(`/cart/${productId}${q ? `?${q}` : ""}`, { method: "DELETE" });
};

// Back-in-stock notifications
export const subscribeStockNotification = (productId, colorName, size, email) =>
  apiRequest("/stock-notifications", { method: "POST", body: JSON.stringify({ productId, colorName, size, email }) });

// Addresses
export const getAddresses = () => apiRequest("/addresses");
export const addAddress = (address) => apiRequest("/addresses", { method: "POST", body: JSON.stringify(address) });
export const updateAddress = (id, address) =>
  apiRequest(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(address) });
export const deleteAddress = (id) => apiRequest(`/addresses/${id}`, { method: "DELETE" });

// Coupons
export const validateCoupon = (code, orderAmount) =>
  apiRequest("/coupons/validate", { method: "POST", body: JSON.stringify({ code, orderAmount }) });

// Orders — pass `buyNow` to purchase a single item directly without touching the cart.
export const placeOrder = (addressId, couponCode, buyNow = null) =>
  apiRequest("/orders", { method: "POST", body: JSON.stringify({ addressId, couponCode, paymentMethod: "cod", ...(buyNow && { buyNow }) }) });
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