import { NextResponse } from "next/server";

// Temporary diagnostic endpoint - no secret values are ever returned.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    hasNotionToken: Boolean(process.env.NOTION_TOKEN),
    hasNotionDatabaseId: Boolean(process.env.NOTION_DATABASE_ID),
    notionDatabaseIdLength: process.env.NOTION_DATABASE_ID?.length ?? 0,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    notionKeys: Object.keys(process.env).filter((k) => k.startsWith("NOTION")),
  });
}
