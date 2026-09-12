import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByCredentials } from "@/lib/users";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!name.trim() || !pin.trim()) {
    return NextResponse.json({ error: "Thiếu tên hoặc PIN." }, { status: 400 });
  }

  const user = await findUserByCredentials(name, pin);
  if (!user) {
    return NextResponse.json({ error: "Tên hoặc PIN không đúng." }, { status: 401 });
  }

  const token = signSession({ userId: user.id, name: user.name, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true, name: user.name, role: user.role });
}
