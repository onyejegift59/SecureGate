 

Part 1 — What I Built
SecureGate is a standalone authentication app built with Next.js 14, Prisma, PostgreSQL and NextAuth.js. It handles signup with email verification, login with session management, forgot and reset password, rate limiting on auth endpoints and a protected dashboard that only verified users can access.

Part 2 — What Surprised Me
I thought the hardest part would be the auth logic. It was not. The build kept failing because Prisma, the email client and Redis all try to connect the moment they are imported, even if nothing actually calls them yet. The build failed three times for three different reasons. Each time the fix was the same: stop creating the client at the top of the file and only create it when something actually needs it. That one pattern solved all three failures.

Part 3 — Engineering Laws Quiz
Q1 — Murphy's Law
Code reference: src/app/api/register/route.ts
If the email fails to send after someone signs up, I still want their account to exist. So the email send is wrapped in a try catch. The registration succeeds either way and the email failure gets logged silently. If I had not done this, a Resend outage would leave users with a created account they cannot access because the signup appeared to fail.
What goes wrong if ignored: User creates an account, email fails, they see an error, they try again and get told the email already exists. They are stuck with no way forward.

Q2 — Law of Leaky Abstractions
Code reference: src/lib/db.ts
Prisma is supposed to handle the database connection for you. What it does not tell you upfront is that in version 7 it validates the datasource options the moment you call new PrismaClient(), not when you actually run a query. So when DATABASE_URL was empty during the build, I got an error about internal Prisma types I had never written. I had to go read the raw changelog to understand what changed. The abstraction leaked straight into internals.
What goes wrong if ignored: You spend hours debugging an error message that sounds like it belongs to the library, not your code, because you never understood what the library was actually doing underneath.

Q3 — YAGNI
Code reference: src/app/(auth)/, src/components/auth/
There is no Google login, no two factor auth, no admin panel. The task asked for register, login, verify, reset and a protected dashboard. That is what I built. At one point I considered adding social login because NextAuth makes it easy to set up. I did not because it was not in the requirements and would have added extra complexity I did not need to debug.
What goes wrong if ignored: You end up debugging features nobody asked for while the features they did ask for have problems you have not found yet.

Q4 — Kerckhoffs's Principle
Code reference: src/lib/auth.ts, src/lib/tokens.ts
The system uses bcrypt with 12 salt rounds for passwords and crypto.randomBytes(32) for tokens. Both are standard and well known. Anyone can read the code and understand how it works. What they cannot do is reverse a bcrypt hash or guess a 64 character random token. The security comes from the math, not from hiding the method.
A salt is a random value bcrypt mixes into the password before hashing it. So two users with the same password end up with completely different hashes. If I had used SHA-256 with no salt, an attacker with a prebuilt list of common password hashes could crack most of them in seconds.
What goes wrong if ignored: The moment your code is visible to anyone, and it always will be eventually, obscurity stops being a defense. The hashing has to hold up on its own.

Q5 — Principle of Least Surprise
Code reference: src/app/api/forgot-password/route.ts
The forgot password page always says the same thing regardless of whether the email exists in the database. It says something like "if an account with that email exists, a reset link has been sent." The login form always says "Invalid credentials." Never "email not found" or "wrong password."
This is not just about being polite. If the response changed depending on whether the email existed, someone could use the forgot password page to find out which emails are registered. That is a real attack and it is called email enumeration.
What goes wrong if ignored: You hand an attacker a list of valid user emails for free just by letting them type addresses into the forgot password form.

Q6 — Boy Scout Rule
Code reference: src/lib/ratelimit.ts
While wiring up the rate limiter I noticed the function was doing two things at once: checking if Redis was available and doing the actual rate limit check. I split them into two separate functions. It was not part of the plan but the file was open and the fix was small. The code is easier to read now.
What goes wrong if ignored: A function that does two things is twice as hard to debug when one of them breaks.

Q7 — Gall's Law
Code reference: src/app/(auth)/, prisma/schema.prisma
I built this phase by phase. Scaffold first, then auth, then email, then rate limiting, then UI. Each phase was working before I touched the next one. The build failures in Part 2 happened early when there was almost nothing else in the codebase. Because the scope was small I could isolate the problem quickly. If I had tried to build all six phases at once, those same failures would have been buried under layers of other code.
What goes wrong if ignored: You end up with a system where everything is broken and you have no idea where to start because every layer is depending on every other layer that is also broken.

Q8 — Law of Leaky Abstractions (ORM)
Code reference: prisma/schema.prisma, prisma/migrations/
The Prisma schema shows a clean VerificationToken model. What the schema does not show you is that Prisma generates a composite unique constraint across both the identifier and token columns in the actual database table. I did not know this until I queried by token alone and got unexpected results. I had to open the migration file to see what was actually created.
What goes wrong if ignored: You write queries that look correct in Prisma but behave differently against the real database because the two do not always match one to one.

