// Vercel serverless function. Keeps RESEND_API_KEY server-side — the
// browser never sees it. Sends whatever the composer captured (text body,
// or a photo/PDF as an attachment) to the configured Canals inbox address
// via the Resend REST API directly (no SDK dependency needed).

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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    res.status(500).json({ error: "Email sending isn't configured on the server yet." });
    return;
  }

  const isAttachment = typeof data === "string" && data.startsWith("data:");
  const payload = { from, to };

  if (isAttachment) {
    const match = /^data:([^;]+);base64,(.*)$/s.exec(data);
    if (!match) {
      res.status(400).json({ error: "Malformed file data." });
      return;
    }
    const [, contentType, base64] = match;
    const ext = contentType.split("/")[1] || "bin";
    payload.subject = `Canals order — ${label || `capture.${ext}`}`;
    payload.text = "New Canals order captured in the field. See attachment.";
    payload.attachments = [{ filename: label || `capture.${ext}`, content: base64 }];
  } else {
    payload.subject = "Canals order — typed/spoken";
    payload.text = data;
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text().catch(() => "");
      res.status(502).json({ error: `Resend rejected the email${errBody ? `: ${errBody}` : ""}.` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: "Could not reach the email service. Check your connection and retry." });
  }
}
