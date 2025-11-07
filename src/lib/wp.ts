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
  siteUrl: string;
  image: { src: string; alt: string; width?: number; height?: number };
  raw: WPItem;
};

export type SliderSlide = {
  img: string;
  title: string;
  text: string;
  meta?: string;
};

// ——— Env / base ———
const DEV = import.meta.env.DEV;
const DISABLE = DEV && import.meta.env.VITE_WP_DISABLE === "1";
const WP = (import.meta.env.WP_URL || "").replace(/\/+$/, "");
const WP_API = `${WP}/wp-json/wp/v2`;

if (DEV && !WP) {
  console.warn("[wp.ts] WP_URL manquant dans .env (mode DEV). Les fonctions renverront []");
}
if (DISABLE) {
  console.warn("[wp.ts] VITE_WP_DISABLE=1 → les appels WP sont désactivés (retours [])");
}

// ——— Utilitaires (cache + logs) ———
const cache = new Map<string, any>();
const warned = new Set<string>();
const warnOnce = (k: string, msg: string) => {
  if (warned.has(k)) return;
  warned.add(k);
  console.warn(msg);
};

// Timeout léger pour ne pas bloquer le rendu
async function fetchWithTimeout(input: string, ms = 6000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(tid);
  }
}

/**
 * wpFetch : essaie l'URL REST “propre”, puis fallback `?rest_route=`.
 * - Désactivable via VITE_WP_DISABLE.
 * - Cache mémoire par `path`.
 * - DEV : si échec → renvoie [] sans throw (évite le HMR en boucle).
 * - PROD : throw si double échec.
 */
async function wpFetchJSON<T = any>(path: string): Promise<T> {
  // Flag off → vide
  if (DISABLE) return [] as unknown as T;

  // Cache
  if (cache.has(path)) return cache.get(path) as T;

  // WP absent ?
  if (!WP) {
    if (DEV) {
      warnOnce(path, `[wp.ts] WP_URL absent → ${path} → []`);
      const empty = [] as unknown as T;
      cache.set(path, empty);
      return empty;
    }
    throw new Error("WP_URL manquant dans .env");
  }

  const urlClean = `${WP_API}${path}`;
  const urlRoute = `${WP}/?rest_route=/wp/v2${path}`;

  // 1) URL propre
  try {
    const r1 = await fetchWithTimeout(urlClean);
    if (r1.ok) {
      const json = (await r1.json()) as T;
      cache.set(path, json);
      return json;
    }
  } catch {
    // ignore → on tente le fallback
  }

  // 2) Fallback rest_route
  try {
    const r2 = await fetchWithTimeout(urlRoute);
    if (r2.ok) {
      const json = (await r2.json()) as T;
      cache.set(path, json);
      return json;
    }
  } catch {
    // ignore
  }

  if (DEV) {
    warnOnce(path, `[wp.ts] fetch KO pour ${path} (ECONNREFUSED ?). DEV → []`);
    const empty = [] as unknown as T;
    cache.set(path, empty);
    return empty;
  }

  throw new Error(`WP fetch failed for ${path}`);
}

// ——— Helpers communs ———
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

export function projectSiteUrl(item?: WPItem): string {
  const a = item?.acf ?? {};
  return a.site_url || a.slide_url || "";
}
export function projectSubtitle(item?: WPItem): string | undefined {
  const a = item?.acf ?? {};
  return a.project_subtitle || a.subtitle || a.subtitle_1 || undefined;
}
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
  const items = await wpFetchJSON<WPItem[]>(
    `/projets?per_page=${per_page}&page=${page}&_embed=1`
  );
  return (Array.isArray(items) ? items : []).map(normalizeProjet);
}

export async function getCPTList(
  type: string,
  { per_page = 12, page = 1 } = {}
) {
  if (type === "projets") return getProjets({ per_page, page });
  const items = await wpFetchJSON<any[]>(
    `/${encodeURIComponent(type)}?per_page=${per_page}&page=${page}&_embed=1`
  );
  return Array.isArray(items) ? items : [];
}

export async function getPosts({ per_page = 6, page = 1 } = {}) {
  const items = await wpFetchJSON<any[]>(
    `/posts?status=publish&per_page=${per_page}&page=${page}&_embed=1`
  );
  return Array.isArray(items) ? items : [];
}

