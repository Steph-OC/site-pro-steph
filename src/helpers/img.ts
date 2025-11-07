// src/lib/img.ts
export function buildSrcset(sizes: Record<string, any> | undefined) {
  if (!sizes) return "";
  const entries = Object.values(sizes)
    .filter((x: any) => x?.source_url && x?.width)
    .sort((a: any, b: any) => a.width - b.width) as any[];
  return entries.map((x: any) => `${x.source_url} ${x.width}w`).join(", ");
}

export const sizesGridX3 = "(min-width:1100px) 32vw, (min-width:640px) 48vw, 92vw";
export const sizesFullBleed = "100vw";
export const sizesContent = "(min-width:1100px) 70ch, 92vw";
