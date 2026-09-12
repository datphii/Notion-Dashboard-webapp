import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateRow, type PropertyType } from "@/lib/notion";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const property = typeof body?.property === "string" ? body.property : "";
  const type = body?.type as PropertyType | undefined;

  if (!property || !type) {
    return NextResponse.json({ error: "Thiếu property hoặc type." }, { status: 400 });
  }

  try {
    await updateRow(id, property, type, body?.value ?? null);
  } catch (err) {
    console.error("updateRow failed:", err);
    return NextResponse.json({ error: "Không thể cập nhật Notion." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
