# Reflection: Engineering Principles in SecureGate

---

Q1  Murphy's Law
Code reference: src/app/api/register/route.ts:52-60, src/lib/db.ts:24-33
Place 1: If the email fails to send after someone signs up I still want their account to exist. So the email send is wrapped in a try catch. The registration succeeds either way and the failure gets logged on the server. Without this, a Nodemailer outage would leave users with a created account they cannot access because the signup appeared to fail. They retry, get told the email already exists, and are completely stuck.
Place 2: PrismaClient validates its database URL the moment you call new PrismaClient(), not when you actually run a query. During a build, DATABASE_URL might not be set. If I had created the client at the top of the file, the build would crash with an internal Prisma error even though no database call was being made. The lazy initialization pattern fixes this by only creating the client when something actually needs it.
What goes wrong if ignored: Users get locked out of accounts they just created. Builds fail in environments where the database is not available at compile time.

Q2  Law of Leaky Abstractions
Code reference: src/lib/auth.ts
I picked NextAuth. The authorize function returns null for every failure whether the credentials are missing, the user does not exist, or the password is wrong. NextAuth turns all of that into one URL parameter on the login page. That part is fine. Where it leaked was the callback lifecycle. I stored emailVerified in the JWT during the jwt callback assuming it would show up in the session automatically. It did not. The session callback runs separately and I had to manually copy the value across. There was no warning in the basic docs. I had to read the source code to understand that jwt and session callbacks run at different times and do not share data unless you pass it explicitly.
What goes wrong if ignored: You end up with a session object missing fields you thought were there, and the only way to debug it is to dig into library internals you were never supposed to need.

Q3  YAGNI
Code reference: src/app/(auth)/, src/components/auth/
The task asked for register, login, verify email, reset password and a protected dashboard. That is what I built. No Google login, no two factor auth, no audit logs.
Social login would need OAuth provider setup, callback URLs, extra environment variables and UI changes. Nobody asked for it. MFA would need a TOTP library, QR code rendering, backup codes and a new database column. The app has no sensitive data and no compliance requirement that demands it. Audit logs would need a new table, middleware to log every action and a query interface with no user asking for any of it.
If I need to add them later, social login is just a new NextAuth provider config and a button. MFA is a new column and a verification step in the authorize callback. Audit logs are a new table and a middleware function. All three slot in without rewriting anything.
What goes wrong if ignored: You spend time debugging features nobody asked for while the features they did ask for still have problems.

Q4   Kerckhoffs's Principle
Code reference: src/lib/auth.ts, src/lib/tokens.ts
A salt is a random value that gets mixed into the password before hashing. It means two users with the same password end up with completely different hashes in the database. Even if someone resets their password to the same value they used before, the new hash looks nothing like the old one.
bcrypt handles the salt automatically. When you call bcrypt.hash(password, 12) it generates a random salt internally, mixes it with the password, hashes everything together and stores the algorithm, cost factor, salt and hash all in one 60 character string. When you call bcrypt.compare() it pulls the salt back out of that string and uses it to verify.
If I had used SHA-256 instead, there would be no salt by default. Identical passwords would produce identical hashes. An attacker with a prebuilt list of common password hashes could crack most of them in seconds. SHA-256 is also fast by design, which means an attacker can try billions of guesses per second on a GPU. bcrypt at 12 rounds takes around 250ms per hash on purpose. That slowness is the defense.
What goes wrong if ignored: Once the code is visible to anyone, and it always will be eventually, there is no security left if the algorithm is the only thing protecting the passwords.

Q5  Postel's Law + Security by Design
Code reference: src/app/api/forgot-password/route.ts:23-28, 43-46
The forgot password endpoint always returns the same message regardless of whether the email exists. It says something like "if an account with that email exists, a reset link has been sent." Valid email, invalid email, server error, it does not matter. The response is always the same.
This follows Postel's Law which says be conservative in what you send. The endpoint sends as little information as possible. If it returned different responses based on whether the email was found, an attacker could just type email addresses into the form and use the responses to build a list of valid accounts on the platform. That is called email enumeration and it is a real attack.
What goes wrong if ignored: You hand an attacker a free list of registered users just by letting them observe the forgot password response.

Q6   Boy Scout Rule
Code reference: src/lib/ratelimit.ts
The original plan was just to add rate limiting to the auth endpoints. While I was implementing it I noticed the function was doing two things at once: checking whether Redis was configured and doing the actual rate limit check. I split them into two separate functions. getRatelimit() handles initialization and returns null if Redis is not configured. checkRateLimit() calls that and does the check. It was not part of the plan. The file was open and the fix was small so I did it.
What goes wrong if ignored: A function that does two things is twice as hard to debug when one of them breaks.

