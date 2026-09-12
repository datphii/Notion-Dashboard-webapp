"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { NotionRow, PropertySchema, WorkspaceMember } from "@/lib/notion";
import { toEditValue } from "@/lib/editValue";
import PropertyValue from "./PropertyValue";
import PropertyEditor from "./PropertyEditor";

const POPOVER_WIDTH = 256; // px, matches w-64

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<unknown>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

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
        className="h-4 w-4 cursor-pointer accent-blue-600"
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

  function openEditor() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      let left = rect.left;
      // Keep the popover on-screen instead of running off the right edge.
      if (left + POPOVER_WIDTH > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - POPOVER_WIDTH - 8);
      }
      setPopoverPos({ top: rect.bottom + 4, left });
    }
    setLocalValue(toEditValue(column.type, row.properties[column.name]));
    setError(null);
    setEditing(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openEditor}
        className="group/cell flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30"
        title="Bấm để chỉnh sửa"
      >
        <span className="min-w-0 flex-1">
          <PropertyValue type={column.type} value={row.properties[column.name]} />
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/cell:opacity-100 dark:text-gray-600"
        >
          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-9.5 9.5a1 1 0 0 1-.464.263l-3.5 1a1 1 0 0 1-1.237-1.237l1-3.5a1 1 0 0 1 .263-.464l9.5-9.5Z" />
        </svg>
      </button>

      {editing &&
        popoverPos &&
        createPortal(
          <>
            {/* Full-screen backdrop, click-to-cancel. The popover itself is
                fixed-positioned from the trigger button's real on-screen
                rect, so it always anchors right under the clicked cell no
                matter how tall that cell's wrapped content is, and never
                disturbs the table's own layout. */}
            <div className="fixed inset-0 z-40" onClick={() => setEditing(false)} />
            <div
              style={{ top: popoverPos.top, left: popoverPos.left, width: POPOVER_WIDTH }}
              className="fixed z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-neutral-900"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            >
              <PropertyEditor
                type={column.type}
                options={column.options}
                value={localValue}
                onChange={setLocalValue}
                workspaceMembers={workspaceMembers}
                listId={`dl-${row.id}-${column.name}`}
              />
              {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
