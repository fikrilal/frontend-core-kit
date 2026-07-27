/** Avatar initials from a display name (2 chars) or email (1 char). */
export function initialsFor(label: string | undefined): string {
  const cleaned = label?.trim() ?? "";
  if (!cleaned) {
    return "?";
  }
  if (cleaned.includes("@")) {
    return cleaned.charAt(0).toUpperCase();
  }
  const initials = cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}
