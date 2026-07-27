export const siteUrl = "https://lamara.dev";

export const siteName = "Lamara";

export const siteDescription =
  "Local AI coding-tool token tracking from your tray.";

export const siteOgAlt =
  "Lamara, local AI coding-tool token tracking from your tray.";

export const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
