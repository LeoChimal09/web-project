# TableStory Web Project

A modern, mobile-optimized restaurant web app built with Next.js App Router and MUI, inspired by a legacy restaurant ordering reference flow.

## Live Demo

Deployed on Vercel — accessible on both desktop and mobile.

## Current Scope

- Customer experience under `app/(public)` with menu, cart, checkout, and order tracking.
- Admin workflow under `app/(admin)` protected by Google OAuth + email allowlist.
- Shared design system with MUI and stable SSR style injection for App Router.
- Fully responsive UI — works on phones, tablets, and desktop.

## Mobile Support

The UI is built mobile-first with responsive breakpoints throughout:

- **Navbar**: collapses to a hamburger menu drawer on small screens; cart count, sign-in, and sign-out all accessible in the drawer.
- **Menu page**: category sidebar scrolls horizontally on mobile; order dialog goes full-screen on phones.
- **Cart page**: line items stack vertically on small screens to avoid cramped rows.
- **Checkout**: single-column form layout on phones; order summary stacks below the form.
- **Orders / Order detail**: headings scale down, status rows wrap properly, and detail cards stack for easy reading.
- **Welcome modal**: goes full-screen on phones for comfortable sign-in/sign-up.
- **Sticky bars** (CartMiniBar, OrderProgressBanner): stack vertically and adjust `top` offset for the 56px mobile nav height.

## Tech Stack

- Next.js `16.2.2`
- React `19.2.4`
- TypeScript
- MUI (`@mui/material`, `@emotion/react`, `@emotion/styled`)
- Drizzle ORM + MySQL2
- NextAuth (`next-auth`)
- Bun for package management and scripts

## Project Structure

```txt
app/
  (public)/
    layout.tsx
    page.tsx
    menu/page.tsx
    cart/page.tsx
    checkout/page.tsx
    order-confirmation/page.tsx
    orders/page.tsx
    orders/[ref]/page.tsx
  (admin)/
    layout.tsx
    admin/page.tsx
    admin/orders/page.tsx
  api/
    auth/[...nextauth]/route.ts
    auth/account-role/route.ts
    orders/route.ts
    orders/[ref]/route.ts
  layout.tsx
components/
  auth/
  customer/
  shared/
features/
  cart/
  checkout/
  menu/
hooks/
  useOrdersApi.ts
lib/
  auth.ts
  admin-session.ts
server/
  db/
    client.ts
    schema.ts
  repositories/
    orders-repository.ts
    customers-repository.ts
drizzle/
  (generated migration files)
```

## Routes

- `/` customer homepage
- `/menu` customer menu and add-to-order flow
- `/cart` grouped cart review before checkout
- `/checkout` checkout form
- `/order-confirmation` order summary
- `/orders` current user order history
- `/orders/[ref]` single order detail/status page
- `/admin` admin dashboard
- `/admin/orders` admin orders workflow

## Getting Started

Install dependencies:

```bash
bun i
```

Copy `.env.example` to `.env`, then fill in the real values:

```bash
cp .env.example .env
```

Required values:

```bash
# Database
DATABASE_URL=mysql://user:pass@localhost:3306/dbname

# Authentication
AUTH_SECRET=replace-with-random-secret
GOOGLE_ID=google-oauth-client-id
GOOGLE_SECRET=google-oauth-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Customer email verification (Resend magic links)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
ADMIN_NOTIFICATION_EMAILS=owner@example.com

# App URL used to build verification links
NEXTAUTH_URL=http://localhost:3000

# Restaurant hours (optional — defaults: 09:00 AM - 10:00 PM UTC, closed weekends)
RESTAURANT_OPEN_TIME=09:00 AM
RESTAURANT_CLOSE_TIME=10:00 PM
RESTAURANT_TIMEZONE=UTC

# Test mode (development only — see Auth Model section)
ADMIN_TEST_MODE=false
TEST_ADMIN_EMAILS=test-admin@example.com
```

Run database schema sync:

```bash
bun run db:push
```

Run dev server:

```bash
bun dev
```

Checks:

