# TableStory Web Project

A modern restaurant web app built with Next.js App Router and MUI, inspired by a legacy PHP restaurant reference project.

## Current Scope

- Customer-facing experience under `app/(public)`
- Admin-facing workflow under `app/(admin)` (env-gated test mode)
- Shared MUI theme and reusable layout components

## Tech Stack

- Next.js `16.2.2`
- React `19.2.4`
- TypeScript
- MUI (`@mui/material`, `@emotion/react`, `@emotion/styled`)
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
    reservation/page.tsx
  (admin)/
    layout.tsx
    admin/page.tsx
    admin/orders/page.tsx
  api/
    orders/route.ts
    orders/[ref]/route.ts
  layout.tsx
components/
  customer/
  shared/
features/
  cart/
  checkout/
  menu/
hooks/
  useOrdersApi.ts
lib/
  admin-access.ts
server/
  db/
    client.ts
    schema.ts
  repositories/
    orders-repository.ts
components/
  shared/
    MuiThemeProvider.tsx
    SiteNavbar.tsx
    SiteFooter.tsx
```

## Routes

- `/` -> customer homepage
- `/menu` -> customer menu and add-to-order flow
- `/cart` -> grouped cart review before checkout
- `/checkout` -> customer checkout form
- `/order-confirmation` -> order confirmation summary
- `/orders` -> recent order history
- `/orders/[ref]` -> single order detail/status page
- `/reservation` -> customer reservation form (MUI scaffold)
- `/admin` -> admin dashboard scaffold
- `/admin/orders` -> test-only admin orders view

## Getting Started

Install dependencies:

```bash
bun i
```

Start development server:

```bash
bun dev
```

Typecheck:

```bash
bun run typecheck
```

Lint:

```bash
bun run lint
```

Admin test mode:

```bash
ADMIN_TEST_MODE=true
```

Set that in your `.env` file to enable admin-only routes during local testing.

Database workflow (code-first):

```bash
bun run db:generate
bun run db:push
```

- Define and update tables in `server/db/schema.ts`.
- Generate SQL migrations into `drizzle/` (committed to source control).
- Push schema changes to your MySQL instance from code.
- Run `db:push` any time you add or change columns before testing locally.

## TODO

### Customer-Facing (High Priority)
- [ ] **Cross-device order notifications** — persist notification dismiss state server-side if users should retain it across browsers/devices.

### Admin Track
- [ ] **Admin menu management** — CRUD UI for menu items (currently hardcoded in `features/menu/menu.data.ts`).

### Infrastructure / Polish
- [ ] **Reservation form submission** — the form exists at `/reservation` but does not submit anywhere yet.
- [ ] **Cart persistence** — hydrate `CartContext` from `localStorage` so active cart/orders survive a page refresh.
- [ ] **Auth for admin mode** — replace env-only admin gating with real auth/role checks.

### Completed
- [x] Production persistence for orders using Drizzle + MySQL (`server/db/schema.ts`, `server/repositories/orders-repository.ts`).
- [x] Admin cancel note — admin can optionally provide a reason when cancelling an order; customer sees it in the top notification and order detail.
- [x] Orders API (`/api/orders`, `/api/orders/[ref]`) with full CRUD backed by MySQL.
- [x] Checkout, confirmation, and customer order pages switched to API-backed order data via `hooks/useOrdersApi.ts`.
- [x] Admin test mode gate using `ADMIN_TEST_MODE=true`.
- [x] Header admin navigation is only visible when admin test mode is enabled.
- [x] Admin orders workflow view with status controls and scroll/fade behavior.
- [x] In-progress ETA selection in admin (`15/30/45/60+ minutes`) and ETA persistence on orders.
- [x] Customer-facing ETA visibility in order history, order details, and top progress notification.
- [x] Dismissible top order progress notification with quick link to the specific active order.
- [x] Browser-local "remove from history" behavior for customer and admin views (does not delete shared order records).
- [x] Online ordering system — order-based cart (`features/cart`) with `pendingLines` → `placeOrder` flow.
- [x] Shopping cart component and cart state management (`features/cart/CartContext.tsx`).
- [x] "Add to Order" on menu items with confirmation modal, drink suggestions, qty controls.
- [x] `/cart` route to review placed orders before checkout.
- [x] `/checkout` route with contact info, fulfillment toggle, payment selection, and order summary.
- [x] `/order-confirmation` route with placed-order summary and reference number.
- [x] Browser-persisted order history using `features/checkout/OrderHistoryContext.tsx`.
- [x] `/orders` route to review recent orders with status, remake, cancel, and remove-from-history actions.
- [x] `/orders/[ref]` route to inspect a single order in detail.
- [x] Remake-order flow that copies a previous order back into the cart and routes to checkout.
- [x] Pending-order cancellation flow.
- [x] Reusable in-app confirmation modal for order actions.
- [x] `CartMiniBar` sticky header bar shown whenever active orders exist.
- [x] Build customer menu page with two-column sidebar layout (McDonald's style).
- [x] Add `/menu` route under `app/(public)/menu/page.tsx`.
- [x] Add reusable `MenuGrid` and `MenuCard` components under `components/customer`.
- [x] Add menu data model in `features/menu` and wire to UI.
- [x] Link homepage CTA/navbar to menu page.
- [x] Set up homepage (MUI-based customer landing page with navbar, hero section, featured menu preview, and footer).
- [x] Create customer route structure under `app/(public)`.
- [x] Add shared layout components in `components/shared` (navigation and footer).
- [x] Build reservation page flow in MUI.
- [x] Scaffold admin pages under `app/(admin)/admin`.

## Notes

- The `TastyIgniter-reference` folder is a Laravel/PHP restaurant ordering system used as a UX/domain reference and is ignored from commits.
- We are rebuilding features in modern Next.js + MUI rather than copying PHP implementation details.

