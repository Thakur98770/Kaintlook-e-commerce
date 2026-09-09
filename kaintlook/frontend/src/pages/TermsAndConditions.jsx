import React from "react";
import { Link } from "react-router-dom";
import LegalPageLayout from "../components/LegalPageLayout";
import Seo from "../components/Seo";

export default function TermsAndConditions() {
  return (
    <LegalPageLayout title="Terms & Conditions" updatedAt="6 September 2026">
      <Seo title="Terms & Conditions | KaintLook" description="Terms and conditions for using the KaintLook website and placing orders." path="/terms" />

      <p>
        Welcome to KaintLook ("we", "us", "our"). These Terms & Conditions govern your use of the
        KaintLook website and your purchase of any products through it. By creating an account,
        browsing our catalogue, or placing an order, you agree to these terms.
      </p>

      <h2>1. About Us</h2>
      <p>
        KaintLook is an online store for handstitched fashion, operating out of Ludhiana, Punjab,
        India. For any questions about these terms, you can reach us at{" "}
        <a href="mailto:hello@kaintlook.com">hello@kaintlook.com</a>.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You must provide accurate information when creating an account and verifying it via the
        OTP sent to your email. You're responsible for keeping your password confidential and for
        all activity under your account. Let us know immediately if you suspect unauthorised access.
      </p>

      <h2>3. Products & Pricing</h2>
      <p>
        We try to display product details, images, and prices as accurately as possible. However,
        colours may vary slightly due to screen settings, and occasional errors in pricing or
        descriptions may occur — in such cases we'll contact you before processing the order, or
        cancel and refund it if already paid.
      </p>

      <h2>4. Orders & Payment</h2>
      <p>
        Placing an order is an offer to buy, which we accept once the order is confirmed. Currently
        we accept <strong>Cash on Delivery (COD)</strong>. We reserve the right to cancel any order
        due to stock unavailability, suspected fraud, or delivery-area restrictions — in which case
        any amount already paid will be refunded.
      </p>

      <h2>5. Shipping & Delivery</h2>
      <p>
        Delivery timelines shown at checkout are estimates and may vary due to courier delays,
        weather, or circumstances beyond our control. Please ensure your shipping address and phone
        number are accurate — we aren't responsible for delays or failed delivery caused by
        incorrect address details.
      </p>

      <h2>6. Returns, Refunds & Cancellations</h2>
      <p>
        Our return and refund process is covered separately in our{" "}
        <Link to="/refund-policy">Refund Policy</Link>, which forms part of these terms.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        All content on this website — including the KaintLook name, logo, product photography, and
        page design — belongs to KaintLook and may not be copied, reproduced, or reused without
        permission.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        We aren't liable for any indirect or consequential loss arising from the use of this
        website or delays outside our reasonable control. Nothing in these terms limits any
        liability that can't be excluded under Indian law.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continuing to use the website after changes
        are posted means you accept the updated terms.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These terms are governed by the laws of India, and any disputes will be subject to the
        jurisdiction of the courts in Ludhiana, Punjab.
      </p>

      <p style={{ marginTop: 28, fontSize: 12, color: "#9a9a9a" }}>
        This is a general template and not a substitute for legal advice — please have it reviewed
        by a professional before relying on it for your business.
      </p>
    </LegalPageLayout>
  );
}