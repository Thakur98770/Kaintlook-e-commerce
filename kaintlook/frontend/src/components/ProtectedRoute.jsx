import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Seo from "./Seo";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace />;

  return <><Seo title="Private account | KaintLook" description="Private KaintLook account page." path="/account" noindex />{children}</>;
}
