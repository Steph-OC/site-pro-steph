import { Users, Gauge, Heart, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useId } from "react";
import "./ApproachStagger.css";

type Step = {
  Icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
};
type Props = {
  variant?: "full" | "teaser";
  id?: string;
  title?: string;
  items?: Step[];
};

const defaultSteps: Step[] = [
  {
    Icon: Users,
    title: "Collaboration",
    text: "On construit ensemble : écoute, cadrage clair et échanges réguliers pour livrer exactement ce dont vous avez besoin.",
  },
  {
    Icon: Gauge,
    title: "Performance",
    text: "Sites rapides, stables et SEO-friendly. Bonnes pratiques WordPress + optimisation images/code pour un rendu fluide.",
  },
  {
    Icon: Heart,
    title: "Passion",
    text: "Veille et soin du détail. UX nette, code propre et finitions utiles pour créer de la valeur.",
  },
  {
    Icon: ShieldCheck,
    title: "Transparence",
    text: "Processus clair, étapes partagées et décisions expliquées. Vous savez où on va — sans surprise.",
  },
];

// compose les classes sans "false"/"undefined"
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// mini-accroche pour le teaser (1ère proposition de phrase, ~32 caractères)
function teaserSnippet(text: string) {
  const first = text.split(/[.,;:!?]/)[0].trim();
  if (first.length <= 32) return first;
  const cut = first.slice(0, 32);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

export default function ApproachStagger({
  variant = "full",
  id = "approach",
  title = "Mon approche",
  items,
}: Props) {
  const steps = items ?? defaultSteps;
  const isTeaser = variant === "teaser";
  const rootRef = useRef<HTMLElement | null>(null);
  const reactId = useId();
  const titleId = `${(id || reactId).toString()}-title`;

  useEffect(() => {
    if (isTeaser) return; // pas d'IO/anim en teaser
    const el = rootRef.current;
    if (!el) return;

    let armed = true;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && armed) {
          el.classList.add("is-inview");
          armed = false;
          io.unobserve(el);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);

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
  }, [isTeaser]);

  return (
    <section
      ref={rootRef}
      id={id}
      className={cx("approach-stagger", isTeaser && "approach-stagger--teaser")}
      aria-labelledby={titleId}
    >
      <div className="container container--xl approach-stagger__inner">
        <header className="section-head">
          <h2 id={titleId} className="approach__title">
            {isTeaser ? "Mon approche" : title || "Mon approche détaillée"}
          </h2>
          {isTeaser && (
            <p className="approach-lead">
              4 piliers qui guident chaque projet.
            </p>
          )}
        </header>

        <div className="stagger">
          {!isTeaser && <div className="stagger__rail" aria-hidden="true" />}
          {steps.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className={cx(
                "stagger__item",
                !isTeaser && (i % 2 === 0 ? "top" : "bottom"),
                `c-${i + 1}`
              )}
              style={{ ["--i" as any]: i }}
            >
              {!isTeaser && (
                <span className="stagger__dot" aria-hidden="true" />
              )}
              <article className="stagger__card" tabIndex={0}>
                <div className="stagger__icon" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <h3 className="stagger__title">{title}</h3>
                {isTeaser ? (
                  <p className="stagger__snippet">{teaserSnippet(text)}</p>
                ) : (
                  <p className="stagger__text">{text}</p>
                )}
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
