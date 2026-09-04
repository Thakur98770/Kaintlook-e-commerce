import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Seo from "./Seo";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <><Seo title="Admin | KaintLook" description="Private KaintLook administration page." path="/admin" noindex />{children}</>;
}