Q7   Gall's Law
Code reference: src/app/(auth)/, prisma/schema.prisma
Gall's Law says a complex system that works always grew from a simple system that worked first. SecureGate was built phase by phase. Scaffold first, then registration, then login, then email verification, then password reset, then rate limiting, then UI polish. Each phase worked before I touched the next one.
The build failures I mentioned in Part 2 happened while the codebase was still tiny. Because there was almost nothing else in the project I could isolate each failure immediately. If I had tried to build all six phases at the same time, those exact same failures would have been buried under layers of other code. A Prisma crash would have looked like a NextAuth problem. A missing email variable would have looked like a database issue. I would have been debugging everything at once with no idea where to start.
What goes wrong if ignored: You end up with a system where everything is broken and every layer is blaming the layer beneath it.

Q8  Law of Leaky Abstractions (ORM)
Code reference: prisma/schema.prisma, src/lib/tokens.ts:15-19
The Prisma schema shows a clean VerificationToken model with an identifier field and a token field both marked unique. It looks simple. What the schema does not tell you is that each unique field becomes a separate index in the actual PostgreSQL table. The model says  these are fields.  The database says "these are physical indexes with their own storage and constraints."
This mattered when I used upsert with where: { identifier: email }. The unique constraint on identifier means only one token can exist per email at a time. The model looks like it could hold multiple tokens for the same identifier since it has its own id field. The database constraint says otherwise. I had to open the migration file to see what was actually generated because the schema never told me.
What goes wrong if ignored: You write queries that look correct against the Prisma model but behave differently against the real database.

Q9   Zawinski's Law
Code reference: src/lib/ratelimit.ts, src/app/api/auth/[...nextauth]/route.ts
Rate limiting is not in Next.js or NextAuth and that is a good thing. NextAuth handles authentication. The rate limiter handles abuse prevention. They are separate tools doing separate jobs and they stay that way.
Zawinski's Law says every program tries to expand until it can do everything. Frameworks are the same. If NextAuth had tried to bundle in rate limiting, you could not replace the rate limiter without touching the auth config. You could not use the rate limiter on non-auth endpoints without pulling in the whole auth package. As SecureGate grows there will be pressure to dump new features directly into existing modules because it is faster. Audit logs into auth.ts. Email logic into route handlers. Without discipline the lib folder becomes a place where everything lives and nothing is findable.
What goes wrong if ignored: Everything ends up depending on everything else and changing one thing breaks three others.

Q10   Principle of Least Surprise
Code reference: src/components/auth/login-form.tsx:25-27
The exact message is "Invalid credentials." That is it. It shows whether the email does not exist or the password is wrong. Both failures get the same response.
I chose this wording because it tells the user their login failed without telling them which part was wrong. A message that said "email not found" would be more helpful to an attacker than to the actual user. The Principle of Least Surprise says software should behave the way users expect. Users expect a failed login to show a generic error. They do not expect the form to hint at which field was correct. Consistent failure messages are the expected behavior and they also happen to be the secure one.
What goes wrong if ignored: Different messages for wrong email versus wrong password let an attacker confirm which emails are registered just by watching what the form says back.

Q11   Murphy's Law + Defensive Programming
Code reference: src/middleware.ts, src/app/dashboard/page.tsx
The middleware uses withAuth from next-auth/middleware. On every request to the dashboard it reads the next-auth.session-token cookie, decrypts it using NEXTAUTH_SECRET and checks the JWT signature. If the token is valid the request goes through. If the token is missing, expired or invalid it redirects to login with a 302.
If a user manually deletes their session cookie and visits the dashboard this is what happens. The middleware runs because the route matches the config matcher. withAuth looks for the cookie and finds nothing. It immediately redirects to login. The dashboard page never loads.
If somehow the middleware was bypassed and the user landed on the page anyway, the useSession hook on the dashboard returns unauthenticated and the useEffect calls router.replace to send them back to login.
The exact path is: middleware runs, cookie not found, 302 to login, page never renders.
What goes wrong if ignored: A single missing check is all it takes for an unauthenticated user to reach a protected page.

Q12   Kerckhoffs's Principle + Technical Debt
Code reference: src/middleware.ts, .env.local
If NEXTAUTH_SECRET was committed to GitHub this is what happens step by step.
Someone finds it, either by scanning the repo or through GitHub's secret scanning alerts. They now know the secret used to sign every session JWT in the system. They craft a fake JWT with whatever user id and email they want. They paste it into their browser as the session cookie. The middleware decrypts it, the signature checks out, and they are in as any user they chose.
To recover: change NEXTAUTH_SECRET in Vercel immediately. This invalidates every existing session and forces all users to log back in. Then remove the secret from the git history using git filter-branch or an interactive rebase and force push the cleaned history. Check if the repo was forked before the secret was removed. Enable GitHub secret scanning so it never happens again. Then go through every other exposed variable, DATABASE_URL, EMAIL_PASS, UPSTASH tokens, and rotate all of them too.
What goes wrong if ignored: A leaked NEXTAUTH_SECRET is not a "change your password" situation. It is a full account takeover for every user on the platform.

