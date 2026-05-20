import nodemailer from "nodemailer";

function getBaseUrl() {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not set");
  }
  return baseUrl.replace(/\/$/, "");
}

function buildVerificationHtml(url: string) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 24px;">
        <h2>SecureGate</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Verify Email</a>
        <p style="margin-top: 16px; font-size: 14px; color: #666;">This link expires in 15 minutes.</p>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">${url}</p>
      </body>
    </html>
  `.trim();
}

function buildResetHtml(url: string) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 24px;">
        <h2>SecureGate</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p style="margin-top: 16px; font-size: 14px; color: #666;">This link expires in 1 hour.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">${url}</p>
      </body>
    </html>
  `.trim();
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is not configured in environment variables");
  }

  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/verify-email/${token}`;
  const html = buildVerificationHtml(url);

  await getTransporter().sendMail({
    from: `"SecureGate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/reset-password/${token}`;
  const html = buildResetHtml(url);

  await getTransporter().sendMail({
    from: `"SecureGate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html,
  });
}
