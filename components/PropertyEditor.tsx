"use client";

import type { PropertyType, SelectOption, WorkspaceMember } from "@/lib/notion";

const inputClass =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-neutral-950";

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
        <>
          <input
            className={inputClass}
            list={listId}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Chọn hoặc nhập giá trị mới..."
          />
          <datalist id={listId}>
            {options?.map((o) => (
              <option key={o.name} value={o.name} />
            ))}
          </datalist>
        </>
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
