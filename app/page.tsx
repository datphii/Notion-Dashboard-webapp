import { fetchNotionDataset } from "@/lib/notion";
import Dashboard from "@/components/Dashboard";

// Re-fetch from Notion at most once per minute (public page, no auth, so
// this keeps load on the Notion API low while staying reasonably fresh).
export const revalidate = 60;

export default async function Home() {
  let dataset;
  let error: string | null = null;

  try {
    dataset = await fetchNotionDataset();
  } catch (err) {
    error =
      err instanceof Error && err.message === "MISSING_NOTION_TOKEN"
        ? "Thiếu biến môi trường NOTION_TOKEN."
        : err instanceof Error && err.message === "MISSING_NOTION_DATABASE_ID"
        ? "Thiếu biến môi trường NOTION_DATABASE_ID."
        : "Không thể tải dữ liệu từ Notion. Kiểm tra lại NOTION_TOKEN, NOTION_DATABASE_ID, và đảm bảo database đã được share với integration.";
  }

  if (error || !dataset) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <h1 className="mb-2 text-lg font-semibold">Chưa cấu hình xong</h1>
          <p className="mb-4">{error}</p>
          <p className="text-sm opacity-80">
            Xem file README.md của repo để biết cách tạo Notion integration,
            share database, và cấu hình biến môi trường trên Vercel.
          </p>
        </div>
      </main>
    );
  }

  return <Dashboard dataset={dataset} />;
}
