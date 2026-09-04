import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";

export default function NotFound() {
  const location = useLocation();
  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "80px 20px", textAlign: "center", fontFamily: "'Work Sans', sans-serif" }}>
      <Seo title="Page not found | KaintLook" description="The KaintLook page you requested could not be found." path={location.pathname} noindex />
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34 }}>Page not found</h1>
      <p style={{ color: "#767676", lineHeight: 1.6 }}>That page may have moved or no longer exists.</p>
      <Link to="/" style={{ color: "#2575FC", fontWeight: 600 }}>Return to KaintLook</Link>
    </main>
  );
}
