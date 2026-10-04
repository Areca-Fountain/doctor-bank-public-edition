import type { Metadata } from "next";
import SettingsView from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings | Doctor Bank",
  description: "Manage your Doctor Bank account, plan, AI model and security.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
