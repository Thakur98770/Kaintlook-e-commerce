import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordRequest, resetPasswordRequest } from "../api/auth";
import Seo from "../components/Seo";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // step 1 = enter email, step 2 = enter OTP + new password, step 3 = done
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return triggerShake("Enter a valid email address");

    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setStep(2);
    } catch (err) {
      triggerShake(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return triggerShake("Enter the 6-digit code");
    if (newPassword.length < 6) return triggerShake("Password must be at least 6 characters");

    setLoading(true);
    try {
      await resetPasswordRequest(email, otp, newPassword);
      setStep(3);
    } catch (err) {
      triggerShake(err.message);
    } finally {
      setLoading(false);
    }
  };

  const welcomeCopy = {
    1: { title: "Forgot your password?", text: "No worries — it happens. Enter your email and we'll send you a code to get back into your account." },
    2: { title: "Almost there!", text: "Enter the code we emailed you along with a new password to secure your account." },
    3: { title: "All set!", text: "Your password has been updated. You can now log in with your new password." },
  }[step];

  return (
    <div style={styles.page}>
      <Seo title="Reset password | KaintLook" description="Reset your KaintLook account password." path="/forgot-password" noindex />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Poppins', sans-serif; }

        .kl-blob { position: absolute; border-radius: 50%; animation: klFloat 9s ease-in-out infinite; }
        @keyframes klFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(14px, -18px) scale(1.05); }
          66% { transform: translate(-12px, 14px) scale(0.97); }
        }
        .kl-star { animation: klTwinkle 2.4s ease-in-out infinite; }
        @keyframes klTwinkle { 0%, 100% { opacity: .25; } 50% { opacity: .9; } }

        .kl-form-area { animation: klAuthRise .65s cubic-bezier(.22,1,.36,1) both; }
        .kl-form > * { animation: klFieldRise .42s cubic-bezier(.22,1,.36,1) both; }
        .kl-form > *:nth-child(2) { animation-delay: .04s; }
        .kl-form > *:nth-child(3) { animation-delay: .08s; }
        .kl-form > *:nth-child(4) { animation-delay: .12s; }
        @keyframes klAuthRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes klFieldRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .kl-shake { animation: klShake .4s ease; }
        @keyframes klShake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }

        .kl-mascot-idle { animation: klIdleFloat 3.2s ease-in-out infinite; }
        @keyframes klIdleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .kl-paw { transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s ease; }

        .kl-input-wrap { transition: border-color .2s ease, box-shadow .2s ease, transform .15s ease; }
        .kl-input-wrap:focus-within { border-color: #7B2FF7 !important; box-shadow: 0 0 0 3px rgba(123,47,247,.12); transform: translateY(-1px); }
        .kl-input { border: none; outline: none; font-size: 13.5px; width: 100%; background: transparent; }

        .kl-eye-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; opacity: .6; }
        .kl-eye-btn:hover { opacity: 1; }

        .kl-signin-btn { transition: transform .15s ease, box-shadow .15s ease; position: relative; overflow: hidden; }
        .kl-signin-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(123,47,247,.35); }
        .kl-signin-btn:active:not(:disabled) { transform: translateY(0px) scale(.98); }
        .kl-signin-btn:disabled { opacity: .75; cursor: default; }

        .kl-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: klSpin .7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
        @keyframes klSpin { to { transform: rotate(360deg); } }

        .kl-link { color: #7B2FF7; text-decoration: none; font-weight: 600; cursor: pointer; background: none; border: none; font-size: inherit; padding: 0; }
        .kl-link:hover { text-decoration: underline; }

        @media (max-width: 860px) { .kl-welcome-panel { display: none !important; } .kl-form-area { flex: 1 1 100% !important; padding: 32px 24px !important; } .kl-cloud-svg { width: 100% !important; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>

      {/* Floating decorative blobs */}
      <div className="kl-blob" style={{ width: 160, height: 160, background: "rgba(255,255,255,.08)", top: "6%", right: "8%" }} />
      <div className="kl-blob" style={{ width: 90, height: 90, background: "rgba(255,255,255,.10)", bottom: "18%", right: "20%", animationDelay: "1.2s" }} />
      <div className="kl-star" style={{ position: "absolute", top: "10%", right: "16%", width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
      <div className="kl-star" style={{ position: "absolute", top: "22%", right: "30%", width: 4, height: 4, borderRadius: "50%", background: "#fff", animationDelay: ".6s" }} />
      <div className="kl-star" style={{ position: "absolute", bottom: "12%", left: "6%", width: 5, height: 5, borderRadius: "50%", background: "#fff", animationDelay: "1.2s" }} />

      {/* White cloud-shaped card */}
      <svg className="kl-cloud-svg" style={styles.cloudSvg} viewBox="0 0 800 900" preserveAspectRatio="none">
        <path
          fill="#ffffff"
          d="M0,0 L800,0 L800,880
             C780,850 750,900 720,870
             C690,840 660,900 630,870
             C600,840 570,900 540,870
             C510,840 480,900 450,870
             C420,840 390,900 360,870
             C330,840 300,900 270,870
             C240,840 210,900 180,870
             C150,840 120,900 90,870
             C60,840 30,900 0,870 Z"
        />
      </svg>

      <div className="kl-form-area" style={styles.formArea}>
        <div key={step} style={styles.formInner}>
          {step === 1 && (
            <>
              <h1 style={styles.hello}>Forgot password?</h1>
              <p style={styles.subtitle}>Enter your account email</p>
              <Mascot passwordFocused={false} />

              <form onSubmit={handleEmailSubmit} style={styles.form} className={`kl-form ${shake ? "kl-shake" : ""}`}>
                <div className="kl-input-wrap" style={styles.inputWrap}>
                  <span style={styles.inputIcon}>✉️</span>
                  <input
                    className="kl-input"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <p style={styles.errorText}>{error}</p>}

                <button type="submit" disabled={loading} className="kl-signin-btn" style={styles.signInBtn}>
                  {loading && <span className="kl-spinner" />}
                  {loading ? "SENDING…" : "SEND OTP"}
                </button>

                <p style={styles.bottomText}>
                  Remembered it? <Link to="/login" className="kl-link">Log in</Link>
                </p>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={styles.hello}>Reset password</h1>
              <p style={styles.subtitle}>
                Code sent to <strong>{email}</strong>
              </p>
              <Mascot passwordFocused={passwordFocused} />

              <form onSubmit={handleResetSubmit} style={styles.form} className={`kl-form ${shake ? "kl-shake" : ""}`}>
                <div className="kl-input-wrap" style={{ ...styles.inputWrap, justifyContent: "center" }}>
                  <input
                    className="kl-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    style={{ textAlign: "center", letterSpacing: 6, fontSize: 18 }}
                  />
                </div>

                <div className="kl-input-wrap" style={styles.inputWrap}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    className="kl-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    minLength={6}
                  />
                  <button type="button" className="kl-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {error && <p style={styles.errorText}>{error}</p>}

                <button type="submit" disabled={loading || otp.length !== 6} className="kl-signin-btn" style={styles.signInBtn}>
                  {loading && <span className="kl-spinner" />}
                  {loading ? "RESETTING…" : "RESET PASSWORD"}
                </button>

                <p style={styles.bottomText}>
                  <button type="button" className="kl-link" onClick={() => setStep(1)}>Use a different email</button>
                </p>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={styles.hello}>Password reset!</h1>
              <p style={styles.subtitle}>You're all set</p>
              <Mascot passwordFocused={false} />

              <div style={styles.form}>
                <p style={{ fontSize: 13.5, color: "#555", textAlign: "center", margin: "0 0 6px" }}>
                  Your password has been updated. You can now log in with your new password.
                </p>
                <button onClick={() => navigate("/login")} className="kl-signin-btn" style={styles.signInBtn}>
                  GO TO LOGIN
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Welcome panel (desktop only) */}
      <div className="kl-welcome-panel" style={styles.welcomePanel}>
        <div key={step}>
          <h2 style={styles.welcomeTitle}>{welcomeCopy.title}</h2>
          <p style={styles.welcomeText}>{welcomeCopy.text}</p>
        </div>
      </div>
    </div>
  );
}

function Mascot({ passwordFocused }) {
  return (
    <div className="kl-mascot-idle" style={styles.panda}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="24" cy="18" r="12" fill="#1B1B1B" />
        <circle cx="66" cy="18" r="12" fill="#1B1B1B" />
        <circle cx="45" cy="45" r="34" fill="#ffffff" stroke="#1B1B1B" strokeWidth="2" />
        {!passwordFocused && (
          <>
            <circle cx="33" cy="42" r="6" fill="#1B1B1B" />
            <circle cx="57" cy="42" r="6" fill="#1B1B1B" />
          </>
        )}
        <ellipse cx="45" cy="56" rx="4" ry="3" fill="#1B1B1B" />
      </svg>
      <div
        className="kl-paw"
        style={{
          position: "absolute", left: 21, top: passwordFocused ? 34 : 78,
          opacity: passwordFocused ? 1 : 0, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", border: "2px solid #1B1B1B", transform: passwordFocused ? "scale(1)" : "scale(.6)",
        }}
      />
      <div
        className="kl-paw"
        style={{
          position: "absolute", right: 21, top: passwordFocused ? 34 : 78,
          opacity: passwordFocused ? 1 : 0, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", border: "2px solid #1B1B1B", transform: passwordFocused ? "scale(1)" : "scale(.6)",
        }}
      />
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(135deg, #7B2FF7 0%, #2575FC 100%)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
  },
  cloudSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "62%",
    height: "100%",
  },
  formArea: {
    position: "relative",
    zIndex: 2,
    flex: "0 0 62%",
    minWidth: 0,
    padding: "20px",
    textAlign: "center",
  },
  formInner: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
  },
  hello: { fontSize: 30, fontWeight: 700, color: "#1B1B1B", margin: 0 },
  subtitle: { fontSize: 13, color: "#767676", marginTop: 6, marginBottom: 20 },
  panda: { position: "relative", width: 90, height: 90, margin: "0 auto 24px" },
  form: { display: "flex", flexDirection: "column", gap: 14, textAlign: "left" },
  inputWrap: { display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #E7E5DF", borderRadius: 999, padding: "12px 18px" },
  inputIcon: { fontSize: 15 },
  errorText: { color: "#B03434", fontSize: 12.5, margin: 0 },
  signInBtn: {
    background: "linear-gradient(135deg, #7B2FF7 0%, #2575FC 100%)",
    color: "#fff", border: "none", borderRadius: 999, padding: "13px 0",
    fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", marginTop: 6,
  },
  bottomText: { fontSize: 12.5, color: "#767676", marginTop: 20, textAlign: "center" },
  welcomePanel: {
    position: "relative", zIndex: 2, flex: 1, minWidth: 0, textAlign: "center", padding: "0 40px", color: "#fff",
  },
  welcomeTitle: { fontSize: 26, fontWeight: 700, margin: 0 },
  welcomeText: { fontSize: 13.5, opacity: 0.9, marginTop: 12, lineHeight: 1.7, maxWidth: 320, marginLeft: "auto", marginRight: "auto" },
};
