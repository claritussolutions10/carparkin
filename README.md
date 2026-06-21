# Carparkin.in

A parking marketplace platform connecting drivers looking for monthly parking with parking space owners (apartment societies, commercial lots) across India.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Design System](#design-system)

---

## Features

### Implemented (MVP in progress)
- ✅ **Authentication** — Signup, login, JWT-based session management
- ✅ **Owner Parking CRUD** — Owners can add, edit, delete parking listings
- ✅ **Search & Discovery** — Drivers can search parking by city, price range, amenities
- ✅ **Parking Detail View** — Full listing detail with vacancy status
- 🔄 **Image Upload** — Cloudinary-based image upload for listings (in progress)
- 🔄 **Map Integration** — Google Maps address autocomplete + location display (in progress)

### Planned (Post-MVP)
- Booking & reservation system
- Razorpay payment integration
- Owner dashboard with revenue analytics
- Admin panel
- AI search assistant / chatbot
- Dynamic pricing suggestions
- Live map view on search results

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Caching | Redis |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Payments (planned) | Razorpay |
| Maps | Google Maps Platform (Places, Geocoding, Maps JS API) |
| Image Hosting | Cloudinary |
| Hosting (MVP) | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
carparkin/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # PostgreSQL connection pool
│   │   │   └── redis.ts             # Redis client config
│   │   ├── modules/
│   │   │   ├── auth/                # Signup, login, JWT verification
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── users/
│   │   │   ├── owners/
│   │   │   ├── parkings/            # Parking CRUD + search
│   │   │   ├── bookings/            # (planned)
│   │   │   └── payments/            # (planned)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification middleware
│   │   │   └── error.ts             # Global error handler
│   │   ├── utils/
│   │   ├── types/
│   │   │   └── index.ts             # Shared TS types
│   │   ├── app.ts                   # Express app setup (helmet, cors, routes)
│   │   └── server.ts                # Entry point
│   ├── migrations/
│   │   ├── 001_users.sql
│   │   ├── 002_parkings.sql
│   │   └── seed.sql                 # Dummy test data
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # API call functions (axios wrappers)
│   │   │   ├── client.ts            # Axios instance with auth interceptor
│   │   │   ├── auth.api.ts
│   │   │   └── parkings.api.ts
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI: Button, Input, ParkingCard,
│   │   │   │                        # VacancyGauge, EmptyState, ImageUploader, etc.
│   │   │   └── layout/              # Navbar, AuthLayout, BarrierGate
│   │   ├── pages/
│   │   │   ├── user/                # Home, SearchResults, ParkingDetail, Dashboard
│   │   │   ├── owner/                # OwnerDashboard, ManageParkings, ParkingForm
│   │   │   └── auth/                  # Login, Signup
│   │   ├── store/                    # Zustand stores (authStore.ts)
│   │   ├── hooks/
│   │   ├── routes/
│   │   │   └── AppRoutes.tsx         # All route definitions
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json                      # Root scripts (run both servers together)
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
| Redis | `brew install redis` | Caching layer |
| Git | `brew install git` | Version control |

Verify installs:
```bash
node -v        # should show v20.x or v22.x
psql --version
redis-cli ping  # should return "PONG" once redis is running
```

Start PostgreSQL and Redis services:
```bash
brew services start postgresql@16
brew services start redis
```

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/carparkin.git
cd carparkin
```

### 2. Install dependencies for both backend and frontend
```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Set up environment variables
Copy the example files and fill in your own values:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
See [Environment Variables](#environment-variables) below for what each value should be.

### 4. Set up the database
```bash
createdb carparkin_dev
psql -d carparkin_dev -f backend/migrations/001_users.sql
psql -d carparkin_dev -f backend/migrations/002_parkings.sql
psql -d carparkin_dev -f backend/migrations/seed.sql   # optional, adds test data
```

### 5. Run the project
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173`.

---

## Environment Variables

### `backend/.env`
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/carparkin_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

**Where to get each key:**
- `JWT_SECRET` — generate any long random string, e.g. `openssl rand -base64 32`
- `RAZORPAY_KEY_ID` / `SECRET` — sign up at [razorpay.com](https://razorpay.com), use test mode keys for development
- `VITE_GOOGLE_MAPS_API_KEY` — Google Cloud Console, with Maps JavaScript API, Places API, and Geocoding API enabled, key restricted to your domain
- `VITE_CLOUDINARY_CLOUD_NAME` / `UPLOAD_PRESET` — sign up at [cloudinary.com](https://cloudinary.com), create an unsigned upload preset

> **Never commit your real `.env` file.** It's already excluded via `.gitignore`. Only `.env.example` (with blank/placeholder values) should be committed.

---

## Database Setup

### Schema overview

```
users        — driver accounts (id, name, email, password, phone)
owners       — parking owner accounts (id, name, email, subscription_plan, subscription_expiry)
parkings     — parking listings (id, owner_id, title, address, city, lat/lng, monthly_price, capacity, amenities, images, status)
bookings     — (planned) monthly booking records linking users/cars to parkings
```

### Adding new migrations
When the schema changes, add a new numbered file — never edit an old migration that's already been pushed and run by someone else:
```bash
backend/migrations/003_bookings.sql
```

---

## Running the Project

From the root, after running `npm install` once at root level (`npm install -D concurrently`), you can start both servers together:
```bash
npm run dev
```

Or run them separately as shown in Setup Instructions step 5.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Create account → returns `{ token, user }` |
| POST | `/login` | Login → returns `{ token, user }` |
| GET | `/me` | Get current user (requires `Authorization: Bearer <token>`) |

### Parkings — Owner (`/api/owners/parkings`) — requires auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a parking listing |
| GET | `/` | List all parkings owned by logged-in owner |
| GET | `/:id` | Get one owned parking |
| PUT | `/:id` | Update a parking |
| DELETE | `/:id` | Delete a parking |

### Parkings — Public (`/api/parkings`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Search parkings — query params: `city`, `minPrice`, `maxPrice`, `amenities` |
| GET | `/:id` | Get full detail for one parking |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

---

## Design System

Colors, type, and motion patterns used throughout the UI — keep new components consistent with these:

| Token | Value | Use |
|---|---|---|
| `navy` | `#1B2A4A` | Primary brand, buttons, headers |
| `amber` | `#F5A623` | CTAs, accents, focus rings |
| `concrete` | `#F4F5F7` | Page background |
| `ink` | `#15202B` | Body text |
| `line` | `#D7DBE0` | Borders/dividers |
| `danger` | `#D64545` | Error states |

- **Display font:** Space Grotesk (headings)
- **Body font:** IBM Plex Sans (body text, forms)
- **Mono font:** IBM Plex Mono (plate numbers, codes)

Signature motifs: animated boom barrier (auth screens), vacancy gauge (parking availability indicator on cards and detail pages).

---

## Contributing (for the 2-developer workflow)

1. Branch off `dev`, never commit directly to `main`
2. Use feature branches: `feature/your-task-name`
3. Open a PR into `dev` when ready
4. `dev` merges into `main` only when stable
5. Run migrations locally after pulling new ones from teammate's commits