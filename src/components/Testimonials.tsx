import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Testimonial = {
  id: string | number;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  // date?: string;              // ← non utilisé
  source?: "google" | "linkedin";
  sourceUrl?: string;
};

type Props = {
  items: Testimonial[];
  autoPlayMs?: number;
  withMotion?: boolean;
};

function SourceIcon({
  source,
  url,
}: {
  source?: "google" | "linkedin";
  url?: string;
}) {
  if (source === "google")
    return (
      <img
        src="/icons/google.svg"
        alt="Google"
        width={18}
        height={18}
        loading="lazy"
      />
    );
  if (source === "linkedin")
    return (
      <img
        src="/icons/linkedin.svg"
        alt="LinkedIn"
        width={18}
        height={18}
        loading="lazy"
      />
    );
  if (url) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes("google"))
        return (
          <img
            src="/icons/google.svg"
            alt="Google"
            width={18}
            height={18}
            loading="lazy"
          />
        );
      if (host.includes("linkedin"))
        return (
          <img
            src="/icons/linkedin.svg"
            alt="LinkedIn"
            width={18}
            height={18}
            loading="lazy"
          />
        );
    } catch {}
  }
  return null;
}

export default function Testimonials({
  items,
  autoPlayMs = 7000,
  withMotion = true,
}: Props) {
  const total = items?.length ?? 0;
  const [idx, setIdx] = useState(0);
  const dirRef = useRef<1 | -1>(1);

  useEffect(() => {
    if (idx >= total) setIdx(0);
  }, [total, idx]);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (!autoPlayMs || reducedMotion || total <= 1) return;
    const t = setInterval(() => next(), autoPlayMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, autoPlayMs, reducedMotion, total]);

  function goTo(n: number) {
    if (total === 0) return;
    if (n === idx) return;
    dirRef.current = n > idx ? 1 : -1;
    setIdx((n + total) % total);
  }
  function next() {
    goTo(idx + 1);
  }
  function prev() {
    goTo(idx - 1);
  }

  const dragProps =
    withMotion && !reducedMotion
      ? {
          drag: "x" as const,
          dragConstraints: { left: 0, right: 0 },
          dragElastic: 0.15,
          onDragEnd: (_: any, info: any) => {
            if (info.offset.x < -60) next();
            if (info.offset.x > 60) prev();
          },
        }
      : {};

  if (!items || total === 0) return null;

  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <h2 id="testimonials-title" className="testimonials__title">
        Ils en parlent mieux que moi
      </h2>

      <div className="testimonials__viewport" role="region" aria-live="polite">
        <AnimatePresence initial={false} custom={dirRef.current}>
          {withMotion && !reducedMotion ? (
            <motion.article
              key={items[idx].id}
              className="tcard"
              role="figure"
              aria-roledescription="témoignage"
              custom={dirRef.current}
              initial={{ opacity: 0, x: 20 * dirRef.current }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 * dirRef.current }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 24,
                mass: 0.6,
              }}
              {...dragProps}
            >
              <CardContent t={items[idx]} />
            </motion.article>
          ) : (
            <article key={items[idx].id} className="tcard" role="figure">
              <CardContent t={items[idx]} />
            </article>
          )}
        </AnimatePresence>
      </div>

      <div className="testimonials__controls">
        <button
          className="tbtn"
          onClick={prev}
          aria-label="Témoignage précédent"
        >
          ‹
        </button>
        <ul className="dots" role="tablist" aria-label="Choisir un témoignage">
          {items.map((_, i) => (
            <li key={i} role="presentation">
              <button
                role="tab"
                aria-selected={i === idx}
                aria-controls={`testimonial-panel-${i}`}
                className={`dot ${i === idx ? "is-active" : ""}`}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ul>
        <button className="tbtn" onClick={next} aria-label="Témoignage suivant">
          ›
        </button>
      </div>
    </section>
  );
}

function CardContent({ t }: { t: Testimonial }) {
  return (
    <>
      <blockquote className="tcard__quote">
        <span className="tcard__quote-mark" aria-hidden="true">
          “
        </span>
        {t.quote}
        <span className="tcard__quote-mark" aria-hidden="true">
          ”
        </span>
      </blockquote>

      <figcaption className="tcard__author">
        {t.avatar && (
          <img className="tcard__avatar" src={t.avatar} alt="" loading="lazy" />
        )}
        <div className="tcard__meta">
          <strong className="tcard__name">{t.author}</strong>
          {t.role && <span className="tcard__role">{t.role}</span>}
          <SourceIcon source={t.source} url={t.sourceUrl} />
        </div>
      </figcaption>
    </>
  );
}
