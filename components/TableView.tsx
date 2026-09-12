"use client";

import type { NotionRow, PropertySchema } from "@/lib/notion";
import PropertyValue from "./PropertyValue";

export default function TableView({
  rows,
  columns,
}: {
  rows: NotionRow[];
  columns: PropertySchema[];
}) {
  if (!rows.length) {
    return (
      <div className="py-16 text-center text-gray-400">
        Không có mục nào khớp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
        <thead className="bg-gray-100 dark:bg-neutral-900">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-left font-semibold dark:bg-neutral-900">
              Tiêu đề
            </th>
            {columns.map((col) => (
              <th
                key={col.name}
                className="whitespace-nowrap px-4 py-2 text-left font-semibold"
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 dark:hover:bg-neutral-900/60"
            >
              <td className="sticky left-0 z-10 max-w-xs bg-white px-4 py-2 font-medium dark:bg-neutral-950">
                <a
                  href={row.notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {row.title}
                </a>
              </td>
              {columns.map((col) => (
                <td key={col.name} className="whitespace-nowrap px-4 py-2">
                  <PropertyValue type={col.type} value={row.properties[col.name]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
