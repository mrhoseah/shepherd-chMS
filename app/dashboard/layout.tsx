import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/permissions";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user has login permission
  const loginCheck = await requireLogin();
  
  if (!loginCheck.authorized) {
    console.error("❌ Dashboard access denied:");
    console.error("   Error:", loginCheck.error);
    console.error("   Authorized:", loginCheck.authorized);
    redirect("/auth/signin");
  }
  
  console.log("✅ Dashboard access granted for user:", loginCheck.userId);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        {children}
      </main>
    </SidebarProvider>
  );
}

