# Allo Inventory — Take-Home Exercise

## Live Demo

https://allo-inventory-32d7bw4tm-madhumithayogeeswaran-2296s-projects.vercel.app

## GitHub

https://github.com/MADHU270803/allo-inventory

---

## Local Setup

**Prerequisites:** Node.js v18+, Supabase project, Upstash Redis

```bash
git clone https://github.com/MADHU270803/allo-inventory.git
cd allo-inventory
npm install
```

Create `.env`:

```env
DATABASE_URL="...?pgbouncer=true"
DIRECT_URL="..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
CRON_SECRET="allosecret2024"
```

Run:

```bash
npx prisma@6 db push
npm run seed
npm run dev
```

---

## Features

- Product reservation system
- Live stock tracking
- Reservation countdown timer
- Redis distributed locking
- Automatic reservation expiry
- Prisma + PostgreSQL database
- Next.js App Router APIs
- Vercel deployment
- Idempotent reservation endpoint

---

## Concurrency Strategy

The `POST /api/reservations` endpoint acquires a Redis distributed lock scoped to each product + warehouse pair using:

```txt
SET key value NX EX 5
```

This operation is atomic:
- `NX` → only succeeds if the key does not exist
- `EX 5` → auto-expires after 5 seconds

Only the request holding the lock:
1. Reads available stock
2. Increments reserved inventory
3. Creates the reservation

Competing requests receive HTTP 503 and can retry.

The lock is always released in a `finally` block.

This prevents race conditions where two users attempt to reserve the final unit simultaneously.

---

## Reservation Expiry

Two safety layers are implemented:

### 1. Vercel Cron Job

`vercel.json` schedules:

```txt
* * * * *
```

This calls:

```txt
GET /api/cron/expire
```

The endpoint:
- finds expired `PENDING` reservations
- releases reserved stock
- marks reservations as `RELEASED`

using Prisma transactions.

### 2. Lazy Expiry Validation

If a user attempts to confirm an already-expired reservation:
- stock is immediately released
- reservation becomes `RELEASED`
- API returns HTTP 410 Gone

This guarantees correctness even if cron execution is delayed.

---

## Bonus: Idempotency

`POST /api/reservations` supports the:

```txt
Idempotency-Key
```

header.

Responses are cached in Redis for 24 hours.

Retrying the same request with the same key:
- returns the cached reservation
- prevents duplicate reservations

---

## Tech Stack

- Next.js 16
- TypeScript
- Prisma v6
- PostgreSQL (Supabase)
- Redis (Upstash)
- Tailwind CSS
- Vercel

---

## Trade-offs

- Redis locking uses a simple single-node strategy instead of Redlock
- No authentication system
- No pagination on products page
- Cron cleanup interval depends on Vercel scheduling
- No payment gateway integration
- Prisma v6 used instead of v7 to avoid breaking config changes

---

## Author

Madhumitha Y