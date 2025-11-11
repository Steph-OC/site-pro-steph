import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import "./ProjectSlider.css";

export type Slide = {
  img?: string;
  title?: string;
  text?: string;
  meta?: string;
  cta?: { href: string };
};

export type ProjectSliderProps = {
  slides?: Slide[];
  accent?: string;
  className?: string;
  siteUrl?: string; // URL externe
  detailsUrl?: string; // URL interne "détails"
  punch?: boolean; // 🔧 active le style “punchy” (défaut: true)
  badge?: string; // 🔧 petit ruban (ex: "Nouveau", "Case study")
};

export default function ProjectSlider({
  slides,
  accent = "#fd7e14",
  className,
  siteUrl,
  detailsUrl,
  punch = true,
  badge,
}: ProjectSliderProps): JSX.Element {
  const reduce = useReducedMotion();

  const list: Slide[] = Array.isArray(slides)
    ? slides.map((s) => ({
        img: s?.img ?? "",
        title: s?.title ?? "",
        text: s?.text ?? "",
        meta: s?.meta ?? undefined,
        cta: s?.cta,
      }))
    : [];

  // Fallback si aucune slide
  if (list.length === 0) {
    return (
      <section
        className={`ps-card ${punch ? "is-punchy" : ""} ${className ?? ""}`}
        style={{ ["--ps-accent" as any]: accent }}
        aria-label="Fonctionnalités du projet"
      >
        {badge && <span className="ps-badge">{badge}</span>}
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

  // État & helpers
  const [index, setIndex] = React.useState(0);
  const len = list.length;
  const safe = (i: number) => ((i % len) + len) % len;
  const go = (dir: 1 | -1) => setIndex((i) => safe(i + dir));
  const set = (i: number) => setIndex(safe(i));

  // Molette
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

  // Auto-play
  React.useEffect(() => {
    if (reduce || len <= 1) return;
    const id = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(id);
  }, [reduce, len]);

  // Clavier
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  // Active: vertical en desktop, horizontal en mobile
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  const cur = list[index];
  const href = siteUrl || cur.cta?.href;

  const variants = {
    enter: { opacity: 0, y: 16, scale: 0.98 },
    center: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.98 },
  };

  // Dots styles (JS, pour gérer le mode mobile vs desktop)
  const dotBase: React.CSSProperties = {
    display: "block",
    width: 10,
    height: 10,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#caced8",
    opacity: 0.9,
    padding: 0,
    margin: 0,
    transition: "height .25s, width .25s, opacity .2s, background .2s",
  };
  const dotActive: React.CSSProperties = {
    ...dotBase,
    background: "var(--ps-accent)",
    opacity: 1,
    width: isMobile ? 28 : 10,
    height: isMobile ? 10 : 28,
    boxShadow:
      "0 0 20px color-mix(in oklab, var(--ps-accent) 35%, transparent)",
  };

  return (
    <section
      className={`ps-card ${punch ? "is-punchy" : ""} ${className ?? ""}`}
      style={{ ["--ps-accent" as any]: accent }}
      aria-roledescription="carrousel"
      aria-label="Fonctionnalités du projet"
    >
      {badge && <span className="ps-badge">{badge}</span>}

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

        {/* CONTENT */}
        <div className="ps-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${index}`}
              className="ps-copy"
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

          {/* Contrôles */}
          {len > 1 && (
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
          )}

          {/* CTA */}
          {(href || detailsUrl) && (
            <div className="ps-ctaRow">
              {href && (
                <a
                  className="ps-btn"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Voir le site – ${cur.title || "projet"}`}
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

          {/* DOTS */}
          {len > 1 && (
            <div
              className="ps-dots"
              role="tablist"
              aria-label="Pagination"
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                display: "grid",
                gap: 10,
                justifyItems: "center",
                alignContent: "center",
                zIndex: 5,
              }}
            >
              {list.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Aller à la diapo ${i + 1}`}
                  className="ps-dot"
                  style={i === index ? dotActive : dotBase}
                  onClick={() => set(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
