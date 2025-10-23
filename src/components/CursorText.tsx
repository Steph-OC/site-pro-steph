import React, { useEffect, useRef, useState } from "react";

type Props = {
  targets?: string;
  textAttr?: string;
  repeatAttr?: string;
  radius?: number; // undefined => auto (calé à la pastille)
  smallSize?: number; // point central
  largeSize?: number; // diamètre de l’anneau
  rotationDuration?: number; // ms par tour
  zIndex?: number;
  textSize?: number; // taille de police du texte
  blendMode?: "difference" | "normal";
  leaveGraceMs?: number; // anti-clignotement entre deux pastilles
};

type Lock = {
  el: HTMLElement;
  getCenter: () => { x: number; y: number; r: number };
};

const RING_BORDER = 2; // épaisseur du trait
const DEFAULT_COLOR = "#fff";

export default function CursorText({
  targets = ".cursor-hover-item, [data-cursor-text]",
  textAttr = "data-cursor-text",
  repeatAttr = "data-cursor-text-repeat",
  radius,
  smallSize = 20,
  largeSize = 100,
  rotationDuration = 8000,
  zIndex = 2147483647,
  textSize = 18,
  blendMode = "normal",
  leaveGraceMs = 180,
}: Props) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [rotate, setRotate] = useState(0);
  const [label, setLabel] = useState("GO HERE!");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [lock, setLock] = useState<Lock | null>(null);
  const [dynamicRadius, setDynamicRadius] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  const leaveTimerRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  // Respecte prefers-reduced-motion
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(!!m?.matches);
    apply();
    m?.addEventListener?.("change", apply);
    return () => m?.removeEventListener?.("change", apply);
  }, []);

  // Suivi souris (seulement si non locké)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (lock) return;
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [lock]);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleEnterOn = (el: HTMLElement) => {
    clearLeaveTimer();
    currentTargetRef.current = el;

    // texte
    const base = el.getAttribute(textAttr) || "GO HERE!";
    const rep = Number(el.getAttribute(repeatAttr) || "4");
    setLabel(Array(rep).fill(` ${base} `).join(""));

    // couleur
    setColor(el.getAttribute("data-cursor-color") || DEFAULT_COLOR);

    // lock au centre ?
    if (el.getAttribute("data-cursor-lock") === "center") {
      const getCenter = () => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2 + window.scrollX;
        const y = r.top + r.height / 2 + window.scrollY;
        const rr = Math.round(Math.min(r.width, r.height) / 2) + 10; // rayon auto
        return { x, y, r: rr };
      };
      setLock({ el, getCenter });
    } else {
      setLock(null);
    }

    setVisible(true);
  };

  const handleLeaveFrom = (el: HTMLElement) => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      if (currentTargetRef.current === el) currentTargetRef.current = null;
      setLock(null);
      setVisible(false);
      setColor(DEFAULT_COLOR); // ← reset couleur après survol
    }, leaveGraceMs);
  };

  // Délégation d’événements (robuste si le DOM change)
  useEffect(() => {
    const sel = targets as string;
    const closestMatch = (node: EventTarget | null) =>
      (node as HTMLElement | null)?.closest?.(sel) as HTMLElement | null;

    const onOver = (e: Event) => {
      const el = closestMatch(e.target);
      if (el && currentTargetRef.current !== el) handleEnterOn(el);
    };
    const onOut = (e: any) => {
      const el = closestMatch(e.target);
      if (!el) return;
      const to = closestMatch(e.relatedTarget);
      if (to !== el) handleLeaveFrom(el);
    };

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
    };
  }, [targets, textAttr, repeatAttr, leaveGraceMs]);

  // Boucle de lock : se centre sur la pastille
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (lock) {
        const { x, y, r } = lock.getCenter();
        setPos({ x, y });
        if (radius === undefined) setDynamicRadius(r);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lock, radius]);

  // Rotation continue
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (visible && rotationDuration > 0) {
        setRotate((r) => (r + (360 * dt) / rotationDuration) % 360);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, rotationDuration, reduced]);

  // Rayon pour l’anneau (trait)
  const effectiveRadius =
    radius !== undefined
      ? radius
      : dynamicRadius ?? Math.max(12, Math.round(largeSize / 2 - 10));

  // Rayon du texte (un peu à l’intérieur du trait)
  const TEXT_INSET = Math.max(8, RING_BORDER + Math.round(textSize * 0.45));
  const textRadius = Math.max(8, effectiveRadius - TEXT_INSET);

  const opacity = visible ? 1 : 0;
  const ringScale = visible ? 1 : 0.92;
  const size = visible ? largeSize : smallSize;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        pointerEvents: "none",
        zIndex,
        mixBlendMode: blendMode,
      }}
    >
      {/* point central */}
      <div
        style={{
          position: "absolute",
          transform: "translate(-50%, -50%)",
          width: smallSize,
          height: smallSize,
          borderRadius: "50%",
          background: color,
          opacity: visible ? 0.78 : 0, // ← masqué hors survol
          transition: "opacity .16s ease",
          zIndex: 1,
        }}
      />

      {/* anneau */}
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) scale(${ringScale})`,
          width: largeSize,
          height: largeSize,
          borderRadius: "50%",
          border: `${RING_BORDER}px solid ${color}`,
          opacity,
          transition: "transform .2s ease, opacity .16s ease",
          zIndex: 2,
        }}
      />

      {/* texte circulaire */}
      <svg
        width={size * 1.7}
        height={size * 1.7}
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
          opacity,
          transition: "opacity .16s ease",
          zIndex: 3,
        }}
      >
        <defs>
          <path
            id="cursor-circle-path"
            d={`M ${size * 0.85}, ${size * 0.85}
               m -${textRadius}, 0
               a ${textRadius},${textRadius} 0 1,1 ${textRadius * 2},0
               a ${textRadius},${textRadius} 0 1,1 -${textRadius * 2},0`}
            fill="none"
          />
        </defs>
        <text
          style={{
            fill: color,
            fontSize: `${textSize}px`,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textRendering: "geometricPrecision",
          }}
        >
          <textPath href="#cursor-circle-path" startOffset="0%">
            {label}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
