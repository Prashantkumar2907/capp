export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { warmPublicMenuCaches } = await import("./lib/server/public-menu-cache");
  await warmPublicMenuCaches();
}
