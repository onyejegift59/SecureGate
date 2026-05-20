# SecureGate

Production-grade authentication system built with Next.js 14, Prisma, PostgreSQL, NextAuth.js, and Nodemailer.

## Features

- Signup with email verification
- Login with session management
- Forgot / reset password flow
- Rate-limited auth endpoints
- Protected dashboard routing
- Secure token handling
- Email delivery via Gmail SMTP (Nodemailer)

## Prerequisites

- Node.js 18+
- PostgreSQL
- Gmail account with App Password enabled

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/securegate
NEXTAUTH_SECRET=your-secret-here-at-least-32-characters-long
NEXTAUTH_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxx
```

### Gmail App Password Setup

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use that App Password as `EMAIL_PASS`

## Run

```bash
npm run dev
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.
See [SECURITY.md](SECURITY.md) for security principles and threat model.
See [REFLECTION.md](REFLECTION.md) for engineering decisions and tradeoffs.
