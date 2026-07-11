import type { MetadataRoute } from "next";

/**
 * PWA manifest: lets the kitchen tablet / waiter phone "Add to Home Screen"
 * and run CAPP full-screen like a native app — the install story small
 * restaurants expect without an app store.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAPP — Restaurant OS",
    short_name: "CAPP",
    description: "QR ordering, kitchen display, and GST billing for Indian restaurants.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#f97316",
    orientation: "any",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
