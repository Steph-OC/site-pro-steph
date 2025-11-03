import { useEffect, useMemo, useRef } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";

// Un item = { label, x, y, size, color }
export default function BubbleCloud({
  items = [],
  // rayon d’influence (px) et push max (px)
  influence = 140,
  maxPush = 22,
}) {
  const contRef = useRef(null);

  // Prépare par bulle des MV + ressorts
  const bubbles = useMemo(
    () =>
      items.map((it, i) => {
        const mvx = useMotionValue(0);
        const mvy = useMotionValue(0);
        const x = useSpring(mvx, { stiffness: 300, damping: 24 });
        const y = useSpring(mvy, { stiffness: 300, damping: 24 });
        // petite phase différente pour la dérive
        const phase = (i + 1) * 987.123 % 1000;
        return { it, mvx, mvy, x, y, phase };
      }),
    [items]
  );

  // Repoussement souris
  useEffect(() => {
    const onMove = (e) => {
      const cont = contRef.current;
      if (!cont) return;
      const cRect = cont.getBoundingClientRect();

      bubbles.forEach(({ it, mvx, mvy }) => {
        // position cible absolue (en px) dans le conteneur
        const cx = cRect.left + (it.x / 100) * cRect.width;
        const cy = cRect.top + (it.y / 100) * cRect.height;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);

        if (d < influence) {
          const k = 1 - d / influence; // 0..1
          const nx = dx / (d || 1);
          const ny = dy / (d || 1);
          mvx.set(-nx * maxPush * k);
          mvy.set(-ny * maxPush * k);
        } else {
          mvx.set(0);
          mvy.set(0);
        }
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [bubbles, influence, maxPush]);

  // très légère dérive “respiration”
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (t) => {
      const elapsed = (t - t0) / 1000;
      bubbles.forEach(({ mvx, mvy, phase }) => {
        // ajoute 1–2 px de drift sinus sur les MV (sans casser le push souris)
        mvx.set(mvx.get() + Math.sin(elapsed * 0.6 + phase) * 0.03);
        mvy.set(mvy.get() + Math.cos(elapsed * 0.5 + phase) * 0.03);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bubbles]);

  return (
    <ul className="bubble-cloud" ref={contRef} aria-hidden="true">
      {bubbles.map(({ it, x, y }, idx) => (
        <m.li
          key={idx}
          className="bubble"
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            // translate de base (-50%, -50%) + offset ressort
            translateX: useTransform(x, (v) => `calc(-50% + ${v}px)`),
            translateY: useTransform(y, (v) => `calc(-50% + ${v}px)`),
          }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <span className="bubble__disc" style={{ "--c": it.color, "--b": `${it.size}px` }} />
          <span className="bubble__spec" style={{ "--b": `${it.size}px` }} />
          <span className="bubble__label">{it.label}</span>
        </m.li>
      ))}
    </ul>
  );
}
