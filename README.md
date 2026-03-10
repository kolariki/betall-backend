# BetAll Backend

Node.js + Express + Supabase backend for the BetAll prediction market.

## Setup

```bash
npm install
cp .env.example .env  # configure your environment variables
npm start
```

## Environment Variables

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key
- `PORT` — Server port (default: 3001)
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret
