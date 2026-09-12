"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PropertySchema, WorkspaceMember } from "@/lib/notion";
import { parseExcelFile, downloadImportTemplate, type ParsedImport } from "@/lib/importExcel";

const MAX_ROWS = 300;
const DELAY_MS = 350; // spaces out requests to stay well under Notion's rate limit

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ImportExcelModal({
  schema,
  workspaceMembers,
  onClose,
}: {
  schema: PropertySchema[];
  workspaceMembers: WorkspaceMember[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ created: number; failed: { title: string; error: string }[] } | null>(
    null
  );

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsed(null);
    setResult(null);
    setParseError(null);
    setParsing(true);
    try {
      const parsedFile = await parseExcelFile(file, schema, workspaceMembers);
      if (parsedFile.rows.length === 0) {
        setParseError(
          "Không tìm thấy dòng nào có Tiêu đề hợp lệ trong file. Kiểm tra lại tên cột đầu tiên có khớp với cột Tiêu đề không."
        );
      } else if (parsedFile.rows.length > MAX_ROWS) {
        setParseError(`File có ${parsedFile.rows.length} dòng, vượt quá giới hạn ${MAX_ROWS} dòng/lần import.`);
      } else {
        setParsed(parsedFile);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Không đọc được file. Đảm bảo đây là file .xlsx hợp lệ.");
    } finally {
      setParsing(false);
    }
  }

  async function runImport() {
    if (!parsed) return;
    setImporting(true);
    setProgress({ done: 0, total: parsed.rows.length });
    let created = 0;
    const failed: { title: string; error: string }[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      try {
        const res = await fetch("/api/rows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: row.fields }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Không thể tạo.");
        }
        created++;
      } catch (err) {
        failed.push({ title: row.title, error: err instanceof Error ? err.message : "Lỗi không rõ" });
      }
      setProgress({ done: i + 1, total: parsed.rows.length });
      if (i < parsed.rows.length - 1) await sleep(DELAY_MS);
    }

    setResult({ created, failed });
    setImporting(false);
    router.refresh();
  }

  const allWarnings = parsed ? parsed.rows.flatMap((r) => r.warnings) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl dark:bg-neutral-900 sm:p-6"
      >
        <h2 className="mb-1 text-lg font-bold">Nhập video hàng loạt từ Excel</h2>
        <p className="mb-4 text-sm text-gray-500">
          Thêm nhiều video cùng lúc bằng file .xlsx thay vì tạo thủ công từng cái.
        </p>

        {result ? (
          <div>
            <p className="mb-2 text-sm">
              Đã tạo thành công <span className="font-semibold text-emerald-600">{result.created}</span> /{" "}
              {parsed?.rows.length ?? 0} video.
            </p>
            {result.failed.length > 0 && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/40">
                <p className="mb-1 font-medium text-red-700 dark:text-red-300">
                  {result.failed.length} dòng thất bại:
                </p>
                <ul className="max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-red-700 dark:text-red-300">
                  {result.failed.map((f, i) => (
                    <li key={i}>
                      {f.title}: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Đóng
            </button>
          </div>
        ) : importing ? (
          <div>
            <p className="mb-2 text-sm">
              Đang tạo {progress.done}/{progress.total}...
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => downloadImportTemplate(schema, workspaceMembers)}
              className="mb-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ⬇ Tải file mẫu (.xlsx)
            </button>

            <label className="mb-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:bg-blue-950/20">
              <span>{fileName ?? "Bấm để chọn file .xlsx"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>

            {parsing && <p className="text-sm text-gray-400">Đang đọc file...</p>}
            {parseError && <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>}

            {parsed && (
              <div className="mt-3">
                <p className="mb-2 text-sm">
                  Tìm thấy <span className="font-semibold">{parsed.rows.length}</span> video hợp lệ
                  {parsed.skippedEmptyTitle > 0 &&
                    ` (bỏ qua ${parsed.skippedEmptyTitle} dòng thiếu Tiêu đề)`}
                  .
                </p>

                {allWarnings.length > 0 && (
                  <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 text-xs text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300">
                    <p className="mb-1 font-medium">Một số giá trị bị bỏ qua:</p>
                    <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-4">
                      {allWarnings.slice(0, 8).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                      {allWarnings.length > 8 && <li>... và {allWarnings.length - 8} cảnh báo khác</li>}
                    </ul>
                  </div>
                )}

                <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-neutral-950">
                      <tr>
                        <th className="px-2 py-1.5 font-medium text-gray-500">Tiêu đề</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {parsed.rows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="truncate px-2 py-1.5">{r.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 5 && (
                    <p className="border-t border-gray-100 px-2 py-1.5 text-xs text-gray-400 dark:border-gray-800">
                      ... và {parsed.rows.length - 5} video khác
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={runImport}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Import {parsed.rows.length} video
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}

            {!parsed && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                >
                  Huỷ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
