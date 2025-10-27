import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import "@/styles/listing-card.css";

export type ListingSlide = {
  img?: string;
  title?: string;
  text?: string;
  meta?: string;
};

type Props = {
  slides?: ListingSlide[];
  title: string;
  intro?: string;
  accent?: string;
  ctaHref: string;
  ctaLabel?: string;
};

export default function ListingProjectCard({
  slides = [],
  title,
  intro,
  accent = "#fd3838",
  ctaHref,
  ctaLabel = "Voir le site",
}: Props) {
  const reduce = useReducedMotion();
  const count = Array.isArray(slides) ? slides.length : 0;
  const len = Math.max(1, count);

  const [i, setI] = React.useState(0);
  const safe = (x: number) => ((x % len) + len) % len;
  const go = (dir: 1 | -1) => setI((v) => safe(v + dir));
  const set = (k: number) => setI(safe(k));

  // autoplay
  React.useEffect(() => {
    if (reduce || count <= 1) return;
    const id = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(id);
  }, [reduce, count]);

  const cur = slides[i] ?? {};
  const variants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  // molette
  const wheelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = wheelRef.current;
    if (!el || count <= 1) return;
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
  }, [count]);

  // clavier
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  // drag / swipe
  const dragRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = dragRef.current;
    if (!el || count <= 1) return;
    let startX = 0,
      dx = 0,
      down = false;
    const onDown = (e: PointerEvent) => {
      down = true;
      startX = e.clientX;
      dx = 0;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      dx = e.clientX - startX;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      el.releasePointerCapture(e.pointerId);
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      dx = 0;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [count]);

  return (
    <article
      className="listingCard"
      style={{ ["--accent" as any]: accent }}
      aria-roledescription="carrousel"
      aria-label={`Fonctionnalités du projet : ${title}`}
    >
      <div
        className="listingCard__inner"
        ref={wheelRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-live="polite"
      >
        {/* MEDIA */}
        <div className="listingCard__imgWrap" ref={dragRef} aria-hidden>
          <AnimatePresence mode="wait">
            {cur.img ? (
              <motion.img
                key={`${i}-${cur.img}`}
                className="listingCard__img"
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
                key={`ph-${i}`}
                className="listingCard__img ph"
                initial={reduce ? false : "enter"}
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* CONTENU */}
        <div className="listingCard__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${i}`}
              initial={reduce ? false : "enter"}
              animate="center"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {cur.meta && <span className="ps-meta">{cur.meta}</span>}
              <h3 className="listingCard__title">{cur.title || title}</h3>
              {(cur.text || intro) && (
                <p className="listingCard__text">{cur.text || intro}</p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* FOOTER : flèches + piste + CTA (une seule ligne) */}
          <div className="listingCard__footer">
            {count > 1 && (
              <div className="listingCard__controls">
                <button
                  className="listingCard__arrow"
                  aria-label="Précédent"
                  onClick={() => go(-1)}
                >
                  ←
                </button>
                <div className="listingCard__track" aria-hidden />
                <button
                  className="listingCard__arrow"
                  aria-label="Suivant"
                  onClick={() => go(1)}
                >
                  →
                </button>
              </div>
            )}

            <div className="listingCard__actions">
              <a
                className="listingCard__button"
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${ctaLabel} — ${cur.title || title}`}
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        </div>

        {/* DOTS */}
        {count > 1 && (
          <div
            className="listingCard__dots"
            role="tablist"
            aria-label="Pagination"
          >
            {slides.map((_, k) => (
              <button
                key={k}
                role="tab"
                aria-selected={k === i}
                aria-label={`Diapo ${k + 1}`}
                className={`dot ${k === i ? "is-active" : ""}`}
                onClick={() => set(k)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
