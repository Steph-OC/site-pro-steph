// src/scripts/bubbles.ts
export function initBubbleCloud(
  cloud: HTMLUListElement,
  opts?: { pointerArea?: HTMLElement }
) {
  // 👉 Par défaut on limite au conteneur des bulles
  const pointerArea = opts?.pointerArea || cloud;

  const items = Array.from(cloud.querySelectorAll<HTMLLIElement>("li"));
  if (!items.length) return;

  const readVar = (el: HTMLElement, name: string) => {
    const inline = el.getAttribute("style") || "";
    const m = inline.match(new RegExp(`${name}\\s*:\\s*([^;]+)`));
    if (m && m[1]) return m[1].trim();
    return getComputedStyle(el).getPropertyValue(name).trim();
  };
  const pct = (el: HTMLElement, name: string) => parseFloat(readVar(el, name)) || 0;
  const num = (el: HTMLElement, name: string) => parseFloat(readVar(el, name)) || 0;

  type Bubble = {
    el: HTMLLIElement; xPct: number; yPct: number; s: number; b: number;
    phase: number; speed: number; amp: number; dx: number; dy: number;
  };

  let cloudRect = cloud.getBoundingClientRect();
  const updateRect = () => { cloudRect = cloud.getBoundingClientRect(); };
  addEventListener("resize", updateRect);

  const state: Bubble[] = items.map((el) => ({
    el, xPct: pct(el, "--x"), yPct: pct(el, "--y"),
    s: num(el, "--s") || 1, b: num(el, "--b") || 120,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.6,
    amp: 6 + Math.random() * 10,
    dx: 0, dy: 0,
  }));

  const mouse = { x: cloudRect.width * 0.5, y: cloudRect.height * 0.5, active: false };
  const toLocalOfCloud = (e: PointerEvent) => ({
    x: e.clientX - cloudRect.left,
    y: e.clientY - cloudRect.top,
  });

  pointerArea.addEventListener("pointerenter", (e) => {
    mouse.active = true; Object.assign(mouse, toLocalOfCloud(e));
  }, { passive: true });
  pointerArea.addEventListener("pointermove", (e) => {
    Object.assign(mouse, toLocalOfCloud(e));
  }, { passive: true });
  pointerArea.addEventListener("pointerleave", () => { mouse.active = false; });

  const RADIUS = 130;   // px
  const STRENGTH = 80;  // force max
  const EASE = 0.18;    // lissage

  let last = performance.now(), t = 0;
  const tick = (now: number) => {
    const dt = Math.min(32, now - last) / 1000; last = now; t += dt;

    for (const b of state) {
      const cx = (b.xPct / 100) * cloudRect.width;
      const cy = (b.yPct / 100) * cloudRect.height;

      const driftX = Math.sin(b.phase + t * b.speed) * b.amp;
      const driftY = Math.cos(b.phase + t * b.speed * 0.9) * b.amp;

      let repX = 0, repY = 0;
      if (mouse.active) {
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const d2 = dx*dx + dy*dy;
        if (d2 > 0) {
          const d = Math.sqrt(d2);
          if (d < RADIUS) {
            const f = 1 - d / RADIUS;
            const s = STRENGTH * f * f;
            repX = (dx / d) * s;
            repY = (dy / d) * s;
          }
        }
      }

      const targetDX = driftX + repX;
      const targetDY = driftY + repY;

      b.dx += (targetDX - b.dx) * EASE;
      b.dy += (targetDY - b.dy) * EASE;

      b.el.style.setProperty("--dx", `${b.dx.toFixed(2)}px`);
      b.el.style.setProperty("--dy", `${b.dy.toFixed(2)}px`);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default initBubbleCloud;
