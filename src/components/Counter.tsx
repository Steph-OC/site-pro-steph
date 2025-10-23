import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

type CounterProps = {
  value: number;                 // valeur finale
  duration?: number;             // durée en ms (1200 par défaut)
  decimals?: number;             // nb de décimales (0 par défaut)
  prefix?: string;               // ex: "≥ "
  suffix?: string;               // ex: " s", " h", "/100"
  locale?: string;               // ex: "fr-FR"
  easing?: (t: number) => number; // easing 0→1 (par défaut easeOutCubic)
  ariaLabel?: string;            // label pour lecteurs d'écran
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Counter({
  value,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "fr-FR",
  easing = easeOutCubic,
  ariaLabel,
}: CounterProps) {
  // prefers-reduced-motion (SSR safe + réactif)
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  // valeur courante
  const [current, setCurrent] = useState<number>(reduced ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // si pas visible, on ne lance pas
    if (!inView) return;

    // si motion réduit ou durée invalide → jump direct
    if (reduced || duration <= 0) {
      setCurrent(value);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easing(t);
      setCurrent(value * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // verrouille pile sur la valeur finale
        setCurrent(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, reduced, duration, value, easing]);

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const display = `${prefix}${formatter.format(current)}${suffix}`;

  return (
    <span ref={ref} aria-label={ariaLabel ?? display} aria-live="polite" style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}
