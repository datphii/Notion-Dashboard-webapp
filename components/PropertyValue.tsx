"use client";

import type { PropertyType, Person } from "@/lib/notion";
import { colorClasses, solidColorClasses } from "@/lib/colors";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function Badge({
  name,
  color,
  solid = true,
}: {
  name: string;
  color?: string;
  solid?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
        solid ? solidColorClasses(color) : colorClasses(color)
      }`}
    >
      {name}
    </span>
  );
}

const AVATAR_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function PeopleChips({ people }: { people: Person[] }) {
  if (!people.length) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {people.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2 text-xs font-medium text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
        >
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
          ) : (
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarColor(
                p.name
              )}`}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
          )}
          {p.name}
        </span>
      ))}
    </div>
  );
}

export default function PropertyValue({
  type,
  value,
}: {
  type: PropertyType;
  value: unknown;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
  }

  switch (type) {
    case "select":
    case "status": {
      const v = value as { name: string; color: string };
      return <Badge name={v.name} color={v.color} />;
    }
    case "multi_select": {
      const v = value as { name: string; color: string }[];
      if (!v.length) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {v.map((o) => (
            <Badge key={o.name} name={o.name} color={o.color} />
          ))}
        </div>
      );
    }
    case "people":
      return <PeopleChips people={value as Person[]} />;
    case "date": {
      const v = value as { start: string; end: string | null };
      return (
        <span>
          {formatDate(v.start)}
          {v.end ? ` → ${formatDate(v.end)}` : ""}
        </span>
      );
    }
    case "created_time":
    case "last_edited_time":
      return <span>{formatDate(value as string)}</span>;
    case "checkbox":
      return <span>{value ? "✅" : "☐"}</span>;
    case "url":
      return (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
        >
          {value as string}
        </a>
      );
    case "files": {
      const files = value as string[];
      if (!files.length) return <span className="text-gray-400">—</span>;
      return <span>{files.length} tệp</span>;
    }
    default:
      return <span>{String(value)}</span>;
  }
}
