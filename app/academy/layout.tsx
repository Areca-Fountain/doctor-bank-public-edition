import type { ReactNode } from "react";
import AcademyShell from "@/components/academy/AcademyShell";

// The shell (header, sidebar, search, smooth scroll) lives here so it stays mounted
// while you move between topics. Only the page inside it changes.
export default function AcademyLayout({ children }: { children: ReactNode }) {
  return <AcademyShell>{children}</AcademyShell>;
}
