<div align="center">

# 🌱 GreenKart

**Reduce food waste. Feed communities.**

GreenKart is a full-stack Progressive Web App that connects food donors, NGOs, and individuals to redistribute surplus food in real time — before it goes to waste.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/pwa)
[![Version](https://img.shields.io/badge/version-1.1.0-2E7D32?style=flat-square)](./CHANGELOG.md)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure) · [API Reference](#api-reference) · [Admin Panel](#admin-panel) · [Roadmap](#roadmap)

</div>

---

## Overview

Millions of tons of edible food are wasted every year while communities face food insecurity. GreenKart bridges this gap by providing a location-aware food exchange ecosystem where:

- **Donors** (households, restaurants, caterers, grocery stores) can list surplus food in under a minute
- **NGOs and food banks** can browse, claim, and coordinate bulk pickups
- **Individuals** can discover free food nearby and connect with donors directly
- **Admins** get a full platform dashboard to manage users, listings, and community health

Everything happens in real time — live messaging, instant status updates, and push notifications keep all parties in sync throughout the exchange.

---

## Features

### Core Exchange Flow
- **Food listings** — create with photos (up to 3), category, quantity, expiry date, and pickup instructions
- **Geo-tagged listings** — address autocomplete via OpenStreetMap Nominatim; all listings with coordinates appear on the interactive map
- **Claim & complete lifecycle** — NGO/individual claims a listing → donor confirms pickup → exchange marked complete
- **Role-guarded actions** — only donors can create/edit/delete their listings; only NGOs and individuals can claim

### Real-Time Communication
- **Live chat** — Socket.IO messaging per listing, with typing indicators and date-grouped history
- **Conversation sidebar** — all active conversations in one place, with unread badge counts
- **Push notifications** — browser-level Web Push on claim, exchange complete, new message, and expiry warning
- **Email alerts** — transactional emails for welcome, claimed, complete, expiry warning, and new message

### Discovery & Map
- **Browse & filter** — search by keyword, filter by category and status, paginated results
- **Interactive map** — Leaflet + OpenStreetMap, zero API key required; color-coded pins (🟢 active / 🟡 claimed) with category emoji
- **Click-to-detail** — map popup shows food details and links directly to the listing
- **List panel** — collapsible sidebar to browse and fly-to any listing on the map

### Dashboards
- **Donor dashboard** — active listings, total donated, completed exchanges, community stats
- **NGO / Individual dashboard** — items claimed, available nearby, completed exchanges
- **Admin panel** — platform-wide stats, monthly bar charts, role breakdown, user and listing management

### Security & Reliability
- **JWT + rotating refresh tokens** — 7-day access tokens, 30-day refresh tokens, silent client-side re-auth
- **Rate limiting** — auth (10 req/15 min), API (100 req/15 min), uploads (20 req/hr)
- **HTTP security headers** — Helmet.js with full Content Security Policy
- **Input sanitisation** — express-validator on all endpoints; HTML/XSS stripped from every free-text field
- **Automated cron jobs** — hourly expiry sweep, daily archival of stale claimed listings, expiry warning sender, token cleanup

### PWA
- Installable to home screen on any device
- Service worker with asset caching for fast repeat loads
- Offline-safe shell — app stays usable when connectivity drops

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | 6.24 | Client-side routing |
| React Hook Form | 7.52 | Form state & validation |
| Axios | 1.7 | HTTP client |
| Socket.IO Client | 4.7 | Real-time messaging |
| Leaflet | 1.9 | Interactive maps |
| React Hot Toast | 2.4 | Toast notifications |
| Lucide React | 0.400 | Icon set |
| Vite PWA Plugin | 0.20 | Service worker & manifest |

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 18+ | Server runtime |
| Express | 4.19 | HTTP framework |
| Mongoose | 8.5 | MongoDB ODM |
| Socket.IO | 4.7 | WebSocket server |
| JSON Web Token | 9.0 | Access token auth |
| bcryptjs | 2.4 | Password hashing |
| Cloudinary SDK | 1.41 | Image upload & CDN |
| Multer | 1.4 | Multipart file handling |
| Helmet | 8.2 | HTTP security headers |
| express-rate-limit | 8.5 | Request rate limiting |
| express-validator | 7.3 | Input validation & sanitisation |
| node-cron | 4.5 | Scheduled jobs |
| Nodemailer | 9.0 | Transactional email |
| web-push | 3.6 | Web Push notifications |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Primary database |
| Cloudinary | Image storage & CDN |
| OpenStreetMap Nominatim | Address autocomplete & geocoding |
| Any SMTP provider | Email delivery |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/greenkart.git
cd greenkart
```

### 2. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
# ── Core ──────────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Database ──────────────────────────────────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/greenkart

# ── Auth ──────────────────────────────────────────────────────────────────────
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=7d

# ── Cloudinary ────────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email (optional — app works without it) ───────────────────────────────────
# Works with any SMTP provider: Gmail, SendGrid, Resend, Mailgun, etc.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=noreply@greenkart.com

# ── Web Push (optional — app works without it) ────────────────────────────────
# Generate keys once with: cd server && npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=admin@greenkart.com
```

> **Note:** SMTP and Web Push are fully optional. If the env vars are absent, those features are silently skipped and the rest of the app works normally.

### 4. Generate VAPID keys (optional, for push notifications)

```bash
cd server && npx web-push generate-vapid-keys
# Copy the output into your .env
```

### 5. Run development servers

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

### 6. Create the first admin user

```bash
cd server && npm run seed:admin
```

Default credentials (change after first login):

```
Email:    admin@greenkart.com
Password: Admin@123
```

Access the admin panel at: http://localhost:5173/admin

---

## Project Structure

```
greenkart/
│
├── client/                          # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── admin/
│       │   │   └── AdminLayout.jsx  # Admin sidebar + layout
│       │   ├── common/
│       │   │   ├── LocationInput.jsx # Nominatim address autocomplete
│       │   │   └── Spinner.jsx
│       │   ├── dashboard/
│       │   │   └── StatCard.jsx
│       │   ├── layout/
│       │   │   ├── Layout.jsx       # Main app shell
│       │   │   └── Navbar.jsx
│       │   └── listings/
│       │       └── FoodCard.jsx
│       │
│       ├── context/
│       │   ├── AuthContext.jsx      # JWT + refresh token state
│       │   └── SocketContext.jsx    # Socket.IO connection
│       │
│       ├── hooks/
│       │   ├── usePushNotifications.js  # Web Push subscribe/unsubscribe
│       │   └── useTokenRefresh.js       # Silent access token refresh
│       │
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminListings.jsx
│       │   │   ├── AdminMap.jsx
│       │   │   ├── AdminOverview.jsx
│       │   │   └── AdminUsers.jsx
│       │   ├── CreateListing.jsx
│       │   ├── Dashboard.jsx
│       │   ├── EditListing.jsx
│       │   ├── Landing.jsx
│       │   ├── ListingDetail.jsx
│       │   ├── Listings.jsx
│       │   ├── Login.jsx
│       │   ├── MapView.jsx
│       │   ├── Messages.jsx
│       │   ├── NotFound.jsx
│       │   ├── Profile.jsx
│       │   └── Register.jsx
│       │
│       ├── services/
│       │   └── api.js               # Axios instance with auth interceptor
│       │
│       ├── App.jsx                  # Route definitions
│       ├── index.css                # Tailwind + global component classes
│       └── main.jsx
│
├── server/                          # Node.js + Express backend
│   ├── config/
│   │   ├── cloudinary.js            # Cloudinary + multer setup
│   │   └── db.js                    # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── adminController.js       # Platform stats, user & listing mgmt
│   │   ├── authController.js        # Register, login, refresh, logout
│   │   ├── listingController.js     # CRUD, claim, complete, map data
│   │   └── messageController.js     # Chat history, send, conversations
│   │
│   ├── middleware/
│   │   ├── admin.js                 # Admin role guard
│   │   ├── auth.js                  # JWT protect + role authorize
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── security.js              # Helmet + rate limiters
│   │   └── validate.js              # express-validator rule sets + sanitiser
│   │
│   ├── models/
│   │   ├── Listing.js               # Food listing schema
│   │   ├── Message.js               # Chat message schema
│   │   ├── PushSubscription.js      # Web Push subscription schema
│   │   ├── RefreshToken.js          # Rotating refresh token schema
│   │   └── User.js                  # User schema (donor/ngo/individual/admin)
│   │
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── listings.js
│   │   ├── messages.js
│   │   └── push.js
│   │
│   ├── scripts/
│   │   └── seedAdmin.js             # One-time admin user seeder
│   │
│   ├── utils/
│   │   ├── cron.js                  # Scheduled jobs (expiry, cleanup)
│   │   ├── email.js                 # Nodemailer transactional emails
│   │   ├── errorResponse.js         # ErrorResponse class
│   │   ├── generateToken.js         # JWT sign helper
│   │   └── push.js                  # Web Push notification helpers
│   │
│   ├── .env.example
│   ├── index.js                     # Server entry — Express + Socket.IO + cron
│   └── package.json
│
├── setup.sh                         # Quick environment setup helper
└── README.md
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Create account (donor / ngo / individual) |
| `POST` | `/auth/login` | Public | Login, returns access + refresh token |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Private | Revoke refresh token |
| `GET` | `/auth/me` | Private | Get current user profile |
| `PUT` | `/auth/profile` | Private | Update name, phone, address |

### Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/listings` | Public | Get listings — `?search=`, `?category=`, `?status=`, `?page=`, `?limit=` |
| `GET` | `/listings/:id` | Public | Get single listing (increments view count) |
| `GET` | `/listings/my` | Private | Get logged-in donor's own listings |
| `GET` | `/listings/stats` | Private | Dashboard stats for current user |
| `GET` | `/listings/map-data` | Private | Active listings with lat/lng for map |
| `POST` | `/listings` | Donor | Create listing (multipart/form-data with images) |
| `PUT` | `/listings/:id` | Donor | Update listing details |
| `DELETE` | `/listings/:id` | Donor | Delete listing + Cloudinary images |
| `PUT` | `/listings/:id/claim` | NGO / Individual | Claim a listing |
| `PUT` | `/listings/:id/complete` | Donor | Mark exchange complete |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/messages/conversations` | Private | All conversations for current user |
| `GET` | `/messages/:listingId/:userId` | Private | Message thread between two users on a listing |
| `POST` | `/messages` | Private | Send a message |

### Admin

All admin endpoints require `role: "admin"`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Platform stats + monthly charts + recent activity |
| `GET` | `/admin/map` | All geo-tagged listings (active + claimed) |
| `GET` | `/admin/users` | List users — `?search=`, `?role=`, `?page=` |
| `GET` | `/admin/users/:id` | User detail + their listings |
| `PUT` | `/admin/users/:id/toggle` | Activate or deactivate a user |
| `DELETE` | `/admin/users/:id` | Delete user + all their listings and messages |
| `GET` | `/admin/listings` | All listings — `?search=`, `?status=`, `?page=` |
| `PUT` | `/admin/listings/:id/expire` | Force-expire a listing |
| `DELETE` | `/admin/listings/:id` | Delete any listing |

### Push Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/push/vapid-public-key` | Public | Fetch VAPID public key for browser |
| `POST` | `/push/subscribe` | Private | Save a Web Push subscription |
| `DELETE` | `/push/unsubscribe` | Private | Remove subscription |

---

## Socket.IO Events

The server runs on the same port as the HTTP API. Connect with:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
```

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `userId` | Register user for personal notifications |
| `chat:join` | `{ listingId, userId }` | Join a listing's chat room |
| `message:send` | `{ listingId, senderId, receiverId, content, senderName }` | Send a chat message |
| `chat:typing` | `{ listingId, userId, userName }` | Broadcast typing indicator |
| `chat:stopTyping` | `{ listingId, userId }` | Stop typing indicator |
| `listing:claimed` | `{ listingId, claimedBy }` | Notify all clients of claim |
| `listing:completed` | `{ listingId }` | Notify all clients of completion |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:receive` | message object | New message in a chat room |
| `notification:message` | `{ listingId, senderName, preview }` | Personal message notification |
| `listing:statusUpdate` | `{ listingId, status, claimedBy? }` | Listing status changed |
| `chat:userTyping` | `{ userId, userName }` | Someone is typing |
| `chat:userStopTyping` | `{ userId }` | Someone stopped typing |

---

## Database Models

### User
```
name, email, password (hashed), role (donor|ngo|individual|admin),
phone, address, avatar, isActive, totalDonations, totalReceived
```

### Listing
```
donor (ref), foodName, description, quantity, category, expiryDate,
pickupInstructions, images [{ url, publicId }], location { address, lat, lng },
status (active|claimed|completed|expired), claimedBy (ref), claimedAt,
completedAt, views
```

### Message
```
listing (ref), sender (ref), receiver (ref), content, isRead
```

### RefreshToken
```
token, user (ref), expiresAt, isRevoked, userAgent, ip
```

### PushSubscription
```
user (ref), subscription { endpoint, keys { p256dh, auth } }
```

---

## Admin Panel

Access at `/admin` — login with an `admin` role account.

```bash
# Create the first admin (run once after setting up .env)
cd server && npm run seed:admin

# Default credentials
Email:    admin@greenkart.com
Password: Admin@123
```

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/admin` | Stats, charts, role breakdown, recent activity |
| Users | `/admin/users` | Search/filter users, view details, activate/deactivate, delete |
| Listings | `/admin/listings` | Manage all listings, force-expire, delete |
| Map | `/admin/map` | Interactive map of all active and claimed listings |

---

## Cron Jobs

Four scheduled jobs run automatically when the server starts:

| Schedule | Job | Description |
|----------|-----|-------------|
| Every hour | Expiry sweep | Marks active listings past `expiryDate` as `expired` |
| Daily at 12:00 | Expiry warnings | Sends push + email to donors with listings expiring within 24h |
| Daily at 02:00 | Token cleanup | Deletes expired and revoked refresh tokens |
| Daily at 03:00 | Stale claim archive | Marks claimed listings not completed within 7 days as `expired` |

---

## User Roles

| Role | Can Do |
|------|--------|
| **Donor** | Create, edit, delete listings · Chat with claimants · Mark exchanges complete · View own dashboard |
| **NGO** | Browse & claim listings · Coordinate pickups · Track impact · Message donors |
| **Individual** | Discover food nearby · Claim listings · Message donors · Track received food |
| **Admin** | All of the above + platform management dashboard |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens |
| `JWT_EXPIRE` | No | Access token TTL (default: 7d) |
| `CLIENT_URL` | **Yes** | Frontend URL for CORS + email links |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (587 or 465) |
| `SMTP_USER` | No | SMTP username / email |
| `SMTP_PASS` | No | SMTP password or app password |
| `SMTP_FROM` | No | Sender address in emails |
| `VAPID_PUBLIC_KEY` | No | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for Web Push |
| `VAPID_EMAIL` | No | Contact email for VAPID |

---

## Scripts

### Backend

```bash
npm run dev          # Start with nodemon (auto-restart)
npm run start        # Start production server
npm run seed:admin   # Create the first admin user
```

### Frontend

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build to dist/
npm run preview      # Preview the production build locally
```

---

## Roadmap

| Milestone | Status | Features |
|-----------|--------|----------|
| **v1.0** | ✅ Shipped | Auth, listings, real-time chat, map, dashboard, admin panel, PWA |
| **v1.1** | ✅ Shipped | Security hardening, token refresh, email alerts, push notifications, expiry cron, coordinate validation |
| **v1.5** | 🔜 Planned | Volunteer transport network, donor reputation & reviews, recurring donation scheduling, group listings |
| **v2.0** | 🔮 Future | AI-based food matching, smart expiry prediction, food waste analytics, carbon footprint tracker |
| **v3.0** | 🔮 Future | Multi-city support, NGO bulk claim & route optimisation, Open API, native mobile apps |

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/your-feature`
2. Follow the existing code style — Prettier + ESLint config
3. Write clear commit messages
4. Open a pull request with a description of what changed and why

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">

Built with 💚 to reduce food waste and feed communities.

**[⭐ Star this repo](https://github.com/your-username/greenkart)** if GreenKart helped you or inspired you.

</div>
