import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  return handler(req, context);
}
