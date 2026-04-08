# TableStory Web Project

A modern, mobile-optimized restaurant web app built with Next.js App Router and MUI, inspired by a legacy restaurant ordering reference flow.

## Live Demo

Deployed on Vercel — accessible on both desktop and mobile.

## Current Scope

- Customer experience under `app/(public)` with menu, cart, checkout, and order tracking.
- Admin workflow under `app/(admin)` protected by GitHub OAuth + email allowlist.
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

Create `.env` with required values:

```bash
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
AUTH_SECRET=replace-with-random-secret
GITHUB_ID=github-oauth-client-id
GITHUB_SECRET=github-oauth-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
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

- Customers use credentials sign-in/sign-up in the welcome modal.
- If the entered email is allowlisted as admin, the same modal automatically routes to GitHub OAuth.
- Admin privileges are granted only to GitHub-authenticated sessions with allowlisted emails.
- Customer order listing is scoped to the signed-in customer email.
- Guest order listing is scoped to browser-owned order refs.

## Production Setup

1. Provision production infrastructure.
- MySQL database instance.
- Host for the Next.js app (Vercel, VPS, container platform, etc.).

2. Configure production environment variables in your hosting platform.

```bash
DATABASE_URL=mysql://user:pass@db-host:3306/dbname
AUTH_SECRET=strong-random-secret
GITHUB_ID=github-oauth-client-id
GITHUB_SECRET=github-oauth-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
NEXTAUTH_URL=https://your-domain.com
```

3. Update your GitHub OAuth app.
- Homepage URL: `https://your-domain.com`
- Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

4. Apply schema changes in production.

```bash
bun run db:push
```

5. Deploy and verify.
- Customer sign in/sign up works.
- Admin email in sign-in modal routes to GitHub OAuth.
- Admin account can access `/admin` and `/admin/orders`.
- Non-admin accounts cannot access admin routes.

### Vercel Runbook

1. Import repository in Vercel.
- Framework preset: `Next.js`
- Root directory: project root

2. Set environment variables in Vercel Project Settings -> Environment Variables.
- `DATABASE_URL`
- `AUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `ADMIN_EMAILS`
- `NEXTAUTH_URL` (set to your production domain)

3. Configure GitHub OAuth app for Vercel domain.
- Homepage URL: `https://your-domain.com`
- Callback URL: `https://your-domain.com/api/auth/callback/github`

4. Deploy, then run schema sync against production DB.

```bash
bun run db:push
```

5. Validate production flows.
- Customer sign-up/sign-in works.
- Admin allowlisted email is routed to GitHub auth.
- Admin routes are inaccessible to non-admin users.

Tip: if you create Vercel preview environments, keep OAuth callback and `NEXTAUTH_URL` aligned with the target domain you are testing.

## Adding Admins

- Add/remove emails in `ADMIN_EMAILS` (comma-separated).
- Restart/redeploy so env var changes are applied.
- Each admin must sign in with a GitHub account whose email matches an allowlisted email.
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

