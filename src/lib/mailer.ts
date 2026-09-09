/**
 * Transactional email delivery over HTTPS (the serverless runtime cannot open
 * raw SMTP sockets). Configured through env vars, checked in this order:
 *   RESEND_API_KEY      -> Resend API
 *   MAILERSEND_API_KEY  -> MailerSend API
 * Shared:
 *   EMAIL_FROM_NAME    (default "Tesla Model")
 *   EMAIL_FROM_ADDRESS (default no-reply@teslamodel.xyz)
 */
function env(name: string): string {
  return process.env[name] ?? "";
}

export function isMailerConfigured() {
  return Boolean(env("RESEND_API_KEY") || env("MAILERSEND_API_KEY"));
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendMail(input: MailInput): Promise<boolean> {
  const fromName = env("EMAIL_FROM_NAME") || "Tesla Model";
  const fromAddress = env("EMAIL_FROM_ADDRESS") || "no-reply@teslamodel.xyz";
  const resendKey = env("RESEND_API_KEY");
  const mailerSendKey = env("MAILERSEND_API_KEY");

  try {
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });
      if (!response.ok) {
        console.error("[mailer] resend failed:", response.status, await response.text());
        return false;
      }
      return true;
    }

    if (mailerSendKey) {
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          authorization: `Bearer ${mailerSendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: { email: fromAddress, name: fromName },
          to: [{ email: input.to }],
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });
      if (!response.ok) {
        console.error("[mailer] mailersend failed:", response.status, await response.text());
        return false;
      }
      return true;
    }

    return false;
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