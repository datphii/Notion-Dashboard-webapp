"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NotionDataset, PropertySchema, WorkspaceMember } from "@/lib/notion";
import type { SessionPayload } from "@/lib/session";
import { groupableProperties, buildGroups } from "@/lib/group";
import { hexForColor } from "@/lib/colors";
import TableView from "./TableView";
import BoardView from "./BoardView";
import CalendarView from "./CalendarView";
import AddRowModal from "./AddRowModal";

type ViewMode = "table" | "board" | "calendar";

function isFilterable(p: PropertySchema) {
  return p.type === "select" || p.type === "status" || p.type === "multi_select";
}

export default function Dashboard({
  dataset,
  currentUser,
  workspaceMembers,
}: {
  dataset: NotionDataset;
  currentUser: SessionPayload | null;
  workspaceMembers: WorkspaceMember[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Formatted with the viewer's local timezone, which is only known after
  // mount - computing it during the render that gets sent to both the
  // server and the client would produce different strings there (Vercel's
  // server runs in UTC) and trip a React hydration mismatch.
  const [fetchedAtLabel, setFetchedAtLabel] = useState<string | null>(null);
  useEffect(() => {
    setFetchedAtLabel(
      new Date(dataset.fetchedAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    );
  }, [dataset.fetchedAt]);

  const filterableProps = useMemo(
    () => dataset.schema.filter(isFilterable),
    [dataset.schema]
  );
  const groupableProps = useMemo(
    () => groupableProperties(dataset.schema),
    [dataset.schema]
  );
  const dateProps = useMemo(
    () => dataset.schema.filter((p) => p.type === "date"),
    [dataset.schema]
  );

  const defaultGroupProp =
    groupableProps.find((p) => p.name.toLowerCase() === "status") ??
    groupableProps[0];
  const [groupByName, setGroupByName] = useState<string | undefined>(
    defaultGroupProp?.name
  );
  const [dateFieldName, setDateFieldName] = useState<string | undefined>(
    dateProps[0]?.name
  );

  const tableColumns = dataset.schema.filter((p) => p.type !== "title");
  const titleProp = dataset.schema.find((p) => p.type === "title");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function moveRow(rowId: string, propName: string, propType: string, value: string) {
    await fetch(`/api/rows/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property: propName, type: propType, value }),
    });
    router.refresh();
  }

  const filteredRows = useMemo(() => {
    return dataset.rows.filter((row) => {
      if (
        search.trim() &&
        !row.title.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      for (const [propName, wanted] of Object.entries(activeFilters)) {
        if (!wanted) continue;
        const value = row.properties[propName];
        if (Array.isArray(value)) {
          const names = (value as { name: string }[]).map((v) => v.name);
          if (!names.includes(wanted)) return false;
        } else if (value && typeof value === "object" && "name" in value) {
          if ((value as { name: string }).name !== wanted) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [dataset.rows, search, activeFilters]);

  const groupByProp = groupableProps.find((p) => p.name === groupByName);
  const groups = groupByProp ? buildGroups(filteredRows, groupByProp) : [];
  const dateProp = dateProps.find((p) => p.name === dateFieldName);

  const boardCardColumns = dataset.schema.filter(
    (p) => p.type !== "title" && p.name !== groupByProp?.name
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{dataset.databaseTitle}</h1>
          <a
            href={dataset.databaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:underline"
          >
            Xem trong Notion ↗
          </a>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span suppressHydrationWarning>Cập nhật lúc {fetchedAtLabel ?? "..."}</span>
          <button
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-3 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
          >
            {isPending ? "Đang tải..." : "Làm mới"}
          </button>
          {currentUser ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center rounded-full bg-gray-100 py-1 pl-2.5 pr-1 font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                {currentUser.name}
                {currentUser.role === "Admin" && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                    Admin
                  </span>
                )}
              </span>
              {currentUser.role === "Admin" && (
                <Link
                  href="/admin/users"
                  className="rounded-lg border border-gray-300 px-2 py-1 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-neutral-800"
                >
                  Quản lý tài khoản
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-lg border border-gray-300 px-2 py-1 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-neutral-800"
              >
                Đăng xuất
              </button>
            </span>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-3 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700">
          {(
            [
              ["table", "Bảng"],
              ["board", "Kanban"],
              ["calendar", "Lịch"],
            ] as [ViewMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                view === mode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề..."
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-neutral-950 dark:focus:ring-blue-950"
        />

        {filterableProps.map((prop) => (
          <select
            key={prop.name}
            value={activeFilters[prop.name] ?? ""}
            onChange={(e) =>
              setActiveFilters((prev) => ({ ...prev, [prop.name]: e.target.value }))
            }
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-neutral-950 dark:focus:ring-blue-950"
          >
            <option value="">{prop.name}: Tất cả</option>
            {prop.options?.map((o) => (
              <option key={o.name} value={o.name} style={{ color: hexForColor(o.color) }}>
                ● {o.name}
              </option>
            ))}
          </select>
        ))}

        {view === "board" && groupableProps.length > 0 && (
          <select
            value={groupByName}
            onChange={(e) => setGroupByName(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-neutral-950 dark:focus:ring-blue-950"
          >
            {groupableProps.map((p) => (
              <option key={p.name} value={p.name}>
                Nhóm theo: {p.name}
              </option>
            ))}
          </select>
        )}

        {view === "calendar" && dateProps.length > 0 && (
          <select
            value={dateFieldName}
            onChange={(e) => setDateFieldName(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-neutral-950 dark:focus:ring-blue-950"
          >
            {dateProps.map((p) => (
              <option key={p.name} value={p.name}>
                Theo ngày: {p.name}
              </option>
            ))}
          </select>
        )}

        {currentUser && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
          >
            + Thêm video
          </button>
        )}

        <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
          {filteredRows.length} / {dataset.rows.length} mục
        </span>
      </div>

      {view === "table" && (
        <TableView
          rows={filteredRows}
          columns={tableColumns}
          accentProp={defaultGroupProp}
          titleProp={titleProp}
          editable={Boolean(currentUser)}
          workspaceMembers={workspaceMembers}
        />
      )}
      {view === "board" &&
        (groupByProp ? (
          <>
            {Boolean(currentUser) &&
              (groupByProp.type === "select" || groupByProp.type === "status") && (
                <p className="mb-3 text-xs text-gray-400">
                  Kéo thẻ sang cột khác để đổi {groupByProp.name}.
                </p>
              )}
            <BoardView
              groups={groups}
              cardColumns={boardCardColumns}
              draggable={
                Boolean(currentUser) &&
                (groupByProp.type === "select" || groupByProp.type === "status")
              }
              onDropRow={(rowId, newValue) =>
                moveRow(rowId, groupByProp.name, groupByProp.type, newValue)
              }
            />
          </>
        ) : (
          <p className="text-gray-400">
            Database này không có cột phù hợp để nhóm theo Kanban.
          </p>
        ))}
      {view === "calendar" &&
        (dateProp ? (
          <CalendarView rows={filteredRows} dateProp={dateProp} />
        ) : (
          <p className="text-gray-400">
            Database này không có cột ngày tháng để hiển thị lịch.
          </p>
        ))}

      {showAddModal && (
        <AddRowModal
          schema={dataset.schema}
          workspaceMembers={workspaceMembers}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}
