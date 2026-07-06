import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// No SMTP credentials are configured in this dev environment - falls back to
// logging the email to the console instead of silently dropping it. Once
// SMTP_HOST/SMTP_USER/SMTP_PASS are set, real emails send with no code change.
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Carparkin.in <no-reply@carparkin.in>",
      to,
      subject,
      html,
      text,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n📧 [DEV EMAIL — no SMTP configured, not actually sent]\nTo: ${to}\nSubject: ${subject}\n${text}\n`
  );
}
