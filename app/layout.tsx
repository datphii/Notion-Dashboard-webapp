import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion Dashboard",
  description: "Public read-only dashboard for a Notion database",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
