// src/lib/services.ts
import { Settings, BadgeCheck, MessageSquareText } from "lucide-react";


/** Map simple: slug ACF -> composant Lucide (optionnel) */
function iconFromSlug(slug?: string) {
  const s = (slug || "").toLowerCase();
  if (s === "settings") return Settings;
  if (s === "badge-check" || s === "badgecheck") return BadgeCheck;
  if (s === "message-square-text" || s === "messagesquaretext")
    return MessageSquareText;
  return undefined;
}

export type ServiceItem = {
  title: string;
  desc: string;
  accent?: string;
  url?: string;
  Icon?: any;
};

/**
 * Force les URLs ACF à devenir relatives
 */
function toRelativeUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const u = new URL(trimmed);
    const path = u.pathname || "/";
    const search = u.search || "";
    const hash = u.hash || "";
    return `${path}${search}${hash}`;
  } catch {
    return trimmed;
  }
}

export function normalizeServices(acf: any) {
  const arr = [
    acf?.service_1,
    acf?.service_2,
    acf?.service_3,
    acf?.service_4,
    acf?.service_5,
    acf?.service_6,
  ]
    .filter(Boolean)
    .map(
      (s: any): ServiceItem => ({
        title: s?.title?.trim?.() || "",
        desc: s?.desc?.trim?.() || "",
        accent: s?.accent || "",
        url: toRelativeUrl(s?.url || ""),
        Icon: iconFromSlug(s?.icon),
      })
    )
    .filter((s) => s.title || s.desc);

  const badges = [
    acf?.badge_1,
    acf?.badge_2,
    acf?.badge_3,
    acf?.badge_4,
    acf?.badge_5,
    acf?.badge_6,
  ].filter(Boolean);

  const steps = [
    acf?.step_1,
    acf?.step_2,
    acf?.step_3,
    acf?.step_4,
    acf?.step_5,
    acf?.step_6,
  ].filter(Boolean);

  const faqs = [
    { q: acf?.faq_1_q, a: acf?.faq_1_a },
    { q: acf?.faq_2_q, a: acf?.faq_2_a },
    { q: acf?.faq_3_q, a: acf?.faq_3_a },
    { q: acf?.faq_4_q, a: acf?.faq_4_a },
    { q: acf?.faq_5_q, a: acf?.faq_5_a },
  ].filter((f) => f.q || f.a);

  return {
    intro: {
      title: acf?.intro_title || "",
      text: acf?.intro_text || "",
      rich: acf?.intro_rich_text || "",
    },
    services: arr,
    badges,
    steps,
    tips: {
      cwv: acf?.points_cle_cwv || acf?.tip_cwv || "",
      access: acf?.points_cle_access || acf?.tip_access || "",
      seo: acf?.points_cle_seo || acf?.tip_seo || "",
    },
    faqs,
    cta: {
      title: acf?.cta_title || "",
      text: acf?.cta_text || "",
      btnLabel: acf?.cta_btn_label || "",
      btnUrl: toRelativeUrl(acf?.cta_btn_url || "/contact"),
      style: acf?.cta_style || "accent",
    },
  };
}
