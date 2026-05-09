import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { AuthProvider } from "@/features/auth/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
