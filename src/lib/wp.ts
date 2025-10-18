// src/lib/wp.ts
const WP = (import.meta.env.WP_URL || "").replace(/\/$/, "");

async function wpFetch<T = any>(path: string): Promise<T> {
  if (!WP) throw new Error("WP_URL manquant dans .env");
  const url = `${WP}/wp-json/wp/v2${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`WP ${res.status}: ${url}`);
  return res.json();
}

/* =========================
   Pages
   ========================= */
export async function getPageBySlug(slug: string) {
  const arr = await wpFetch<any[]>(`/pages?slug=${encodeURIComponent(slug)}`);
  return arr[0];
}

/* =========================
   CPT (ex: "projets")
   ========================= */
export async function getCPTList(
  type: string,
  { per_page = 12, page = 1 }: { per_page?: number; page?: number } = {}
) {
  // IMPORTANT : pas de _fields ici, sinon on perd des infos dans _embedded (images, etc.)
  return wpFetch<any[]>(
    `/${encodeURIComponent(type)}?per_page=${per_page}&page=${page}&_embed=1`
  );
}

export async function getCPTBySlug(type: string, slug: string) {
  const arr = await wpFetch<any[]>(
    `/${encodeURIComponent(type)}?slug=${encodeURIComponent(slug)}&_embed=1`
  );
  return arr[0];
}

/* =========================
   Blog (posts)
   ========================= */
export async function getPosts({
  per_page = 6,
  page = 1,
}: { per_page?: number; page?: number } = {}) {
  return wpFetch<any[]>(`/posts?per_page=${per_page}&page=${page}&_embed=1`);
}

export async function getPostBySlug(slug: string) {
  const arr = await wpFetch<any[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
  return arr[0];
}

/* =========================
   Médias (image à la une)
   ========================= */
export function getFeatured(item: any) {
  const media = item?._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return { src: "", alt: "", width: undefined, height: undefined };

  const sizes = media?.media_details?.sizes || {};
  // Choix de taille raisonnable (léger -> grand)
  const pick =
    sizes?.medium ||
    sizes?.medium_large ||
    sizes?.large ||
    sizes?.full ||
    media;

  return {
    src: pick?.source_url || media?.source_url || "",
    alt:
      media?.alt_text ||
      media?.title?.rendered ||
      item?.title?.rendered ||
      "",
    width: pick?.width,
    height: pick?.height,
  };
}
