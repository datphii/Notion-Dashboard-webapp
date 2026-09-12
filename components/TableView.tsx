"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotionRow, PropertySchema, PropertyType, WorkspaceMember } from "@/lib/notion";
import { borderColorClass } from "@/lib/colors";
import PropertyValue from "./PropertyValue";
import EditableCell from "./EditableCell";

const PAGE_SIZE = 10;

function accentColorOf(row: NotionRow, accentProp?: PropertySchema): string | undefined {
  if (!accentProp) return undefined;
  const value = row.properties[accentProp.name] as { color?: string } | null;
  return value?.color;
}

// Short, badge-like values (select, numbers, dates...) should stay on one
// line so their column shrinks to fit; long free-text values should wrap
// instead of forcing the whole table to stretch out to their full length.
function cellWrapClass(type: PropertyType): string {
  return type === "rich_text"
    ? "min-w-[180px] max-w-xs whitespace-normal break-words"
    : "whitespace-nowrap";
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
  const rowsKey = useMemo(() => rows.map((r) => r.id).join(","), [rows]);
  const [page, setPage] = useState(1);

  // Jump back to page 1 whenever the actual set of visible rows changes
  // (search/filter/group changed) - but not just because the parent
  // re-rendered with a fresh array after an in-place edit, which would
  // otherwise annoyingly kick the user off the page they were working on.
  useEffect(() => {
    setPage(1);
  }, [rowsKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

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
        {pagedRows.map((row, i) => (
          <div
            key={row.id}
            className={`rounded-lg border-y border-r border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-neutral-950 ${borderColorClass(
              accentColorOf(row, accentProp)
            )} border-l-4`}
          >
            <div className="mb-2 flex items-baseline gap-2 font-medium">
              <span className="shrink-0 text-xs font-normal text-gray-400">
                #{startIndex + i + 1}
              </span>
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

      {/* max-h + overflow-y-auto turns this into its own scroll box so the
          sticky thead below actually freezes as you scroll through the
          rows - inside a plain overflow-x-auto wrapper (x-scroll only), the
          browser still treats it as a scroll container per spec but one
          that never scrolls vertically, which silently breaks position:
          sticky against the page. */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-12 min-w-[48px] bg-blue-50 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                STT
              </th>
              <th className="sticky top-0 left-12 z-20 min-w-[260px] bg-blue-50 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Tiêu đề
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="sticky top-0 z-10 whitespace-nowrap bg-blue-50 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pagedRows.map((row, i) => (
              <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-neutral-900/60">
                <td className="sticky left-0 z-10 w-12 min-w-[48px] bg-white px-2 py-2 text-center text-xs text-gray-400 group-hover:bg-gray-50 dark:bg-neutral-950 dark:group-hover:bg-neutral-900/60">
                  {startIndex + i + 1}
                </td>
                <td
                  className={`sticky left-12 z-10 min-w-[260px] border-l-4 bg-white px-4 py-2 font-medium group-hover:bg-gray-50 dark:bg-neutral-950 dark:group-hover:bg-neutral-900/60 ${borderColorClass(
                    accentColorOf(row, accentProp)
                  )}`}
                >
                  <TitleCell row={row} titleProp={titleProp} editable={editable} />
                </td>
                {columns.map((col) => (
                  <td key={col.name} className={`px-4 py-2 align-top ${cellWrapClass(col.type)}`}>
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

      {totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-xs text-gray-400">
            Trang {safePage}/{totalPages} — hiển thị {pagedRows.length} / {rows.length} mục
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-700"
            >
              ‹ Trước
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1
              )
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-gray-300">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[28px] rounded-md px-2 py-1 text-xs font-medium ${
                      p === safePage
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-700"
            >
              Sau ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
