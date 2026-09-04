import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
const Shop = lazy(() => import("./pages/Shop"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Invoice = lazy(() => import("./pages/Invoice"));

const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountOrders = lazy(() => import("./pages/account/Orders"));
const AccountAddresses = lazy(() => import("./pages/account/Addresses"));
const AccountWishlist = lazy(() => import("./pages/account/Wishlist"));
const AccountReviews = lazy(() => import("./pages/account/Reviews"));
const AccountProfile = lazy(() => import("./pages/account/Profile"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: "100vh", padding: 40, color: "#767676" }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id/invoice"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />

          {/* Account dashboard - nested routes share the sidebar layout */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountOrders />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="reviews" element={<AccountReviews />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>

          {/* Admin dashboard - nested routes share the sidebar layout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}