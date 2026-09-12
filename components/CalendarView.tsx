"use client";

import { useMemo, useState } from "react";
import type { NotionRow, PropertySchema } from "@/lib/notion";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CalendarView({
  rows,
  dateProp,
}: {
  rows: NotionRow[];
  dateProp: PropertySchema;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { byDay, undated } = useMemo(() => {
    const map = new Map<string, NotionRow[]>();
    const noDate: NotionRow[] = [];
    for (const row of rows) {
      const value = row.properties[dateProp.name] as
        | { start: string; end: string | null }
        | null;
      if (!value?.start) {
        noDate.push(row);
        continue;
      }
      const key = value.start.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return { byDay: map, undated: noDate };
  }, [rows, dateProp]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = toDateKey(new Date());
  const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-neutral-800"
        >
          ← Tháng trước
        </button>
        <div className="font-semibold">
          Tháng {month + 1} / {year}
        </div>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-neutral-800"
        >
          Tháng sau →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {weekdayLabels.map((w) => (
          <div key={w} className="p-1 text-center font-semibold text-gray-500">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const key = toDateKey(date);
          const items = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`min-h-24 rounded-md border p-1 ${
                isToday
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="mb-1 text-right text-gray-400">{date.getDate()}</div>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 3).map((row) => (
                  <a
                    key={row.id}
                    href={row.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate rounded bg-gray-100 px-1 py-0.5 hover:underline dark:bg-neutral-800"
                    title={row.title}
                  >
                    {row.title}
                  </a>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-gray-400">
                    +{items.length - 3} khác
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {undated.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-gray-500">
            Chưa có {dateProp.name} ({undated.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {undated.map((row) => (
              <a
                key={row.id}
                href={row.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-neutral-900"
              >
                {row.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
