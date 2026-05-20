import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ResetPasswordForm token={params.token} />
    </div>
  );
}
