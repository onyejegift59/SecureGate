"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface VerificationStatusProps {
  success: boolean;
  message: string;
  email?: string;
}

export function VerificationStatus({ success, message, email }: VerificationStatusProps) {
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendEmail, setResendEmail] = useState(email || "");
  const [resendError, setResendError] = useState("");

  async function handleResend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResending(true);
    setResendError("");

    const res = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });

    if (!res.ok) {
      setResendError("Something went wrong");
      setResending(false);
      return;
    }

    setResendSent(true);
    setResending(false);
  }

  if (success) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Email verified</h1>
          <p className="mt-2 text-sm text-neutral-500">{message}</p>
          <Link href="/login">
            <Button className="mt-6 w-full">Sign in</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Verification failed</h1>
        <p className="mt-2 text-sm text-neutral-500">{message}</p>
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-neutral-900">Resend verification email</h2>
        <form onSubmit={handleResend} className="mt-3 space-y-3">
          {resendError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{resendError}</div>
          )}
          {resendSent ? (
            <p className="text-sm text-green-600">Verification email sent!</p>
          ) : (
            <>
              <div>
                <Label htmlFor="resend-email">Email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" loading={resending} className="w-full">
                Resend verification
              </Button>
            </>
          )}
        </form>
      </div>
    </Card>
  );
}
