# SECURITY.md

## SecureGate Security Architecture & Defensive Engineering Notes

---

# Overview

SecureGate is a production-style authentication and identity management system built with security-first engineering principles.

This document explains:
- authentication security decisions
- credential protection
- token lifecycle management
- session protection
- attack mitigation strategies
- secure deployment practices

The system is intentionally designed to assume:
- attackers exist
- requests are malicious
- users make mistakes
- clients cannot be trusted

---

# Security Philosophy

SecureGate follows a defensive engineering approach.

Core principles:
- validate everything
- trust nothing from the client
- minimize leaked information
- fail safely
- reduce attack surface
- expire sensitive credentials
- protect against brute-force attacks

The system prioritizes:
1. credential protection
2. session integrity
3. secure token handling
4. safe authentication flows
5. predictable failure behavior

---

# Authentication Security

## Password Hashing

Passwords are never stored in plaintext.

All passwords are hashed using:

```ts
bcrypt.hash(password, 12)
```

Implementation details:
- library: bcryptjs
- salt rounds: 12
- comparison: bcrypt.compare()

---

## Why bcrypt?

bcrypt is intentionally slow.

This helps defend against:
- brute-force attacks
- rainbow table attacks
- dictionary attacks

bcrypt automatically generates salts internally, reducing the risk of predictable hashes.

---

## Security Risks Prevented

Without hashing:
- database leaks expose raw passwords
- users become vulnerable across reused accounts
- attackers gain immediate credential access

Without salts:
- identical passwords produce identical hashes
- rainbow table attacks become easier

---

# Authentication Error Handling

SecureGate prevents email enumeration attacks.

The system never reveals:
- whether an email exists
- whether a password is incorrect
- whether an account exists

---

## Unsafe Responses

```txt
Email not found
Wrong password
Account does not exist
```

---

## Safe Response

```txt
Invalid credentials
```

---

# Why This Matters

Attackers often test email lists against login endpoints.

If the system reveals whether an account exists:
- attackers can enumerate users
- targeted phishing becomes easier
- credential stuffing becomes more effective

Generic errors reduce exposed intelligence.

---

# Email Verification Security

## Verification Tokens

Verification tokens are:
- cryptographically secure
- randomly generated
- time-limited
- single-use

Token generation:

```ts
crypto.randomBytes(32).toString("hex")
```

---

## Token Expiry

Verification tokens expire after:

```txt
15 minutes
```

Expired tokens:
- cannot be reused
- are rejected safely
- require regeneration

---

## Why Expiry Matters

Without expiration:
- stolen tokens remain valid indefinitely
- old email links become attack vectors
- verification replay attacks become possible

---

# Password Reset Security

## Reset Token Security

Password reset tokens use:
- secure random generation
- expiration windows
- one-time usage

---

## Reset Token Lifetime

Reset tokens expire after:

```txt
1 hour
```

---

## Reset Flow Protections

The system:
- validates tokens before use
- checks expiration timestamps
- hashes new passwords before storage
- deletes tokens after successful reset

---

## Forgot Password Privacy Protection

Forgot password requests never reveal whether an email exists.

Safe response:

```txt
If an account exists, a reset email has been sent.
```

This prevents:
- account enumeration
- targeted reconnaissance
- user discovery attacks

---

# Session Security

SecureGate uses NextAuth.js for session handling.

Session protection includes:
- authenticated route protection
- session validation middleware
- secure redirects
- verification enforcement

---

# Protected Route Security

/dashboard is accessible only to:
- authenticated users
- verified users

Unauthorized access attempts redirect users safely.

---

## Defensive Assumptions

The system assumes users may:
- manually edit URLs
- delete cookies
- tamper with requests
- bypass frontend restrictions

Therefore:
- all checks occur server-side
- middleware protection is mandatory

---

# Rate Limiting

## Brute-Force Protection

Rate limiting protects:
- login endpoints
- forgot-password endpoints

---

## Limits

Maximum:
```txt
5 attempts per IP within 10 minutes
```

---

## Why Rate Limiting Matters

Without rate limiting:
- attackers can brute-force passwords
- bots can spam reset requests
- authentication endpoints become vulnerable

Rate limiting slows automated abuse significantly.

---

# Input Validation Security

All incoming data is validated server-side using Zod.

Validated inputs include:
- email addresses
- passwords
- route params
- tokens
- request payloads

---

# Why Server Validation Matters

Frontend validation alone is insecure.

Attackers can:
- bypass frontend code
- send malformed requests directly
- manipulate payloads manually

Server validation ensures:
- type safety
- request integrity
- predictable behavior

---

# Environment Variable Security

Sensitive credentials are stored only in:
- `.env.local`
- Vercel environment variables

---

## Required Secrets

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
EMAIL_USER=
EMAIL_PASS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

# Secret Handling Rules

Secrets must NEVER:
- be hardcoded
- be committed to GitHub
- be exposed client-side
- appear in logs

---

# Why This Matters

Leaked secrets can allow attackers to:
- forge sessions
- access databases
- send malicious emails
- impersonate infrastructure

---

# Email Security (Nodemailer / Gmail SMTP)

Transactional emails are sent via Nodemailer using Gmail SMTP.

Security considerations:
- credentials are stored in environment variables only
- App Passwords are used instead of account passwords
- SMTP credentials are never exposed to the client
- transport initialization is lazy (no build-time credential check)
- email failures are logged server-side with generic client-facing messages
- no SMTP internals or stack traces are returned to the client

---

# HTTP Security Headers

SecureGate includes defensive HTTP headers.

Headers include:
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

---

## Security Benefits

### X-Frame-Options
Helps prevent clickjacking attacks.

---

### X-Content-Type-Options
Prevents MIME-type sniffing vulnerabilities.

---

### Referrer-Policy
Limits accidental referrer information leakage.

---

# Database Security

Prisma ORM is used for database access.

Security considerations:
- parameterized queries
- schema validation
- relational integrity
- typed database interactions

Sensitive operations:
- password updates
- token validation
- session handling

must always pass through validated server logic.

---

# Secure Deployment Practices

Deployment target:
- Vercel

Version control:
- GitHub

---

# Deployment Security Checklist

Before deployment:
- ensure .env.local is gitignored
- verify no secrets exist in source code
- configure Vercel environment variables
- test authentication flows in production
- verify token expiry behavior
- confirm route protection

---

# Threat Model Summary

SecureGate is designed to reduce risk from:

| Threat | Mitigation |
|---|---|
| Password leaks | bcrypt hashing |
| Brute-force attacks | rate limiting |
| Email enumeration | generic auth errors |
| Token replay | token expiry |
| Malformed requests | Zod validation |
| Clickjacking | security headers |
| Session abuse | middleware protection |
| Secret leakage | environment variables |

---

# Engineering Principles Applied

| Principle | Application |
|---|---|
| Murphy's Law | Defensive auth handling |
| Kerckhoffs's Principle | Secret-based security |
| Defensive Programming | Safe validation + route protection |
| Principle of Least Surprise | Predictable auth behavior |
| Law of Leaky Abstractions | Understanding auth internals |

---

# Final Security Priorities

Priority order:

1. Protect credentials
2. Protect sessions
3. Prevent information leakage
4. Expire sensitive tokens
5. Reduce attack surface
6. Fail safely

SecureGate treats authentication as critical infrastructure, not just a frontend feature.

Every authentication flow is designed under the assumption that hostile interaction is inevitable.
