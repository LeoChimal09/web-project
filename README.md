# TableStory Web Project

A modern restaurant web app built with Next.js App Router and MUI, inspired by a legacy restaurant ordering reference flow.

## Current Scope

- Customer experience under `app/(public)` with menu, cart, checkout, and order tracking.
- Admin workflow under `app/(admin)` protected by GitHub OAuth + email allowlist.
- Shared design system with MUI and stable SSR style injection for App Router.

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

