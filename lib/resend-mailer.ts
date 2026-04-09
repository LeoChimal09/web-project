import { Resend } from "resend";
import { formatOrderTimestamp } from "@/features/checkout/order-format";
import { getOrderProgressMessage } from "@/features/checkout/order-status";
import type { PlacedOrder } from "@/features/checkout/checkout.types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TableStory <no-reply@example.com>";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function getAppBaseUrl() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function getAdminNotificationEmails() {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderOrderItems(order: PlacedOrder) {
  return order.orders
    .flatMap((entry) =>
      entry.lines.map(
        (line) => `<li>${escapeHtml(String(line.cartQuantity))}x ${escapeHtml(line.name)}</li>`,
      ),
    )
    .join("");
}

function renderPrimaryLink(href: string, label: string) {
  return `<p><a href="${href}" style="display:inline-block;padding:10px 14px;background:#1f6feb;color:#fff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a></p>`;
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export async function sendCustomerSignInLinkEmail(input: {
  email: string;
  signInUrl: string;
}) {
  await sendEmail({
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

export async function sendCustomerOrderReceivedEmail(input: {
  email: string;
  order: PlacedOrder;
}) {
  const orderUrl = `${getAppBaseUrl()}/orders/${encodeURIComponent(input.order.ref)}`;

  await sendEmail({
    to: input.email,
    subject: `We received your order ${input.order.ref}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>We received your order</h2>
        <p>Thanks for ordering with TableStory. Your order reference is <strong>${escapeHtml(input.order.ref)}</strong>.</p>
        <p>Status: <strong>${escapeHtml(getOrderProgressMessage(input.order.status, input.order.etaMinutes, input.order.cancellationNote))}</strong></p>
        <p>Placed at: ${escapeHtml(formatOrderTimestamp(input.order.placedAt))}</p>
        <ul>${renderOrderItems(input.order)}</ul>
        <p>Total: <strong>$${input.order.totalPrice.toFixed(2)}</strong></p>
        ${renderPrimaryLink(orderUrl, "Track your order")}
      </div>
    `,
  });
}

export async function sendCustomerOrderStatusUpdateEmail(input: {
  email: string;
  order: PlacedOrder;
}) {
  const orderUrl = `${getAppBaseUrl()}/orders/${encodeURIComponent(input.order.ref)}`;

  await sendEmail({
    to: input.email,
    subject: `Order update: ${input.order.ref} is ${input.order.status.replaceAll("_", " ")}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Your order status changed</h2>
        <p>Order reference: <strong>${escapeHtml(input.order.ref)}</strong></p>
        <p>${escapeHtml(getOrderProgressMessage(input.order.status, input.order.etaMinutes, input.order.cancellationNote))}</p>
        <p>Placed at: ${escapeHtml(formatOrderTimestamp(input.order.placedAt))}</p>
        ${renderPrimaryLink(orderUrl, "View order details")}
      </div>
    `,
  });
}

export async function sendAdminNewOrderEmail(input: {
  order: PlacedOrder;
}) {
  const recipients = getAdminNotificationEmails();
  if (recipients.length === 0) {
    return;
  }

  const adminOrdersUrl = `${getAppBaseUrl()}/admin/orders`;

  await sendEmail({
    to: recipients,
    subject: `New order received: ${input.order.ref}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>New order received</h2>
        <p>Reference: <strong>${escapeHtml(input.order.ref)}</strong></p>
        <p>Customer: ${escapeHtml(input.order.form.firstName)} ${escapeHtml(input.order.form.lastName)} (${escapeHtml(input.order.form.email)})</p>
        <p>Placed at: ${escapeHtml(formatOrderTimestamp(input.order.placedAt))}</p>
        <ul>${renderOrderItems(input.order)}</ul>
        <p>Total: <strong>$${input.order.totalPrice.toFixed(2)}</strong></p>
        ${renderPrimaryLink(adminOrdersUrl, "Open admin orders")}
      </div>
    `,
  });
}
