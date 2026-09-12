"use client";

import type { PropertyType, Person } from "@/lib/notion";
import { colorClasses } from "@/lib/colors";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function Badge({ name, color }: { name: string; color?: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${colorClasses(
        color
      )}`}
    >
      {name}
    </span>
  );
}

export function PeopleChips({ people }: { people: Person[] }) {
  if (!people.length) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {people.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
        >
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[9px] dark:bg-gray-600">
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
