# AGENT.md
## SecureGate Engineering Agent Instructions

---

# Project Name

SecureGate

---

# Project Type

Production-Grade Authentication & Security System

---

# Primary Objective

Build a focused standalone authentication system using:

- Next.js 14 App Router
- TypeScript
- Prisma
- PostgreSQL
- NextAuth.js
- bcryptjs
- Zod
- Resend
- Tailwind CSS
- Vercel

This project is security-first.

The goal is NOT to build a complete SaaS application.

The goal is to engineer a production-style authentication layer with:
- secure credential handling
- safe session management
- defensive middleware
- secure token flows
- production-safe architecture

---

# Agent Role

You are acting as:
- senior full-stack engineer
- product engineer
- authentication systems engineer
- defensive software architect

You must think beyond feature implementation.

Every engineering decision must consider:
- security
- failure states
- token abuse
- session abuse
- malicious input
- production risks
- maintainability
- engineering tradeoffs

---

# Critical Engineering Philosophy

SecureGate must behave as though:
- attackers exist
- users break flows
- requests are malformed
- tokens leak
- sessions fail
- clients cannot be trusted

Always engineer defensively.

---

# Primary Engineering Principles

The implementation must reflect:

| Principle | Meaning |
|---|---|
| Murphy’s Law | Anything that can fail eventually will fail |
| Gall’s Law | Working systems evolve from simple working systems |
| Kerckhoffs’s Principle | Security must depend on secrets, not hidden code |
| YAGNI | Do not overbuild unnecessary features |
| Defensive Programming | Assume hostile or invalid input |
| Principle of Least Surprise | System behavior should be predictable |
| Law of Leaky Abstractions | Understand underlying implementation details |

---

# Global Implementation Rules

# RULE 1 — NEVER TRUST CLIENT INPUT

All incoming request data must be validated server-side using Zod.

Frontend validation alone is insufficient.

Validate:
- emails
- passwords
- route params
- tokens
- request payloads
- query parameters

Malformed requests must fail safely.

---

# RULE 2 — PASSWORDS MUST NEVER EXIST IN PLAIN TEXT

Always hash passwords using:

```ts
bcrypt.hash(password, 12)
```

Requirements:
- bcryptjs only
- minimum 12 salt rounds
- compare passwords using bcrypt.compare()

Never:
- store raw passwords
- log passwords
- expose passwords in responses
- return password-related internals

---

# RULE 3 — PREVENT EMAIL ENUMERATION

Authentication flows must NEVER reveal:
- whether an email exists
- whether a password is wrong
- whether an account exists

Unsafe:
```txt
Email not found
Wrong password
```

Safe:
```txt
Invalid credentials
```

Forgot password responses must always return:
```txt
If an account exists, a reset email has been sent.
```

regardless of whether the account exists.

---

# RULE 4 — TOKEN SECURITY IS MANDATORY

Verification tokens and reset tokens must:
- be cryptographically secure
- expire automatically
- be deleted after usage

Generate tokens using:

```ts
crypto.randomBytes(32).toString("hex")
```

Expiry rules:
- verification tokens → 15 minutes
- reset tokens → 1 hour

Expired tokens must fail gracefully.

---

# RULE 5 — ROUTE PROTECTION MUST BE DEFENSIVE

Protected routes must verify:
- authentication state
- verification state

/dashboard must only allow:
- authenticated users
- verified users

Unauthenticated users:
→ redirect to /login

Unverified users:
→ block access

Assume users:
- manipulate URLs
- delete cookies
- alter requests manually

---

# RULE 6 — RATE LIMIT AUTH ENDPOINTS

Protect:
- login endpoint
- forgot-password endpoint

Limits:
- max 5 attempts
- per IP
- within 10 minutes

Use:
- Upstash Redis
OR
- secure custom middleware

Do not expose rate limiting internals.

---

# RULE 7 — NEVER LEAK INTERNAL ERRORS

