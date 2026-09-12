import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateUser, deleteUser, type Role } from "@/lib/users";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const data: Partial<{ name: string; pin: string; role: Role; active: boolean }> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.pin === "string" && body.pin.trim()) data.pin = body.pin.trim();
  if (body?.role === "Admin" || body?.role === "Editor") data.role = body.role;
  if (typeof body?.active === "boolean") data.active = body.active;

  await updateUser(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
