"use client";

import { useState } from "react";
import type { NotionRow, PropertySchema } from "@/lib/notion";
import { EMPTY_KEY, type Group } from "@/lib/group";
import { solidColorClasses, borderColorClass, tintBgColorClass, dotColorClass } from "@/lib/colors";
import PropertyValue from "./PropertyValue";

function Card({
  row,
  columns,
  accentColor,
  draggable,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  row: NotionRow;
  columns: PropertySchema[];
  accentColor?: string;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  return (
    <a
      href={row.notionUrl}
      target="_blank"
      rel="noopener noreferrer"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", row.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`block rounded-lg border-l-4 border-y border-r border-y-gray-200 border-r-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-y-gray-800 dark:border-r-gray-800 dark:bg-neutral-900 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : ""} ${borderColorClass(accentColor)}`}
    >
      <div className="mb-2 font-medium">{row.title}</div>
      <div className="flex flex-col gap-1 text-xs">
        {columns.map((col) => {
          const value = row.properties[col.name];
          if (value === null || value === undefined || value === "") return null;
          return (
            <div key={col.name} className="flex items-center gap-1">
              <span className="shrink-0 text-gray-400">{col.name}:</span>
              <PropertyValue type={col.type} value={value} />
            </div>
          );
        })}
      </div>
    </a>
  );
}

export default function BoardView({
  groups,
  cardColumns,
  draggable = false,
  onDropRow,
}: {
  groups: Group[];
  cardColumns: PropertySchema[];
  draggable?: boolean;
  onDropRow?: (rowId: string, newValue: string) => void;
}) {
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  if (!groups.length) {
    return (
      <div className="py-16 text-center text-gray-400">
        Không có mục nào khớp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groups.map((group) => (
        <div
          key={group.key}
          onDragOver={(e) => {
            if (!draggable) return;
            e.preventDefault();
            setDragOverKey(group.key);
          }}
          onDragLeave={() => setDragOverKey((k) => (k === group.key ? null : k))}
          onDrop={(e) => {
            if (!draggable) return;
            e.preventDefault();
            setDragOverKey(null);
            const rowId = e.dataTransfer.getData("text/plain");
            if (rowId && onDropRow) {
              onDropRow(rowId, group.key === EMPTY_KEY ? "" : group.label);
            }
          }}
          className={`w-72 shrink-0 rounded-lg border-t-4 p-3 transition-shadow ${borderColorClass(
            group.color
          )} ${tintBgColorClass(group.color)} ${
            dragOverKey === group.key ? "ring-2 ring-blue-400 ring-inset" : ""
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dotColorClass(group.color)}`} />
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${solidColorClasses(
                  group.color
                )}`}
              >
                {group.label}
              </span>
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-black/20 dark:text-gray-300">
              {group.rows.length}
            </span>
          </div>
          <div className="flex min-h-8 flex-col gap-2">
            {group.rows.map((row) => (
              <Card
                key={row.id}
                row={row}
                columns={cardColumns}
                accentColor={group.color}
                draggable={draggable}
                isDragging={draggingRowId === row.id}
                onDragStart={() => setDraggingRowId(row.id)}
                onDragEnd={() => setDraggingRowId(null)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
