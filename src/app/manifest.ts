import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAPP Restaurant Operations",
    short_name: "CAPP",
    description: "QR ordering, kitchen operations, payments, staff, and analytics for restaurants.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#128c7e",
    orientation: "portrait",
    categories: ["business", "food", "productivity"],
    icons: [
      {
        src: "/icons/capp-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/capp-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
