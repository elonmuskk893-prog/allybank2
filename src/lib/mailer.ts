/**
 * Outbound email.
 *
 * Two delivery paths, chosen by the settings saved in Admin → Settings → Email:
 *   - "smtp"       → direct SMTP over TCP/TLS (host/port/user/password)
 *   - "resend" /
 *     "mailersend" → HTTPS provider APIs (api key)
 *
 * Credentials are read server-side only (admin_config table or environment
 * variables) and are never sent to the browser.
 */
import net from "node:net";
import tls from "node:tls";

export interface EmailConfig {
  provider?: string;
  api_key?: string;
  smtp_host?: string;
  smtp_port?: number | string;
  smtp_user?: string;
  smtp_password?: string;
  encryption?: string; // "tls" (implicit, 465) | "starttls" (587) | "none"
  from_email?: string;
  from_name?: string;
}

function env(name: string): string {
  return process.env[name] ?? "";
}

/** Merge stored admin settings with environment fallbacks. */
export function resolveEmailConfig(stored: EmailConfig | null | undefined): EmailConfig {
  const cfg: EmailConfig = { ...(stored ?? {}) };
  if (!cfg.provider) {
    cfg.provider = cfg.smtp_host
      ? "smtp"
      : env("RESEND_API_KEY")
        ? "resend"
        : env("MAILERSEND_API_KEY")
          ? "mailersend"
          : "";
  }
  if (!cfg.api_key) {
    cfg.api_key =
      cfg.provider === "resend"
        ? env("RESEND_API_KEY")
        : cfg.provider === "mailersend"
          ? env("MAILERSEND_API_KEY")
          : "";
  }
  cfg.from_name = cfg.from_name || env("EMAIL_FROM_NAME") || "Online Banking";
  cfg.from_email = cfg.from_email || env("EMAIL_FROM_ADDRESS") || cfg.smtp_user || "";
  return cfg;
}

export function isEmailConfigured(cfg: EmailConfig): boolean {
  if (cfg.provider === "smtp") return Boolean(cfg.smtp_host && cfg.from_email);
  return Boolean(cfg.api_key && cfg.from_email);
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Address humans can reply to. Defaults to the configured from address. */
  replyTo?: string;
  /** Set for bulk/marketing style mail so inbox providers see an opt-out. */
  listUnsubscribe?: boolean;
}

export interface MailResult {
  sent: boolean;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/* Minimal SMTP client                                                        */
/* -------------------------------------------------------------------------- */

interface SmtpSocket {
  write(data: string): void;
  read(): Promise<string>;
  end(): void;
  upgrade(host: string): Promise<void>;
}

function wrap(socket: net.Socket | tls.TLSSocket): SmtpSocket {
  let buffer = "";
  const waiters: ((chunk: string) => void)[] = [];
  let current: net.Socket | tls.TLSSocket = socket;

  const attach = (s: net.Socket | tls.TLSSocket) => {
    s.setEncoding("utf8");
    s.on("data", (chunk: string) => {
      buffer += chunk;
      // A complete SMTP reply ends with "NNN <text>\r\n" (space, not dash).
      if (/^\d{3} [^\n]*\r?\n$/m.test(buffer.split(/\r?\n/).slice(-2)[0] + "\n")) {
        const done = buffer;
        buffer = "";
        waiters.shift()?.(done);
      }
    });
  };
  attach(current);

  return {
    write: (data: string) => current.write(data),
    read: () =>
      new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("smtp_timeout")), 15000);
        waiters.push((chunk) => {
          clearTimeout(timer);
          resolve(chunk);
        });
      }),
    end: () => current.end(),
    upgrade: async (host: string) => {
      const plain = current as net.Socket;
      current = tls.connect({ socket: plain, servername: host, rejectUnauthorized: false });
      await new Promise<void>((resolve, reject) => {
        (current as tls.TLSSocket).once("secureConnect", () => resolve());
        current.once("error", reject);
      });
      attach(current);
    },
  };
}

function expect(reply: string, codes: string[]) {
  const code = reply.trim().slice(0, 3);
  if (!codes.includes(code)) throw new Error(`smtp_error: ${reply.trim().slice(0, 200)}`);
}

