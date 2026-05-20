import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <span className="text-lg font-bold text-neutral-900">SecureGate</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
            Authentication, done right
          </h1>
          <p className="mt-4 text-lg text-neutral-500">
            SecureGate is a production-grade authentication system built with security-first
            engineering practices. Sign up to experience secure auth in action.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