API responses must NEVER expose:
- stack traces
- database internals
- SQL errors
- auth implementation details
- token internals
- existence of users

All failures must be graceful.

---

# RULE 8 — ENVIRONMENT VARIABLES ONLY

Secrets must only exist in:
- .env.local
- Vercel environment variables

Required:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never:
- hardcode secrets
- commit .env.local
- expose secrets client-side

---

# RULE 9 — SECURITY HEADERS REQUIRED

Configure:
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

inside:
```txt
next.config.js
```

---

# RULE 10 — BUILD IN PHASES

Implementation order is mandatory.

---

# Phase 1 — Project Scaffold & Database

Requirements:
- initialize Next.js
- configure TypeScript
- initialize Prisma
- connect PostgreSQL
- create schema
- run migrations

Models required:
- User
- VerificationToken
- PasswordResetToken

---

# Phase 2 — Authentication Core

Requirements:
- configure NextAuth
- credentials provider
- login flow
- signup flow
- bcrypt hashing
- session handling

---

# Phase 3 — Email Verification

Requirements:
- verification token generation
- email delivery
- verification route
- expiry validation
- verification enforcement

---

# Phase 4 — Forgot Password

Requirements:
- forgot-password route
- reset token generation
- reset email
- reset-password route
- password update
- token invalidation

---

# Phase 5 — Security Hardening

Requirements:
- rate limiting
- secure headers
- safe error handling
- middleware protection
- edge case testing

---

# Phase 6 — UI Polish & Deployment

Requirements:
- accessible forms
- loading states
- validation messages
- password strength indicator
- Vercel deployment
- GitHub push

---

# Required Database Models

# User

```prisma
model User {
  id             String   @id @default(cuid())
  name           String?
  email          String   @unique
  password       String
  emailVerified  Boolean  @default(false)
  createdAt      DateTime @default(now())
}
```

---

# VerificationToken

```prisma
model VerificationToken {
  id         String   @id @default(cuid())
  identifier String
  token      String   @unique
  expires    DateTime
}
```

---

# PasswordResetToken

```prisma
model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime
}
```

---

# Folder Structure

```txt
src/
 ├── app/
 │    ├── login/
 │    ├── signup/
 │    ├── dashboard/
 │    ├── forgot-password/
 │    ├── reset-password/[token]/
 │    ├── verify-email/[token]/
 │
 ├── app/api/
 │    ├── auth/
 │    ├── signup/
 │    ├── forgot-password/
 │    ├── reset-password/
 │
 ├── lib/
 │    ├── prisma.ts
 │    ├── auth.ts
 │    ├── mail.ts
 │    ├── rate-limit.ts
 │    ├── tokens.ts
 │
 ├── middleware.ts
```

---

# UI Requirements

UI must be:
- minimal
- clean
- accessible
- production-like

Every form must include:
- labels
- validation messages
- loading states
- disabled submit states

Password fields must include:
- weak
- fair
- strong

strength indicators.

Do not over-prioritize aesthetics over security.

---

# Code Quality Rules

Requirements:
- reusable utilities
- meaningful naming
- modular structure
- small focused functions
- separated concerns

Avoid:
- giant route handlers
- duplicated validation logic
- duplicated token logic
- deeply nested conditionals

---

# Deployment Rules

Deployment target:
- Vercel

Version control:
- GitHub

The repository must:
- include REFLECTION.md
- exclude .env.local
- exclude secrets

---

# REFLECTION.md Requirements

The project root must contain:

```txt
REFLECTION.md
```

The reflection must:
- answer all 15 engineering questions
- reference real implementation details
- reference actual files
- explain tradeoffs honestly
- sound human
- avoid generic AI explanations

---

# Final Priorities

Priority order:

1. Security
2. Correctness
3. Reliability
4. Maintainability
5. UI Polish

Never sacrifice:
- security for speed
- correctness for visuals
- architecture for shortcuts

Build as though attackers are active users.

Build as though Murphy has permanent access to your staging environment.