import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (session) {
    logAuditEvent("AUTH_LOGOUT", { actorId: session.userId });
  }

  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.url.startsWith("https://") ||
    process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}


