/** Mini class-merger (geen extra dependency). Filtert falsy waarden en voegt samen. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
