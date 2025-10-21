import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function IosPointer({
  force = false,
  size = 14,
  pad = 10,
  radius = 12,
  color = "var(--brand)",
  zIndex = 2147483647, // ++ au-dessus de tout
  magnetRadius = 80,
  targets = "[data-pointer], .nav a, a[href], button, [role='button']",
}) {
  const [enabled, setEnabled] = useState(false);
  const selector = useMemo(() => targets, [targets]);

  // frame (coin haut-gauche)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mw = useMotionValue(size);
  const mh = useMotionValue(size);
  const mr = useMotionValue(size / 2);

  const x = useSpring(mx, { stiffness: 480, damping: 40, mass: 0.6 });
  const y = useSpring(my, { stiffness: 480, damping: 40, mass: 0.6 });
  const w = useSpring(mw, { stiffness: 360, damping: 34, mass: 0.6 });
  const h = useSpring(mh, { stiffness: 360, damping: 34, mass: 0.6 });
  const r = useSpring(mr, { stiffness: 360, damping: 34, mass: 0.6 });

  const rafRef = useRef(0);
  const moRef  = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0, seen: false });
  const activeElRef = useRef(null);

  // activer selon device / prefers-reduced-motion
  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (force || (!isTouch && !prefersReduced)) setEnabled(true);
  }, [force]);

  // suivre la souris (+ poser un schedule)
  useEffect(() => {
    if (!enabled) return;

    const onMove = (e) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, seen: true };

      // première position : on place le point directement
      if (mw.get() === size && mh.get() === size) {
        mx.set(e.clientX - size / 2);
        my.set(e.clientY - size / 2);
      }
      schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    // déclenche une première passe au cas où la souris est déjà dans la page
    schedule();

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, [enabled, mx, my, mw, mh, size]);

  // scroll / resize
  useEffect(() => {
    if (!enabled) return;
    const onScrollOrResize = () => schedule();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [enabled]);

  // classe root pour masquer le curseur natif
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("use-ios-pointer");
    return () => root.classList.remove("use-ios-pointer");
  }, [enabled]);

  // observer le DOM (SPA / hydratations) pour réévaluer les cibles
  useEffect(() => {
    if (!enabled) return;
    const obs = new MutationObserver(() => schedule());
    obs.observe(document.body, { childList: true, subtree: true, attributes: false });
    moRef.current = obs;
    return () => obs.disconnect();
  }, [enabled]);

  const cancelFrame = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  };

  const schedule = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(step);
  };

  const step = () => {
    rafRef.current = 0;

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
        activeElRef.current = null;
      }
    };

    const { x: mxView, y: myView, seen } = lastMouseRef.current;

    // si on n’a jamais vu la souris, garder le pointeur discret
    if (!seen) {
      mw.set(size); mh.set(size); mr.set(size / 2);
      return;
    }

    // ignorer si hors viewport
    if (mxView < 0 || myView < 0 || mxView > window.innerWidth || myView > window.innerHeight) {
      mw.set(size); mh.set(size); mr.set(size / 2);
      clearActive();
      return;
    }

    // pointer doit être neutre pour elementFromPoint : pointer-events:none (cf. JSX)
    const el = document.elementFromPoint(mxView, myView);
    const target = el?.closest?.(selector);

    if (target) {
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mxView - cx;
      const dy = myView - cy;
      const dist = Math.hypot(dx, dy);

      if (dist <= magnetRadius) {
        // cadre autour de la cible (+ pad)
        const ww = rect.width + pad * 2;
        const hh = rect.height + pad * 2;
        const xx = rect.left - pad;
        const yy = rect.top - pad;

        mw.set(ww); mh.set(hh); mr.set(radius); mx.set(xx); my.set(yy);

        if (activeElRef.current !== target) clearActive();
        activeElRef.current = target;
        target.classList.add("magnet-on");

        // Tilt 3D doux
        const maxDeg = 2;
        const rotX = Math.max(-maxDeg, Math.min(maxDeg, (-dy / (hh / 2)) * maxDeg));
        const rotY = Math.max(-maxDeg, Math.min(maxDeg, ( dx / (ww / 2)) * maxDeg));
        target.style.setProperty("--magnet-rotX", `${rotX.toFixed(2)}deg`);
        target.style.setProperty("--magnet-rotY", `${rotY.toFixed(2)}deg`);

        // Follow (décalage léger vers la souris) + rotZ + scale
        const maxShift = 6; // px
        const tx = (dx / (rect.width  / 2)) * maxShift;
        const ty = (dy / (rect.height / 2)) * maxShift;
        target.style.setProperty("--magnet-tx", `${tx.toFixed(2)}px`);
        target.style.setProperty("--magnet-ty", `${ty.toFixed(2)}px`);

        const maxZ = 1.2; // degrés
        const rotZ = Math.max(-maxZ, Math.min(maxZ,
          (dx / (rect.width/2)) * 0.8 + (-dy / (rect.height/2)) * 0.4
        ));
        target.style.setProperty("--magnet-rotZ", `${rotZ.toFixed(2)}deg`);
        target.style.setProperty("--magnet-scale", "1.03");
        return;
      }
    }

    // pas de cible → petit point
    mw.set(size); mh.set(size); mr.set(size / 2);
    mx.set(mxView - size / 2);
    my.set(myView - size / 2);
    clearActive();
  };

  useEffect(() => {
    return () => {
      cancelFrame();
      moRef.current?.disconnect?.();
    };
  }, []);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="ios-pointer"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        x, y,
        width: w, height: h,
        borderRadius: r,
        zIndex,
        pointerEvents: "none",
        willChange: "transform, width, height, border-radius, opacity",
        boxSizing: "border-box",
        outline: `2px solid ${color}`,
        outlineOffset: 0,
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--brand) 18%, transparent), transparent)",
        boxShadow: "0 0 36px color-mix(in srgb, var(--brand) 40%, transparent)",
        opacity: 1
      }}
    />
  );
}
