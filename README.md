# Remedy Setu — Partner Lead Management System

A full-stack web application for capturing and managing partner enquiries for **Remedy Setu**, an Indian faith-tech business supplying gemstones, rudraksha and puja services to astrologers, retailers and institutional partners.

![Remedy Setu](https://img.shields.io/badge/Remedy%20Setu-Partner%20Lead%20Management-D4AF37)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)
![Express](https://img.shields.io/badge/Backend-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)

---

## Project Overview

Remedy Setu Partner Lead Management System provides:

- A clean, responsive **public partner enquiry form** for capturing leads from astrologers, retailers and distributors.
- A **secure admin sales dashboard** with token-based authentication.
- A **lead status pipeline** (New → Contacted → Quoted → Won / Lost).
- **Internal notes** per lead, persisted in MongoDB.
- **Search and filtering** by name, phone, city, business type, and status.
- Real-time **sales statistics** (total, new, contacted, quoted, won, lost).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, CSS Modules |
| Backend | Express.js 5, Node.js |
| Database | MongoDB (via Mongoose 8) |
| Authentication | Pre-shared token (Bearer), no JWT signing |
| Deployment | Integrated — Express serves both API and static export |

---

## Features

### Public Enquiry Form
- Fields: Full Name, Phone Number, City, Business Type, Products Interested In (multi-select checkboxes), Additional Message
- Client-side and server-side validation
- Loading spinner during submission
- Success confirmation page on completion
- Error handling for network and server failures

### Admin Sales Dashboard
- Token-authenticated access — stored in `localStorage`, validated on every page load
- **Stats bar**: Total / New / Contacted / Quoted / Won / Lost
- **Searchable, filterable leads table** — search by name or phone; filter by city, business type, or status
- **Inline status change** — PATCH request directly from the table row
- **Lead detail modal** — view all fields, existing notes, and add new notes
- **Logout** — clears token from localStorage

### Lead Status Pipeline
```
New → Contacted → Quoted → Won
                          → Lost
```
Status changes are persisted to MongoDB immediately.

### Internal Notes
Sales staff can add timestamped notes to any lead. Notes are stored as an embedded array within the lead document and persist across page refreshes.

---

## Environment Variable Instructions

### Frontend — `lead-form/.env.local`

```env
NEXT_PUBLIC_API_URL=/api
```

> **Dev note**: When running the Next.js dev server (`localhost:3000`) separately from the Express backend (`localhost:5000`), set this to `http://localhost:5000/api` to avoid 404s. The `/api` relative value is correct for integrated deployment where Express serves both.

### Backend — `backend/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
TOKEN_SECRET=your_admin_token_secret
```

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: 5000) |
| `MONGO_URI` | Full MongoDB connection string (Atlas or local) |
| `TOKEN_SECRET` | The token admin users enter to access the dashboard |

> **Security note**: `TOKEN_SECRET` is both the admin password AND the bearer token. Choose a long, random string. Never commit `.env` to version control.

---

## Local Installation

### Prerequisites
- Node.js v18+
- A MongoDB database (Atlas free tier or local `mongod`)
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/UltronTheAI/LeadForm.git
cd LeadForm

# 2. Install frontend dependencies
cd lead-form
npm install

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Create environment files (see section above)
#    lead-form/.env.local
#    backend/.env

# 5. Start development servers (two terminals)
# Terminal 1 — Frontend
cd lead-form
npm run dev

# Terminal 2 — Backend
cd backend
npm run dev
```

Frontend runs on **http://localhost:3000**  
Backend API runs on **http://localhost:5000**

---

## Database Setup

The application uses MongoDB with:

- **Database name**: `LeadForm`
- **Collection**: `Leads`

No manual schema creation is needed — Mongoose creates the collection automatically on first insert.

### Lead document shape

```json
{
  "_id": "ObjectId",
  "name": "Rajan Sharma",
  "phone": "9876543210",
  "city": "Jaipur",
  "businessType": "Astrologer",
  "productsInterested": ["Gemstones", "Rudraksha"],
  "message": "Looking for wholesale gemstone pricing.",
  "status": "New",
  "notes": [
    { "text": "Called — interested in ruby. Follow up next week.", "createdAt": "..." }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Status enum
`New` | `Contacted` | `Quoted` | `Won` | `Lost`

### Business type enum
`Astrologer` | `Retailer` | `Distributor` | `Other`

### Products enum
`Gemstones` | `Rudraksha` | `Puja Services` | `Other`

---

## Authentication Instructions

This application uses a **pre-shared token** system (not JWT signing despite `jsonwebtoken` being listed as a dependency — it is unused).

### How it works

1. Admin navigates to `/admin`.
2. A modal prompts for the **Admin Token**.
3. The frontend POSTs `{ token }` to `POST /api/verify-token`.
4. The backend compares the submitted token directly against `process.env.TOKEN_SECRET`.
5. If valid, the token is stored in `localStorage` as `adminToken`.
6. All subsequent admin API calls include `Authorization: Bearer <token>` in headers.
7. The backend `verifyToken` middleware repeats the direct string comparison on each protected request.

### Your admin credential

**The value you set in `TOKEN_SECRET` in `backend/.env` is your admin password.** There is no separate admin user account, no signup flow, and no password hashing. Keep `TOKEN_SECRET` long and random.

Example of generating a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Reference

### Public (no authentication)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/leads` | Submit a new partner enquiry |
| `POST` | `/api/verify-token` | Verify an admin token |

### Protected (Bearer token required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/leads/stats` | Counts by status |
| `GET` | `/api/leads` | All leads, sorted newest first |
| `PATCH` | `/api/leads/:id/status` | Update lead status |
| `POST` | `/api/leads/:id/notes` | Add a note to a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |

---

## Project Structure

```
LeadForm/
├── lead-form/                  # Next.js frontend
│   ├── src/app/
│   │   ├── layout.js           # Root layout, metadata
│   │   ├── page.js             # Public partner enquiry form
│   │   ├── page.module.css
│   │   ├── globals.css
│   │   ├── admin/
│   │   │   ├── layout.js       # Admin section metadata
│   │   │   ├── page.js         # Sales dashboard (auth + stats + table + modal)
│   │   │   └── admin.module.css
│   │   └── components/
│   │       ├── TokenModal.js   # Admin login modal
│   │       └── TokenModal.module.css
│   ├── .env.local              # NEXT_PUBLIC_API_URL
│   ├── next.config.mjs         # Static export config
│   └── package.json
│
├── backend/                    # Express API server
│   ├── server.js               # All routes, schemas, middleware
│   ├── scripts/
│   │   ├── deploy.js           # Build + copy + start
│   │   └── copy-frontend-build.js
│   ├── out/                    # Copied Next.js static export (for production)
│   ├── .env                    # PORT, MONGO_URI, TOKEN_SECRET
│   └── package.json
│
└── README.md
```

---

## Integrated Production Deployment

For production, the backend serves both the API and the static Next.js export:

```bash
# From the backend directory
npm run deploy
```

This will:
1. Build the Next.js frontend (`next build` → `out/`)
2. Copy the static files to `backend/out/`
3. Start the Express server

Deploy only the `backend/` directory to your hosting platform (Render, Railway, Heroku, DigitalOcean, etc.). Set the three environment variables in your platform's dashboard.

---

## Features Completed

- [x] Public partner enquiry form with 6 fields and validation
- [x] Server-side field validation (name, phone, city, businessType required)
- [x] Lead saved to MongoDB with `status: 'New'` by default
- [x] Token-based admin authentication
- [x] Sales dashboard with stats bar (Total / New / Contacted / Quoted / Won / Lost)
- [x] Leads table with search (name/phone) and filters (city, business type, status)
- [x] Inline status change with pipeline (New → Contacted → Quoted → Won/Lost)
- [x] Lead detail modal with all fields visible
- [x] Internal notes — add and view per lead, persisted in MongoDB
- [x] Logout functionality
- [x] Frontend static export build passes (Next.js 15)
- [x] Backend Express server with all routes

## Future Improvements

- [ ] Pagination for large lead sets
- [ ] Export leads to CSV
- [ ] Email notification on new enquiry submission
- [ ] Role-based access (multiple sales users with individual passwords)
- [ ] Proper JWT signing with expiry (replace pre-shared token)
- [ ] Lead assignment to specific sales team members
- [ ] Dashboard charts (conversion funnel, leads over time)
- [ ] WhatsApp/SMS integration for follow-up automation

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Attribution

This project is adapted from the original **[LeadForm](https://github.com/UltronTheAI/LeadForm)** repository by [UltronTheAI (Swaraj Puppalwar)](https://github.com/UltronTheAI), used under the MIT License.

The original architecture (Next.js + Express + MongoDB + token authentication + integrated static deployment) has been preserved. The application has been extended with new data models, API routes and a full sales dashboard for the Remedy Setu use case.