export async function getPostBySlug(slug: string) {
  const arr = await wpFetchJSON<any[]>(
    `/posts?slug=${encodeURIComponent(slug)}&_embed=1`
  );
  return Array.isArray(arr) ? arr[0] : undefined;
}

// ———————————————————————————————————————————
// ACF helpers (slides fixes) pour Projets
// ———————————————————————————————————————————

const isNumericId = (v: unknown) =>
  (typeof v === "number" && Number.isFinite(v)) ||
  (typeof v === "string" && /^\d+$/.test(v));

async function resolveMediaIdsToUrls(ids: (string | number)[]) {
  const uniqueIds = Array.from(new Set(ids.map((x) => String(x))));
  if (uniqueIds.length === 0) return {} as Record<string, string>;
  const qs = uniqueIds.join(",");
  const items = await wpFetchJSON<Array<{ id: number; source_url: string }>>(
    `/media?include=${encodeURIComponent(qs)}`
  );
  const map: Record<string, string> = {};
  (Array.isArray(items) ? items : []).forEach((m) => {
    if (m?.id && m?.source_url) map[String(m.id)] = m.source_url;
  });
  return map;
}

export async function toSlidesFixed(
  item?: WPItem,
  maxSlides = 4
): Promise<SliderSlide[]> {
  const a = item?.acf ?? {};
  const rawImgs = Array.from({ length: maxSlides }, (_, i) => a[`slide_${i + 1}_img`]);
  const idList = rawImgs.filter(isNumericId) as (string | number)[];
  const idMap = await resolveMediaIdsToUrls(idList);

  return Array.from({ length: maxSlides }, (_, i) => {
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
}

// ———————————————————————————————————————————
// Derniers projets + ACF
// ———————————————————————————————————————————
export async function getDerniersProjetsAvecSlides(limit = 2) {
  const fields = [
    "id","slug","title","excerpt",
    "acf.card_title","acf.card_intro",
    "acf.project_subtitle","acf.subtitle","acf.subtitle_1",
    "acf.site_url","acf.slide_url",
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap((n) => [
      `acf.slide_${n}_img`,`acf.slide_${n}_title`,`acf.slide_${n}_text`,`acf.slide_${n}_meta`,
    ]),
  ].join(",");

  const items = await wpFetchJSON<WPItem[]>(
    `/projets?per_page=${limit}&_fields=${fields}&_embed=1`
  );

  const safe = Array.isArray(items) ? items : [];
  return Promise.all(
    safe.map(async (it) => ({
      projet: normalizeProjet(it),
      subtitle: projectSubtitle(it),
      slides: await toSlidesFixed(it),
      cardTitle: projectCardTitle(it),
      cardIntro: projectCardIntro(it),
    }))
  );
}

export async function getProjetBySlugWithACF(slug: string) {
  const fields = [
    "id","slug","title","content",
    "acf.card_title","acf.card_intro",
    "acf.project_subtitle","acf.subtitle","acf.subtitle_1",
    "acf.site_url","acf.slide_url",
    ...Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => [
      `acf.slide_${n}_img`,`acf.slide_${n}_title`,`acf.slide_${n}_text`,`acf.slide_${n}_meta`,
    ]),
  ].join(",");

  const arr = await wpFetchJSON<WPItem[]>(
    `/projets?slug=${encodeURIComponent(slug)}&_fields=${fields}&_embed=1`
  );
  const item = Array.isArray(arr) ? arr[0] : undefined;
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

export async function toSlidesForListing(item?: WPItem, maxSlides = 4) {
  const a = item?.acf ?? {};
  const hasAlt = !!a?.list_slide_1_img;

  const rawImgs = Array.from({ length: maxSlides }, (_, i) =>
    (hasAlt ? a[`list_slide_${i + 1}_img`] : a[`slide_${i + 1}_img`])
  );
  const idList = rawImgs.filter(isNumericId) as (string | number)[];
  const idMap = await resolveMediaIdsToUrls(idList);

  const base = hasAlt ? "list_slide_" : "slide_";
  return Array.from({ length: maxSlides }, (_, i) => {
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
}

export async function getProjectsPage({
  page = 1,
  perPage = 9,
}: { page?: number; perPage?: number }) {
  if (DISABLE || !WP) {
    if (DEV) return { items: [], total: 0, pages: 0 };
    if (!WP) throw new Error("WP_URL manquant dans .env");
  }

  const url = new URL(`${WP_API}/projets`);
  const fields = [
    "id,slug,title,excerpt",
    "acf.site_url",
    "acf.list_card_title",
    "acf.list_card_intro",
    "acf.list_card_accent",
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap((n) => [
      `acf.list_slide_${n}_img`,`acf.list_slide_${n}_title`,`acf.list_slide_${n}_text`,`acf.list_slide_${n}_meta`,
      `acf.slide_${n}_img`,`acf.slide_${n}_title`,`acf.slide_${n}_text`,`acf.slide_${n}_meta`,
    ]),
  ].join(",");

  url.searchParams.set("_fields", fields);
  url.searchParams.set("_embed", "1");
  url.searchParams.set("status", "publish");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`WP ${res.status}: ${url}`);
    const total = Number(res.headers.get("X-WP-Total") || 0);
    const pages = Number(res.headers.get("X-WP-TotalPages") || 0);
    const items = (await res.json()) as WPItem[];
    return { items: Array.isArray(items) ? items : [], total, pages };
  } catch {
    if (DEV) {
      warnOnce("getProjectsPage", "[wp.ts] getProjectsPage échec → vide (DEV)");
      return { items: [], total: 0, pages: 0 };
    }
    throw new Error("WP fetch failed for /projets (projects page)");
  }
}

// ———————————————————————————————————————————
// Témoignages (CPT temoignage / temoignages) + DEBUG
// ———————————————————————————————————————————

export type Testimonial = {
  id: number;
  quote: string;
  full_name?: string;
  author?: string;
  date?: string;
  source?: "google" | "linkedin";
  sourceUrl?: string;
};

export type TestimonialsResult = {
  items: Testimonial[];
  _debug: { tried: string[]; hit?: string; rows?: number; mapped?: number; note?: string };
};

function stripTagsPreserveNewlines(html = "") {
  return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/\r\n/g, "\n").trim();
}

async function fetchMaybe(url: URL) {
  try {
    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

function toSource(v: unknown): "google" | "linkedin" | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase().trim();
  return s === "google" || s === "linkedin" ? s : undefined;
}

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
        full_name: fullname,
        author: fullname,
        date: a.date || undefined,
        source: toSource(a.source),
        sourceUrl: a.source_url || undefined,
      } as Testimonial;
    })
    .filter((t) => t.quote && (t.full_name || t.author));
}