```bash
bun run typecheck
bun run lint
```

## Auth Model

- Customers use one-time email verification links (magic links) sent via Resend.
- Admins in **production** (`ADMIN_TEST_MODE=false`) must use Google OAuth — email bypass is disabled.
- Admins in **test mode** (`ADMIN_TEST_MODE=true`) can use either Google OAuth or fast email verification bypass for development convenience.
  - Public customer sign-in (WelcomeModal) never auto-elevates allowlisted emails to admin.
  - Explicit admin sign-in (SignInModal) can trigger the test-mode email bypass if `adminIntent=true`.
- Admin privileges are granted only to sessions with allowlisted emails in `ADMIN_EMAILS` (production) or `TEST_ADMIN_EMAILS` (test mode).
- Customer order listing is scoped to the signed-in customer email.
- Guest order listing is scoped to browser-owned order refs (see Guest Ordering Privacy below).

### Test Mode Admin Flow

When `ADMIN_TEST_MODE=true` and `NODE_ENV=development`:

1. Admin opens admin area → SignInModal detects test mode and shows email field instead of Google button.
2. Admin enters allowlisted email → request-link endpoint returns `directAdminSignIn: true`.
3. SignInModal intercepts response and calls credentials sign-in with password `"test"` and `adminIntent: "true"`.
4. Credentials provider grants admin session immediately (skips email verification).

**Important:** Test mode is **always disabled in production** via a hard-block at startup. An error is thrown if `NODE_ENV=production` and `ADMIN_TEST_MODE=true`.

### Guest Ordering Privacy

⚠️ **Important:** Guest orders are stored in browser localStorage and shared with other guests on the same device.

If two people order as guests on a shared device (e.g., a restaurant kiosk), both will see each other's order history. For privacy:
- Encourage customers to create accounts (sign in with email) instead of ordering as guests.
- For restaurant kiosks, clear localStorage between sessions or use incognito/private mode.

## Features

### Order Management
- **Clear Order History**: Remove all completed or cancelled orders from your local browser history with a single click. Available on both customer and admin order pages.
- **Order Status Tracking**: Real-time order progress from pending → in progress → ready → completed/cancelled.
- **Order Details**: View full order items, prices, fulfillment method, and status history for any past order.
- **Remake Order**: Quickly duplicate a previous order to your cart and modify before checkout.

### Restaurant Hours Enforcement
- Orders are blocked when the restaurant is closed (server-side and client-side).
- Configurable hours with support for overnight windows (e.g., 8:00 PM – 8:00 AM).
- Timezone-aware status messages using any IANA timezone (default: America/Chicago).

## Email Notifications

- Customers receive an order receipt email when an order is placed.
- Customers receive status update emails when their order moves through progress states.
- Customer emails include direct links back to the website order page.
- Admins receive new order emails using `ADMIN_NOTIFICATION_EMAILS` or, if unset, the `ADMIN_EMAILS` allowlist.
- Admin emails include a direct link to the admin orders screen.
- Email sending is non-blocking: checkout and status updates still succeed even if the email provider is temporarily unavailable.

### Security Features

