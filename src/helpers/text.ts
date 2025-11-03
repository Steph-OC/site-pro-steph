/**
 * Convert a textarea/string into an array of list items.
 * - Splits on newlines
 * - Strips common bullets (-, –, •, *) and surrounding spaces
 * - Drops empty lines
 */
export function linesToItems(input?: string): string[] {
  if (!input) return [];
  return input
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[-–•*]\s*/,'').trim())
    .filter(Boolean);
}

/**
 * Optional: split a textarea into an intro paragraph and a list.
 * Use a line with only `---` to separate.
 *
 * Everything before the first `---` becomes a paragraph (string),
 * everything after becomes list items (string[]).
 */
export function splitIntroAndList(input?: string): { intro: string; items: string[] } {
  if (!input) return { intro: "", items: [] };
  const parts = input.split(/^\s*---\s*$/m);
  const intro = parts[0]?.trim() ?? "";
  const items = linesToItems(parts[1] ?? "");
  return { intro, items };
}
