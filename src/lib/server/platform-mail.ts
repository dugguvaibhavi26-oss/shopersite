import "server-only";
import nodemailer from "nodemailer";

/** Sends a plain email from the platform Gmail. Returns false (and logs) when the Gmail isn't configured. */
export async function sendPlatformMail(msg: { to: string; subject: string; text: string; replyTo?: string }): Promise<boolean> {
  const user = (process.env.PLATFORM_GMAIL_USER || "").trim();
  const pass = (process.env.PLATFORM_GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (!user || !pass || !msg.to) {
    console.warn("[mail] PLATFORM_GMAIL_USER / PLATFORM_GMAIL_APP_PASSWORD not set; email skipped");
    return false;
  }
  await nodemailer
    .createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass }, connectionTimeout: 10_000 })
    .sendMail({
      from: `Shopersite <${user}>`,
      to: msg.to,
      ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      subject: msg.subject,
      text: msg.text,
    });
  return true;
}
