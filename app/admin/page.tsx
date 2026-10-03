import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import AdminPanel from "@/components/admin/AdminPanel";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Checked on the server: non-admins never receive the panel at all
  const admin = await getAdmin();
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-28 pb-12 px-6">
      <TopNav view="dashboard" />
      <AdminPanel currentAdminId={admin.id} />
    </div>
  );
}