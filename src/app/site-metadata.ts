export const siteUrl = "https://lamara.dev";

export const siteName = "Lamara";

export const siteDescription =
  "Track AI coding-tool token usage locally from a lightweight tray app.";

export const siteOgAlt = "Lamara — local AI coding-tool usage from your tray.";

export const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
