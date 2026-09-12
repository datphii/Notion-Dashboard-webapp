"use client";

import { useMemo, useState } from "react";
import type { NotionRow, PropertySchema } from "@/lib/notion";
import { buildGroups } from "@/lib/group";
import { dotColorClass, hexForColor, solidColorClasses } from "@/lib/colors";
import DonutChart from "./DonutChart";

function pct(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export default function StatsView({
  rows,
  schema,
}: {
  rows: NotionRow[];
  schema: PropertySchema[];
}) {
  const statFields = useMemo(
    () => schema.filter((p) => p.type === "select" || p.type === "status"),
    [schema]
  );
  const defaultField =
    statFields.find((p) => /status|trạng thái/i.test(p.name)) ?? statFields[0];
  const [fieldName, setFieldName] = useState<string | undefined>(defaultField?.name);
  const field = statFields.find((p) => p.name === fieldName) ?? defaultField;

  if (!field) {
    return (
      <p className="text-gray-400">
        Database này không có cột select/status nào để thống kê.
      </p>
    );
  }

  const groups = buildGroups(rows, field);
  const total = rows.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold sm:text-lg">Thống kê theo</h2>
        <select
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-neutral-950 dark:focus:ring-blue-950"
        >
          {statFields.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center">
          <DonutChart
            segments={groups.map((g) => ({ key: g.key, label: g.label, color: g.color, count: g.rows.length }))}
            total={total}
          />
          <p className="mt-2 text-xs text-gray-400">Tổng {total} mục</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2">
          {groups.map((g) => (
            <div
              key={g.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColorClass(g.color)}`} />
                <span className="truncate text-sm">{g.label}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {g.rows.length} · {pct(g.rows.length, total)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
          <span>Tiến độ theo {field.name}</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
          {groups
            .filter((g) => g.rows.length > 0)
            .map((g) => (
              <div
                key={g.key}
                style={{ width: `${pct(g.rows.length, total)}%`, backgroundColor: hexForColor(g.color) }}
                title={`${g.label}: ${g.rows.length} (${pct(g.rows.length, total)}%)`}
              />
            ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {groups
            .filter((g) => g.rows.length > 0)
            .map((g) => (
              <span
                key={g.key}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${solidColorClasses(g.color)}`}
              >
                {g.label} {pct(g.rows.length, total)}%
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
