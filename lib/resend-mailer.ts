import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TableStory <no-reply@example.com>";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendCustomerSignInLinkEmail(input: {
  email: string;
  signInUrl: string;
}) {
  if (!resend) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: input.email,
    subject: "Your TableStory sign-in link",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin-bottom: 8px;">Sign in to TableStory</h2>
        <p style="margin-top: 0;">Use the secure link below to continue:</p>
        <p>
          <a href="${input.signInUrl}" style="display:inline-block;padding:10px 14px;background:#1f6feb;color:#fff;text-decoration:none;border-radius:6px;">Sign in securely</a>
        </p>
        <p style="font-size: 13px; color: #555;">This link expires in 15 minutes and can be used once.</p>
        <p style="font-size: 13px; color: #555;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
