// src/content/faq.ts

// --- Littéraux centralisés (réutilisables dans tout le projet) ---
export const FAQ_TAGS = ["pricing", "timeline", "process", "maintenance", "seo", "contact"] as const;
export type FaqTag = typeof FAQ_TAGS[number];

export const FAQ_SURFACES = ["home", "services", "contact"] as const;
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
  // ======================
  // HOME + SERVICES (FAQ globale)
  // ======================
  {
    id: "types-sites",
    q: "Avec quels types de sites WordPress travaillez-vous ?",
    a: "Je travaille surtout sur des sites vitrines, blogs éditoriaux et petits sites de services sous WordPress. L’objectif est d’avoir une base propre, rapide et facile à faire évoluer.",
    tags: ["process"],
    surfaces: ["home", "services"],
    priority: 1,
  },
  {
    id: "zone-geo",
    q: "Travaillez-vous uniquement autour de Béziers ?",
    a: "Je suis basée près de Béziers (Hérault), mais j’accompagne des clientes et clients en Occitanie et partout en France, principalement à distance (visio, e-mail, téléphone).",
    tags: ["contact"],
    surfaces: ["home", "contact"],
    priority: 2,
  },
  {
    id: "reprise-site",
    q: "Pouvez-vous reprendre un site WordPress déjà existant ?",
    a: "Oui. Je peux auditer un site WordPress déjà en ligne, corriger les points bloquants (performance, bugs, thème vieillissant…) et préparer un plan de refonte progressive si nécessaire.",
    tags: ["process"],
    surfaces: ["home", "services"],
    priority: 3,
  },

  // ======================
  // SERVICES
  // ======================
  {
    id: "delais",
    q: "Quels sont les délais pour un projet de site WordPress ?",
    a: "En général, il faut compter entre 2 et 6 semaines selon les fonctionnalités : nombre de pages, besoin en contenus et complexité des fonctionnalités. Un planning prévisionnel est posé dès le début du projet.",
    tags: ["timeline"],
    surfaces: ["home", "services", "contact"],
    priority: 4,
  },
  {
    id: "pricing-vitrine",
    q: "Comment se passe l’estimation d’un projet de site WordPress ?",
    a: "Je vous pose quelques questions sur votre activité, le type de site (création ou refonte), le volume de contenu et les fonctionnalités importantes. À partir de là, je vous envoie un devis détaillé poste par poste, pour que vous sachiez exactement ce qui est inclus.",
    tags: ["pricing"],
    surfaces: ["services"],
    priority: 5,
  },
  {
    id: "maintenance",
    q: "Proposes-tu la maintenance et les mises à jour du site ?",
    a: "Oui : mises à jour WordPress, thèmes et extensions, sauvegardes régulières, veille de sécurité et petites corrections. La formule est flexible et peut être ajustée ou arrêtée selon vos besoins.",
    tags: ["maintenance"],
    surfaces: ["services", "contact"],
    priority: 6,
  },
  {
    id: "seo-perf",
    q: "Le site sera-t-il optimisé pour la performance et le SEO ?",
    a: "Oui. J’accorde une attention particulière au temps de chargement (Core Web Vitals), à la structure HTML, aux balises importantes, aux images optimisées et au cache. Je peux aussi configurer Search Console et Analytics.",
    tags: ["seo"],
    surfaces: ["services"],
    priority: 7,
  },

  // ======================
  // CONTACT
  // ======================
  {
    id: "prise-contact",
    q: "Comment se passe la prise de contact ?",
    a: "Vous m’écrivez via le formulaire ou par e-mail, et je vous réponds généralement sous 24 h ouvrées avec quelques questions complémentaires. On peut ensuite prévoir une courte visio si nécessaire pour clarifier votre projet.",
    tags: ["contact"],
    surfaces: ["contact"],
    priority: 8,
  },
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
    .map(id => arr.find(x => x?.id === id))
    .filter((x): x is QA => Boolean(x));
}

// Optionnel : overrides de libellé par page (reformulations locales)
export type FaqOverride = Record<string, Partial<Pick<QA, "q" | "a">>>;
export function applyOverrides(list: QA[], overrides: FaqOverride): QA[] {
  if (!overrides) return list;
  return list.map(x => ({ ...x, ...(overrides[x.id] ?? {}) }));
}
