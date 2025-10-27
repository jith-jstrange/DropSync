# Dropship Sync (WooCommerce <> Shopify)

Open-source, self-hosted inventory and order synchronization.

## Tech Stack
- Backend: Node.js + Express, Prisma (SQLite), JWT, AES-256-GCM encryption
- Frontend: React + Vite + Tailwind
- Queue: In-memory queue (single-node)
- Email: Nodemailer (optional SMTP)

## Features
- Connect WooCommerce (Application Passwords) and Shopify (OAuth)
- Bidirectional webhooks and manual/polling triggers
- Dashboard to manage connections and trigger syncs

## Setup

### Backend
1. Copy env
```bash
cp backend/.env.example backend/.env
```
2. Edit `backend/.env` with `JWT_SECRET`, `ENCRYPTION_KEY_HEX`, and Shopify keys
3. Install deps and migrate
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and log in. Use Dashboard to connect stores.

## Docker
```bash
docker compose up --build
```

## Notes
- Webhook verification for Shopify uses `X-Shopify-Hmac-Sha256`
- Do not store passwords; tokens are encrypted in DB
- For WordPress, use Basic Auth with Application Passwords

## Tests
```bash
cd backend
npm test
```
