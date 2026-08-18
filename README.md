# FixTriage

A location-based home-services marketplace. Users find nearby service providers (electricians, plumbers, cleaners, and more) on a map, book appointments, and rate providers. Includes an optional AI layer that classifies free-text problem descriptions into service categories.

## Tech Stack

- **Backend:** NestJS (Node.js, TypeScript)
- **Frontend:** React + Vite
- **Database:** PostgreSQL (Neon cloud) with Prisma ORM
- **Auth:** bcrypt password hashing + JWT (planned)
- **Maps:** Google Maps Platform
- **AI:** OpenAI API (triage feature)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
# copy .env.example to .env and fill in DATABASE_URL
npx prisma migrate dev
npm run start:dev
```

Runs on http://localhost:3000 — health check at `/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173.

## Team

- Islam
- Abdalmajed
- Mustafa