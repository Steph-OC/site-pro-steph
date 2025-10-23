// src/components/ApproachStagger.tsx
import { Users, Gauge, Heart, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import "./ApproachStagger.css";

const steps = [
  {
    Icon: Users,
    title: "Collaboration",
    text:
      "On construit ensemble : écoute, cadrage clair et échanges réguliers pour livrer exactement ce dont vous avez besoin.",
  },
  {
    Icon: Gauge,
    title: "Performance",
    text:
      "Sites rapides, stables et SEO-friendly. Bonnes pratiques WordPress + optimisation images/code pour un rendu fluide.",
  },
  {
    Icon: Heart,
    title: "Passion",
    text:
      "Veille et soin du détail. UX nette, code propre et finitions utiles pour créer de la valeur.",
  },
  {
    Icon: ShieldCheck,
    title: "Transparence",
    text:
      "Processus clair, étapes partagées et décisions expliquées. Vous savez où on va — sans surprise.",
  },
];

export default function ApproachStagger() {
  const rootRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  const el = rootRef.current;
  if (!el) return;

  let armed = true; // évite double déclenchement

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;

      if (entry.isIntersecting && armed) {
        // On déclenche UNE SEULE FOIS puis on arrête d'observer
        el.classList.add("is-inview");
        armed = false;
        io.unobserve(el);
        io.disconnect();
      }
    },
    {
      // déclenche dès que ~10% du bloc est visible
      threshold: 0.1,
      // tolérance en bas pour ne pas rater le trigger sur grands écrans
      rootMargin: "0px 0px -10% 0px",
    }
  );

  io.observe(el);

  // Fallback: si l’IO ne déclenche pas (cas rare), on force après 800ms
  const t = window.setTimeout(() => {
    if (armed) {
      el.classList.add("is-inview");
      armed = false;
      io.disconnect();
    }
  }, 800);

  return () => {
    window.clearTimeout(t);
    io.disconnect();
  };
}, []);


  return (
    <section
      ref={rootRef}
      className="approach-stagger"
      aria-labelledby="approach-title"
    >
      <h2 id="approach-title" className="approach__title">
        Mon approche
      </h2>

      <div className="stagger">
        <div className="stagger__rail" aria-hidden="true" />
        {steps.map(({ Icon, title, text }, i) => (
          <div
            key={title}
            className={`stagger__item ${i % 2 === 0 ? "top" : "bottom"} c-${i + 1}`}
            style={{ ["--i" as any]: i }}
          >
            <span className="stagger__dot" aria-hidden="true" />
            <article className="stagger__card">
              <div className="stagger__icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <h3 className="stagger__title">{title}</h3>
              <p className="stagger__text">{text}</p>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
