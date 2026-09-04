// Sends transactional emails via the Brevo HTTP API (https://api.brevo.com).
// This uses plain HTTPS (port 443), unlike SMTP (port 587/465) which can hang
// or time out on some hosts (e.g. Render's free tier blocking/throttling
// outbound SMTP) — HTTP is fast and reliable there instead.
//
// Required env var: BREVO_API_KEY (Brevo dashboard -> Settings -> SMTP & API -> API Keys)
// EMAIL_FROM can be either "Name <email@domain.com>" or just "email@domain.com".
// The EMAIL_FROM address must be a verified sender in Brevo.

function parseFrom(raw) {
  const fallback = { email: process.env.EMAIL_USER || "no-reply@example.com", name: "KaintLook" };
  if (!raw) return fallback;
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, "") || fallback.name, email: match[2].trim() };
  }
  return { email: raw.trim(), name: fallback.name };
}

async function sendEmail({ to, subject, html }) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") console.log(`[email skipped - not configured] To: ${to} | Subject: ${subject}`);
      return { sent: false, skipped: true };
    }

    const sender = parseFrom(process.env.EMAIL_FROM);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || `Brevo API error (status ${response.status})`;
      console.error("Failed to send email:", message);
      return { sent: false, error: message };
    }

    return { sent: true, messageId: data.messageId };
  } catch (err) {
    console.error("Failed to send email:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail };
