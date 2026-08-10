export const siteUrl = "https://frontend-core-kit.example";

export const siteName = "Frontend Core Kit";

export const siteDescription = "A SaaS starter currently under development.";

export const siteOgAlt =
  "Frontend Core Kit — a SaaS starter under development.";

export const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
