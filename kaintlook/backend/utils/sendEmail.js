const nodemailer = require("nodemailer");

// Uses standard SMTP env vars so this works with Gmail (with an app password),
// SendGrid, Mailtrap, or any other SMTP provider — set EMAIL_HOST/PORT/USER/PASS.
let transporter = null;
function getTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // email not configured — callers should treat this as "skip silently"
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const t = getTransporter();
    if (!t) {
      if (process.env.NODE_ENV !== "production") console.log(`[email skipped - not configured] To: ${to} | Subject: ${subject}`);
      return { sent: false, skipped: true };
    }
    const result = await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    return { sent: true, messageId: result.messageId };
  } catch (err) {
    console.error("Failed to send email:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail };
