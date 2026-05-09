import { AppToaster } from "@/components/shared/app-toaster";
import { AuthProvider } from "@/features/auth/auth-provider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AppToaster />
    </AuthProvider>
  );
}
