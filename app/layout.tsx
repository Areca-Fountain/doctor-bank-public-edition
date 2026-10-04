import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import ParticleBackground from "@/components/ParticleBackground"; // ← add this

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doctor Bank",
  description: "AI Bank Form Assistant",
};

// Lets the page draw under phone notches / home bars; globals.css adds the safe-area padding back
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ParticleBackground />  {/* ← add this */}
          {children}
        </Providers>
      </body>
    </html>
  );
}