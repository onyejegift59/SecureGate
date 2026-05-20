import { db } from "@/lib/db";
import { VerificationStatus } from "@/components/auth/verification-status";

export default async function VerifyEmailPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <VerificationStatus
          success={false}
          message="This verification link is invalid or has already been used."
        />
      </div>
    );
  }

  if (verificationToken.expires < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <VerificationStatus
          success={false}
          message="This verification link has expired."
          email={verificationToken.identifier}
        />
      </div>
    );
  }

  await db.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <VerificationStatus
        success={true}
        message="Your email has been verified. You can now sign in."
      />
    </div>
  );
}
