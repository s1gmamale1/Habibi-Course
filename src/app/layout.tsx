import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import type { Metadata } from "next";
import { Credits } from "@/components/Credits";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = { title: "Tajweed Course" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="aurora" aria-hidden="true">
          <span className="aurora__blob aurora__blob--a" />
          <span className="aurora__blob aurora__blob--b" />
          <span className="aurora__blob aurora__blob--c" />
          <span className="aurora__blob aurora__blob--d" />
        </div>
        <div className="relative z-10">
          <SiteNav />
          <div id="content">{children}</div>
          <Credits />
        </div>
      </body>
    </html>
  );
}
