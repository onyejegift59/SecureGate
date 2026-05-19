import crypto from "crypto";
import { db } from "./db";

export const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;
export const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function generateVerificationToken(
  email: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  await db.verificationToken.upsert({
    where: { identifier: email },
    update: { token, expires },
    create: { identifier: email, token, expires },
  });

  return token;
}

export async function generateResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  );

  await db.passwordResetToken.upsert({
    where: { email },
    update: { token, expires },
    create: { email, token, expires },
  });

  return token;
}
