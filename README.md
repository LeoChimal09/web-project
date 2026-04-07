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
    reservation/page.tsx
  (admin)/
    layout.tsx
    admin/page.tsx
  layout.tsx
components/
  shared/
    MuiThemeProvider.tsx
    SiteNavbar.tsx
    SiteFooter.tsx
styles/
  globals.css
```

## Routes

- `/` -> customer homepage
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
- [ ] **Checkout flow** — `/checkout` page with customer info form (name, contact, delivery/pickup toggle) and payment method selection. The cart page already has a "Proceed to Checkout" button wired for this.
- [ ] **Order confirmation page** — `/order-confirmation` shown after a successful checkout, with full order summary and a reference number.

### Admin Track
- [ ] **Admin orders view** — list of placed orders with status workflow (Pending → In Progress → Ready → Completed).
- [ ] **Admin menu management** — CRUD UI for menu items (currently hardcoded in `features/menu/menu.data.ts`).

### Infrastructure / Polish
- [ ] **Reservation form submission** — the form exists at `/reservation` but does not submit anywhere yet.
- [ ] **Cart persistence** — hydrate `CartContext` from `localStorage` so orders survive a page refresh.

### Completed
- [x] Online ordering system — order-based cart (`features/cart`) with `pendingLines` → `placeOrder` flow.
- [x] Shopping cart component and cart state management (`features/cart/CartContext.tsx`).
- [x] "Add to Order" on menu items with confirmation modal, drink suggestions, qty controls.
- [x] `/cart` route to review placed orders before checkout.
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

