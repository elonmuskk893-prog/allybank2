import nodemailer from "nodemailer";

/**
 * SMTP mail delivery (MailerSend by default). Configured through env vars:
 *   SMTP_HOST  (default smtp.mailersend.net)
 *   SMTP_PORT  (default 587)
 *   SMTP_USER
 *   SMTP_PASS
 *   EMAIL_FROM_NAME    (default "Tesla Model")
 *   EMAIL_FROM_ADDRESS (default no-reply@teslamodel.xyz)
 */
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.mailersend.net";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Tesla Model";
const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ?? "no-reply@teslamodel.xyz";

export function isMailerConfigured() {
  return Boolean(SMTP_USER && SMTP_PASS);
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendMail(input: MailInput): Promise<boolean> {
  if (!isMailerConfigured()) return false;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  try {
    await transporter.sendMail({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.error("[mailer] send failed:", (error as Error).message);
    return false;
  }
}

/** Log the code server-side when delivery fails so the flow remains testable. */
export function logUndeliveredCode(purpose: string, to: string, code: string) {
  console.warn(`[mailer] ${purpose} code for ${to}: ${code}`);
}

function shell(code: string, siteName: string, purpose: string, ctaText: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#0ea5e9;padding:24px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;">${siteName}</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${purpose}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
            Your one-time code is below. It expires in 15 minutes — if you didn't request this, you can safely ignore this email.
          </p>
          <div style="background:#f9fafb;border:1px dashed #d1d5db;border-radius:12px;padding:20px;text-align:center;">
            <span style="font-size:28px;letter-spacing:8px;font-weight:bold;color:#0ea5e9;">${code}</span>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${ctaText}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendVerificationCodeEmail(to: string, code: string, siteName = "Tesla Model") {
  return sendMail({
    to,
    subject: `Verify your email — ${siteName}`,
    text: `Your ${siteName} verification code is ${code}. It expires in 15 minutes.`,
    html: shell(
      code,
      siteName,
      "Confirm your email",
      "Enter this code on the verification screen to activate your account.",
    ),
  });
}

export async function sendPasswordResetCodeEmail(to: string, code: string, siteName = "Tesla Model") {
  return sendMail({
    to,
    subject: `Reset your password — ${siteName}`,
    text: `Your ${siteName} password reset code is ${code}. It expires in 15 minutes.`,
    html: shell(
      code,
      siteName,
      "Reset your password",
      "Enter this code on the password reset screen to set a new password.",
    ),
  });
}