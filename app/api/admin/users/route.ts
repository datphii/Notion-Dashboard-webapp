import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listUsers, createUser, type Role } from "@/lib/users";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const role: Role = body?.role === "Admin" ? "Admin" : "Editor";

  if (!name || !pin) {
    return NextResponse.json({ error: "Thiếu tên hoặc PIN." }, { status: 400 });
  }
  if (pin.length < 4) {
    return NextResponse.json({ error: "PIN cần tối thiểu 4 ký tự." }, { status: 400 });
  }

  const user = await createUser({ name, pin, role });
  return NextResponse.json({ user });
}
