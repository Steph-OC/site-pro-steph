import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function IosPointer({
  force = false,
  size = 14,                 // côté de la boîte de base (non-scalée)
  pad = 10,                  // marge autour de la cible
  radius = 12,               // coins arrondis
  color = "var(--brand)",
  zIndex = 2147483647,
  magnetRadius = 80,
  targets = "[data-pointer], .nav a, a[href], button, [role='button']",
}) {
  const [enabled, setEnabled] = useState(false);
  const selector = useMemo(() => targets, [targets]);

  // transforms (GPU)
  const mvX  = useMotionValue(0);
  const mvY  = useMotionValue(0);
  const mvSX = useMotionValue(1);
  const mvSY = useMotionValue(1);

  // opacité (discret au repos, net sur cible)
  const mvO = useMotionValue(0.35);
  const o   = useSpring(mvO, { stiffness: 420, damping: 32, mass: 0.6 });

  // follow iOS pour x/y
  const x = useSpring(mvX, { stiffness: 480, damping: 40, mass: 0.6 });
  const y = useSpring(mvY, { stiffness: 480, damping: 40, mass: 0.6 });

  const rafRef = useRef(0);
  const moRef  = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0, seen: false });
  const activeElRef  = useRef(null);
  const cachedRectRef = useRef(null);
  const wasActiveRef  = useRef(false);

  // activer selon device / RDM
  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (force || (!isTouch && !prefersReduced)) setEnabled(true);
  }, [force]);

  // pointermove + rAF
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, seen: true };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  // scroll/resize + mutations → relance une frame
  useEffect(() => {
    if (!enabled) return;
    const kick = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(step); };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    const obs = new MutationObserver(kick);
    obs.observe(document.body, { childList: true, subtree: true });
    moRef.current = obs;
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      obs.disconnect();
    };
  }, [enabled]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    moRef.current?.disconnect?.();
  }, []);

  const clearActive = () => {
    const prev = activeElRef.current;
    if (prev) {
      prev.classList.remove("magnet-on");
      prev.style.removeProperty("--magnet-scale");
      prev.style.removeProperty("--magnet-rotX");
      prev.style.removeProperty("--magnet-rotY");
      prev.style.removeProperty("--magnet-rotZ");
      prev.style.removeProperty("--magnet-tx");
      prev.style.removeProperty("--magnet-ty");
    }
    activeElRef.current = null;
    cachedRectRef.current = null;
    mvSX.set(1); mvSY.set(1);
  };

  const step = () => {
    rafRef.current = 0;
    const { x: mx, y: my, seen } = lastMouseRef.current;
    if (!seen) return;

    const el = document.elementFromPoint(mx, my);
    const target = el?.closest?.(selector) || null;

    if (!target) {
      // petit point centré + opacité faible
      mvX.set(mx - size / 2);
      mvY.set(my - size / 2);
      if (wasActiveRef.current) { mvO.set(0.35); wasActiveRef.current = false; }
      clearActive();
      return;
    }

    // distance pour activer l’aimant
    let rect = cachedRectRef.current;
    if (!rect || activeElRef.current !== target) {
      rect = target.getBoundingClientRect();
      cachedRectRef.current = rect;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > magnetRadius) {
      mvX.set(mx - size / 2);
      mvY.set(my - size / 2);
      if (wasActiveRef.current) { mvO.set(0.35); wasActiveRef.current = false; }
      clearActive();
      return;
    }

    // entoure la cible : coin haut-gauche + scale
    const ww = rect.width  + pad * 2;
    const hh = rect.height + pad * 2;
    const xx = rect.left - pad;
    const yy = rect.top  - pad;

    mvX.set(xx);
    mvY.set(yy);
    mvSX.set(Math.max(1, ww / size));
    mvSY.set(Math.max(1, hh / size));

    if (activeElRef.current !== target) {
      clearActive();
      activeElRef.current = target;
      target.classList.add("magnet-on");
    }

    // opacité forte en mode “entoure”
    if (!wasActiveRef.current) { mvO.set(0.92); wasActiveRef.current = true; }

    // tilt/follow léger
    const maxDeg = 2, maxShift = 6, maxZ = 1.2;
    const rotX = Math.max(-maxDeg, Math.min(maxDeg, (-dy / (rect.height / 2)) * maxDeg));
    const rotY = Math.max(-maxDeg, Math.min(maxDeg, ( dx / (rect.width  / 2)) * maxDeg));
    const tx   = (dx / (rect.width  / 2)) * maxShift;
    const ty   = (dy / (rect.height / 2)) * maxShift;
    const rotZ = Math.max(-maxZ, Math.min(maxZ,
                 (dx / (rect.width/2)) * 0.8 + (-dy / (rect.height/2)) * 0.4));
    target.style.setProperty("--magnet-rotX", `${rotX.toFixed(2)}deg`);
    target.style.setProperty("--magnet-rotY", `${rotY.toFixed(2)}deg`);
    target.style.setProperty("--magnet-rotZ", `${rotZ.toFixed(2)}deg`);
    target.style.setProperty("--magnet-tx",  `${tx.toFixed(2)}px`);
    target.style.setProperty("--magnet-ty",  `${ty.toFixed(2)}px`);
    target.style.setProperty("--magnet-scale", "1.03");
  };

  if (!enabled) return null;

  // SVG avec trait non scalable + coins arrondis
  return (
    <motion.svg
      aria-hidden="true"
      className="ios-pointer"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        x, y,
        scaleX: mvSX,
        scaleY: mvSY,
        width: size,
        height: size,
        transformOrigin: "0 0",
        zIndex,
        pointerEvents: "none",
        willChange: "transform, opacity",
        opacity: o,
      }}
      viewBox={`0 0 ${size} ${size}`}
    >
      <rect
        x="0.5"
        y="0.5"
        width={size - 1}
        height={size - 1}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={color}
        strokeWidth={0.25}              // finesse du trait
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        shapeRendering="geometricPrecision"
      />
    </motion.svg>
  );
}
