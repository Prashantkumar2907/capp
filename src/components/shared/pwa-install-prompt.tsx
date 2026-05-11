"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "capp-pwa-install-dismissed";
const TOASTED_KEY = "capp-pwa-install-toast";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister())).catch(() => undefined);
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.filter((key) => key.startsWith("capp-pwa-")).map((key) => caches.delete(key))))
          .catch(() => undefined);
      }
      return;
    }

    if (!navigator.webdriver) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (standalone) return;

    if (ios) {
      window.setTimeout(() => {
        setIsIos(true);
        setVisible(true);
        notifyOnce("Install CAPP from Share > Add to Home Screen for a faster restaurant workspace.");
      }, 0);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
      notifyOnce("Install CAPP for quick access to orders, kitchen, payments, and QR menus.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-x-3 top-3 z-[120] mx-auto max-w-2xl rounded-2xl border bg-card p-3 text-card-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install CAPP</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isIos
              ? "On iPhone or iPad, tap Share, then Add to Home Screen for app-like access."
              : "Add CAPP to this device for faster access during service hours."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!isIos && deferredPrompt ? (
              <Button size="sm" onClick={() => void install()}>
                <Download className="h-3.5 w-3.5" />
                Install
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={dismiss}>
              {isIos ? "Got it" : "Not now"}
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Dismiss install prompt" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function notifyOnce(message: string) {
  if (sessionStorage.getItem(TOASTED_KEY) === "1") return;
  sessionStorage.setItem(TOASTED_KEY, "1");
  toast.info(message);
}
