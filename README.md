# 🌱 GreenKart

> Reduce food waste. Feed communities.

GreenKart is a full-stack PWA built with the MERN stack that connects food donors, NGOs, and individuals to redistribute surplus food in real time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Hook Form, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Media | Cloudinary |
| Location | OpenStreetMap Nominatim |
| PWA | Vite PWA Plugin |

---

## Project Structure

```
greenkart/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── layout/
│   │   │   └── listings/
│   │   ├── context/     # Auth + Socket contexts
│   │   ├── pages/       # All page components
│   │   ├── services/    # Axios API instance
│   │   └── main.jsx
│   └── package.json
│
└── server/          # Express backend
    ├── config/      # DB + Cloudinary config
    ├── controllers/ # Route handlers
    ├── middleware/  # Auth + Error handling
    ├── models/      # Mongoose schemas
    ├── routes/      # API routes
    ├── utils/       # Helpers
    └── index.js
```

---

## Setup

### 1. Clone & Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Fill in your `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/greenkart
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get all listings (filterable) |
| GET | `/api/listings/:id` | Get single listing |
| POST | `/api/listings` | Create listing (donor) |
| PUT | `/api/listings/:id` | Update listing (donor) |
| DELETE | `/api/listings/:id` | Delete listing (donor) |
| PUT | `/api/listings/:id/claim` | Claim listing (NGO/individual) |
| PUT | `/api/listings/:id/complete` | Mark complete (donor) |
| GET | `/api/listings/my` | My listings |
| GET | `/api/listings/stats` | Dashboard stats |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | All conversations |
| GET | `/api/messages/:listingId/:userId` | Conversation messages |
| POST | `/api/messages` | Send message |

---

## User Roles

- **Donor** — Create and manage food listings, chat with recipients
- **NGO** — Browse listings, claim donations, track impact
- **Individual** — Discover food, request pickups, communicate with donors

---

## PWA

GreenKart is a Progressive Web App. When accessed in a browser, users will be prompted to install it to their home screen. The service worker enables offline support and asset caching.

---

## Socket Events

| Event | Description |
|-------|-------------|
| `user:join` | User connects with their ID |
| `chat:join` | Join a listing chat room |
| `message:send` | Send a real-time message |
| `message:receive` | Receive a real-time message |
| `chat:typing` | Typing indicator |
| `listing:claimed` | Listing claimed event |
| `listing:completed` | Exchange completed event |
