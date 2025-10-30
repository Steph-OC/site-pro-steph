// src/lib/wp.ts
// ———————————————————————————————————————————
// Helpers WordPress REST + ACF (CPT: "projets" + "temoignage(s)")
// ———————————————————————————————————————————

type WPImage = {
  source_url?: string;
  alt_text?: string;
  title?: { rendered?: string };
  media_details?: {
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
};

type WPEmbedded = {
  "wp:featuredmedia"?: WPImage[];
};

export type WPItem = {
  id: number;
  slug?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  acf?: Record<string, any>;
  _embedded?: WPEmbedded;
};

export type NormalizedProjet = {
  id: number;
  slug?: string;
  title: string;
  excerpt: string;
  siteUrl: string; // un seul lien par projet
  image: { src: string; alt: string; width?: number; height?: number };
  raw: WPItem;
};

export type SliderSlide = {
  img: string;
  title: string;
  text: string;
  meta?: string;
  // plus de CTA par slide (un seul bouton / projet)
};

// ——— Base WP (unique pour tout le fichier) ———
const WP = (import.meta.env.WP_URL || "").replace(/\/+$/, "");
if (!WP) console.warn("[wp.ts] WP_URL manquant dans .env");
const WP_API = `${WP}/wp-json/wp/v2`;

async function wpFetch<T = any>(path: string): Promise<T> {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = `${WP_API}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`WP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export function getFeatured(item?: WPItem) {
  const m = item?._embedded?.["wp:featuredmedia"]?.[0];
  const s = m?.media_details?.sizes || {};
  const pick: any = s?.medium || s?.medium_large || s?.large || s?.full || m || {};
  return {
    src: pick?.source_url || m?.source_url || "",
    alt: m?.alt_text || m?.title?.rendered || item?.title?.rendered || "",
    width: pick?.width,
    height: pick?.height,
  };
}

const strip = (html = "") =>
  html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** URL de site (priorité: site_url, fallback: slide_url) */
export function projectSiteUrl(item?: WPItem): string {
  const a = item?.acf ?? {};
  return a.site_url || a.slide_url || "";
}

/** Sous-titre projet (fallback: project_subtitle || subtitle || subtitle_1) */
export function projectSubtitle(item?: WPItem): string | undefined {
  const a = item?.acf ?? {};
  return a.project_subtitle || a.subtitle || a.subtitle_1 || undefined;
}

/** Titre & intro de la card (ACF) */
export function projectCardTitle(item?: WPItem): string | undefined {
  const v = item?.acf?.card_title;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
export function projectCardIntro(item?: WPItem): string | undefined {
  const v = item?.acf?.card_intro;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function normalizeProjet(item: WPItem): NormalizedProjet {
  return {
    id: item?.id,
    slug: item?.slug,
    title: item?.title?.rendered || "",
    excerpt: strip(item?.excerpt?.rendered || item?.content?.rendered || ""),
    siteUrl: projectSiteUrl(item),
    image: getFeatured(item),
    raw: item,
  };
}

// ———————————————————————————————————————————
// LISTES (projets & posts)
// ———————————————————————————————————————————

export async function getProjets({ per_page = 12, page = 1 } = {}) {
  const items = await wpFetch<WPItem[]>(
    `/projets?per_page=${per_page}&page=${page}&_embed=1`
  );
  return items.map(normalizeProjet);
}

export async function getCPTList(
  type: string,
  { per_page = 12, page = 1 } = {}
) {
  if (type === "projets") return getProjets({ per_page, page });
  return wpFetch<any[]>(
    `/${encodeURIComponent(type)}?per_page=${per_page}&page=${page}&_embed=1`
  );
}

export async function getPosts({ per_page = 6, page = 1 } = {}) {
  return wpFetch<any[]>(`/posts?per_page=${per_page}&page=${page}&_embed=1`);
}

export async function getPostBySlug(slug: string) {
  const arr = await wpFetch<any[]>(
    `/posts?slug=${encodeURIComponent(slug)}&_embed=1`
  );
  return arr[0];
}

// ———————————————————————————————————————————
// ACF helpers (slides fixes) pour Projets
// ———————————————————————————————————————————

/** util: vrai si valeur ressemble à un ID numérique (ex "76") */
const isNumericId = (v: unknown) =>
  (typeof v === "number" && Number.isFinite(v)) ||
  (typeof v === "string" && /^\d+$/.test(v));

/** Résout une liste d’IDs media → { [id]: source_url } en une requête */
async function resolveMediaIdsToUrls(ids: (string | number)[]) {
  const uniqueIds = Array.from(new Set(ids.map((x) => String(x))));
  if (uniqueIds.length === 0) return {} as Record<string, string>;

  // /media?include=1,2,3
  const qs = uniqueIds.join(",");
  const items = await wpFetch<Array<{ id: number; source_url: string }>>(
    `/media?include=${encodeURIComponent(qs)}`
  );
  const map: Record<string, string> = {};
  for (const m of items) {
    if (m?.id && m?.source_url) map[String(m.id)] = m.source_url;
  }
  return map;
}

/** Mappe 1..N slides ACF “fixes” (Free) vers ProjectSlider (tolère URL **ou** ID) */
export async function toSlidesFixed(
  item?: WPItem,
  maxSlides = 4
): Promise<SliderSlide[]> {
  const a = item?.acf ?? {};
  // collecter les valeurs d’image pour détecter les IDs à résoudre
  const rawImgs = Array.from({ length: maxSlides }, (_, i) => a[`slide_${i + 1}_img`]);
  const idList = rawImgs.filter(isNumericId) as (string | number)[];
  const idMap = await resolveMediaIdsToUrls(idList); // { "76": "https://.../image.jpg" }

  // fabriquer les slides avec URL finale
  const slides: SliderSlide[] = Array.from({ length: maxSlides }, (_, i) => {
    const n = i + 1;
    const raw = a[`slide_${n}_img`];
    const img =
      typeof raw === "string" && raw.startsWith("http")
        ? raw
        : isNumericId(raw)
        ? idMap[String(raw)] || ""
        : "";

    return {
      img,
      title: a[`slide_${n}_title`] || "",
      text: a[`slide_${n}_text`] || "",
      meta: a[`slide_${n}_meta`] || undefined,
    };
  }).filter((s) => s.img || s.title || s.text);

  return slides;
}

// ———————————————————————————————————————————
// 2 projets pour “Derniers projets” + champs ACF utiles
// ———————————————————————————————————————————
export async function getDerniersProjetsAvecSlides(limit = 2) {
  const fields = [
    "id",
    "slug",
    "title",
    "excerpt",
    "acf.card_title",
    "acf.card_intro",
    "acf.project_subtitle",
    "acf.subtitle",
    "acf.subtitle_1",
    "acf.site_url",
    "acf.slide_url",
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap((n) => [
      `acf.slide_${n}_img`,
      `acf.slide_${n}_title`,
      `acf.slide_${n}_text`,
      `acf.slide_${n}_meta`,
    ]),
  ].join(",");

  const items = await wpFetch<WPItem[]>(
    `/projets?per_page=${limit}&_fields=${fields}&_embed=1`
  );

  const withSlides = await Promise.all(
    items.map(async (it) => ({
      projet: normalizeProjet(it),
      subtitle: projectSubtitle(it),
      slides: await toSlidesFixed(it),
      cardTitle: projectCardTitle(it),
      cardIntro: projectCardIntro(it),
    }))
  );

  return withSlides;
}

/** Un projet par slug avec champs ACF utiles (ex: /realisations/[slug]) */
export async function getProjetBySlugWithACF(slug: string) {
  const fields = [
    "id",
    "slug",
    "title",
    "content",
    "acf.card_title",
    "acf.card_intro",
    "acf.project_subtitle",
    "acf.subtitle",
    "acf.subtitle_1",
    "acf.site_url",
    "acf.slide_url",
    ...Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => [
      `acf.slide_${n}_img`,
      `acf.slide_${n}_title`,
      `acf.slide_${n}_text`,
      `acf.slide_${n}_meta`,
    ]),
  ].join(",");

  const arr = await wpFetch<WPItem[]>(
    `/projets?slug=${encodeURIComponent(slug)}&_fields=${fields}&_embed=1`
  );
  const item = arr[0];
  if (!item) return undefined;

  return {
    projet: normalizeProjet(item),
    subtitle: projectSubtitle(item),
    slides: await toSlidesFixed(item, 8),
    cardTitle: projectCardTitle(item),
    cardIntro: projectCardIntro(item),
  };
}

// ——— Helpers LISTING (réalisations) ———
export function listCardTitle(item?: WPItem) {
  const v = item?.acf?.list_card_title;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
export function listCardIntro(item?: WPItem) {
  const v = item?.acf?.list_card_intro;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
export function listCardAccent(item?: WPItem) {
  const v = item?.acf?.list_card_accent;
  return typeof v === "string" && /^#([0-9a-f]{3}){1,2}$/i.test(v) ? v : undefined;
}

/** Slides LISTING : privilégie list_slide_* ; sinon fallback slide_* */
export async function toSlidesForListing(item?: WPItem, maxSlides = 4) {
  const a = item?.acf ?? {};
  const hasAlt = !!a?.list_slide_1_img;

  const rawImgs = Array.from({ length: maxSlides }, (_, i) =>
    (hasAlt ? a[`list_slide_${i + 1}_img`] : a[`slide_${i + 1}_img`])
  );
  const idList = rawImgs.filter(isNumericId) as (string | number)[];
  const idMap = await resolveMediaIdsToUrls(idList);

  const base = hasAlt ? "list_slide_" : "slide_";
  const slides = Array.from({ length: maxSlides }, (_, i) => {
    const n = i + 1;
    const raw = a[`${base}${n}_img`];
    const img =
      typeof raw === "string" && raw.startsWith("http")
        ? raw
        : isNumericId(raw)
        ? idMap[String(raw)] || ""
        : "";

    return {
      img,
      title: a[`${base}${n}_title`] || "",
      text: a[`${base}${n}_text`] || "",
      meta: a[`${base}${n}_meta`] || undefined,
    };
  }).filter((s) => s.img || s.title || s.text);

  return slides;
}

/** Listing avec pagination & champs utiles pour /realisations */
export async function getProjectsPage({
  page = 1,
  perPage = 9,
}: {
  page?: number;
  perPage?: number;
}) {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = new URL(`${WP_API}/projets`);

  const fields = [
    "id,slug,title,excerpt",
    "acf.site_url",
    "acf.list_card_title",
    "acf.list_card_intro",
    "acf.list_card_accent",
    // slides listing + fallback home
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap((n) => [
      `acf.list_slide_${n}_img`,
      `acf.list_slide_${n}_title`,
      `acf.list_slide_${n}_text`,
      `acf.list_slide_${n}_meta`,
      `acf.slide_${n}_img`,
      `acf.slide_${n}_title`,
      `acf.slide_${n}_text`,
      `acf.slide_${n}_meta`,
    ]),
  ].join(",");

  url.searchParams.set("_fields", fields);
  url.searchParams.set("_embed", "1");
  url.searchParams.set("status", "publish");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`WP ${res.status}: ${url}`);

  const total = Number(res.headers.get("X-WP-Total") || 0);
  const pages = Number(res.headers.get("X-WP-TotalPages") || 0);
  const items = (await res.json()) as WPItem[];

  return { items, total, pages };
}

// ———————————————————————————————————————————
// Témoignages (CPT temoignage / temoignages) + DEBUG
// ———————————————————————————————————————————

export type Testimonial = {
  id: number;
  quote: string;
  /** ACF: full_name ; on duplique aussi dans author pour compat */
  full_name?: string;
  author?: string;
  date?: string;
  source?: "google" | "linkedin";
  sourceUrl?: string;
};

export type TestimonialsResult = {
  items: Testimonial[];
  _debug: {
    tried: string[];   // URLs testées
    hit?: string;      // URL qui a marché
    rows?: number;     // nb d'objets bruts
    mapped?: number;   // nb après mapping (quote + nom)
    note?: string;     // commentaire
  };
};

function stripTagsPreserveNewlines(html = "") {
  return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/\r\n/g, "\n").trim();
}

async function fetchMaybe(url: URL) {
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return Array.isArray(json) ? json : null;
}

function toSource(v: unknown): "google" | "linkedin" | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase().trim();
  return s === "google" || s === "linkedin" ? s : undefined;
}

/** Mapping permissif: supporte ACF (quote, full_name) + fallback excerpt/title */
function mapRowsLoose(rows: any[] = []): Testimonial[] {
  return rows
    .map((r) => {
      const a = r.acf || r.acf_fields || {};
      const quote = stripTagsPreserveNewlines(
        a.quote || r.excerpt?.rendered || r.content?.rendered || ""
      );
      const fullname = (a.full_name || r.title?.rendered || "").trim();

      return {
        id: r.id,
        quote,
        full_name: fullname,  // pour le composant
        author: fullname,     // compat si un autre composant lit "author"
        date: a.date || undefined,
        source: toSource(a.source),
        sourceUrl: a.source_url || undefined,
      } as Testimonial;
    })
    .filter((t) => t.quote && (t.full_name || t.author));
}

/**
 * Essaie plusieurs variantes :
 * - rest_base : "temoignage" puis "temoignages"
 * - _fields : jeu complet pour conserver les fallbacks (title/excerpt/content)
 * - status : publish → sans filtre
 * - lang (Polylang) : par défaut "fr"
 * - tri : date DESC
 */
export async function getTemoignages(
  limit = 3,
  lang = "fr"
): Promise<TestimonialsResult> {
  const WP = (import.meta.env.WP_URL || "").replace(/\/+$/, "");
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const WP_API = `${WP}/wp-json/wp/v2`;

  const bases = ["temoignage", "temoignages"];
  // IMPORTANT : inclure title/excerpt/content pour nos fallbacks
  const fieldSets = [
    "id,acf,title,excerpt,content",
    "id,acf_fields,title,excerpt,content",
    "" // no _fields
  ];
  const statuses = ["publish", "" /* no status */];

  const tried: string[] = [];

  for (const base of bases) {
    for (const fields of fieldSets) {
      for (const status of statuses) {
        const url = new URL(`${WP_API}/${base}`);
        url.searchParams.set("per_page", String(limit));
        url.searchParams.set("orderby", "date");
        url.searchParams.set("order", "desc");
        if (status) url.searchParams.set("status", status);
        if (fields) url.searchParams.set("_fields", fields);
        if (lang) url.searchParams.set("lang", lang);

        tried.push(url.toString());

        const rows = await fetchMaybe(url);
        if (!rows) continue;

        const mapped = mapRowsLoose(rows);
        if (mapped.length) {
          return {
            items: mapped,
            _debug: {
              tried,
              hit: url.toString(),
              rows: rows.length,
              mapped: mapped.length,
              note: !fields
                ? "ACF récupéré sans _fields (serveur/extension filtrant la sortie)"
                : undefined,
            },
          };
        }

        // Données trouvées mais champs attendus manquants
        if (rows.length > 0) {
          return {
            items: [],
            _debug: {
              tried,
              hit: url.toString(),
              rows: rows.length,
              mapped: 0,
              note:
                "Objets trouvés mais champs ACF (quote/full_name) absents : vérifie l’emplacement du groupe ACF (post type ‘temoignage’) et ‘Afficher dans l’API REST’.",
            },
          };
        }
      }
    }
  }

  return {
    items: [],
    _debug: {
      tried,
      rows: 0,
      mapped: 0,
      note:
        "Aucun endpoint REST n’a répondu. Vérifie le REST base du CPT (singulier/pluriel) et réenregistre les permaliens.",
    },
  };
}
