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

function TitleCell({
  row,
  titleProp,
  editable,
}: {
  row: NotionRow;
  titleProp?: PropertySchema;
  editable?: boolean;
}) {
  if (editable && titleProp) return <EditableCell row={row} column={titleProp} />;
  return (
    <a href={row.notionUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
      {row.title}
    </a>
  );
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
    <>
      {/* Below md, a wide multi-column table forces horizontal scrolling
          that hides most fields off-screen - a stacked card per row keeps
          every value visible without scrolling. */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`rounded-lg border-y border-r border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-neutral-950 ${borderColorClass(
              accentColorOf(row, accentProp)
            )} border-l-4`}
          >
            <div className="mb-2 font-medium">
              <TitleCell row={row} titleProp={titleProp} editable={editable} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {columns.map((col) => (
                <div key={col.name} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {col.name}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {editable ? (
                      <EditableCell row={row} column={col} workspaceMembers={workspaceMembers} />
                    ) : (
                      <PropertyValue type={col.type} value={row.properties[col.name]} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 md:block">
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
              <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-neutral-900/60">
                <td
                  className={`sticky left-0 z-10 max-w-xs border-l-4 bg-white px-4 py-2 font-medium group-hover:bg-gray-50 dark:bg-neutral-950 dark:group-hover:bg-neutral-900/60 ${borderColorClass(
                    accentColorOf(row, accentProp)
                  )}`}
                >
                  <TitleCell row={row} titleProp={titleProp} editable={editable} />
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
    </>
  );
}
