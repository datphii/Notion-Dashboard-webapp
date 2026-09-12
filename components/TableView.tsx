"use client";

import type { NotionRow, PropertySchema, WorkspaceMember } from "@/lib/notion";
import { borderColorClass } from "@/lib/colors";
import PropertyValue from "./PropertyValue";
import EditableCell from "./EditableCell";

function accentColorOf(row: NotionRow, accentProp?: PropertySchema): string | undefined {
  if (!accentProp) return undefined;
  const value = row.properties[accentProp.name] as { color?: string } | null;
  return value?.color;
}

export default function TableView({
  rows,
  columns,
  accentProp,
  titleProp,
  editable,
  workspaceMembers,
}: {
  rows: NotionRow[];
  columns: PropertySchema[];
  accentProp?: PropertySchema;
  titleProp?: PropertySchema;
  editable?: boolean;
  workspaceMembers?: WorkspaceMember[];
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
        <thead className="bg-gray-50 dark:bg-neutral-900">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-neutral-900 dark:text-gray-400">
              Tiêu đề
            </th>
            {columns.map((col) => (
              <th
                key={col.name}
                className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
              className="group hover:bg-gray-50 dark:hover:bg-neutral-900/60"
            >
              <td
                className={`sticky left-0 z-10 max-w-xs border-l-4 bg-white px-4 py-2 font-medium group-hover:bg-gray-50 dark:bg-neutral-950 dark:group-hover:bg-neutral-900/60 ${borderColorClass(
                  accentColorOf(row, accentProp)
                )}`}
              >
                {editable && titleProp ? (
                  <EditableCell row={row} column={titleProp} />
                ) : (
                  <a
                    href={row.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {row.title}
                  </a>
                )}
              </td>
              {columns.map((col) => (
                <td key={col.name} className="whitespace-nowrap px-4 py-2 align-top">
                  {editable ? (
                    <EditableCell row={row} column={col} workspaceMembers={workspaceMembers} />
                  ) : (
                    <PropertyValue type={col.type} value={row.properties[col.name]} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
