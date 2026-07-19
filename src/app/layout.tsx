import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tajweed Course" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
