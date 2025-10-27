// src/lib/wp.ts
// ———————————————————————————————————————————
// Helpers WordPress REST + ACF (CPT: "projets")
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

const WP = (import.meta.env.WP_URL || "").replace(/\/+$/, "");
if (!WP) console.warn("[wp.ts] WP_URL manquant dans .env");

async function wpFetch<T = any>(path: string): Promise<T> {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = `${WP}/wp-json/wp/v2${path}`;
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
// LISTES
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
// ACF helpers (slides fixes)
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
/** 2 projets pour “Derniers projets” + champs ACF utiles */
// ———————————————————————————————————————————
export async function getDerniersProjetsAvecSlides(limit = 2) {
  const fields = [
    "id",
    "slug",
    "title",
    "excerpt",
    "acf.card_title",   // 👈 ajouté
    "acf.card_intro",   // 👈 ajouté
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
      cardTitle: projectCardTitle(it), // 👈 renvoyé pour la page
      cardIntro: projectCardIntro(it), // 👈 renvoyé pour la page
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
    "acf.card_title",   // 👈 ajouté
    "acf.card_intro",   // 👈 ajouté
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
// -- Helpers LISTING --
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
// --- Listing avec pagination & champs utiles pour /realisations ---
export async function getProjectsPage({ page = 1, perPage = 9 }: { page?: number; perPage?: number }) {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = new URL(`${WP}/wp-json/wp/v2/projets`);

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
