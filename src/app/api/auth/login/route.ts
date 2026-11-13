import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, autoProvisionStudentProfile } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, email, password, name } = body;

    let userSession;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid student or university email." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (mode === "signup") {
      await autoProvisionStudentProfile(name || email.split("@")[0], email);
    }

    userSession = {
      userId: `student-${email}`,
      email: email.toLowerCase().trim(),
      name: name || email.split("@")[0],
      role: "student" as const,
    };

    const encoded = Buffer.from(JSON.stringify(userSession)).toString("base64");

    const response = NextResponse.json({
      success: true,
      user: userSession,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encoded,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Auth login error:", err);
    return NextResponse.json(
      { error: "Authentication service encountered an error." },
      { status: 500 }
    );
  }
}

