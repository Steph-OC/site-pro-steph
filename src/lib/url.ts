// src/lib/url.ts

/**
 * Force les URLs ACF à devenir relatives :
 * - "http://sq-local.test/contact" → "/contact"
 * - "https://stephaniequibel.fr/services#faq" → "/services#faq"
 * - "/contact" → "/contact" (inchangé)
 */
export function toRelativeUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();

  // déjà relative
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const u = new URL(trimmed);
    const path = u.pathname || "/";
    const search = u.search || "";
    const hash = u.hash || "";
    return `${path}${search}${hash}`;
  } catch {
    // pas une URL complète → on renvoie tel quel
    return trimmed;
  }
}
