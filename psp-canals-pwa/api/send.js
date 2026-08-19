// Vercel serverless function. Sends whatever the composer captured (text
// body, or a photo/PDF as an attachment) to the configured Canals inbox
// address through the user's own Gmail account via SMTP + an App Password
// (GMAIL_USER / GMAIL_APP_PASSWORD), kept server-side only.

import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { data, label, inboxEmail } = req.body || {};
  const to = (inboxEmail || process.env.CANALS_INBOX_EMAIL || "").trim();

  if (!to) {
    res.status(400).json({ error: "No Canals inbox address is configured." });
    return;
  }
  if (!data || !String(data).trim()) {
    res.status(400).json({ error: "Nothing to send." });
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    res.status(500).json({ error: "Email sending isn't configured on the server yet." });
    return;
  }

  const isAttachment = typeof data === "string" && data.startsWith("data:");
  const mail = { from: `PSP Canals Capture <${gmailUser}>`, to };

  if (isAttachment) {
    const match = /^data:([^;]+);base64,(.*)$/s.exec(data);
    if (!match) {
      res.status(400).json({ error: "Malformed file data." });
      return;
    }
    const [, contentType, base64] = match;
    const ext = contentType.split("/")[1] || "bin";
    mail.subject = `Canals order — ${label || `capture.${ext}`}`;
    mail.text = "New Canals order captured in the field. See attachment.";
    mail.attachments = [{ filename: label || `capture.${ext}`, content: base64, encoding: "base64" }];
  } else {
    mail.subject = "Canals order — typed/spoken";
    mail.text = data;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    });
    await transporter.sendMail(mail);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Could not send via Gmail: ${err.message || "unknown error"}. Check the App Password and retry.` });
  }
}
