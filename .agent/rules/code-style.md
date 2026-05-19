# CODE-STYLE.md — SecureGate

> Conventions, patterns, and rules for every file in this repository.
> When in doubt, consistency beats cleverness.

---

## 1. Language & Tooling

- **TypeScript strict mode** is on. No `any`. If you don't know the type, find it.
- All files are `.ts` or `.tsx`. No plain `.js` anywhere in `src/`.
- Node built-ins (e.g. `crypto`) are imported directly — no polyfill wrappers.
- Zod is the single source of truth for runtime validation. Do not validate manually.

---

## 2. Folder Structure

```
src/
├── app/                        # Next.js App Router pages and API routes
│   ├── (auth)/                 # Route group: login, signup, verify-email, reset
│   ├── dashboard/              # Protected route
│   └── api/
│       ├── auth/               # NextAuth handler
│       ├── register/           # Sign up endpoint
│       ├── verify-email/       # Token verification
│       ├── forgot-password/    # Reset request
│       └── reset-password/     # Reset submission
├── components/
│   ├── ui/                     # Primitives: Button, Input, FormField
│   └── auth/                   # Auth-specific: PasswordStrength, AuthCard
├── lib/
│   ├── auth.ts                 # NextAuth config (authOptions)
│   ├── db.ts                   # Prisma client singleton
│   ├── email.ts                # Resend send helpers
│   ├── tokens.ts               # Token generation and lookup
│   ├── ratelimit.ts            # Rate limiting logic
│   └── validations/            # Zod schemas
│       ├── auth.ts
│       └── password.ts
├── types/
│   └── next-auth.d.ts          # Session type augmentation
prisma/
├── schema.prisma
.env.local                      # Never committed
```

**Rule:** If a file exists only to support one route, it lives near that route. If it's shared by two or more routes, it belongs in `lib/`.

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `PasswordStrength.tsx` |
| Files (lib/util) | camelCase | `tokens.ts` |
| Files (routes) | lowercase | `page.tsx`, `route.ts` |
| React components | PascalCase | `AuthCard` |
| Functions | camelCase | `generateVerificationToken` |
| Constants | UPPER_SNAKE | `TOKEN_EXPIRY_MINUTES` |
| Zod schemas | camelCase + `Schema` suffix | `loginSchema` |
| Types/Interfaces | PascalCase | `SessionUser` |
| DB model fields | camelCase (Prisma default) | `emailVerified`, `createdAt` |

---

## 4. TypeScript Rules

```ts
// ✅ Explicit return types on all exported functions
export async function generateResetToken(email: string): Promise<string> { ... }

// ✅ Zod schema inferred types — do not duplicate manually
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type LoginInput = z.infer<typeof loginSchema>;

// ❌ Never
const data: any = req.body;
function doSomething(x) { ... }
```

- Use `type` for unions and aliases. Use `interface` for object shapes that may be extended.
- Augment `next-auth` session types in `src/types/next-auth.d.ts` — never cast `session.user as any`.

---

## 5. API Route Pattern

Every route handler in `src/app/api/` follows this exact order:

```ts
// 1. Rate limit check (if applicable)
// 2. Parse and validate request body with Zod
// 3. Business logic (DB query, token generation, email send)
// 4. Return response

export async function POST(req: Request) {
  // 1. Rate limit
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  // 2. Validate
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  // 3. Logic
  // ...

  // 4. Response
  return NextResponse.json({ success: true }, { status: 200 });
}
```

**Error messages from API routes must never:**
- Confirm whether an email exists in the database
- Expose stack traces or Prisma error codes
- Differ in a way that lets an attacker enumerate valid accounts

Use generic messages: `"Invalid credentials."`, `"Something went wrong."`, `"Request failed."`.

---

## 6. Security Patterns

### Password Hashing
```ts
// Always 12 salt rounds — no lower
const hashed = await bcrypt.hash(password, 12);

// Comparison
const valid = await bcrypt.compare(plaintext, hashed);
```

### Token Generation
```ts
// Always crypto.randomBytes — never Math.random()
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');
```

### Token Expiry Constants
```ts
// lib/tokens.ts
export const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;
export const RESET_TOKEN_EXPIRY_HOURS = 1;
```

Never hardcode `15` or `60` inline. Always reference the constant.

### Environment Variables
```ts
// lib/env.ts (optional helper)
// Access via process.env — never import from a file that stores them as values
const resendKey = process.env.RESEND_API_KEY!;
```

If an env var is missing, fail loudly at startup — not silently at runtime.

---

## 7. Prisma Usage

- **One Prisma client instance.** It lives in `lib/db.ts` and is imported everywhere.

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- Always delete tokens after they are used. Do not leave consumed tokens in the database.
- Always check `expires` manually after fetching a token — do not assume Prisma handles expiry.

```ts
if (!token || token.expires < new Date()) {
  return NextResponse.json({ error: 'Token expired or invalid.' }, { status: 400 });
}
```

---

## 8. Component Rules

- All form inputs must have an associated `<label>`. No placeholder-only labelling.
- Every form submission must show a loading state. Disable the submit button during pending state.
- Validation errors display inline under the relevant field, not in a global toast unless it's a server error.
- The `PasswordStrength` component evaluates on every keystroke. Criteria: length ≥ 8 (weak), + uppercase + number (fair), + special character (strong).

```tsx
// ✅ Accessible input pattern
<label htmlFor="email">Email address</label>
<input id="email" type="email" ... />
{errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
```

---

## 9. Styling

- **Tailwind CSS only.** No inline `style={{}}` except for dynamic values that Tailwind cannot handle.
- No custom CSS files unless absolutely necessary. If needed, they go in `src/app/globals.css`.
- Responsive design is required on all auth pages. Use mobile-first breakpoints (`sm:`, `md:`).
- Colour palette is defined as Tailwind config extensions — do not scatter hex codes across components.

---

## 10. Git Discipline

- Branch from `main`. Name branches: `feature/`, `fix/`, `chore/`.
- Commit messages follow this format: `type(scope): short description`
  - `feat(auth): add email verification flow`
  - `fix(ratelimit): correct IP extraction from headers`
  - `chore(prisma): add PasswordResetToken model`
- `.env.local` is in `.gitignore` before the first push. Non-negotiable.
- Never commit with `// TODO: fix this later` in security-critical code paths.

---

## 11. What This File Is Not

This is not a linting config. ESLint and Prettier handle automated formatting. This file covers the decisions that tools cannot enforce — naming logic, security patterns, architectural choices, and the reasoning behind them.

When a new file needs to be created and you are unsure where it belongs or what to call it, come back here first.