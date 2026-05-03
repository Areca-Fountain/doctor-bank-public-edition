import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers"; // 📍 NEW: Import our Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doctor Bank",
  description: "AI Bank Form Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 📍 NEW: Wrap children inside the Providers tag */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}