import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST() {
  const session = await getCurrentSession();
  if (session) {
    logAuditEvent("AUTH_LOGOUT", { actorId: session.userId });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}


