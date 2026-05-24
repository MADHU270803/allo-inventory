import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Allo Inventory",
  description: "Product reservation system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-slate-900 text-white px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-xl font-bold">Allo Inventory</span>
            <span className="text-slate-400 text-sm">
              Reservation System
            </span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}