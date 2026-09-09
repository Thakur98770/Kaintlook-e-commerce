// KaintLook — branded transactional email templates.
// All emails are sent via Brevo's HTTP API (see sendEmail.js) from the backend only.
//
// LOGO: if LOGO_URL is set (a public https:// image), it's used as an <img>.
// Otherwise we render a text-based "Kaint/Look" wordmark that matches the site's
// look — this avoids depending on a local file path (./logo.png, /src/assets/...),
// which Gmail/Outlook recipients can never load since it isn't reachable over the
// public internet. Once you host a real logo file at a public HTTPS URL, set
// LOGO_URL and it will automatically switch to the image.
//
// NOTE: this HTML logo only affects the inside of the email body. It does NOT
// change the small sender avatar Gmail shows next to your name in the inbox
// list — that's a separate thing (BIMI + a verified brand logo with Brevo/Google),
// see the domain-authentication notes shared alongside this file.

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const appUrl = process.env.APP_URL || process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";
const brand = process.env.EMAIL_FROM_NAME || "KaintLook";
const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || "";
const logoUrl = process.env.LOGO_URL || "";

const money = (value) => `\u20b9${Number(value || 0).toFixed(2)}`;

const orderCode = (order) => order._id.toString().slice(-8).toUpperCase();
const orderUrl = (order) => `${appUrl}/orders/${order._id}`;

const PAYMENT_LABELS = { cod: "Cash on Delivery" };
const paymentLabel = (method) => PAYMENT_LABELS[method] || (method ? method.toUpperCase() : "\u2014");

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const statusLabel = (status) => STATUS_LABELS[status] || String(status || "").replace(/_/g, " ");

// ---- shared building blocks -------------------------------------------------

// Header is a plain white bar (see layout() below) with a thin gradient accent
// underneath — so a logo image with dark/gradient text (like the default
// KaintLook wordmark) reads clearly, instead of sitting on a busy gradient.
const logoBlock = logoUrl
  ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand)}" height="32" style="height:32px;display:block;border:0;outline:0;" />`
  : `<span style="font-size:24px;font-weight:800;letter-spacing:0.2px;color:#111827;">Kaint<span style="color:#6a3df0;">Look</span></span>`;

