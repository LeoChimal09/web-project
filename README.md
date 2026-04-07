# TableStory Web Project

A modern restaurant web app built with Next.js App Router and MUI, inspired by a legacy PHP restaurant reference project.

## Current Scope

- Customer-facing experience under `app/(public)`
- Admin-facing scaffold under `app/(admin)`
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
  layout.tsx
components/
  customer/
  shared/
features/
  cart/
  checkout/
  menu/
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

## TODO

### Customer-Facing (High Priority)
- [ ] **Active order tracking** — real backend-driven status updates so order progress is not limited to browser-local state.

### Admin Track
- [ ] **Admin orders view** — list of placed orders with status workflow (Pending → In Progress → Ready → Completed).
- [ ] **Admin menu management** — CRUD UI for menu items (currently hardcoded in `features/menu/menu.data.ts`).

### Infrastructure / Polish
- [ ] **Reservation form submission** — the form exists at `/reservation` but does not submit anywhere yet.
- [ ] **Cart persistence** — hydrate `CartContext` from `localStorage` so active cart/orders survive a page refresh.
- [ ] **Persist order history server-side** — current order history is browser-local and can be cleared by the user.

### Completed
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

