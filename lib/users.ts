import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type Role = "Admin" | "Editor";

export interface WebUser {
  id: string;
  name: string;
  pin: string;
  role: Role;
  active: boolean;
}

function getClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("MISSING_NOTION_TOKEN");
  return new Client({ auth: token });
}

function usersDatabaseId(): string {
  const id = process.env.NOTION_USERS_DATABASE_ID;
  if (!id) throw new Error("MISSING_NOTION_USERS_DATABASE_ID");
  return id;
}

function mapPage(page: PageObjectResponse): WebUser {
  const props = page.properties;
  const nameProp = props.Name;
  const pinProp = props.PIN;
  const roleProp = props.Role;
  const activeProp = props.Active;

  const name = nameProp?.type === "title" ? nameProp.title.map((t) => t.plain_text).join("") : "";
  const pin = pinProp?.type === "rich_text" ? pinProp.rich_text.map((t) => t.plain_text).join("") : "";
  const role: Role = roleProp?.type === "select" && roleProp.select?.name === "Admin" ? "Admin" : "Editor";
  const active = activeProp?.type === "checkbox" ? activeProp.checkbox : false;

  return { id: page.id, name, pin, role, active };
}

export async function listUsers(): Promise<WebUser[]> {
  const notion = getClient();
  const users: WebUser[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: usersDatabaseId(),
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      if (isFullPage(page)) users.push(mapPage(page));
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return users;
}

export async function findUserByCredentials(name: string, pin: string): Promise<WebUser | null> {
  const users = await listUsers();
  const normalized = name.trim().toLowerCase();
  return (
    users.find((u) => u.active && u.name.trim().toLowerCase() === normalized && u.pin === pin) ??
    null
  );
}

export async function createUser(data: { name: string; pin: string; role: Role }): Promise<WebUser> {
  const notion = getClient();
  const page = await notion.pages.create({
    parent: { database_id: usersDatabaseId() },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      PIN: { rich_text: [{ text: { content: data.pin } }] },
      Role: { select: { name: data.role } },
      Active: { checkbox: true },
    },
  });
  if (!isFullPage(page)) throw new Error("CREATE_USER_FAILED");
  return mapPage(page);
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; pin: string; role: Role; active: boolean }>
): Promise<void> {
  const notion = getClient();
  const properties: Record<string, unknown> = {};
  if (data.name !== undefined) properties.Name = { title: [{ text: { content: data.name } }] };
  if (data.pin !== undefined) properties.PIN = { rich_text: [{ text: { content: data.pin } }] };
  if (data.role !== undefined) properties.Role = { select: { name: data.role } };
  if (data.active !== undefined) properties.Active = { checkbox: data.active };
  await notion.pages.update({
    page_id: id,
    properties: properties as Parameters<typeof notion.pages.update>[0]["properties"],
  });
}

export async function deleteUser(id: string): Promise<void> {
  const notion = getClient();
  await notion.pages.update({ page_id: id, archived: true });
}
