import type { PropertySchema, PropertyType, WorkspaceMember } from "./notion";

export interface ImportField {
  name: string;
  type: PropertyType;
  value: unknown;
}

export interface ParsedImportRow {
  title: string;
  fields: ImportField[];
  warnings: string[];
}

export interface ParsedImport {
  rows: ParsedImportRow[];
  skippedEmptyTitle: number;
  columns: string[];
}

// Properties an import can't set: the title is handled separately, and
// these types are either system-managed or have no simple cell representation.
const UNSUPPORTED_TYPES = new Set(["created_time", "last_edited_time", "files", "unsupported"]);

function importableProps(schema: PropertySchema[]): PropertySchema[] {
  return schema.filter((p) => p.type !== "title" && !UNSUPPORTED_TYPES.has(p.type));
}

function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return ["true", "1", "x", "yes", "co", "có"].includes(s);
}

function toDateString(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v ?? "").trim();
  return s || null;
}

function convertCellValue(
  type: PropertyType,
  raw: unknown,
  workspaceMembers: WorkspaceMember[],
  warnings: string[],
  columnLabel: string
): unknown {
  if (raw === null || raw === undefined || raw === "") return null;
  switch (type) {
    case "rich_text":
    case "url":
    case "email":
    case "phone_number":
      return String(raw).trim();
    case "number": {
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
      if (Number.isNaN(n)) {
        warnings.push(`Cột "${columnLabel}": giá trị "${raw}" không phải số, đã bỏ qua.`);
        return null;
      }
      return n;
    }
    case "checkbox":
      return toBoolean(raw);
    case "date": {
      const start = toDateString(raw);
      return start ? { start, end: null } : null;
    }
    case "select":
    case "status":
      return String(raw).trim();
    case "multi_select":
      return String(raw)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    case "people": {
      const names = String(raw)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const ids: string[] = [];
      for (const name of names) {
        const member = workspaceMembers.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (member) ids.push(member.id);
        else warnings.push(`Cột "${columnLabel}": không tìm thấy thành viên "${name}".`);
      }
      return ids;
    }
    default:
      return null;
  }
}

export async function parseExcelFile(
  file: File,
  schema: PropertySchema[],
  workspaceMembers: WorkspaceMember[]
): Promise<ParsedImport> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const titleProp = schema.find((p) => p.type === "title");
  const titleName = titleProp?.name ?? "Title";
  const otherProps = importableProps(schema);

  const rows: ParsedImportRow[] = [];
  let skippedEmptyTitle = 0;

  for (const record of raw) {
    const titleRaw = record[titleName];
    const title = titleRaw === null || titleRaw === undefined ? "" : String(titleRaw).trim();
    if (!title) {
      skippedEmptyTitle++;
      continue;
    }
    const warnings: string[] = [];
    const fields: ImportField[] = [{ name: titleName, type: "title", value: title }];
    for (const prop of otherProps) {
      const value = convertCellValue(
        prop.type,
        record[prop.name],
        workspaceMembers,
        warnings,
        prop.name
      );
      if (value !== null) fields.push({ name: prop.name, type: prop.type, value });
    }
    rows.push({ title, fields, warnings });
  }

  return { rows, skippedEmptyTitle, columns: [titleName, ...otherProps.map((p) => p.name)] };
}

export async function downloadImportTemplate(
  schema: PropertySchema[],
  workspaceMembers: WorkspaceMember[]
): Promise<void> {
  const XLSX = await import("xlsx");
  const titleProp = schema.find((p) => p.type === "title");
  const otherProps = importableProps(schema);
  const headers = [titleProp?.name ?? "Title", ...otherProps.map((p) => p.name)];

  // Title is left blank on this row so the parser's "skip rows without a
  // title" rule naturally excludes it - no need to tell users to delete it.
  const hintRow: (string | null)[] = [null];
  for (const p of otherProps) {
    switch (p.type) {
      case "select":
      case "status":
        hintRow.push(
          p.options?.length ? `VD: ${p.options.slice(0, 3).map((o) => o.name).join(" / ")}` : ""
        );
        break;
      case "multi_select":
        hintRow.push(
          p.options?.length
            ? `VD: ${p.options.slice(0, 2).map((o) => o.name).join(", ")} (cách nhau bởi dấu phẩy)`
            : "Nhiều giá trị, cách nhau bởi dấu phẩy"
        );
        break;
      case "people":
        hintRow.push(
          workspaceMembers.length
            ? `VD: ${workspaceMembers.slice(0, 2).map((m) => m.name).join(", ")}`
            : "Tên thành viên, cách nhau bởi dấu phẩy"
        );
        break;
      case "date":
        hintRow.push("VD: 2026-09-20");
        break;
      case "checkbox":
        hintRow.push("TRUE hoặc FALSE");
        break;
      case "number":
        hintRow.push("VD: 10");
        break;
      default:
        hintRow.push("(văn bản)");
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, hintRow]);
  ws["!cols"] = headers.map(() => ({ wch: 26 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Videos");
  XLSX.writeFile(wb, "mau-nhap-video.xlsx");
}
