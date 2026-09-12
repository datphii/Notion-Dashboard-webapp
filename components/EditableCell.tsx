"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NotionRow, PropertySchema, WorkspaceMember } from "@/lib/notion";
import { toEditValue } from "@/lib/editValue";
import PropertyValue from "./PropertyValue";
import PropertyEditor from "./PropertyEditor";

export default function EditableCell({
  row,
  column,
  workspaceMembers,
}: {
  row: NotionRow;
  column: PropertySchema;
  workspaceMembers?: WorkspaceMember[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<unknown>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rows/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property: column.name, type: column.type, value: localValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Không thể lưu.");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu.");
    } finally {
      setSaving(false);
    }
  }

  // Checkboxes toggle and save immediately - no separate edit mode needed.
  if (column.type === "checkbox") {
    const current = Boolean(row.properties[column.name]);
    return (
      <input
        type="checkbox"
        checked={current}
        disabled={saving}
        onChange={async (e) => {
          setSaving(true);
          await fetch(`/api/rows/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ property: column.name, type: column.type, value: e.target.checked }),
          });
          setSaving(false);
          router.refresh();
        }}
      />
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setLocalValue(toEditValue(column.type, row.properties[column.name]));
          setEditing(true);
        }}
        className="block w-full rounded px-1 py-0.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/30"
        title="Bấm để chỉnh sửa"
      >
        <PropertyValue type={column.type} value={row.properties[column.name]} />
      </button>
    );
  }

  return (
    <div className="min-w-[11rem] rounded-md border border-blue-300 bg-blue-50/50 p-1.5 dark:border-blue-800 dark:bg-blue-950/20">
      <PropertyEditor
        type={column.type}
        options={column.options}
        value={localValue}
        onChange={setLocalValue}
        workspaceMembers={workspaceMembers}
        listId={`dl-${row.id}-${column.name}`}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-1.5 flex gap-1">
        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded border border-gray-300 px-2 py-0.5 text-xs dark:border-gray-700"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
