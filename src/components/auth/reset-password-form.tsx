"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PasswordStrength } from "./password-strength";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const confirmPassword = formData.get("confirmPassword") as string;

    const errs: Record<string, string> = {};
    if (!password) errs.password = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    if (password && confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.errors) {
        const errs: Record<string, string> = {};
        for (const err of json.errors) {
          errs[err.path[0]] = err.message;
        }
        setFieldErrors(errs);
      } else {
        setError(json.message || "Something went wrong");
      }
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  }

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Set new password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <PasswordStrength password={password} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            error={fieldErrors.confirmPassword}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}