export async function getTemoignages(limit = 3, lang = "fr"): Promise<TestimonialsResult> {
  if (DISABLE || !WP) {
    if (DEV) return { items: [], _debug: { tried: [], rows: 0, mapped: 0, note: "WP désactivé ou manquant (DEV)" } };
    if (!WP) throw new Error("WP_URL manquant dans .env");
  }

  const bases = ["temoignage", "temoignages"];
  const fieldSets = ["id,acf,title,excerpt,content", "id,acf_fields,title,excerpt,content", ""];
  const statuses = ["publish", ""];
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
          return { items: mapped, _debug: { tried, hit: url.toString(), rows: rows.length, mapped: mapped.length } };
        }
        if (rows.length > 0) {
          return {
            items: [],
            _debug: {
              tried, hit: url.toString(), rows: rows.length, mapped: 0,
              note: "ACF absents — vérifier le CPT & ‘Afficher dans l’API’.",
            },
          };
        }
      }
    }
  }
  return { items: [], _debug: { tried, rows: 0, mapped: 0, note: "Aucun endpoint REST n’a répondu." } };
}

// ———————————————————————————————————————————
// Page “Services” (ACF sur page slug=services)
// ———————————————————————————————————————————
export async function getServicesPage() {
  const arr = await wpFetchJSON<any[]>(
    `/pages?slug=services&_fields=id,slug,acf&acf_format=standard`
  );
  const list = Array.isArray(arr) ? arr : [];
  return list?.[0] ?? null;
}
