// src/components/ProjectSlider.tsx
import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import "@/styles/ProjectSlider.css";

export type Slide = {
  img?: string;
  title?: string;
  text?: string;
  meta?: string;
  cta?: { href: string }; // fallback si pas de siteUrl
};

export type ProjectSliderProps = {
  slides?: Slide[];
  accent?: string;
  className?: string;
  /** URL unique du projet (externe) */
  siteUrl?: string;
  /** URL interne vers la page réalisation (slug) */
  detailsUrl?: string;
};

export default function ProjectSlider({
  slides,
  accent = "#fd7e14",
  className,
  siteUrl,
  detailsUrl,
}: ProjectSliderProps): JSX.Element {
  const reduce = useReducedMotion();

  // On garde la longueur et l’ordre, on normalise juste les champs.
  const list: Slide[] = Array.isArray(slides)
    ? slides.map((s) => ({
        img: s?.img ?? "",
        title: s?.title ?? "",
        text: s?.text ?? "",
        meta: s?.meta ?? undefined,
        cta: s?.cta,
      }))
    : [];

  // ——— Fallback gracieux (aucune slide) ———
  if (list.length === 0) {
    return (
      <section
        className={`ps-card ${className ?? ""}`}
        style={{ ["--ps-accent" as any]: accent }}
        aria-label="Fonctionnalités du projet"
      >
        <div className="ps-inner">
          <div className="ps-media" aria-hidden>
            <div className="ps-media__ph" />
          </div>
          <div className="ps-content">
            <div>
              <span className="ps-meta">À venir</span>
              <h3 className="ps-title">Contenu en cours</h3>
              <p className="ps-text">
                Les slides de ce projet seront ajoutées bientôt.
              </p>
            </div>

            {(siteUrl || detailsUrl) && (
              <div className="ps-ctaRow">
                {siteUrl && (
                  <a
                    className="ps-btn"
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics="cta-projet"
                  >
                    Voir le site
                  </a>
                )}
                {detailsUrl && (
                  <a className="ps-btn ps-btn--ghost" href={detailsUrl}>
                    Plus de détails
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ——— État & helpers ———
  const [index, setIndex] = React.useState(0);
  const len = list.length;
  const safe = (i: number) => ((i % len) + len) % len;
  const go = (dir: 1 | -1) => setIndex((i) => safe(i + dir));
  const set = (i: number) => setIndex(safe(i));

  // Wheel nav (utile si > 1)
  const wheelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = wheelRef.current;
    if (!el || len <= 1) return;
    let ticking = false;
    const onWheel = (e: WheelEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (Math.abs(e.deltaY) > 8) go(e.deltaY > 0 ? 1 : -1);
        ticking = false;
      });
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [len]);

  // Auto-play doux
  React.useEffect(() => {
    if (reduce || len <= 1) return;
    const id = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(id);
  }, [reduce, len]);

  // Nav clavier (← / →)
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  const cur = list[index];
  const href = siteUrl || cur.cta?.href; // priorité au siteUrl

  const variants = {
    enter: { opacity: 0, y: 16, scale: 0.98 },
    center: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.98 },
  };

  return (
    <section
      className={`ps-card ${className ?? ""}`}
      style={{ ["--ps-accent" as any]: accent }}
      aria-roledescription="carrousel"
      aria-label="Fonctionnalités du projet"
    >
      <div
        className="ps-inner"
        ref={wheelRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-live="polite"
      >
        {/* MEDIA */}
        <div className="ps-media" aria-hidden>
          <AnimatePresence mode="wait">
            {cur.img ? (
              <motion.img
                key={`${index}-${cur.img}`}
                src={cur.img}
                alt=""
                initial={reduce ? false : "enter"}
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <motion.div
                key={`ph-${index}`}
                className="ps-media__ph"
                initial={reduce ? false : "enter"}
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* CONTENT (animé) */}
        <div className="ps-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${index}`}
              initial={reduce ? false : "enter"}
              animate="center"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {cur.meta && <span className="ps-meta">{cur.meta}</span>}
              <h3 className="ps-title">{cur.title || "Slide"}</h3>
              <p className="ps-text">{cur.text || ""}</p>
            </motion.div>
          </AnimatePresence>

          {/* CTA FIXE (non animé, ne saute pas) */}
          {(href || detailsUrl) && (
            <div className="ps-ctaRow">
              {href && (
                <a
                  className="ps-btn"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Voir le site – ${cur.title || "projet"}`}
                  data-analytics="cta-projet"
                >
                  Voir le site
                </a>
              )}
              {detailsUrl && (
                <a
                  className="ps-btn ps-btn--ghost"
                  href={detailsUrl}
                  aria-label={`En savoir plus – ${cur.title || "projet"}`}
                >
                  Plus de détails
                </a>
              )}
            </div>
          )}

          {/* Contrôles + dots */}
          {len > 1 && (
            <>
              <div className="ps-controls">
                <button
                  className="ps-arrow"
                  aria-label="Précédent"
                  onClick={() => go(-1)}
                >
                  ←
                </button>
                <div className="ps-track" aria-hidden />
                <button
                  className="ps-arrow"
                  aria-label="Suivant"
                  onClick={() => go(1)}
                >
                  →
                </button>
              </div>

              <div className="ps-dots" role="tablist" aria-label="Pagination">
                {list.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Aller à la diapo ${i + 1}`}
                    className={`ps-dot ${i === index ? "is-active" : ""}`}
                    onClick={() => set(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
