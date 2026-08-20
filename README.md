# Voxly — Social Opinion Polling Platform (V1 MVP)

> A modern, mobile-first social polling app where users vote, debate, and discover what people really think.

---

## Tech Stack

| Layer           | Technology                                    |
|-----------------|-----------------------------------------------|
| Frontend        | Next.js 14, React, TypeScript, Tailwind CSS   |
| Backend         | Node.js, Express, TypeScript                  |
| Database        | PostgreSQL                                    |
| Auth            | Google OAuth 2.0 (ID token / credential flow) |
| Frontend Deploy | Vercel                                        |
| Backend Deploy  | Render                                        |

---

## Repository Structure

```
opinion-poll/
├── frontend/          # Next.js 14 app
├── backend/           # Express REST API
├── README.md
└── .gitignore
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- A Google Cloud project with OAuth 2.0 credentials

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
7. Copy the **Client ID** — you'll need it in both backend and frontend `.env` files.
   The **Client Secret** is only needed by the backend.

---

## Database Setup

```bash
# Create the local database
createdb voxly

# Or with psql:
psql -U postgres -c "CREATE DATABASE voxly;"
```

---

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# Run database migrations (creates all tables)
npm run db:migrate

# (Optional) Seed with sample polls for development
npm run db:seed

# Start development server (port 4000)
npm run dev
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

### Backend (`cd backend`)

| Command                 | Description                                    |
|-------------------------|------------------------------------------------|
| `npm run dev`           | Start dev server with hot reload               |
| `npm run build`         | Compile TypeScript to `dist/`                  |
| `npm run start`         | Run compiled production server                 |
| `npm run lint`          | Run ESLint                                     |
| `npm run db:migrate`    | Run schema migrations (dev, uses ts-node)      |
| `npm run db:migrate:prod` | Run compiled migrations (production/Render) |
| `npm run db:seed`       | Seed development data (never run in production)|

### Frontend (`cd frontend`)

| Command         | Description                 |
|-----------------|-----------------------------|
| `npm run dev`   | Start Next.js dev server    |
| `npm run build` | Production build            |
| `npm run start` | Run production server       |
| `npm run lint`  | Run ESLint                  |

---

## Environment Variables

### Backend — `backend/.env`

| Variable              | Required | Description                                         |
|-----------------------|----------|-----------------------------------------------------|
| `PORT`                | No       | Server port (default: `4000`)                       |
| `DATABASE_URL`        | **Yes**  | PostgreSQL connection string                        |
| `GOOGLE_CLIENT_ID`    | **Yes**  | Google OAuth Client ID                              |
| `GOOGLE_CLIENT_SECRET`| **Yes**  | Google OAuth Client Secret                          |
| `SESSION_SECRET`      | **Yes**  | Secret for signing sessions (min 32 chars)          |
| `FRONTEND_URL`        | **Yes**  | Frontend origin for CORS (e.g. `http://localhost:3000`) |
| `NODE_ENV`            | No       | `development` or `production`                       |

Example `backend/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voxly
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=a-long-random-secret-string-at-least-32-chars
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend — `frontend/.env.local`

| Variable                     | Required | Description                    |
|------------------------------|----------|--------------------------------|
| `NEXT_PUBLIC_API_URL`        | **Yes**  | Backend API base URL           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **Yes** | Google OAuth Client ID        |
| `NEXT_PUBLIC_APP_NAME`       | No       | App display name (default: Voxly) |

Example `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_APP_NAME=Voxly
```

> **Never commit `.env` or `.env.local` to git.** They are already in `.gitignore`.

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** → `backend`
4. Set **Build Command** → `npm install && npm run build && npm run db:migrate:prod`
5. Set **Start Command** → `npm run start`
6. Add a **PostgreSQL** database on Render; copy its **Internal Database URL** as `DATABASE_URL`
7. Add all remaining environment variables in the Render dashboard

### Frontend → Vercel

1. Import your GitHub repo at [Vercel](https://vercel.com)
2. Set **Root Directory** → `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL (e.g. `https://voxly-api.onrender.com`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → your Google Client ID
4. Add your Vercel domain to Google Cloud Console **Authorized JavaScript origins**
5. Deploy

---

## API Reference

### Auth
| Method | Endpoint           | Auth     | Description                      |
|--------|--------------------|----------|----------------------------------|
| POST   | `/api/auth/google` | —        | Login/register with Google ID token |
| GET    | `/api/auth/me`     | ✅       | Get current session user          |
| POST   | `/api/auth/logout` | —        | Destroy session                   |

### Polls
| Method | Endpoint                   | Auth     | Description                    |
|--------|----------------------------|----------|--------------------------------|
| GET    | `/api/polls`               | Optional | List polls (newest first)      |
| GET    | `/api/polls/trending`      | Optional | Trending polls by score        |
| GET    | `/api/polls/:id`           | Optional | Get single poll with results   |
| POST   | `/api/polls`               | ✅       | Create a poll                  |
| DELETE | `/api/polls/:id`           | ✅       | Delete own poll                |
| POST   | `/api/polls/:id/vote`      | ✅       | Vote on a poll (once only)     |
| GET    | `/api/polls/:id/results`   | Optional | Get current poll results       |

### Comments
| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| GET    | `/api/polls/:id/comments`    | Optional | List comments        |
| POST   | `/api/polls/:id/comments`    | ✅   | Post a comment           |
| DELETE | `/api/comments/:id`          | ✅   | Delete own comment       |

### Users
| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| GET    | `/api/users/:username`| —    | Get user profile & polls |
| PUT    | `/api/users/me`       | ✅   | Update own profile       |
| GET    | `/api/users/me/polls` | ✅   | Get own polls            |

---

## Database Schema

```
users           — Google OAuth users (google_id, email, username, display_name, avatar_url, bio)
polls           — Polls created by users (question, category, image_url)
poll_options    — 2–4 options per poll (option_text, position)
votes           — One vote per user per poll (enforced by UNIQUE constraint)
comments        — User comments on polls (content, up to 500 chars)
user_sessions   — Express session store (auto-created by connect-pg-simple)
```

---

## Security

- Sessions stored in PostgreSQL (`connect-pg-simple`)
- Helmet for HTTP security headers
- CORS restricted to `FRONTEND_URL` only
- Rate limiting: 300 req/15min globally, 20 req/15min on auth, 10 comments/min
- User identity always derived from server-side session — never trusted from request body
- `UNIQUE(poll_id, user_id)` DB constraint prevents duplicate votes at the database level
- Authorization checks on all mutation endpoints (polls, comments, profile)
- All DB queries use parameterized statements (no string interpolation)

---

## Trending Score Formula

```
trendingScore = votes + (comments × 2) + GREATEST(0, 10 - hours_since_created)
```

Newer polls get up to +10 bonus points, decaying over 10 hours.

---

## V2 Roadmap (not implemented)

- Push notifications / activity feed
- Poll boosts and sponsored polls
- Subscriptions & payments
- Direct messaging
- Advanced analytics dashboard
- Mobile app (React Native)
- AI-powered recommendations
