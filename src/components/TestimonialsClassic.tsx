import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Testimonial = {
  id: string | number;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
};

type Props = {
  items: Testimonial[];
  speedMs?: number; // autoplay (par défaut 4500ms comme le CodePen)
  withMotion?: boolean; // activer Framer Motion (par défaut true)
};

export default function TestimonialsClassic({
  items,
  speedMs = 4500,
  withMotion = true,
}: Props) {
  const [idx, setIdx] = useState(0);
  const total = items?.length ?? 0;
  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const ignoreTouch = 30 as const;
  const dirRef = useRef<1 | -1>(1);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  const prevIdx = (i: number) => (i - 1 + total) % total;
  const nextIdx = (i: number) => (i + 1) % total;

  function goTo(n: number) {
    if (n === idx) return;
    dirRef.current = n > idx ? 1 : -1;
    setIdx((n + total) % total);
  }

  function scheduleNext() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (total <= 1) return;
    timerRef.current = window.setTimeout(() => {
      setIdx((i) => nextIdx(i));
    }, speedMs) as unknown as number;
  }

  useEffect(() => {
    if (!reducedMotion) scheduleNext();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, total, speedMs, reducedMotion]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (total <= 1) return;
      if (e.key === "ArrowLeft") goTo(prevIdx(idx));
      if (e.key === "ArrowRight") goTo(nextIdx(idx));
    }
    document.addEventListener("keyup", onKey);
    return () => document.removeEventListener("keyup", onKey);
  }, [idx, total]);

  if (!items || total === 0) return null;

  const active = items[idx];

  const Card = (
    <article
      className="tclassic-slide active"
      role="figure"
      aria-roledescription="témoignage"
      key={active.id}
    >
      <div className="img">
        {active.avatar ? (
          <img src={active.avatar} alt="" loading="lazy" />
        ) : (
          <div className="img-fallback" aria-hidden="true" />
        )}
      </div>
      <h2>{active.author}</h2>
      <p>
        {active.quote}
        {active.role ? ` — ${active.role}` : ""}
      </p>
    </article>
  );

  return (
    <section
      className="testim"
      aria-labelledby="testim-title"
      onTouchStart={(e) => {
        touchStartRef.current = e.changedTouches?.[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current;
        const end = e.changedTouches?.[0]?.clientX ?? null;
        touchStartRef.current = null;
        if (start == null || end == null) return;
        const diff = start - end;
        if (diff > 0 + ignoreTouch)
          goTo(nextIdx(idx)); // swipe gauche → suivant
        else if (diff < 0 - ignoreTouch) goTo(prevIdx(idx)); // swipe droite → précédent
      }}
    >
      <div className="wrap">
        <h2 id="testim-title" className="visually-hidden">
          Témoignages
        </h2>

        {/* Flèches */}
        <button
          className="arrow left"
          aria-label="Témoignage précédent"
          onClick={() => goTo(prevIdx(idx))}
        >
          ‹
        </button>
        <button
          className="arrow right"
          aria-label="Témoignage suivant"
          onClick={() => goTo(nextIdx(idx))}
        >
          ›
        </button>

        {/* Viewport + slide active */}
        <div className="cont" role="region" aria-live="polite">
          {withMotion && !reducedMotion ? (
            <AnimatePresence
              initial={false}
              custom={dirRef.current}
              mode="wait"
            >
              <motion.div
                key={active.id} // change à chaque idx
                className="tclassic-motion-wrapper"
                custom={dirRef.current}
                initial={{ opacity: 0, x: 16 * dirRef.current }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 * dirRef.current }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 24,
                  mass: 0.6,
                }}
              >
                {Card}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="tclassic-motion-wrapper">{Card}</div>
          )}
        </div>

        {/* Dots */}
        <ul className="dots" role="tablist" aria-label="Choisir un témoignage">
          {items.map((_, i) => (
            <li key={i} role="presentation">
              <button
                role="tab"
                aria-selected={i === idx}
                className={`dot ${i === idx ? "active" : ""}`}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
