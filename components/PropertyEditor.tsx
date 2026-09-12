"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyType, SelectOption, WorkspaceMember } from "@/lib/notion";

const inputClass =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-neutral-950";

// Native <input list=datalist> only suggests options that still match the
// current text, so once a value is already selected the browser hides every
// other option - this reimplements the combobox by hand so the full list is
// always browsable, both when creating a new item and when editing one.
function SelectCombobox({
  options,
  value,
  onChange,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  function select(name: string) {
    onChange(name);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputClass}
        value={open ? query : value ?? ""}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Chọn hoặc nhập giá trị mới..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (query.trim()) select(query.trim());
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-neutral-900">
          {value && (
            <button
              type="button"
              onClick={() => select("")}
              className="block w-full px-2 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              — Xoá giá trị —
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => select(o.name)}
              className={`block w-full truncate px-2 py-1.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-neutral-800 ${
                o.name === value ? "bg-blue-50 font-medium dark:bg-neutral-800" : ""
              }`}
            >
              {o.name}
            </button>
          ))}
          {filtered.length === 0 && !query.trim() && (
            <p className="px-2 py-1.5 text-xs text-gray-400">Chưa có lựa chọn nào.</p>
          )}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => select(query.trim())}
              className="block w-full border-t border-gray-100 px-2 py-1.5 text-left text-sm text-blue-600 hover:bg-blue-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-neutral-800"
            >
              + Tạo mới &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertyEditor({
  type,
  options,
  value,
  onChange,
  workspaceMembers,
  listId,
}: {
  type: PropertyType;
  options?: SelectOption[];
  value: unknown;
  onChange: (value: unknown) => void;
  workspaceMembers?: WorkspaceMember[];
  listId: string;
}) {
  switch (type) {
    case "title":
    case "rich_text":
    case "url":
    case "email":
    case "phone_number":
      return (
        <input
          className={inputClass}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className={inputClass}
          value={value === "" || value === null || value === undefined ? "" : (value as number)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );

    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case "date": {
      const v = (value as { start: string; end: string | null }) ?? { start: "", end: null };
      return (
        <input
          type="date"
          className={inputClass}
          value={v.start ? v.start.slice(0, 10) : ""}
          onChange={(e) => onChange({ start: e.target.value, end: null })}
        />
      );
    }

    case "select":
    case "status":
      return (
        <SelectCombobox options={options ?? []} value={(value as string) ?? ""} onChange={onChange} />
      );

    case "multi_select": {
      const selected = (value as string[]) ?? [];
      const toggle = (name: string) =>
        onChange(
          selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
        );
      return (
        <div className="flex flex-wrap gap-2">
          {(options ?? []).map((o) => (
            <label key={o.name} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(o.name)}
                onChange={() => toggle(o.name)}
              />
              {o.name}
            </label>
          ))}
          <input
            className="w-32 rounded-md border border-gray-300 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-neutral-950"
            placeholder="+ giá trị mới"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = e.currentTarget.value.trim();
                if (v && !selected.includes(v)) onChange([...selected, v]);
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      );
    }

    case "people": {
      const selected = (value as string[]) ?? [];
      const toggle = (id: string) =>
        onChange(selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id]);
      return (
        <div className="flex flex-wrap gap-2">
          {(workspaceMembers ?? []).map((m) => (
            <label key={m.id} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggle(m.id)}
              />
              {m.name}
            </label>
          ))}
          {!workspaceMembers?.length && (
            <span className="text-xs text-gray-400">Không tìm thấy thành viên workspace.</span>
          )}
        </div>
      );
    }

    default:
      return <span className="text-xs text-gray-400">Không hỗ trợ chỉnh sửa trường này.</span>;
  }
}
