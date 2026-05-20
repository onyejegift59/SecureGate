import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
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
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validated.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    let emailSent = true;

    try {
      const token = await generateVerificationToken(email);
      await sendVerificationEmail(email, token);
    } catch (error) {
      emailSent = false;
      console.error("Failed to send verification email", error);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? "Account created. Check your email to verify."
          : "Account created, but verification email could not be sent. Use dashboard to resend verification.",
        emailSent,
      },
      { status: emailSent ? 201 : 202 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
