import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validations/auth";
import { generateResetToken } from "@/lib/tokens";
import { sendResetPasswordEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = emailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "If an account exists, a reset email has been sent." },
        { status: 200 }
      );
    }

    const { email } = validated.data;

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      try {
        const token = await generateResetToken(email);
        await sendResetPasswordEmail(email, token);
      } catch {
        console.error("Failed to send reset email");
      }
    }

    return NextResponse.json(
      { message: "If an account exists, a reset email has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "If an account exists, a reset email has been sent." },
      { status: 200 }
    );
  }
}
