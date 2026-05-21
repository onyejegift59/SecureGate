"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string) || "";

    if (!email.trim()) {
      setFieldError("Please enter your email");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();

      if (res.status === 429) {
        setError(json.message || "Too many attempts. Please try again later.");
        setLoading(false);
        return;
      }

      if (json.devResetUrl) {
        setDevResetUrl(json.devResetUrl);
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
          <p className="mt-2 text-sm text-neutral-500">
            If an account exists, we sent a password reset link.
          </p>
          {devResetUrl && (
            <div className="mt-4 rounded-md bg-neutral-100 p-3 text-left">
              <p className="text-xs font-medium text-neutral-500">DEV MODE — Reset URL</p>
              <a
                href={devResetUrl}
                className="mt-1 block text-sm text-blue-600 underline break-all"
              >
                {devResetUrl}
              </a>
            </div>
          )}
          <Button onClick={() => window.location.href = "/login"} className="mt-6 w-full">
            Back to login
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required error={fieldError} />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Sending reset link..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
