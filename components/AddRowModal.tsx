"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PropertySchema, WorkspaceMember } from "@/lib/notion";
import PropertyEditor from "./PropertyEditor";

const SKIP_TYPES = new Set(["created_time", "last_edited_time", "files", "unsupported"]);

export default function AddRowModal({
  schema,
  workspaceMembers,
  onClose,
}: {
  schema: PropertySchema[];
  workspaceMembers?: WorkspaceMember[];
  onClose: () => void;
}) {
  const router = useRouter();
  const titleProp = schema.find((p) => p.type === "title");
  const otherProps = schema.filter((p) => p.type !== "title" && !SKIP_TYPES.has(p.type));

  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const p of otherProps) {
      if (p.type === "multi_select" || p.type === "people") init[p.name] = [];
      else if (p.type === "checkbox") init[p.name] = false;
      else if (p.type === "date") init[p.name] = { start: "", end: null };
      else init[p.name] = "";
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Cần nhập tiêu đề.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fields = [
        { name: titleProp?.name ?? "Title", type: "title", value: title },
        ...otherProps.map((p) => ({ name: p.name, type: p.type, value: values[p.name] })),
      ];
      const res = await fetch("/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Không thể tạo.");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl dark:bg-neutral-900 sm:p-6"
      >
        <h2 className="mb-4 text-lg font-bold">Thêm video mới</h2>

        <label className="mb-3 block text-sm">
          Tiêu đề
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-neutral-950"
          />
        </label>

        {otherProps.map((p) => (
          <div key={p.name} className="mb-3">
            <label className="mb-1 block text-sm">{p.name}</label>
            <PropertyEditor
              type={p.type}
              options={p.options}
              value={values[p.name]}
              onChange={(v) => setValues((prev) => ({ ...prev, [p.name]: v }))}
              workspaceMembers={workspaceMembers}
              listId={`new-${p.name}`}
            />
          </div>
        ))}

        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Đang tạo..." : "Tạo video"}
          </button>
        </div>
      </form>
    </div>
  );
}
