// src/content/faq.ts

// --- Littéraux centralisés (réutilisables dans tout le projet) ---
export const FAQ_TAGS = ["pricing","timeline","process","maintenance","seo","contact"] as const;
export type FaqTag = typeof FAQ_TAGS[number];

export const FAQ_SURFACES = ["home","services","contact"] as const;
export type FaqSurface = typeof FAQ_SURFACES[number];

// --- Modèle de donnée ---
export type QA = Readonly<{
  id: string;
  q: string;
  a: string;
  tags: Readonly<FaqTag[]>;
  surfaces: Readonly<FaqSurface[]>; // où l’item est pertinent
  priority?: number;                // tri (1 = plus haut)
}>;

// --- Données : cohérentes, immuables ---
export const FAQ: Readonly<QA[]> = [
  {
    id: "pricing-vitrine",
    q: "Comment estimer le coût de conception d'un site WordPress ?",
    a: "Selon les fonctionnalités, entre 750€ et 4 000€ en moyenne. Le devis détaille design, intégration, performance et options (blog, formulaires, multilingue).",
    tags: ["pricing"], surfaces: ["home","services"], priority: 1
  },
  {
    id: "delais",
    q: "Quels sont les délais de livraison ?",
    a: "Entre 2 et 6 semaines selon le contenu et les fonctionnalités. Un planning est fourni dès la validation.",
    tags: ["timeline"], surfaces: ["home","services","contact"], priority: 2
  },
  {
    id: "maintenance",
    q: "Proposes-tu la maintenance et les mises à jour ?",
    a: "Oui : sauvegardes, mises à jour WP/thèmes/plugins, surveillance de sécurité et correctifs. Résiliable à tout moment.",
    tags: ["maintenance"], surfaces: ["services","contact"], priority: 3
  },
  {
    id: "seo-perf",
    q: "Le site sera-t-il optimisé pour le SEO et la performance ?",
    a: "Oui : structure sémantique, métadonnées, images optimisées, cache et Core Web Vitals. Mise en place de Search Console et Analytics possible.",
    tags: ["seo"], surfaces: ["services"], priority: 4
  },
  {
    id: "prise-contact",
    q: "Comment se passe la prise de contact ?",
    a: "Vous m’écrivez, je vous réponds sous 24 h avec 2–3 questions et une courte visio si besoin.",
    tags: ["contact"], surfaces: ["contact"], priority: 5
  }
] as const;

// --- Helpers ---
type PickFaqOptions = {
  surface?: FaqSurface;
  includeTags?: FaqTag[];
  excludeTags?: FaqTag[];
  limit?: number; // 0 => []
};

/**
 * Sélectionne des Q/R en combinant surface, tags et limite.
 * L’ordre est déterministe : priority ASC puis ordre d’origine.
 */
export function pickFaq(opts: PickFaqOptions = {}): QA[] {
  const { surface, includeTags, excludeTags, limit } = opts;

  let arr = FAQ.slice();

  if (surface) {
    arr = arr.filter(x => x.surfaces.includes(surface));
  }
  if (includeTags && includeTags.length > 0) {
    arr = arr.filter(x => x.tags.some(t => includeTags.includes(t)));
  }
  if (excludeTags && excludeTags.length > 0) {
    arr = arr.filter(x => !x.tags.some(t => excludeTags.includes(t)));
  }

  // tri stable : priority (undefined => 99), puis index initial
  arr = arr
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const pa = a.item.priority ?? 99;
      const pb = b.item.priority ?? 99;
      return pa === pb ? a.i - b.i : pa - pb;
    })
    .map(x => x.item);

  return typeof limit === "number" ? arr.slice(0, limit) : arr;
}

/** Sélectionne par liste d’IDs (pratique pour la Home mini-FAQ). */
export function pickByIds(ids: string[]): QA[] {
  const set = new Set(ids);
  const arr = FAQ.filter(x => set.has(x.id));
  // respecte l’ordre des ids fournis
  return ids
    .map(id => arr.find(x => x.id === id))
    .filter((x): x is QA => Boolean(x));
}

// Optionnel : overrides de libellé par page (reformulations locales)
export type FaqOverride = Record<string, Partial<Pick<QA, "q" | "a">>>;
export function applyOverrides(list: QA[], overrides: FaqOverride): QA[] {
  if (!overrides) return list;
  return list.map(x => ({ ...x, ...(overrides[x.id] ?? {}) }));
}
