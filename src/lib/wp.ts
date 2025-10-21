// src/lib/wp.ts
const WP = (import.meta.env.WP_URL || "").replace(/\/$/, "");

async function wpFetch(path) {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = `${WP}/wp-json/wp/v2${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`WP ${res.status}: ${url}`);
  return res.json();
}

export function getFeatured(item) {
  const m = item?._embedded?.["wp:featuredmedia"]?.[0];
  const s = m?.media_details?.sizes || {};
  const pick = s?.medium || s?.medium_large || s?.large || s?.full || m;
  return {
    src: pick?.source_url || m?.source_url || "",
    alt: m?.alt_text || m?.title?.rendered || item?.title?.rendered || "",
    width: pick?.width,
    height: pick?.height,
  };
}

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

export function normalizeProjet(item) {
  return {
    id: item?.id,
    slug: item?.slug,
    title: item?.title?.rendered || "",
    excerpt: strip(item?.excerpt?.rendered || item?.content?.rendered || ""),
    siteUrl: item?.acf?.site_url || "",
    image: getFeatured(item),
    raw: item,
  };
}

export async function getProjets({ per_page = 12, page = 1 } = {}) {
  const items = await wpFetch(`/projets?per_page=${per_page}&page=${page}&_embed=1`);
  return items.map(normalizeProjet);
}

// Alias (si d’anciennes pages appellent encore getCPTList)
export async function getCPTList(type, { per_page = 12, page = 1 } = {}) {
  if (type === "projets") return getProjets({ per_page, page });
  return wpFetch(`/${encodeURIComponent(type)}?per_page=${per_page}&page=${page}&_embed=1`);
}

/** Articles (listing) */
export async function getPosts({ per_page = 6, page = 1 } = {}) {
  return wpFetch<any[]>(`/posts?per_page=${per_page}&page=${page}&_embed=1`);
}

/** Article par slug (pour /blog/[slug]) */
export async function getPostBySlug(slug: string) {
  const arr = await wpFetch<any[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
  return arr[0]; // undefined si non trouvé
}

// (optionnel) Alias rétro-compat si tu avais d'autres noms avant
export const getArticles = getPosts;