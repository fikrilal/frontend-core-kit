export const siteUrl = "https://lamara.dev";

export const siteName = "Lamara";

export const siteDescription = "A SaaS product currently under development.";

export const siteOgAlt = "Lamara — a SaaS product under development.";

export const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
