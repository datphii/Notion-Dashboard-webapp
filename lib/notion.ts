import { Client, isFullPage, isFullDatabase } from "@notionhq/client";
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type PropertyType =
  | "title"
  | "rich_text"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "people"
  | "checkbox"
  | "number"
  | "url"
  | "email"
  | "phone_number"
  | "files"
  | "created_time"
  | "last_edited_time"
  | "unsupported";

export interface SelectOption {
  name: string;
  color: string;
}

export interface PropertySchema {
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

export interface Person {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NotionRow {
  id: string;
  notionUrl: string;
  title: string;
  properties: Record<string, unknown>;
}

export interface NotionDataset {
  databaseTitle: string;
  databaseUrl: string;
  schema: PropertySchema[];
  rows: NotionRow[];
  fetchedAt: string;
}

export function getClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error("MISSING_NOTION_TOKEN");
  }
  return new Client({ auth: token });
}

function databaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("MISSING_NOTION_DATABASE_ID");
  return id;
}

function mapPropertyType(notionType: string): PropertyType {
  const known: PropertyType[] = [
    "title",
    "rich_text",
    "select",
    "multi_select",
    "status",
    "date",
    "people",
    "checkbox",
    "number",
    "url",
    "email",
    "phone_number",
    "files",
    "created_time",
    "last_edited_time",
  ];
  return (known as string[]).includes(notionType)
    ? (notionType as PropertyType)
    : "unsupported";
}

function buildSchema(db: DatabaseObjectResponse): PropertySchema[] {
  const entries = Object.values(db.properties);
  // Keep Notion's own property order (object key order is preserved by V8/Notion API)
  return entries.map((prop): PropertySchema => {
    const type = mapPropertyType(prop.type);
    let options: SelectOption[] | undefined;
    if (prop.type === "select") options = prop.select.options;
    if (prop.type === "multi_select") options = prop.multi_select.options;
    if (prop.type === "status") options = prop.status.options;
    return { name: prop.name, type, options };
  });
}

function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("") || "(Untitled)";
    }
  }
  return "(Untitled)";
}

function extractProperty(prop: PageObjectResponse["properties"][string]): unknown {
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "select":
      return prop.select ? { name: prop.select.name, color: prop.select.color } : null;
    case "status":
      return prop.status ? { name: prop.status.name, color: prop.status.color } : null;
    case "multi_select":
      return prop.multi_select.map((o) => ({ name: o.name, color: o.color }));
    case "date":
      return prop.date
        ? { start: prop.date.start, end: prop.date.end }
        : null;
    case "people":
      return prop.people.map((p): Person => {
        const anyP = p as { id: string; name?: string | null; avatar_url?: string | null };
        return {
          id: anyP.id,
          name: anyP.name || "Unknown",
          avatarUrl: anyP.avatar_url || null,
        };
      });
    case "checkbox":
      return prop.checkbox;
    case "number":
      return prop.number;
    case "url":
      return prop.url;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "files":
      return prop.files.map((f) =>
        f.type === "external" ? f.external.url : (f as { file: { url: string } }).file.url
      );
    case "created_time":
      return prop.created_time;
    case "last_edited_time":
      return prop.last_edited_time;
    default:
      return null;
  }
}

export async function fetchNotionDataset(): Promise<NotionDataset> {
  const dbId = databaseId();
  const notion = getClient();

  const dbResponse = await notion.databases.retrieve({ database_id: dbId });
  if (!isFullDatabase(dbResponse)) {
    throw new Error("INCOMPLETE_DATABASE_RESPONSE");
  }
  const schema = buildSchema(dbResponse);
  const databaseTitle = dbResponse.title.map((t) => t.plain_text).join("") || "Notion Database";

  const rows: NotionRow[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of response.results) {
      if (!isFullPage(page)) continue;
      const properties: Record<string, unknown> = {};
      for (const [name, prop] of Object.entries(page.properties)) {
        properties[name] = extractProperty(prop);
      }
      rows.push({
        id: page.id,
        notionUrl: page.url,
        title: extractTitle(page),
        properties,
      });
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return {
    databaseTitle,
    databaseUrl: dbResponse.url,
    schema,
    rows,
    fetchedAt: new Date().toISOString(),
  };
}

export interface WorkspaceMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const notion = getClient();
  const members: WorkspaceMember[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.users.list({ start_cursor: cursor, page_size: 100 });
    for (const user of res.results) {
      if (user.type === "person") {
        members.push({ id: user.id, name: user.name ?? "Unknown", avatarUrl: user.avatar_url });
      }
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return members;
}

// Converts a simplified value (as produced by extractProperty / sent from the
// client) back into a Notion API property payload for pages.update/create.
export function buildPropertyPayload(type: PropertyType, value: unknown): Record<string, unknown> | null {
  switch (type) {
    case "title":
      return { title: [{ text: { content: String(value ?? "") } }] };
    case "rich_text":
      return { rich_text: value ? [{ text: { content: String(value) } }] : [] };
    case "select":
      return { select: value ? { name: String(value) } : null };
    case "status":
      return { status: value ? { name: String(value) } : null };
    case "multi_select":
      return { multi_select: Array.isArray(value) ? value.map((name) => ({ name: String(name) })) : [] };
    case "date": {
      const v = value as { start: string; end?: string | null } | null;
      return { date: v?.start ? { start: v.start, end: v.end || null } : null };
    }
    case "people": {
      const ids = Array.isArray(value) ? (value as string[]) : [];
      return { people: ids.map((id) => ({ id })) };
    }
    case "checkbox":
      return { checkbox: Boolean(value) };
    case "number":
      return { number: value === null || value === "" ? null : Number(value) };
    case "url":
      return { url: value ? String(value) : null };
    case "email":
      return { email: value ? String(value) : null };
    case "phone_number":
      return { phone_number: value ? String(value) : null };
    default:
      return null;
  }
}

export async function updateRow(
  pageId: string,
  propertyName: string,
  propertyType: PropertyType,
  value: unknown
): Promise<void> {
  const payload = buildPropertyPayload(propertyType, value);
  if (!payload) throw new Error("UNSUPPORTED_PROPERTY_TYPE");
  const notion = getClient();
  await notion.pages.update({
    page_id: pageId,
    // The SDK's property types are a strict discriminated union keyed by
    // property name; we build these payloads dynamically from the live
    // database schema, so a structural cast here is the pragmatic choice.
    properties: { [propertyName]: payload } as Parameters<typeof notion.pages.update>[0]["properties"],
  });
}

export async function createRow(
  fields: { name: string; type: PropertyType; value: unknown }[]
): Promise<string> {
  const notion = getClient();
  const properties: Record<string, unknown> = {};
  for (const field of fields) {
    const payload = buildPropertyPayload(field.type, field.value);
    if (payload) properties[field.name] = payload;
  }
  const page = await notion.pages.create({
    parent: { database_id: databaseId() },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  });
  return page.id;
}
