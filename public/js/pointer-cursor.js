// /public/js/pointer-cursor.js — smooth DOM pointer (rect-proximity)
export default function initPointerCursor(opts = {}) {
  const {
    color = "#5cc7a0",
    size = 14,
    radius = 12,
    pad = 8,
    magnetRadius = 56, // aussi utilisé comme "padding" autour du rect
    targets = "[data-pointer], .nav a, a[href], button, [role='button'], .btn",
    enableOnCoarse = false,
    freeOpacity = 0.45,
    ringBorder = 1.25,
    follow = 0.18,
  } = opts;

  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!enableOnCoarse && !canHover) return;

  document.documentElement.classList.add("use-ios-pointer");

  // ---------- DOM ----------
  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "fixed",
    left: "0", top: "0",
    width: `${size}px`, height: `${size}px`,
    marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`,
    borderRadius: "50%",
    background: color,
    opacity: freeOpacity,
    zIndex: 2147483647,
    pointerEvents: "none",
    willChange: "transform, opacity",
    transform: "translate3d(-100px, -100px, 0)",
  });

  const ring = document.createElement("div");
  Object.assign(ring.style, {
    position: "fixed",
    left: "0", top: "0",
    border: `${ringBorder}px solid ${color}`,
    borderRadius: `${radius}px`,
    opacity: "0",
    zIndex: 2147483647,
    pointerEvents: "none",
    willChange: "transform, opacity",
    boxSizing: "border-box",
    transform: "translate3d(-100px, -100px, 0)",
  });

  document.body.append(dot, ring);

  // ---------- State ----------
  let mx = -9999, my = -9999; // raw mouse
  let dx = mx, dy = my;       // smoothed dot
  /** @type {HTMLElement|null} */
  let activeEl = null;
  let activeRect = null;
  let raf = 0;
  let lastTargetId = 0;
  let running = true;

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (!running && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (running) { kick(); }
  });

  // ---------- Helpers ----------
  const lerp = (a, b, t) => a + (b - a) * t;

  const PREF = ".post-nav a, .post-nav .btn, .post-nav .wp-block-button__link";
  const safeMatches = (el, sel) => { try { return !!el?.matches?.(sel); } catch { return false; } };
  const closestMatch = (el, sel) => el?.closest?.(sel) || null;

  const setRingToRect = (rect) => {
    const x = rect.left - pad;
    const y = rect.top - pad;
    const w = rect.width + pad * 2;
    const h = rect.height + pad * 2;

    if (ring._w !== w || ring._h !== h) {
      ring.style.width = `${w}px`;
      ring.style.height = `${h}px`;
      ring._w = w; ring._h = h;
    }
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const engageTarget = (el) => {
    if (activeEl === el) return;
    activeEl?.classList.remove("magnet-on");
    activeEl = el;
    activeRect = el.getBoundingClientRect();
    el.classList.add("magnet-on");
    lastTargetId++;
    setRingToRect(activeRect);
  };

  const clearTarget = () => {
    if (activeEl) {
      activeEl.classList.remove("magnet-on");
      activeEl = null;
      activeRect = null;
    }
    ring.style.opacity = "0";
  };

  // Test “proximité rectangulaire” (beaucoup plus tolérant que la distance au centre)
  const pointerInsideRectWithPad = (rect, padPx) =>
    mx >= rect.left - padPx &&
    mx <= rect.right + padPx &&
    my >= rect.top - padPx &&
    my <= rect.bottom + padPx;

  // ---------- Main loop ----------
  function frame() {
    if (!running) { raf = 0; return; }
    raf = 0;

    if (mx === -9999 && my === -9999) return;

    // Smooth follow
    dx = lerp(dx, mx, follow);
    dy = lerp(dy, my, follow);
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

    const movedEnough = Math.abs(mx - dx) + Math.abs(my - dy) > 0.2;
    if (movedEnough) {
      const stack = document.elementsFromPoint(mx, my) || [];
      let target = null;

      // 1) Si on a déjà un élément actif ET que la souris est encore dans sa zone élargie,
      // on le garde sans refaire un elementsFromPoint (gros gain perf)
      if (
        activeEl &&
        activeRect &&
        pointerInsideRectWithPad(activeRect, magnetRadius * 1.2)
      ) {
        target = activeEl;
      } else {
        // 2) Sinon, on recalcule la pile sous la souris
        const stack = document.elementsFromPoint(mx, my) || [];

        // priorité .post-nav
        for (const el of stack) {
          const t = closestMatch(el, PREF);
          if (t) { target = t; break; }
        }

        // sinon critères généraux
        if (!target) {
          for (const el of stack) {
            if (safeMatches(el, targets)) { target = el; break; }
            const t = closestMatch(el, targets);
            if (t) { target = t; break; }
          }
        }
      }


      if (!target) {
        dot.style.opacity = freeOpacity;
        clearTarget();
      } else {
        if (!activeEl || activeEl !== target) {
          engageTarget(target);
        } else if (lastTargetId % 2 === 0) {
          activeRect = target.getBoundingClientRect();
        }

        const r = activeRect || target.getBoundingClientRect();

        // <<< NOUVEAU : engagement si le pointeur est dans le rect élargi >>>
        const nearEnough = pointerInsideRectWithPad(r, magnetRadius);

        if (!nearEnough) {
          dot.style.opacity = freeOpacity;
          clearTarget();
        } else {
          setRingToRect(r);
          ring.style.opacity = "1";
          dot.style.opacity = "0.18";

          // petit feedback visuel
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dxm = mx - cx, dym = my - cy;
          const nx = dxm / (r.width / 2 || 1);
          const ny = dym / (r.height / 2 || 1);
          target.style.setProperty("--magnet-tx", `${nx * 6}px`);
          target.style.setProperty("--magnet-ty", `${ny * 6}px`);
          target.style.setProperty("--magnet-rotX", `${(-ny * 2).toFixed(2)}deg`);
          target.style.setProperty("--magnet-rotY", `${(nx * 2).toFixed(2)}deg`);
          target.style.setProperty("--magnet-scale", `1.03`);
        }
      }
    }

    if (Math.abs(mx - dx) + Math.abs(my - dy) > 0.05) {
      raf = requestAnimationFrame(frame);
    }
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  // ---------- Events ----------
  const onMove = (e) => { mx = e.clientX; my = e.clientY; kick(); };
  const onLeave = () => { mx = -9999; my = -9999; clearTarget(); kick(); };
  const onScrollResize = () => {
    activeRect = activeEl ? activeEl.getBoundingClientRect() : null;
    kick();
  };

  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerleave", onLeave, { passive: true });
  addEventListener("scroll", onScrollResize, { passive: true });
  addEventListener("resize", onScrollResize);

  return () => {
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerleave", onLeave);
    removeEventListener("scroll", onScrollResize);
    removeEventListener("resize", onScrollResize);
    document.documentElement.classList.remove("use-ios-pointer");
    ring.remove(); dot.remove();
  };
}
