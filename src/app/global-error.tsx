"use client";

/**
 * Last-resort boundary for errors in the root layout itself (must ship its
 * own <html>/<body>). Deliberately dependency-free — inline styles only, so
 * it renders even if the app's CSS failed to load.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0c0a09", color: "#fafaf9" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ maxWidth: 360, fontSize: 14, color: "#a8a29e" }}>
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{ height: 40, padding: "0 20px", borderRadius: 999, border: "none", background: "#f97316", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
