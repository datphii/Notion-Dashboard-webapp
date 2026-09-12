import type { PropertyType, Person } from "./notion";

// Converts a display-shape value (as rendered by PropertyValue, e.g.
// { name, color } for a select) into the plain value an <input>/<select>
// works with and that the write API (buildPropertyPayload) expects.
export function toEditValue(type: PropertyType, value: unknown): unknown {
  switch (type) {
    case "select":
    case "status":
      return (value as { name?: string } | null)?.name ?? "";
    case "multi_select":
      return ((value as { name: string }[] | null) ?? []).map((o) => o.name);
    case "people":
      return ((value as Person[] | null) ?? []).map((p) => p.id);
    case "date":
      return (value as { start: string; end: string | null } | null) ?? { start: "", end: null };
    case "checkbox":
      return Boolean(value);
    case "number":
      return value ?? "";
    default:
      return value ?? "";
  }
}
