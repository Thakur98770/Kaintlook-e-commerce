import React from "react";
import LegalPageLayout from "../components/LegalPageLayout";
import Seo from "../components/Seo";

export default function RefundPolicy() {
  return (
    <LegalPageLayout title="Refund & Return Policy" updatedAt="6 September 2026">
      <Seo title="Refund & Return Policy | KaintLook" description="KaintLook's return, replacement, and refund policy." path="/refund-policy" />

      <p>
        We want you to love what you order. If something isn't right, here's how returns,
        replacements, and refunds work at KaintLook.
      </p>

      <h2>1. Order Cancellation</h2>
      <p>
        You can cancel an order any time before it's shipped, from your{" "}
        <em>Account &rarr; Orders</em> page, or by contacting us. Once an order has shipped, it
        can no longer be cancelled — you can request a return instead once delivered.
      </p>

      <h2>2. Returns</h2>
      <p>
        We accept returns within <strong>7 days of delivery</strong> for items that are:
      </p>
      <ul>
        <li>Damaged or defective on arrival</li>
        <li>Materially different from what was ordered (wrong item, wrong size, etc.)</li>
      </ul>
      <p>
        To be eligible, the item must be unused, unwashed, and in its original packaging with tags
        intact. Handstitched and made-to-order pieces may have minor variations that are part of
        their handmade nature and aren't considered defects.
      </p>

      <h2>3. How to Request a Return</h2>
      <p>
        Go to <em>Account &rarr; Orders</em>, select the order, and choose "Request Return", or
        email us at <a href="mailto:hello@kaintlook.com">hello@kaintlook.com</a> with your order ID
        and photos of the issue. We'll review the request and arrange a pickup or return
        instructions.
      </p>

      <h2>4. Refunds</h2>
      <p>
        Once a returned item is received and inspected, we'll notify you of the approval status.
        Approved refunds are processed within <strong>5–7 business days</strong>:
      </p>
      <ul>
        <li>For orders paid via Cash on Delivery, refunds are sent to your bank account or UPI ID (details will be requested at the time of approval).</li>
        <li>For orders paid online (once available), refunds are credited back to the original payment method.</li>
      </ul>

      <h2>5. Non-Returnable Items</h2>
      <p>
        For hygiene reasons, certain items (if any are sold in future, such as innerwear or
        pierced jewellery) may be marked non-returnable on the product page.
      </p>

      <h2>6. Replacements</h2>
      <p>
        If you'd prefer a replacement instead of a refund for a damaged/wrong item, let us know
        when you raise the return request and we'll ship a replacement subject to availability.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        Questions about a return or refund? Reach us at{" "}
        <a href="mailto:hello@kaintlook.com">hello@kaintlook.com</a>.
      </p>

      <p style={{ marginTop: 28, fontSize: 12, color: "#9a9a9a" }}>
        This is a general template and not a substitute for legal advice — please have it reviewed
        by a professional before relying on it for your business.
      </p>
    </LegalPageLayout>
  );
}