import React from "react";
import LegalPageLayout from "../components/LegalPageLayout";
import Seo from "../components/Seo";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy" updatedAt="6 September 2026">
      <Seo title="Privacy Policy | KaintLook" description="How KaintLook collects, uses, and protects your personal information." path="/privacy-policy" />

      <p>
        This Privacy Policy explains what personal information KaintLook collects, how we use it,
        and the choices you have. By using our website, you agree to the collection and use of
        information as described here.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Account details: name, email address, and password (stored securely, never in plain text).</li>
        <li>Order details: shipping address, phone number, and items purchased.</li>
        <li>Usage data: pages visited and interactions with the site, used to improve the shopping experience.</li>
      </ul>
      <p>We do not collect or store your card/UPI details — payments (when enabled) are handled by our payment partner directly.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To send account-related emails: OTP verification, order confirmations, and shipping updates.</li>
        <li>To respond to support requests.</li>
        <li>To improve our website and product catalogue.</li>
      </ul>

      <h2>3. Sharing Your Information</h2>
      <p>
        We share your information only where necessary to fulfil your order — for example, with
        courier partners for delivery, and with our email service provider to send transactional
        emails. We do not sell your personal information to third parties.
      </p>

      <h2>4. Data Security</h2>
      <p>
        We use industry-standard measures — including password hashing and encrypted connections
        (HTTPS) — to protect your data. No method of transmission over the internet is 100% secure,
        but we work to protect your information to the best of our ability.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We may use cookies or similar technologies to keep you logged in and to understand how
        visitors use our site (for example, via analytics tools). You can disable cookies in your
        browser settings, though some features may not work correctly as a result.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You can review or update your account information any time from your account dashboard, or
        request that we delete your account and associated data by writing to{" "}
        <a href="mailto:hello@kaintlook.com">hello@kaintlook.com</a>.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>Our services are not directed at children under 18, and we don't knowingly collect data from them.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.</p>

      <h2>9. Contact Us</h2>
      <p>
        For any privacy-related questions, reach us at{" "}
        <a href="mailto:hello@kaintlook.com">hello@kaintlook.com</a>.
      </p>

      <p style={{ marginTop: 28, fontSize: 12, color: "#9a9a9a" }}>
        This is a general template and not a substitute for legal advice — please have it reviewed
        by a professional before relying on it for your business.
      </p>
    </LegalPageLayout>
  );
}