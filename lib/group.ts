import type { NotionRow, PropertySchema, Person } from "./notion";

export interface Group {
  key: string;
  label: string;
  color?: string;
  rows: NotionRow[];
}

const EMPTY_KEY = "__empty__";

export function groupableProperties(schema: PropertySchema[]): PropertySchema[] {
  return schema.filter((p) =>
    ["select", "status", "multi_select", "people", "checkbox"].includes(p.type)
  );
}

export function buildGroups(rows: NotionRow[], prop: PropertySchema): Group[] {
  const buckets = new Map<string, Group>();

  const ensure = (key: string, label: string, color?: string) => {
    let g = buckets.get(key);
    if (!g) {
      g = { key, label, color, rows: [] };
      buckets.set(key, g);
    }
    return g;
  };

  for (const row of rows) {
    const value = row.properties[prop.name];

    if (prop.type === "select" || prop.type === "status") {
      const v = value as { name: string; color: string } | null;
      if (v) ensure(v.name, v.name, v.color).rows.push(row);
      else ensure(EMPTY_KEY, "Không có", "default").rows.push(row);
      continue;
    }

    if (prop.type === "multi_select") {
      const v = (value as { name: string; color: string }[]) ?? [];
      if (!v.length) {
        ensure(EMPTY_KEY, "Không có", "default").rows.push(row);
      } else {
        for (const o of v) ensure(o.name, o.name, o.color).rows.push(row);
      }
      continue;
    }

    if (prop.type === "people") {
      const v = (value as Person[]) ?? [];
      if (!v.length) {
        ensure(EMPTY_KEY, "Chưa gán", "default").rows.push(row);
      } else {
        for (const person of v) ensure(person.id, person.name).rows.push(row);
      }
      continue;
    }

    if (prop.type === "checkbox") {
      const v = Boolean(value);
      ensure(v ? "true" : "false", v ? "Có" : "Chưa").rows.push(row);
      continue;
    }
  }

  const groups = Array.from(buckets.values());

  // Order: follow the schema's declared option order when available,
  // otherwise alphabetical, with the "empty" bucket always last.
  const optionOrder = prop.options?.map((o) => o.name) ?? [];
  groups.sort((a, b) => {
    if (a.key === EMPTY_KEY) return 1;
    if (b.key === EMPTY_KEY) return -1;
    if (optionOrder.length) {
      return optionOrder.indexOf(a.label) - optionOrder.indexOf(b.label);
    }
    return a.label.localeCompare(b.label);
  });

  return groups;
}
