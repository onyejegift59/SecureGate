import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyEmailSchema } from "@/lib/validations/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = verifyEmailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = validated.data;

    const user = await db.user.findUnique({ where: { email } });

    if (user && !user.emailVerified) {
      try {
        const token = await generateVerificationToken(email);
        await sendVerificationEmail(email, token);
      } catch (e) {
        console.error("Failed to send verification email:", e);
      }
    }

    return NextResponse.json(
      { message: "If an account exists, a verification email has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
