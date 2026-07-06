# Carparkin.in

A parking marketplace platform connecting drivers looking for monthly/weekly/daily parking with parking space owners (apartment societies, commercial lots) across India. Three portals — User (driver), Owner, and Admin — share one codebase and one Postgres database.

---

## Table of Contents
- [Feature Status](#feature-status)
- [Screens & Responsibilities](#screens--responsibilities)
  - [Public](#public)
  - [User (Driver) Portal](#user-driver-portal)
  - [Owner Portal](#owner-portal)
  - [Admin Portal](#admin-portal)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Design System](#design-system)
- [Known Gaps](#known-gaps)
- [Contributing](#contributing)

---

## Feature Status

### Built and working
- **Auth** — signup/login (JWT), forgot/reset password (emailed link), email verification (emailed link), role-based accounts (`user` / `owner` / `admin`)
- **Search & booking** — search by city/dates/price/amenities, parking detail page, date-range booking flow, pricing estimate, availability check (respects both existing bookings and owner-set blackout dates)
- **Payments** — checkout flow is fully wired end-to-end but the gateway itself is **mocked** (`/api/payments/test/*`) — see [Known Gaps](#known-gaps)
- **Reviews** — write/view reviews with sub-ratings (cleanliness/security/accessibility), owner can post one public reply per review, admin can remove abusive reviews
- **Owner tools** — listing CRUD with photo management, blocked-dates calendar, booking management, earnings/payout history, KYC + bank verification submission, subscription plans
- **Admin oversight** — user/owner/booking/listing management, pending-listing approval queue, payouts batch processing, reviews moderation, support inbox, revenue/commission reports, full audit log of every admin mutation, platform configuration (commission rate, listing policy, amenities, parking types, subscription plans)
- **Notifications** — real in-app notification center (bell icon) across all three portals, backed by one shared table
- **Email** — real SMTP-capable email (falls back to a console log in dev when no SMTP is configured) for password reset, email verification, and booking confirmation

### Explicitly out of scope for now
- Real Razorpay integration (payment gateway is mocked by design decision — see [Known Gaps](#known-gaps))
- Saved payment methods (cards/UPI) — depends on real gateway tokenization

---

## Screens & Responsibilities

Every screen below is a real route in `frontend/src/routes/AppRoutes.tsx`. Layout shells (`UserLayout`, `OwnerLayout`, `AdminLayout`) each own one fixed left sidebar reused by every page in that portal — no page builds its own nav.

### Public

No login required unless noted.

| Route | Screen | Responsibility |
|---|---|---|
| `/` | Home | Marketing landing page: hero search bar (city + date), trending listings, owner acquisition CTA |
| `/about` | About Us | Company mission/story/values (static content) |
| `/terms` | Terms of Service | Legal terms, linked from Signup's agreement checkbox and the footer |
| `/privacy` | Privacy Policy | Privacy policy, linked from the same places |
| `/search` | Search Results | Filterable/sortable listing search (price, amenities, distance), map + list view |
| `/parking/:id` | Parking Detail | Full listing detail: photos, amenities, map, reviews, booking sidebar (booking sidebar only renders for authenticated users) |
| `/login` | Login | Email/password login; redirects to the right portal dashboard by role |
| `/signup` | Signup | Role-aware signup (`user` or `owner`) |
| `/forgot-password` → `/reset-password` | Password reset | Request a reset email, then set a new password via the emailed token |
| `/verify-email` | Verify Email | Consumes the emailed verification token, marks the account verified |
| `/booking` → `/booking/payment` → `/booking/confirmation` | Booking flow | 3-step flow: pick dates + vehicle → pay (mocked gateway) → confirmation screen with receipt |
| `*` | Not Found | Catch-all 404 for any unmatched URL |

### User (Driver) Portal

Sidebar: Dashboard, Find Parking, My Bookings, Profile & Settings, Support. (`My Bookings`/`Find Parking`/`Support` are top-level routes but share the same `UserLayout` shell.)

| Route | Screen | Responsibility |
|---|---|---|
| `/user/dashboard` | Dashboard | Current active booking, spend summary, recent booking history — the post-login landing page for drivers |
| `/find-parking` | Find Parking | Map-based search with quick amenity filter chips, distinct from the public `/search` page (this one is the authenticated, map-first version) |
| `/bookings` | My Bookings | All bookings (tabbed: all/active/completed/cancelled), cancel a booking, write/view a review after completion, view/download a PDF receipt |
| `/user/vehicles` | My Vehicles | Add/edit/remove vehicles, mark one as primary |
| `/user/profile` | Profile & Settings | Edit name/phone, verify-email banner + resend action, payment history |
| `/support` | Help & Support | FAQ + a "send us a message" form that creates a real support ticket the Admin Support Inbox receives |

### Owner Portal

Sidebar: Dashboard, My Locations, Bookings, Earnings, Reviews, Profile.

| Route | Screen | Responsibility |
|---|---|---|
| `/owner/dashboard` | Dashboard | Listings/earnings/bookings summary, recent bookings |
| `/owner/locations` | My Locations | List of owned listings with occupancy, edit/delete |
| `/owner/locations/new` | Add Location | Full listing creation wizard: details, address (Places autocomplete), pricing, amenities, photo upload |
| `/owner/parkings/:id/edit` | Edit Location | Edit an existing listing's details/pricing/status, manage photos, and manage **blocked dates** (take the listing offline for a date range, e.g. for maintenance) |
| `/owner/locations/:id/members` | Cars & Members | Per-listing view of who's currently parked / booking history for that specific location |
| `/owner/bookings` | All Bookings | Every booking across all of this owner's listings, filterable |
| `/owner/earnings` | Earnings | Monthly earnings chart, payout history, gross/commission/net breakdown per transaction |
| `/owner/reviews` | Reviews | Reviews left on the owner's listings; reply publicly to any of them |
| `/owner/subscription` | Subscription | Current plan, usage vs. plan limits, upgrade/downgrade |
| `/owner/settings` | Profile & Settings | Edit profile, listing-approval preference, **KYC document submission**, **bank account submission** (both reviewed by Admin), payout history, verify-email banner |

### Admin Portal

Sidebar main group: Dashboard, Users, Owners, Bookings, Locations, Approvals, Payouts, Reviews, Support. Second group ("Admin Panel"): Configuration, Reports, Audit Log.

| Route | Screen | Responsibility |
|---|---|---|
| `/admin/dashboard` | Dashboard | Platform-wide KPIs (users, listings, bookings, revenue) with month-over-month trend indicators, booking volume chart |
| `/admin/users` | User Management | View/search all accounts, suspend/reactivate, edit role/details |
| `/admin/owners` | Owners | Owner-specific view: revenue per owner, KYC/bank verification status, **approve or reject** an owner's submitted KYC document and bank details |
| `/admin/bookings` | Booking Management | All bookings platform-wide, change status, search/filter by date/location |
| `/admin/locations` | Parking Locations | All listings, activate/suspend, edit |
| `/admin/locations/pending` | Pending Approvals | Queue of newly-submitted listings awaiting admin review before they go live |
| `/admin/payouts` | Payouts | Owner payout queue sourced from `owner_earnings`; select pending payouts and batch mark-as-paid (notifies each owner) |
| `/admin/reviews` | Reviews Moderation | Browse all reviews platform-wide, remove ones that violate content guidelines |
| `/admin/support` | Support Inbox | Receives every message submitted from the User Portal's "Help & Support" form; reply resolves the ticket and notifies the user |
| `/admin/reports` | Reports | Monthly revenue & platform-commission breakdown with CSV export |
| `/admin/audit-log` | Audit Log | Immutable log of every admin mutation (who did what, when, with what details) — covers all ~20 admin write endpoints |
| `/admin/configuration/*` | Configuration | Seven tabs: **Profile** (admin's own account), **Commission** (platform commission rate), **Listing Policy** (default approval requirement), **Support** (public support contact info shown to users), **Amenities** (master list used by search filters + owner listing form), **Parking Types** (master list used by the listing form), **Subscription Plans** (the plans owners can subscribe to) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (CSS-based `@theme`, no config file) |
| Charts | Recharts |
| PDF generation | jsPDF (client-side booking receipts) |
| State Management | Zustand |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Maps | Google Maps Platform — Places Autocomplete + Maps JavaScript API (via `@vis.gl/react-google-maps`) |
| Image Hosting | Cloudinary (unsigned client-side upload) |
| Backend | Node.js + Express v5 + TypeScript |
| Database | PostgreSQL (`pg`), IDs are prefixed ULIDs (e.g. `usr_...`, `bkg_...`), not UUIDs |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Email | Nodemailer — real SMTP if `SMTP_*` env vars are set, otherwise logs to console in dev |
| API Docs | `swagger-jsdoc` + `swagger-ui-express`, served live at `/api-docs` |
| Payments | Mocked (`/api/payments/test/*`) — no real gateway wired yet |

> **Note:** `redis` is present in `backend/package.json` but is not currently used anywhere in the codebase — no config file, no imports. It's a leftover from early planning, not an active part of the architecture.

---

## Project Structure

```
carparkin/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # PostgreSQL pool (DB_HOST/PORT/USER/PASSWORD/NAME)
│   │   │   └── swagger.ts           # OpenAPI spec generation
│   │   ├── modules/                 # one folder per domain, each with
│   │   │   │                        # *.routes.ts / *.controller.ts / *.service.ts
│   │   │   ├── auth/                 # signup, login, password reset, email verification
│   │   │   ├── user/                  # driver dashboard, vehicles, bookings-as-user, reviews, support tickets
│   │   │   ├── owner/                  # owner dashboard, earnings, payouts, settings, KYC/bank submission, reviews received
│   │   │   ├── parkings/                # listing CRUD (owner + public search), images, blackout dates
│   │   │   ├── bookings/                 # availability check, pricing estimate, create/confirm/complete
│   │   │   ├── payments/                  # mocked payment gateway endpoints
│   │   │   ├── subscriptions/              # owner subscription activation
│   │   │   ├── notifications/               # shared in-app notification table/endpoints, used by every module
│   │   │   ├── config/                       # platform settings (commission rate, listing policy, support info)
│   │   │   └── admin/                         # every admin-only endpoint (users, owners, bookings, locations,
│   │   │                                      # payouts, reviews, reports, audit log, configuration)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification + requireAdmin role gate
│   │   │   └── error.ts             # Global error handler
│   │   ├── utils/
│   │   │   ├── ulid.ts              # prefixed ID generators (usr_/own_/adm_/lst_/bkg_/...)
│   │   │   └── email.ts             # sendEmail() — real SMTP or dev console fallback
│   │   ├── types/index.ts           # Shared TS types + Express Request augmentation
│   │   ├── app.ts                   # Express app setup (helmet, cors, route mounting, /api-docs)
│   │   └── server.ts                # Entry point
│   ├── migrations/                  # numbered, sequential, never edit one already run/pushed
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # one *.api.ts per backend module (axios wrappers + response types)
│   │   ├── components/
│   │   │   ├── common/               # Button, Input, Select, Modal, ConfirmDialog, Badge, Pagination,
│   │   │   │                         # DatePicker/DateRangePicker/Calendar/PopoverPortal, ImageUploader, etc.
│   │   │   └── layout/                # UserLayout, OwnerLayout, AdminLayout (each portal's fixed sidebar shell),
│   │   │                              # PublicHeader/PublicFooter, Navbar
│   │   ├── pages/
│   │   │   ├── public/                # Home, SearchResults, ParkingDetail, BookingFlow, PaymentPage, BookingConfirmation
│   │   │   ├── auth/                   # Login, Signup, ForgotPassword, ResetPassword, VerifyEmail
│   │   │   ├── user/                    # driver portal pages
│   │   │   ├── owner/                    # owner portal pages
│   │   │   ├── admin/                     # admin portal pages + admin/configuration/*Tab.tsx
│   │   │   ├── AboutUs.tsx, TermsOfService.tsx, PrivacyPolicy.tsx, NotFound.tsx
│   │   ├── lib/                      # dateUtils, invoicePdf, bookingHelpers, parkingFilters
│   │   ├── store/authStore.ts       # Zustand auth store (JWT + user, persisted to localStorage)
│   │   ├── routes/AppRoutes.tsx     # Every route definition, single source of truth
│   │   └── main.tsx
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Install these on your machine before starting (macOS instructions — adjust for other OS):

| Tool | Install Command | Purpose |
|---|---|---|
| Homebrew | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` | Package manager |
| Node.js (via nvm) | `brew install nvm` then `nvm install --lts` | JavaScript runtime |
| PostgreSQL | `brew install postgresql@16` | Database |
| Git | `brew install git` | Version control |

Verify installs:
```bash
node -v        # v20.x or newer
psql --version
```

Start PostgreSQL:
```bash
brew services start postgresql@16
```

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd carparkin
```

### 2. Install dependencies
```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
See [Environment Variables](#environment-variables) for what to fill in.

### 4. Database
```bash
createdb carparkin
psql -d carparkin -f backend/migrations/003_carparkin_complete.sql
# then run every subsequent numbered migration in order, e.g.:
for f in backend/migrations/0{04..20}_*.sql; do psql -d carparkin -f "$f"; done
psql -d carparkin -f backend/migrations/004_seed_data.sql   # optional test data
```
`001_users.sql` / `002_parkings.sql` are the very first prototype schema and are superseded by `003_carparkin_complete.sql`, which drops and recreates everything — start from `003` on a fresh database.

### 5. Run
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173`. API docs live at `http://localhost:5000/api-docs`.

---

## Environment Variables

### `backend/.env`
```
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=carparkin

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=604800

# Optional — used for password-reset/verify-email links. Defaults to
# http://localhost:5173 if unset.
FRONTEND_URL=http://localhost:5173

# Optional — if unset, emails are logged to the console instead of sent.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Carparkin.in <no-reply@carparkin.in>"
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

**Where to get each key:**
- `JWT_SECRET` — any long random string, e.g. `openssl rand -base64 32`
- `SMTP_*` — any SMTP provider (Mailtrap for local dev is fine); leave blank to just log emails to the console
- `VITE_GOOGLE_MAPS_API_KEY` — Google Cloud Console, with Places API + Maps JavaScript API enabled, key restricted to your domain
- `VITE_CLOUDINARY_CLOUD_NAME` / `UPLOAD_PRESET` — [cloudinary.com](https://cloudinary.com), create an **unsigned** upload preset (uploads happen directly from the browser)

> **Never commit your real `.env` file.** Only `.env.example` (blank/placeholder values) should be committed.

---

## Database

### Tables (as of migration 020)

| Table | Purpose |
|---|---|
| `users` | All accounts — `role` is `user` / `owner` / `admin` |
| `parking_types`, `amenities` | Admin-managed master lists used by search filters and the listing form |
| `subscription_plans`, `user_subscriptions` | Owner subscription tiers and active subscriptions |
| `owner_settings` | Per-owner preferences + KYC/bank verification submission and status |
| `parking_listings`, `parking_listing_amenities`, `parking_listing_images` | Listings and their amenities/photos |
| `parking_blackout_dates` | Owner-blocked date ranges (e.g. maintenance) — respected by availability checks |
| `vehicles` | Driver-owned vehicles |
| `bookings` | Booking records with pricing breakdown and payment status |
| `reviews` | Booking reviews with sub-ratings and an optional owner reply |
| `owner_earnings` | Per-booking payout ledger (`pending` → `paid`), source of the Admin Payouts screen |
| `platform_settings` | Single-row table: commission rate, listing-approval default, support contact info |
| `support_tickets` | User Support form submissions → Admin Support Inbox |
| `notifications` | Shared in-app notification feed for all three portals |
| `password_reset_tokens`, `email_verification_tokens` | Single-use, hashed tokens (raw value only ever exists in the emailed link) |
| `admin_audit_log` | One row per admin mutation — action, entity, admin, timestamp, JSON details |

### Adding new migrations
Add a new numbered file — never edit a migration that's already been pushed and run by someone else:
```bash
backend/migrations/021_your_change.sql
```

---

## Running the Project

```bash
# Terminal 1
cd backend && npm run dev     # nodemon + ts-node, http://localhost:5000

# Terminal 2
cd frontend && npm run dev    # Vite, http://localhost:5173
```

`npm run build` in `frontend/` runs `tsc -b && vite build` — always verify with this, not `tsc --noEmit`, which uses a different tsconfig and misses real errors (see [Known Gaps](#known-gaps)).

---

## API Reference

Full request/response schemas for all **111 endpoints** across 10 modules are served live via Swagger at **`http://localhost:5000/api-docs`** once the backend is running (raw spec at `/api-docs/spec.json`). Module map:

| Prefix | Module | Auth required | Endpoints |
|---|---|---|---|
| `/api/auth` | Signup, login, password reset, email verification | Mixed | 7 |
| `/api/parkings` + `/api/owners/parkings` | Public search/detail + owner listing CRUD, images, blackout dates | Mixed | 15 |
| `/api/owner` | Owner dashboard, earnings, settings, KYC/bank, reviews | Owner JWT | 13 |
| `/api/user` | Driver dashboard, vehicles, bookings-as-user, support tickets, reviews | User JWT | 15 |
| `/api/bookings` | Availability, pricing estimate, create/confirm/complete | Mixed | 7 |
| `/api/payments` | Mocked payment gateway | Mixed | 3 |
| `/api/subscriptions` | Owner subscription activation | Owner JWT | 5 |
| `/api/notifications` | Shared notification feed | Any JWT | 4 |
| `/api/config` / `/api/admin/config` | Platform settings (public read / admin write) | Mixed | 3 |
| `/api/admin` | Every admin-only endpoint | Admin JWT | 39 |
| `/api/health` | Health check | No | 1 |

---

## Design System

Colors, type, and motion patterns used throughout the UI — keep new components consistent with these. Defined as Tailwind v4 `@theme` tokens in `frontend/src/index.css` (no separate config file).

| Token | Value | Use |
|---|---|---|
| `green` | `#22c55e` | **Primary brand color** — primary buttons, active nav state, links, focus rings |
| `green-light` | `#16a34a` | Primary button/link hover state |
| `navy` | `#1B2A4A` | Hero/dark section backgrounds, headings on dark |
| `navy-light` | `#28406B` | Gradient partner to `navy` |
| `amber` | `#F5A623` | Warning/pending states, secondary accents — not the primary CTA color |
| `concrete` | `#F4F5F7` | Page background |
| `ink` | `#15202B` | Body text |
| `line` | `#D7DBE0` | Borders/dividers |
| `danger` | `#D64545` | Error/destructive states |

- **Display font:** Space Grotesk (headings)
- **Body font:** IBM Plex Sans (body text, forms)
- **Mono font:** IBM Plex Mono (plate numbers, access codes)

Signature motifs: animated boom barrier (auth screens), vacancy/occupancy indicators on listing cards, a shared themed `DatePicker`/`DateRangePicker` (calendar popover, not native `<input type="date">`) used everywhere a date is picked.

Each portal (User/Owner/Admin) has exactly one fixed left-sidebar layout, reused by every page in that portal — never build a page-specific nav variant.

---

## Known Gaps

Honest, current list — not aspirational:

- **Payments are mocked.** `/api/payments/test/*` always succeeds (or fails on request) and is explicitly documented as a placeholder for a real Razorpay integration. Fine for demos, blocking for a real launch.
- **No saved payment methods.** Coupled to the item above — needs real gateway tokenization to do safely.
- **No frontend route guards.** Portal access is enforced by the backend (JWT + `requireAdmin` middleware on all `/api/admin/*` routes, per-role checks elsewhere), but the frontend doesn't currently redirect a logged-in user away from a portal's routes they don't have the role for — the page will attempt to render and its API calls will fail with 403.
- **Redis is an unused dependency** — listed in `backend/package.json`, never imported or configured anywhere.
- **A few pre-existing TypeScript errors** surface under the project's real build command (`tsc -b`, used by `npm run build`) in `AddressAutocomplete.tsx` (missing Google Maps global types) and three Recharts tooltip-formatter type mismatches (`AdminDashboard.tsx`, `OwnerDashboard.tsx`, `OwnerEarnings.tsx`). `tsc --noEmit` alone won't catch these — always verify with `tsc -b`.

---

## Contributing (for the 2-developer workflow)

1. Branch off `dev`, never commit directly to `main`
2. Use feature branches: `feature/your-task-name`
3. Open a PR into `dev` when ready
4. `dev` merges into `main` only when stable
5. Run any new migrations locally after pulling teammate commits
