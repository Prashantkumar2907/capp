"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user, staff } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!user) {
    redirect("/sign-in");
  }

  if (!staff) {
    redirect("/onboarding");
  }

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-3 md:p-4 max-w-7xl mx-auto animate-page-enter">{children}</div>
      </main>
    </div>
  );
}