Q13   Conway's Law
Code reference: src/app/(auth)/, src/lib/, src/components/auth/, prisma/schema.prisma
Conway's Law says systems mirror the structure of the people or teams that build them. For a solo project the structure mirrors how one person thinks about the problem.
Auth pages live together in src/app/(auth)/ because in my head they are one feature. Database logic lives in src/lib/db.ts, email in src/lib/email.ts, tokens in src/lib/tokens.ts because I think of those as separate tools I reach for when I need them. UI components for auth live in src/components/auth/ because the form is its own thing separate from the route it sits on. The middleware sits at the root because it is the gatekeeper for everything.
If three people built this, one would own the API routes, one the UI and one the lib folder. The structure already maps to those natural boundaries without anyone planning it that way. That is Conway's Law. The folder structure is just the way I think about the problem made visible.
What goes wrong if ignored: When there are no clear boundaries, code ends up everywhere and nobody knows where to look or what is safe to change.

Q14    Technical Debt
Code reference: src/middleware.ts, src/app/dashboard/page.tsx
The middleware only checks that the user has a valid session. It does not check whether emailVerified is set. Right now the dashboard shows a warning banner to unverified users but never actually blocks them server side. The client side check handles it for now but it is a warning not a wall.
This works today because the app is small and there is nothing sensitive behind the dashboard yet. But as soon as a premium feature or any real data goes behind that route, unverified users can access it. Every new route that copies this pattern spreads the problem  
I did not do this during the assessment because it required touching both the middleware and the auth config at the same time which was risky during a timed build. The current approach works but it is the kind of shortcut that gets more expensive every time a new route is added.
What goes wrong if ignored: Unverified users eventually access things they should not. The longer it stays unfixed the more places it needs to be fixed.

Q15 — Synthesis
Code reference: all of the above
Every principle from this task still applies if Flutterwave is added. A few of them become significantly more important when money is involved.
Murphy's Law becomes the most urgent. Payment flows fail in more ways than auth flows. Network timeouts, duplicate webhook calls, users closing the browser mid-payment, insufficient funds. Every one of those needs a specific fallback. Flutterwave uses a tx_ref field for idempotency. Without it a network retry could charge someone twice.
Kerckhoffs's Principle becomes critical in a new way. The Flutterwave secret key is not just a session signing key. It is direct access to financial operations. If it leaks an attacker can query transaction history, initiate refunds and impersonate webhooks. Rotation is harder because Flutterwave has to be involved. The key goes in environment variables and never anywhere else.
Defense in depth gets more important because payment fraud is financially motivated and targeted. The middleware checks session, the route handler verifies the user owns the order, the webhook handler verifies Flutterwave's signature. All three layers need to hold.
YAGNI still applies. Start with one product, one currency, one payment method. Subscriptions, refunds, multi-currency and bank transfers all add PCI compliance surface area. None of them get built until someone actually asks for them.
Technical debt has a money value now. An idempotency bug is a double charge. A missing webhook log means you cannot reconcile payments when something goes wrong. The same shortcuts that are annoying in auth are expensive in payments.
The principle that changes least is Gall's Law. Start with the simplest possible payment flow that works end to end. Verify the webhook fires, the database records the transaction, the dashboard unlocks. Then build from there.

Part 4  One Thing I Would Refactor
The Prisma client in src/lib/db.ts uses a JavaScript Proxy to avoid initializing at import time. It works but TypeScript does not fully understand what the Proxy is doing and if something breaks inside it the error is hard to trace.
 
Every route would call const db = await getPrisma() instead of importing db directly. The error message when DATABASE_URL is missing is readable. There is no Proxy to reason about. I did not do this refactor during the assessment because it meant touching every single route file at once which was too much risk during a timed build.

Part 5  How This Changes How I Build
I used to think of auth as something you just bolt onto a project. Now I see it as a chain where every single link has to hold. Token generation, email delivery, password hashing, session handling, error messages, rate limiting. Any one of them failing quietly is a security problem.
The biggest shift is how I think about error messages. Before this they were just feedback. Now I know the wording is a security decision. Invalid credentials versus   email not found  are not the same thing. One of them tells an attacker something useful.
 

  Why I Switched from Resend to Nodemailer
Resend was in the original spec and it is a good tool for Vercel hosted apps. The problem is the free tier only lets you send emails to one verified address. Anyone cloning the repo to test it would never receive a real email without a paid Resend account.
Nodemailer with a Gmail App Password fixes this completely. Any developer can create a Gmail account, generate an App Password, add two environment variables and have real emails arriving in minutes. No credit card, no domain verification, no rate plan.
The switch only touched src/lib/email.ts. The function names stayed the same. Every route that calls sendVerificationEmail() or sendResetPasswordEmail() required zero changes. Token logic, expiry checks, rate limiting, none of it moved.
The lesson is to pick infrastructure that works the same way in every environment  developers will actually use. Resend is correct on paper. Nodemailer is correct in practice for a project that needs to be fully testable at zero cost.

