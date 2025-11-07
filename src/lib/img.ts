// Utilitaires d’images WordPress + tailles par défaut

/** Tailles responsives "plein écran/pleine largeur" (hero, cover) */
export const sizesFullBleed =
  "(min-width:1100px) 100vw, (min-width:640px) 100vw, 100vw";

/** Tailles pour cartes/grilles 3 → 2 → 1 colonnes */
export const sizesGrid3 =
  "(min-width:1100px) 32vw, (min-width:640px) 48vw, 92vw";

/** Tailles pour cartes/grilles 4 → 2 → 1 colonnes */
export const sizesGrid4 =
  "(min-width:1200px) 22vw, (min-width:800px) 45vw, 92vw";

/** Construit src + srcset depuis un objet media WP (_embedded.wp:featuredmedia[0]) */
export function buildWpSrc(media?: any) {
  const s = media?.media_details?.sizes || {};
  const entries: Array<{ src: string; w: number; h?: number }> = Object.values(s || {})
    .filter((x: any) => x?.source_url && x?.width)
    .map((x: any) => ({ src: x.source_url, w: x.width, h: x.height }))
    .sort((a, b) => a.w - b.w);

  // fallback : on essaie full (ou l’URL du media)
  const fallback =
    media?.media_details?.sizes?.full?.source_url ||
    media?.source_url ||
    entries.at(-1)?.src ||
    "";

  const width = media?.media_details?.sizes?.full?.width || entries.at(-1)?.w;
  const height = media?.media_details?.sizes?.full?.height || entries.at(-1)?.h;

  const srcset =
    entries.length > 0
      ? entries.map((e) => `${e.src} ${e.w}w`).join(", ")
      : fallback
      ? `${fallback} ${width || 1600}w`
      : "";

  return { src: fallback, srcset, width, height };
}
