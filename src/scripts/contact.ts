// src/pages/api/contact.ts
import type { APIRoute } from "astro";

export const prerender = false; // route runtime

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProd = import.meta.env.MODE === "production";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // 1) Honeypot (on dit "ok" pour ne rien révéler aux bots)
    if ((form.get("website") || "").toString().trim()) {
      return json({ ok: true });
    }

    // 2) Lire & valider
    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const phoneRaw = (form.get("phone") || "").toString().trim();
    const subject = (form.get("subject") || "Contact depuis le site").toString().trim();
    const message = (form.get("message") || "").toString().trim();

    // Case d’acceptation RGPD côté front (name="accept")
    const acceptVal = (form.get("accept") || "").toString().toLowerCase();
    const accept = acceptVal === "on" || acceptVal === "1" || acceptVal === "true";

    if (!name || !email || !message) {
      return json({ ok: false, error: "Nom, e-mail et message sont requis." }, 400);
    }
    if (!emailRe.test(email)) {
      return json({ ok: false, error: "E-mail invalide." }, 400);
    }
    // Si côté CF7 tu as mis [acceptance* acceptance-privacy], on force l’acceptation ici :
    if (!accept) {
      return json({ ok: false, error: "Veuillez accepter la politique de confidentialité." }, 400);
    }

    // Normalise doucement le numéro (garde chiffres et signes usuels)
    const phone = phoneRaw.replace(/[^0-9+().\s-]/g, "");

    // 3) Config (URL sans slash final, ID numérique)
    const RAW_WP_URL = String(import.meta.env.WP_URL || "").trim();
    const WP_URL = RAW_WP_URL.replace(/\/+$/, "");
    const CF7_ID = String(import.meta.env.CF7_ID ?? import.meta.env.CF7_FORM_ID ?? "")
      .trim()
      .replace(/\D+/g, ""); // ne garde que les chiffres

    if (!WP_URL || !CF7_ID) {
      console.error("[contact] Config manquante: WP_URL / CF7_ID");
      return json({ ok: false, error: "Configuration serveur incomplète." }, 500);
    }

    // 4) Mapper vers les names CF7 + champs cachés CF7 requis en headless
    const payload = new FormData();

    // Champs "visibles" → NAMES CF7
    payload.set("your-name", name);
    payload.set("your-email", email);
    if (phone)   payload.set("your-phone", phone);
    if (subject) payload.set("your-subject", subject);
    payload.set("your-message", message);

    // Case d’acceptation (CF7: [acceptance* acceptance-privacy])
    if (accept) {
      payload.set("acceptance-privacy", "1");
    }

    // Champs "unitaires" CF7 attendus par l'endpoint /feedback
    const unitTag = `wpcf7-f${CF7_ID}-o1`;
    payload.set("_wpcf7", CF7_ID);                 // id du formulaire
    payload.set("_wpcf7_unit_tag", unitTag);       // identifiant d’instance
    payload.set("_wpcf7_locale", "fr_FR");         // locale
    payload.set("_wpcf7_container_post", "0");     // id du post contenant (0 = none)
    // optionnels :
    // payload.set("_wpcf7_version", "5.9.6");
    // payload.set("url", `${WP_URL}/contact`);

    // 5) Appel CF7 avec timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const endpoint = `${WP_URL}/wp-json/contact-form-7/v1/contact-forms/${CF7_ID}/feedback`;

    const res = await fetch(endpoint, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { /* CF7 peut renvoyer du HTML */ }

    if (res.ok && data?.status === "mail_sent") {
      return json({ ok: true });
    }
    if (data?.status === "validation_failed") {
      return json({ ok: false, error: data?.message || "Validation échouée par CF7." }, 400);
    }

    const msg = data?.message || "Envoi refusé par CF7.";
    return json(
      { ok: false, error: msg, ...(isProd ? {} : { debug: { status: res.status, raw } }) },
      400
    );

  } catch (err: any) {
    const aborted = err?.name === "AbortError";
    return json({ ok: false, error: aborted ? "Délai dépassé." : "Erreur serveur." }, 500);
  }
};