async function sendViaSmtp(cfg: EmailConfig, input: MailInput): Promise<MailResult> {
  const host = String(cfg.smtp_host);
  const encryption = (cfg.encryption ?? "starttls").toLowerCase();
  const port = Number(cfg.smtp_port) || (encryption === "tls" || encryption === "ssl" ? 465 : 587);
  const implicit = encryption === "tls" || encryption === "ssl" || port === 465;

  let sock: SmtpSocket | null = null;
  try {
    const raw: net.Socket | tls.TLSSocket = implicit
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.connect({ host, port });
    await new Promise<void>((resolve, reject) => {
      raw.once(implicit ? "secureConnect" : "connect", () => resolve());
      raw.once("error", reject);
      setTimeout(() => reject(new Error("smtp_connect_timeout")), 15000);
    });
    sock = wrap(raw);
    expect(await sock.read(), ["220"]);

    sock.write(`EHLO ${host}\r\n`);
    let greeting = await sock.read();
    expect(greeting, ["250"]);

    if (!implicit && encryption !== "none") {
      sock.write("STARTTLS\r\n");
      expect(await sock.read(), ["220"]);
      await sock.upgrade(host);
      sock.write(`EHLO ${host}\r\n`);
      greeting = await sock.read();
      expect(greeting, ["250"]);
    }

    if (cfg.smtp_user) {
      sock.write("AUTH LOGIN\r\n");
      expect(await sock.read(), ["334"]);
      sock.write(`${Buffer.from(String(cfg.smtp_user)).toString("base64")}\r\n`);
      expect(await sock.read(), ["334"]);
      sock.write(`${Buffer.from(String(cfg.smtp_password ?? "")).toString("base64")}\r\n`);
      expect(await sock.read(), ["235"]);
    }

    const from = cfg.from_email as string;
    sock.write(`MAIL FROM:<${from}>\r\n`);
    expect(await sock.read(), ["250"]);
    sock.write(`RCPT TO:<${input.to}>\r\n`);
    expect(await sock.read(), ["250", "251"]);
    sock.write("DATA\r\n");
    expect(await sock.read(), ["354"]);

    const boundary = `b${Date.now().toString(36)}`;
    const domain = from.split("@")[1] ?? "localhost";
    const replyTo = input.replyTo || from;
    const body = [
      `From: ${cfg.from_name} <${from}>`,
      `To: ${input.to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${input.subject}`,
      // Date and Message-ID are required by RFC 5322; missing them is a strong
      // spam signal with Gmail/Outlook.
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@${domain}>`,
      "MIME-Version: 1.0",
      ...(input.listUnsubscribe
        ? [`List-Unsubscribe: <mailto:${replyTo}?subject=unsubscribe>`, "List-Unsubscribe-Post: List-Unsubscribe=One-Click"]
        : []),
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      input.text,
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      input.html.replace(/^\./gm, ".."),
      `--${boundary}--`,
      "",
      ".",
      "",
    ].join("\r\n");
    sock.write(body);
    expect(await sock.read(), ["250"]);
    sock.write("QUIT\r\n");
    sock.end();
    return { sent: true };
  } catch (error) {
    try {
      sock?.end();
    } catch {
      /* ignore */
    }
    return { sent: false, error: (error as Error).message };
  }
}

/* -------------------------------------------------------------------------- */
/* HTTPS providers                                                            */
/* -------------------------------------------------------------------------- */

async function sendViaApi(cfg: EmailConfig, input: MailInput): Promise<MailResult> {
  const replyTo = input.replyTo || String(cfg.from_email ?? "");
  const unsubHeaders = input.listUnsubscribe
    ? {
        "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;
  try {
    if (cfg.provider === "mailersend") {
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.api_key}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: { email: cfg.from_email, name: cfg.from_name },
          to: [{ email: input.to }],
          reply_to: { email: replyTo },
          subject: input.subject,
          text: input.text,
          html: input.html,
          ...(unsubHeaders
            ? { headers: Object.entries(unsubHeaders).map(([name, value]) => ({ name, value })) }
            : {}),
        }),
      });
      if (!response.ok) return { sent: false, error: `${response.status} ${await response.text()}` };
      return { sent: true };
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.api_key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `${cfg.from_name} <${cfg.from_email}>`,
        to: [input.to],
        reply_to: replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(unsubHeaders ? { headers: unsubHeaders } : {}),
      }),
    });
    if (!response.ok) return { sent: false, error: `${response.status} ${await response.text()}` };
    return { sent: true };
  } catch (error) {
    return { sent: false, error: (error as Error).message };
  }
}

export async function sendMail(cfg: EmailConfig, input: MailInput): Promise<MailResult> {
  if (!isEmailConfigured(cfg)) return { sent: false, error: "email_not_configured" };
  const result = cfg.provider === "smtp" ? await sendViaSmtp(cfg, input) : await sendViaApi(cfg, input);
  if (!result.sent) console.error("[mailer] send failed:", result.error);
  return result;
}

/** Log the code server-side when delivery fails so the flow remains testable. */
export function logUndeliveredCode(purpose: string, to: string, code: string) {
  console.warn(`[mailer] ${purpose} code for ${to}: ${code}`);
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

function layout(siteName: string, heading: string, intro: string, rows: [string, string][], footer: string) {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">${label}</td><td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${value}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#0ea5e9;padding:20px 28px;"><span style="color:#ffffff;font-size:18px;font-weight:bold;">${siteName}</span></td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${heading}</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">${intro}</p>
          <table role="presentation" width="100%" style="border-top:1px solid #e5e7eb;">${cells}</table>
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function money(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

interface TxEmailInput {
  siteName: string;
  name: string;
  amount: number;
  currency: string;
  balance?: number | null;
  reference?: string | null;
  method?: string | null;
  status?: string;
  date?: string;
}

export function depositApprovedEmail(input: TxEmailInput): MailInput {
  const when = input.date ?? new Date().toISOString();
  const rows: [string, string][] = [
    ["Amount credited", `+ ${money(input.currency, input.amount)}`],
    ["Currency", input.currency.toUpperCase()],
    ["Date", new Date(when).toLocaleString("en-US")],
  ];
  if (input.method) rows.push(["Method", input.method]);
  if (input.reference) rows.push(["Reference", input.reference]);
  if (input.balance != null) rows.push(["Available balance", money(input.currency, input.balance)]);
  return {
    to: "",
    subject: `Deposit Approved — Your Account Has Been Credited`,
    text: `Hi ${input.name}, your deposit of ${money(input.currency, input.amount)} has been approved and credited to your account.`,
    html: layout(
      input.siteName,
      "Deposit approved",
      `Hi ${input.name}, your deposit has been approved and your account has been credited.`,
      rows,
      "If you did not make this deposit, contact support immediately.",
    ),
  };
}

export function withdrawalStatusEmail(input: TxEmailInput): MailInput {
  const when = input.date ?? new Date().toISOString();
  const status = (input.status ?? "completed").toLowerCase();
  const heading =
    status === "completed" ? "Withdrawal completed" : status === "rejected" || status === "failed" ? "Withdrawal declined" : "Withdrawal update";
  const rows: [string, string][] = [
    ["Amount", `- ${money(input.currency, input.amount)}`],
    ["Currency", input.currency.toUpperCase()],
    ["Status", status],
    ["Date", new Date(when).toLocaleString("en-US")],
  ];
  if (input.method) rows.push(["Method", input.method]);
  if (input.reference) rows.push(["Reference", input.reference]);
  if (input.balance != null) rows.push(["Available balance", money(input.currency, input.balance)]);
  return {
    to: "",
    subject: `${heading} — ${money(input.currency, input.amount)}`,
    text: `Hi ${input.name}, your withdrawal of ${money(input.currency, input.amount)} is now ${status}.`,
    html: layout(
      input.siteName,
      heading,
      `Hi ${input.name}, here is the latest update on your withdrawal request.`,
      rows,
      "If you did not request this withdrawal, contact support immediately.",
    ),
  };
}

function codeShell(code: string, siteName: string, purpose: string, ctaText: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#0ea5e9;padding:24px 32px;"><span style="color:#ffffff;font-size:18px;font-weight:bold;">${siteName}</span></td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${purpose}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Your one-time code is below. It expires in 15 minutes — if you didn't request this, you can safely ignore this email.</p>
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

export function verificationCodeEmail(code: string, siteName: string): MailInput {
  return {
    to: "",
    subject: `Verify your email — ${siteName}`,
    text: `Your ${siteName} verification code is ${code}. It expires in 15 minutes.`,
    html: codeShell(code, siteName, "Confirm your email", "Enter this code on the verification screen to activate your account."),
  };
}

export function passwordResetCodeEmail(code: string, siteName: string): MailInput {
  return {
    to: "",
    subject: `Reset your password — ${siteName}`,
    text: `Your ${siteName} password reset code is ${code}. It expires in 15 minutes.`,
    html: codeShell(code, siteName, "Reset your password", "Enter this code on the password reset screen to set a new password."),
  };
}

export function testEmail(siteName: string): MailInput {
  return {
    to: "",
    subject: `Test email from ${siteName}`,
    text: `This is a test email from ${siteName}. Your email settings are working.`,
    html: layout(siteName, "Email settings are working", "This is a test message sent from your admin panel.", [["Status", "Delivered"]], "You can now enable transaction notifications."),
  };
}

/**
 * Admin broadcast. `bodyHtml` is the message the admin composed (already
 * sanitized upstream); it is dropped straight into the branded shell so the
 * HTML they write is exactly what the member receives.
 */
export function broadcastEmail(input: {
  siteName: string;
  title: string;
  bodyHtml: string;
  link?: string | null;
  name?: string;
}): MailInput {
  const cta = input.link
    ? `<p style="margin:24px 0 0;"><a href="${input.link}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold;">View details</a></p>`
    : "";
  const greeting = input.name ? `<p style="margin:0 0 16px;font-size:14px;color:#111827;">Hi ${input.name},</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#0ea5e9;padding:20px 28px;"><span style="color:#ffffff;font-size:18px;font-weight:bold;">${input.siteName}</span></td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${input.title}</h1>
          ${greeting}
          <div style="font-size:14px;color:#374151;line-height:1.7;">${input.bodyHtml}</div>
          ${cta}
          <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;">You are receiving this message because you hold an account with ${input.siteName}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return {
    to: "",
    subject: input.title,
    text: input.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    html,
    listUnsubscribe: true,
  };
}
