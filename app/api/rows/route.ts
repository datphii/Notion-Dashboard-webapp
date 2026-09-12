import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createRow, type PropertyType } from "@/lib/notion";

interface FieldInput {
  name: string;
  type: PropertyType;
  value: unknown;
}

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fields = Array.isArray(body?.fields) ? (body.fields as FieldInput[]) : null;
  if (!fields || !fields.length) {
    return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });
  }

  try {
    const id = await createRow(fields);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("createRow failed:", err);
    return NextResponse.json({ error: "Không thể tạo mục mới trên Notion." }, { status: 502 });
  }
}