Q9 — Zawinski's Law
Code reference: src/lib/ratelimit.ts, src/middleware.ts
Rate limiting is not built into Next.js or NextAuth. I had to add it myself. This is a good thing. NextAuth handles authentication. The rate limiter handles abuse prevention. They are separate tools doing separate jobs. If a framework tried to bundle everything together it would become impossible to replace or update any one part without breaking the others.
What goes wrong if ignored: Tools that try to do everything become tools that do everything badly. Keeping responsibilities separate means you can swap out the rate limiter without touching the auth logic.

Q10 — Least Privilege
Code reference: prisma/schema.prisma
The database has three tables: User, VerificationToken and PasswordResetToken. The user table stores only what is needed: name, email, hashed password, and whether the email is verified. No phone numbers, no IP addresses, no roles. Nothing that is not used.
What goes wrong if ignored: Every extra column you store is extra data that leaks if the database is breached. Storing less is a security decision, not just a design preference.

Q11 — Defense in Depth
Code reference: src/middleware.ts, src/lib/auth.ts, src/app/dashboard/page.tsx
The dashboard has three layers of protection. The middleware checks for a session before the page loads. NextAuth refuses to create a session for unverified users. The dashboard page itself checks the session on the server side. If a user deletes their cookie, the middleware catches it first and redirects to login.
What goes wrong if ignored: One layer of protection means one way to bypass it. Three layers means someone has to break all three at the same time.

Q12 — Token Rotation
Code reference: src/app/(auth)/verify-email/[token]/page.tsx, src/app/api/reset-password/route.ts
After a verification or reset token is used, it is deleted from the database immediately. It cannot be used again.
What goes wrong if ignored: If tokens are never deleted, someone who intercepts an old verification link from an email can use it later. Old tokens sitting in the database are just waiting to be abused.

Q13 — Constant Time Comparison
Code reference: src/lib/auth.ts
Password checking uses bcrypt.compare() which takes the same amount of time no matter how many characters match. A regular string comparison like password === hash stops as soon as it finds a mismatch. An attacker can measure how long the server takes to respond and use that to figure out how much of the password they got right.
What goes wrong if ignored: Someone with enough patience and the right tools can guess your password one character at a time just by watching response times.

Q14 — Input Sanitization
Code reference: src/lib/validations/auth.ts
Every API route runs the request body through a Zod schema before anything else happens. Email format is checked. Password minimum length is enforced. Empty strings are rejected. Nothing raw from the request body touches the database.
What goes wrong if ignored: A user could send an empty email string and crash Prisma on the lookup. They could send a one character password and bypass the minimum. Frontend validation is easy to skip. Server side validation is not.

Q15 — Explicit Error Handling
Code reference: src/app/api/register/route.ts
Every try catch block logs the actual error on the server and sends a generic message to the user. The user sees "Something went wrong." The server log has the full error. Nothing internal leaks to the client.
What goes wrong if ignored: If you swallow errors silently with an empty catch block, you will never know something is broken until users start complaining. And by then you have no logs to debug from.

Part 4 — One Thing I Would Refactor
The Prisma client in src/lib/db.ts uses a JavaScript Proxy to avoid initializing at import time. It works but TypeScript does not fully understand it and if anything goes wrong inside the Proxy it is hard to trace.
The cleaner version is a simple async function:
tslet prisma: PrismaClient | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (prisma) return prisma;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  prisma = new PrismaClient({ datasourceUrl: url });
  await prisma.$connect();
  return prisma;
}
Every route would call const db = await getPrisma() instead of importing db directly. I did not refactor to this during the assessment because it meant touching every single route file at once which was too risky during a timed build.

Part 5 — How This Changes How I Build
I used to think of auth as something you just add to a project. Now I see it as a chain where every single link has to hold. Token generation, email delivery, password hashing, session handling, error messages, rate limiting. Any one of them failing quietly is a security problem.
The biggest shift for me is how I think about error messages now. Before this, an error message was just feedback. Now I know the wording is a security decision. "Invalid credentials" versus "email not found" are not the same thing. One of them tells an attacker something useful.
I will not write new Client() at the top of a module again without thinking about what happens when that runs during a build. And I will not assume a library handles expiry or cleanup automatically. Prisma taught me it does not.

Part 6 — Why I Switched from Resend to Nodemailer
Resend was in the original spec and it is a genuinely good tool for Vercel hosted apps. The problem is that the free tier only lets you send emails to one verified address. For anyone else cloning the repo and testing it, real emails would never arrive unless they had a paid Resend account.
Nodemailer with a Gmail App Password solves this completely. Any developer can create a Gmail account, generate an App Password in the security settings, add two environment variables and have real emails arriving in their inbox within minutes. No credit card, no domain verification, no rate plan.
The switch only touched src/lib/email.ts. The function names and signatures stayed the same. Every route that calls sendVerificationEmail() or sendResetPasswordEmail() required zero changes. The token logic, the expiry checks, the rate limiting, none of it moved.
The lesson is simple: pick infrastructure that works the same way in every environment your developers will actually use. Resend is correct on paper for Vercel. Nodemailer is correct in practice for a project that needs to be fully testable at zero cost.