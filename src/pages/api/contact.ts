
import type { APIRoute } from "astro";

const WP_URL = import.meta.env.WP_URL!;
const CF7_ID = import.meta.env.CF7_ID!; // ex: 90

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // Honeypot anti-spam
    if ((form.get("website") as string)?.trim()) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const phone = (form.get("phone") || "").toString().trim(); // champ optionnel
    const subject = (form.get("subject") || "Contact depuis le site").toString().trim();
    const message = (form.get("message") || "").toString().trim();

    if (!name || !email) {
      return new Response(JSON.stringify({ ok: false, error: "Nom et e-mail requis." }), { status: 400 });
    }

    // Mappage vers les NAMES CF7
    const payload = new FormData();
    payload.set("your-name", name);
    payload.set("your-email", email);
    if (phone) payload.set("your-phone", phone);
    payload.set("your-subject", subject);
    payload.set("your-message", message);

    const res = await fetch(`${WP_URL}/wp-json/contact-form-7/v1/contact-forms/${CF7_ID}/feedback`, {
      method: "POST",
      body: payload,
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.status === "mail_sent") {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: false, error: data?.message || "Envoi refusé par CF7." }), { status: 400 });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Erreur serveur." }), { status: 500 });
  }
};
