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

function getClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error("MISSING_NOTION_TOKEN");
  }
  return new Client({ auth: token });
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
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("MISSING_NOTION_DATABASE_ID");
  }
  const notion = getClient();

  const dbResponse = await notion.databases.retrieve({ database_id: databaseId });
  if (!isFullDatabase(dbResponse)) {
    throw new Error("INCOMPLETE_DATABASE_RESPONSE");
  }
  const schema = buildSchema(dbResponse);
  const databaseTitle = dbResponse.title.map((t) => t.plain_text).join("") || "Notion Database";

  const rows: NotionRow[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
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