- **Order API Authorization**: GET, PATCH, DELETE operations on `/api/orders/[ref]` require session authentication and ownership or admin verification.
- **Rate Limiting**: 
  - Login link requests: 3 per minute per email, and 20 per minute per IP.
  - Credentials verification attempts: configurable (`AUTH_RATE_LIMIT_ATTEMPTS`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`), defaults to 10 per 15 seconds.
  - Order lookups: 10 per minute per IP address.
  - Prevents brute-force attacks on verification, authentication, and order references.
- **Cryptographic Order References**: Order refs use secure random generation (`randomBytes(8).toString("hex")`), not timestamps.
- **Guest Ref Validation**: Guest order lookups validate format and cap at 25 items to prevent abuse.

### Local Email Testing

- For local testing, `EMAIL_FROM=onboarding@resend.dev` is the simplest sender option.
- In development, the sign-in modal also exposes an `Open test sign-in link` button after a successful email request so you can continue even if your local environment blocks opening email links.
- For real delivery, verify your own domain in Resend and switch `EMAIL_FROM` to a verified sender such as `TableStory <no-reply@yourdomain.com>`.

## Restaurant Hours

Orders are blocked when the restaurant is closed. The app enforces hours both server-side (POST `/api/orders`) and client-side (checkout button disabled).

- **Default Hours**: 9:00 AM – 10:00 PM, Monday–Friday. Closed weekends.
- **Configuration**:
  ```bash
  RESTAURANT_OPEN_TIME=09:00 AM     # Supports 12-hour (09:00 AM) or 24-hour (09:00) format
  RESTAURANT_CLOSE_TIME=10:00 PM
  RESTAURANT_TIMEZONE=UTC           # Any IANA timezone (e.g., America/New_York, Europe/London)
  ```
- **Overnight Windows**: If `OPEN_TIME > CLOSE_TIME` (e.g., 8:00 PM – 8:00 AM), the system correctly interprets it as overnight.
- **Status Endpoint**: Clients fetch `/api/restaurant-status` to check open/closed state and display user messages.

## Production Setup

1. Provision production infrastructure.
- MySQL database instance.
- Host for the Next.js app (Vercel, VPS, container platform, etc.).

2. Configure production environment variables in your hosting platform.

```bash
DATABASE_URL=mysql://user:pass@db-host:3306/dbname
AUTH_SECRET=strong-random-secret
GOOGLE_ID=google-oauth-client-id
GOOGLE_SECRET=google-oauth-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
NEXTAUTH_URL=https://your-domain.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM="TableStory <no-reply@yourdomain.com>"
ADMIN_NOTIFICATION_EMAILS=owner@example.com

# Restaurant hours (optional)
RESTAURANT_OPEN_TIME=09:00 AM
RESTAURANT_CLOSE_TIME=10:00 PM
RESTAURANT_TIMEZONE=UTC

# IMPORTANT: Never set these in production
# ADMIN_TEST_MODE must be false or unset
# TEST_ADMIN_EMAILS should not be configured
```

3. Update your Google OAuth app.
- Homepage URL: `https://your-domain.com`
- Authorization callback URL: `https://your-domain.com/api/auth/callback/google`

4. Apply schema changes in production.

```bash
bun run db:push
```

5. Deploy and verify.
- Customer sign in/sign up sends magic-link email and verifies successfully.
- Admin email in sign-in modal routes to Google OAuth.
- Admin account can access `/admin` and `/admin/orders`.
- Non-admin accounts cannot access admin routes.

### Vercel Runbook

1. Import repository in Vercel.
- Framework preset: `Next.js`
- Root directory: project root

2. Set environment variables in Vercel Project Settings -> Environment Variables.
- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `ADMIN_EMAILS`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXTAUTH_URL` (set to your production domain)

3. Configure Google OAuth app for Vercel domain.
- Homepage URL: `https://your-domain.com`
- Callback URL: `https://your-domain.com/api/auth/callback/google`

4. Deploy, then run schema sync against production DB.

```bash
bun run db:push
```

5. Validate production flows.
- Customer sign-up/sign-in works via magic-link email verification.
- Admin allowlisted email is routed to Google auth.
- Admin routes are inaccessible to non-admin users.

Tip: if you create Vercel preview environments, keep OAuth callback and `NEXTAUTH_URL` aligned with the target domain you are testing.

## Adding Admins

- Add/remove emails in `ADMIN_EMAILS` (comma-separated).
- Restart/redeploy so env var changes are applied.
- Each admin must sign in with a Google account whose email matches an allowlisted email.
- Admins do not need their own OAuth app; one app configuration is shared by the project.

## Database Workflow

```bash
bun run db:generate
bun run db:push
```

- Update tables in `server/db/schema.ts`.
- Generate migration SQL into `drizzle/`.
- Run `db:push` whenever schema columns change.

## Notes

- `TastyIgniter-reference` is kept only as a UX/domain reference and is ignored from commits.
- This project rebuilds features in modern Next.js + MUI rather than reusing PHP implementation details.

