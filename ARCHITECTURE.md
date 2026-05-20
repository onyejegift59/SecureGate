# ARCHITECTURE.md

## SecureGate System Architecture & Design Overview

---

# 1. System Overview

SecureGate is a standalone authentication and identity management system built as a full-stack Next.js application.

It is designed to handle:
- user authentication
- session management
- email verification
- password recovery
- secure access control

The system is intentionally scoped to authentication only, allowing deep focus on security, reliability, and production-grade engineering patterns.

---

# 2. High-Level Architecture

SecureGate follows a layered full-stack architecture:

```
[ Client Layer ]
      ↓
[ Next.js App Router ]
      ↓
[ API Routes / Server Actions ]
      ↓
[ Authentication Layer (NextAuth.js) ]
      ↓
[ Business Logic Layer (lib/) ]
      ↓
[ Prisma ORM Layer ]
      ↓
[ PostgreSQL Database ]
```

---

# 3. Core System Components

## 3.1 Frontend Layer (Next.js App Router)

Responsible for:
- UI rendering
- form handling
- client-side validation (non-authoritative)
- navigation and redirects

Key pages:
- /signup
- /login
- /dashboard
- /forgot-password
- /reset-password/[token]
- /verify-email/[token]

---

## 3.2 Authentication Layer (NextAuth.js)

Responsible for:
- session creation
- credential validation
- session persistence
- authentication state management

Uses:
- Credentials Provider
- JWT or database session strategy (implementation choice)

---

## 3.3 API Layer (Route Handlers)

Handles:
- signup requests
- password reset flows
- email verification logic
- token validation
- secure server-side operations

This layer is the main enforcement point for:
- validation
- security checks
- rate limiting integration

---

## 3.4 Business Logic Layer (lib/)

Contains reusable core logic:

- prisma client wrapper
- auth helpers
- token generation utilities
- email sending logic (Nodemailer)
- rate limiting utilities

This layer ensures:
- separation of concerns
- reuse of logic across routes
- reduced duplication

---

## 3.5 Database Layer (Prisma + PostgreSQL)

Responsible for:
- persistent user storage
- token storage
- reset and verification tracking

---

# 4. Database Architecture

## 4.1 User Table

Stores core identity data.

```prisma
User {
  id
  name
  email
  password
  emailVerified
  createdAt
}
```

---

## 4.2 VerificationToken Table

Stores email verification state.

Used for:
- account activation
- email ownership validation

Includes:
- token
- expiration timestamp
- identifier

---

## 4.3 PasswordResetToken Table

Stores password reset requests.

Used for:
- secure password recovery
- time-limited reset access

Includes:
- email
- token
- expiration timestamp

---

# 5. Authentication Flow Architecture

## 5.1 Sign Up Flow

```
User submits form
→ Zod validation
→ bcrypt password hashing
→ User stored in DB
→ Verification token created
→ Email sent via Nodemailer (Gmail SMTP)
→ User pending verification
```

---

## 5.2 Login Flow

```
User submits credentials
→ NextAuth Credentials Provider
→ User lookup in DB
→ bcrypt.compare()
→ Session created
→ Redirect to dashboard
```

Security rules:
- no email enumeration
- generic error responses only

---

## 5.3 Email Verification Flow

```
User clicks email link
→ Token validation
→ Expiry check
→ User marked verified
→ Token deleted
→ Access granted
```

Failure cases:
- expired token
- invalid token

---

## 5.4 Forgot Password Flow

```
User submits email
→ Always return success response
→ Generate reset token
→ Store token with expiry
→ Send email via Nodemailer (Gmail SMTP)
```

Security principle:
- prevents email enumeration attacks

---

## 5.5 Reset Password Flow

```
User opens reset link
→ Token validation
→ Expiry check
→ New password submitted
→ bcrypt hashing
→ Password updated
→ Token deleted
→ Redirect to login
```

---

# 6. Middleware Architecture

Middleware enforces:
- route protection
- authentication checks
- verification checks

---

## Protected Route Logic

```
/dashboard
→ check session
→ check emailVerified
→ allow or redirect
```

---

## Security Assumptions

Middleware assumes:
- cookies can be modified
- sessions can be deleted
- requests can be spoofed

Therefore all checks are server-side authoritative.

---

# 7. Rate Limiting Architecture

Rate limiting is applied at API layer.

## Protected Endpoints:
- login
- forgot password

---

## Rate Limit Logic

```
IP address tracked
→ request count incremented
→ check threshold
→ allow or block
```

Threshold:
- 5 requests per 10 minutes per IP

---

# 8. Email System Architecture

Uses Nodemailer with Gmail SMTP for transactional email delivery.

Emails:
- verification email
- password reset email

Flow:
```
Server action
→ token generation
→ email template rendering
→ Nodemailer transport (Gmail SMTP)
→ email sent
```

Configuration:
- `EMAIL_USER` — Gmail address
- `EMAIL_PASS` — Gmail App Password

Transport is initialized lazily on first use and reused as a singleton for subsequent sends.

---

# 9. Security Architecture

## 9.1 Password Security

- bcrypt hashing (12 salt rounds)
- secure comparison only
- never exposed in logs or responses

---

## 9.2 Token Security

- crypto.randomBytes(32)
- expiration enforced
- single-use tokens
- deletion after consumption

---

## 9.3 Session Security

Managed via NextAuth:
- secure cookies
- server validation
- protected routes

---

## 9.4 Input Security

All inputs validated via Zod:
- prevents malformed payloads
- enforces schema safety
- reduces injection risk

---

## 9.5 Error Security

System prevents:
- stack trace leakage
- DB error exposure
- authentication hints
- internal state leaks

---

# 10. Deployment Architecture

## Hosting
- Vercel (frontend + API routes)

## Database
- PostgreSQL (external or managed)

---

## Environment Variables Flow

```
Local .env.local
→ ignored in Git
→ mirrored in Vercel dashboard
→ used at runtime only
```

---

## Build Pipeline

```
GitHub push
→ Vercel build
→ environment injection
→ deployment
```

---

# 11. Folder Structure Architecture

```
src/
 ├── app/                 # UI routes
 ├── app/api/            # server endpoints
 ├── lib/                # core logic
 ├── middleware.ts       # route protection
 ├── prisma/             # schema + client
```

---

# 12. Data Flow Architecture

## Example: Login Request

```
UI form
→ API route
→ validation (Zod)
→ DB lookup (Prisma)
→ bcrypt compare
→ NextAuth session
→ cookie set
→ redirect
```

---

# 13. Failure Handling Design

System is designed to fail safely:

| Failure Type | Behavior |
|---|---|
| Invalid token | reject silently |
| Expired token | require regeneration |
| Wrong login | generic error |
| Rate limit exceeded | block request |
| DB failure | safe fallback |

---

# 14. Scalability Considerations

Architecture supports future expansion:

- OAuth providers (Google, GitHub)
- MFA (multi-factor authentication)
- RBAC (role-based access control)
- audit logs
- device tracking
- session revocation

Design is modular to allow extension without rewrite.

---

# 15. Key Design Principles

SecureGate architecture is built on:

- separation of concerns
- layered security model
- stateless session handling (if JWT used)
- defensive backend validation
- minimal trust assumptions

---

# 16. Architecture Summary

SecureGate is structured as a layered authentication system:

- UI handles interaction
- API enforces rules
- Auth layer manages identity
- Database stores state
- Security layer enforces protection boundaries

Every layer assumes the previous layer can fail.

This is intentional.

The system is designed not for ideal users, but for real-world adversarial conditions.
