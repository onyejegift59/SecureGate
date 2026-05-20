"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  async function handleResendVerification() {
    if (!session?.user?.email) return;

    setResendStatus("sending");
    setResendMessage("");

    const res = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
    });

    if (!res.ok) {
      setResendStatus("error");
      setResendMessage("Failed to resend verification email. Please try again.");
      return;
    }

    setResendStatus("success");
    setResendMessage("Verification email sent. Check your inbox.");
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <span className="text-lg font-bold text-neutral-900">SecureGate</span>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-2 text-neutral-500">Welcome back, {session.user.name || "User"}.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-medium text-neutral-500">Account</h2>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Email</span>
                  <span className="text-sm font-medium text-neutral-900">{session.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Name</span>
                  <span className="text-sm font-medium text-neutral-900">{session.user.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Verified</span>
                  <span className={`text-sm font-medium ${session.user.emailVerified ? "text-green-600" : "text-red-600"}`}>
                    {session.user.emailVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              {!session.user.emailVerified && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                  <p>Your email is not verified yet. Resend the verification email below.</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={resendStatus === "sending"}
                    >
                      {resendStatus === "sending" ? "Sending..." : "Resend verification email"}
                    </Button>
                  </div>
                  {resendMessage && (
                    <p className={`mt-3 text-sm ${resendStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-medium text-neutral-500">Session</h2>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">User ID</span>
                  <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">{session.user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Status</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