// Base HTML shell every email uses. Table-based layout + a small <style> block
// for responsiveness — degrades gracefully in clients that strip <style>.
const layout = (preheader, title, bodyHtml) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(brand)}</title>
<style>
  body,table,td { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .content-pad { padding: 24px 20px !important; }
    .otp-box { font-size: 28px !important; letter-spacing: 6px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f3f4f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,0.08);">
          <tr>
            <td style="padding:24px 32px 20px;background:#ffffff;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="line-height:0;font-size:0;height:4px;background:linear-gradient(90deg,#6a3df0,#2575fc);">&nbsp;</td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:36px 32px;color:#1f2430;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:#111827;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background:#fafafa;border-top:1px solid #eef0f4;color:#6b7280;font-size:12px;line-height:1.7;">
              This is an automated message from ${escapeHtml(brand)}.<br/>
              ${supportEmail ? `Need help? <a href="mailto:${escapeHtml(supportEmail)}" style="color:#6a3df0;text-decoration:none;">${escapeHtml(supportEmail)}</a><br/>` : ""}
              <a href="${escapeHtml(appUrl)}" style="color:#2575fc;text-decoration:none;">Visit ${escapeHtml(brand)}</a>
              &nbsp;\u00b7&nbsp; \u00a9 ${new Date().getFullYear()} ${escapeHtml(brand)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const button = (label, url) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;background:linear-gradient(135deg,#6a3df0,#2575fc);color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;font-size:14px;margin:6px 10px 6px 0;">${escapeHtml(label)}</a>`;

const infoRow = (label, value) =>
  value
    ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:150px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;">${value}</td></tr>`
    : "";

const addressBlock = (a) => {
  if (!a) return "";
  const lines = [a.fullName, [a.line1, a.line2].filter(Boolean).join(", "), a.landmark, [a.city, a.state, a.pincode].filter(Boolean).join(", "), a.phone]
    .filter(Boolean)
    .map(escapeHtml);
  return lines.join("<br/>");
};

const itemRows = (order) =>
  order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">${escapeHtml(item.name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;text-align:right;">${money(item.price)}</td>
        </tr>`
    )
    .join("");

const orderItemsTable = (order) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
    <thead>
      <tr>
        <th align="left" style="font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#9aa1ac;padding-bottom:6px;">Product</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#9aa1ac;padding-bottom:6px;">Qty</th>
        <th align="right" style="font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#9aa1ac;padding-bottom:6px;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows(order)}</tbody>
  </table>`;

// ---- OTP email ---------------------------------------------------------------

const otpEmail = (user, otp, purpose) => {
  const isSignup = purpose === "signup";
  const title = isSignup ? `Welcome to ${brand}` : `Reset your ${brand} password`;
  const intro = isSignup
    ? "Use the code below to verify your email and activate your account."
    : "Use the code below to reset your password.";
  const body = `
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">Hi ${escapeHtml(user.name || "there")},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">${intro}</p>
    <div class="otp-box" style="text-align:center;background:#f5f3ff;border:1px dashed #8f6bff;border-radius:10px;padding:20px;margin:0 0 20px;font-size:34px;font-weight:800;letter-spacing:10px;color:#6a3df0;">${escapeHtml(otp)}</div>
    <p style="margin:0 0 6px;color:#374151;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="margin:0;color:#9aa1ac;font-size:12px;">For your security, never share this code with anyone \u2014 ${escapeHtml(brand)} staff will never ask you for it. If you didn't request this, you can safely ignore this email.</p>
  `;
  return {
    subject: `${brand} - Your Verification Code`,
    html: layout(`Your ${brand} verification code: ${otp}`, title, body),
  };
};

// ---- welcome email -------------------------------------------------------------

const welcomeEmail = (user) => ({
  subject: `Welcome to ${brand}, ${user.name}!`,
  html: layout(
    `Welcome to ${brand}!`,
    `Welcome to ${brand}!`,
    `<p style="margin:0 0 20px;color:#374151;font-size:14px;">Hi ${escapeHtml(user.name)}, your account has been verified and is ready to go. We're glad to have you with us.</p>
     <p style="margin:0;">${button("Start Shopping", appUrl)}</p>`
  ),
});

// ---- customer order email (placed / status updates) --------------------------

const ORDER_MESSAGES = {
  placed: "Thank you for shopping with us \u2014 your order has been placed successfully.",
  confirmed: "Your order has been confirmed and is now in our fulfilment queue.",
  processing: "Your order is now being prepared.",
  packed: "Your order has been packed and is ready to leave our facility.",
  shipped: "Your order is on its way.",
  out_for_delivery: "Your order is out for delivery today.",
  delivered: "Your order has been delivered. We hope you enjoy it!",
  delivery_failed: "We were unable to deliver your order. Please contact support for the next steps.",
  cancelled: "Your order has been cancelled.",
};

const orderEmail = (user, order, eventType) => {
  const isPlaced = eventType === "placed";
  const message = ORDER_MESSAGES[eventType] || `Your order status is now ${statusLabel(eventType)}.`;
  const trackingRow = order.trackingNumber
    ? infoRow(order.courierName || "Courier", escapeHtml(order.trackingNumber))
    : "";

  const body = `
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">Hi ${escapeHtml(user.name)},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">${message}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:2px;margin:0 0 20px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("Order ID", `#${orderCode(order)}`)}
          ${infoRow("Status", statusLabel(order.status))}
          ${infoRow("Payment Method", paymentLabel(order.paymentMethod))}
          ${infoRow("Total Amount", money(order.totalAmount))}
          ${trackingRow}
        </table>
      </td></tr>
    </table>
    ${orderItemsTable(order)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="padding-top:8px;text-align:right;color:#374151;font-size:13px;">Subtotal: ${money(order.subtotal)}</td></tr>
      ${order.discount ? `<tr><td style="padding-top:2px;text-align:right;color:#16a34a;font-size:13px;">Discount: -${money(order.discount)}</td></tr>` : ""}
      <tr><td style="padding-top:2px;text-align:right;color:#374151;font-size:13px;">Delivery: ${order.deliveryCharge ? money(order.deliveryCharge) : "Free"}</td></tr>
      <tr><td style="padding-top:6px;text-align:right;color:#111827;font-size:15px;font-weight:800;">Total: ${money(order.totalAmount)}</td></tr>
    </table>
    <div style="margin:20px 0;padding-top:16px;border-top:1px solid #eef0f4;">
      <p style="margin:0 0 6px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;">Shipping Address</p>
      <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${addressBlock(order.shippingAddress)}</p>
    </div>
    <p style="margin-top:22px;">${button("View Order", orderUrl(order))}</p>
  `;

  return {
    subject: isPlaced ? `${brand} - Order Confirmed #${orderCode(order)}` : `${brand} - ${message.split(".")[0]} #${orderCode(order)}`,
    html: layout(message, isPlaced ? "Order Confirmed" : `Order Update \u2014 #${orderCode(order)}`, body),
  };
};

// ---- admin order notification --------------------------------------------------

const adminOrderEmail = (customer, order) => {
  const body = `
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">A new order has been placed on ${escapeHtml(brand)}.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin:0 0 20px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("Order ID", `#${orderCode(order)}`)}
          ${infoRow("Order Date/Time", new Date(order.createdAt || Date.now()).toLocaleString("en-IN"))}
          ${infoRow("Customer Name", escapeHtml(customer.name))}
          ${infoRow("Customer Email", escapeHtml(customer.email))}
          ${infoRow("Payment Method", paymentLabel(order.paymentMethod))}
          ${infoRow("Total Amount", money(order.totalAmount))}
        </table>
      </td></tr>
    </table>
    ${orderItemsTable(order)}
    <div style="margin:20px 0;padding-top:16px;border-top:1px solid #eef0f4;">
      <p style="margin:0 0 6px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;">Shipping Address</p>
      <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${addressBlock(order.shippingAddress)}</p>
    </div>
    <p style="margin-top:22px;">${button("Open in Admin Dashboard", `${appUrl}/admin/orders/${order._id}`)}</p>
  `;
  return {
    subject: `${brand} - New Order Received #${orderCode(order)}`,
    html: layout(`New order #${orderCode(order)} from ${customer.name}`, "New Order Received", body),
  };
};

// ---- return email ---------------------------------------------------------------

const returnEmail = (user, order) => {
  const body = `
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">Hi ${escapeHtml(user.name)},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">Your return request for order #${orderCode(order)} is now <strong>${escapeHtml(order.return.status)}</strong>.${order.return.reason ? ` Reason: ${escapeHtml(order.return.reason)}` : ""}</p>
    ${orderItemsTable(order)}
    <p style="margin-top:22px;">${button("View Order", orderUrl(order))}</p>
  `;
  return {
    subject: `${brand} - Return Update #${orderCode(order)}`,
    html: layout(`Return update for order #${orderCode(order)}`, "Return Update", body),
  };
};

// ---- back-in-stock notification --------------------------------------------------

const restockEmail = (product, colorName, size, colorCode) => {
  const variantBits = [colorName, size].filter(Boolean);
  const variantLine = variantBits.length
    ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:150px;">Variant</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;">${escapeHtml(variantBits.join(" / "))}${colorCode ? ` <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${escapeHtml(colorCode)};vertical-align:middle;border:1px solid #e5e7eb;"></span>` : ""}</td></tr>`
    : "";
  const params = new URLSearchParams();
  if (colorName) params.set("color", colorName);
  if (size) params.set("size", size);
  const query = params.toString();
  const productUrl = `${appUrl}/products/${product._id}${query ? `?${query}` : ""}`;

  const body = `
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">Good news! An item you were waiting for is back in stock.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin:0 0 20px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("Product", escapeHtml(product.name))}
          ${variantLine}
        </table>
      </td></tr>
    </table>
    <p style="margin-top:22px;">${button("Shop Now", productUrl)}</p>
    <p style="margin:16px 0 0;color:#9aa1ac;font-size:12px;">Stock is limited and this item may sell out again — we'd grab it soon.</p>
  `;
  return {
    subject: `${brand} - Your item is back in stock!`,
    html: layout(`${product.name} is back in stock`, "Back in Stock", body),
  };
};

module.exports = { escapeHtml, otpEmail, welcomeEmail, orderEmail, adminOrderEmail, returnEmail, restockEmail };