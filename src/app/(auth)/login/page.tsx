import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
