// FILE PATH: kaintlook-auth/frontend/src/pages/ForgotPassword.jsx
// Replace the existing file at this path with the contents below.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordRequest, resetPasswordRequest } from "../api/auth";
import Seo from "../components/Seo";

const accent = "#2575FC";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // step 1 = enter email, step 2 = enter OTP + new password, step 3 = done
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPasswordRequest(email, otp, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px", fontFamily: "'Work Sans', sans-serif" }}>
        <Seo title="Reset password | KaintLook" description="Reset your KaintLook account password." path="/forgot-password" noindex />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          Password reset
        </h1>
        <p style={{ color: "#767676", fontSize: 13.5, marginBottom: 24 }}>
          Your password has been updated. You can now log in with your new password.
        </p>
        <button onClick={() => navigate("/login")} style={buttonStyle}>
          Go to Login
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px", fontFamily: "'Work Sans', sans-serif" }}>
        <Seo title="Reset password | KaintLook" description="Reset your KaintLook account password." path="/forgot-password" noindex />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          Enter OTP & new password
        </h1>
        <p style={{ color: "#767676", fontSize: 13.5, marginBottom: 24 }}>
          If <strong>{email}</strong> is registered, we've sent a 6-digit code to it.
        </p>

        <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            style={{ ...inputStyle, textAlign: "center", letterSpacing: 6, fontSize: 18 }}
          />
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />
          {error && <p style={{ color: "#B03434", fontSize: 12.5 }}>{error}</p>}
          <button type="submit" disabled={loading || otp.length !== 6} style={buttonStyle}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#767676", marginTop: 20, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{ background: "none", border: "none", color: accent, fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Use a different email
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px", fontFamily: "'Work Sans', sans-serif" }}>
      <Seo title="Reset password | KaintLook" description="Reset your KaintLook account password." path="/forgot-password" noindex />
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        Forgot your password?
      </h1>
      <p style={{ color: "#767676", fontSize: 13.5, marginBottom: 24 }}>
        Enter your account email and we'll send you a code to reset it.
      </p>

      <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: "#B03434", fontSize: 12.5 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#767676", marginTop: 20, textAlign: "center" }}>
        Remembered it? <Link to="/login" style={{ color: accent, fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}

const inputStyle = {
  padding: "11px 14px",
  border: "1px solid #E7E5DF",
  borderRadius: 6,
  fontSize: 13.5,
  outline: "none",
};

const buttonStyle = {
  background: "linear-gradient(135deg, #7B2FF7 0%, #2575FC 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "11px 0",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
