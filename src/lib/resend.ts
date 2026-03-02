import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface WaiverEmailData {
  participantName: string;
  eventTitle: string;
  distance: string;
  signedAt: string;
  pdfUrl: string;
}

export async function sendWaiverEmail(to: string, data: WaiverEmailData) {
  const { participantName, eventTitle, distance, signedAt, pdfUrl } = data;
  const resend = getResend();

  await resend.emails.send({
    from: "Making Miles Matter <noreply@makingmilesmatter.org>",
    to,
    subject: `Your Registration + Waiver Copy — ${eventTitle}`,
    html: `
      <h2>Registration Confirmed</h2>
      <p>Hi ${participantName},</p>
      <p>You're registered for <strong>${eventTitle}</strong> (${distance}).</p>
      <p>Your waiver was signed on ${new Date(signedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}.</p>
      <p><a href="${pdfUrl}">Download your signed waiver (PDF)</a></p>
      <p>This link expires in 7 days. If you need another copy, contact us.</p>
      <br/>
      <p>— Making Miles Matter</p>
    `,
  });

  // Internal copy
  if (process.env.MMM_ADMIN_EMAIL) {
    await resend.emails.send({
      from: "Making Miles Matter <noreply@makingmilesmatter.org>",
      to: process.env.MMM_ADMIN_EMAIL,
      subject: `[Admin] New Registration — ${participantName} — ${eventTitle}`,
      html: `
        <h3>New Registration</h3>
        <p><strong>Participant:</strong> ${participantName} (${to})</p>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Distance:</strong> ${distance}</p>
        <p><strong>Waiver signed:</strong> ${signedAt}</p>
        <p><a href="${pdfUrl}">Waiver PDF</a></p>
      `,
    });
  }
}
