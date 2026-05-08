import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

export const metadata: Metadata = {
  applicationName: "CAPP",
  title: "CAPP Restaurant Operations",
  description: "QR ordering, kitchen operations, payments, staff, and analytics for restaurants.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAPP",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/capp-icon.svg",
    apple: "/icons/capp-icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
