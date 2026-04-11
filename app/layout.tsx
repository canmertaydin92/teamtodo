import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamTodo",
  description: "Ekibinizle görev takibi yapın",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full dark">
      <body className={`${geist.className} min-h-full bg-gray-950 text-gray-100`}>{children}</body>
    </html>
  );
}
